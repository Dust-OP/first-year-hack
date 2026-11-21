# Snowflake roles, access control and a setup script for the compass app

- **Inspection date:** 2026-11-21 (all docs pages fetched and all repos cloned on this date).
- **Scope:** how Snowflake works, its role system, the privileges the compass app needs, official Snowflake-Labs sample code, and a draft `setup.sql`. Nothing was run against a Snowflake account. No sign-ups, logins or secrets.
- **Builds on:** [`../retro-compass-prior-art/rules-snowflake.md`](../retro-compass-prior-art/rules-snowflake.md) section 2, which covers account routes, Cortex function list, geospatial functions and Marketplace datasets. That material is not repeated here.
- **Labels:** verified-in-spec (docs read), verified-in-source (code read), inferred, unverified (+ next check). See [`../README.md`](../README.md).

---

## 0. Short version for the team

1. **Snowflake splits storage from compute.** Your data sits in databases. A query only runs when a **virtual warehouse** (rented compute) is switched on. Warehouses cost credits per second while running, with a 60-second minimum each time they start. They switch themselves off after an idle period (auto-suspend).
2. **Everything is controlled by roles.** A user never holds permissions directly in the normal setup. Permissions go to a **role**, the role goes to the user, and each session has one active **primary role** (`USE ROLE ...`).
3. **The built-in roles are admin roles, not app roles.** ACCOUNTADMIN is the top role. Under it, SYSADMIN creates warehouses and databases, SECURITYADMIN manages grants, and USERADMIN creates users and roles. PUBLIC is given to everyone. Snowflake tells you not to build your app on ACCOUNTADMIN.
4. **The pattern for the app:** create one custom role, `COMPASS_APP_ROLE`. Give it only these: USAGE on one XS warehouse, USAGE/SELECT/INSERT on its own small database, `IMPORTED PRIVILEGES` on the Overture Places share and (optionally) Cortex. Grant the role to SYSADMIN, and to one `TYPE = SERVICE` user that logs in with a **key pair**.
5. **Possible blockers:**
   - The Overture listing can only be added by ACCOUNTADMIN (or a role with IMPORT SHARE).
   - On a trial, AI functions stay off until a credit card is added.
   - On a non-trial (sponsor) account, password-only logins for humans are being phased out, and service users cannot use passwords at all.
   - A PAT for a service user needs a network policy.

Details and evidence follow.

---

## 1. How Snowflake works

### 1.1 Three layers (verified-in-spec)

Source: https://docs.snowflake.com/en/user-guide/intro-key-concepts

- "Snowflake's unique architecture has the following key layers: Database storage, Compute, Cloud services."
- Compute: "A virtual warehouse is a cluster of compute resources in Snowflake. Virtual warehouses process SQL statements … Each virtual warehouse is an independent compute cluster that doesn't share compute resources with other virtual warehouses."
- Cloud services: "a collection of services that coordinate activities across Snowflake … from sign-in to query dispatch." It handles "Security, authentication, and access control", metadata, and "Query parsing and optimization".

### 1.2 Object hierarchy (verified-in-spec)

Source: https://docs.snowflake.com/en/user-guide/security-access-control-overview

> "Every securable object resides within a logical container in a hierarchy of containers. The top-most container is the customer organization. Securable objects such as tables, views, functions, and stages are contained in a schema object, which are in turn contained in a database. All databases for your Snowflake account are contained in the account object."

```
Organization
└── Account                  (one Snowflake account; you log in here)
    ├── Users                (people TYPE=PERSON, apps TYPE=SERVICE)
    ├── Roles                (account roles: ACCOUNTADMIN, SYSADMIN, COMPASS_APP_ROLE …)
    ├── Warehouses           (compute; account-level objects)
    ├── Network policies, resource monitors, integrations …
    └── Database             (e.g. COMPASS_DB, or OVERTURE_MAPS__PLACES imported from a share)
        ├── Database roles   (roles scoped to one database)
        └── Schema           (e.g. COMPASS_DB.APP, OVERTURE_MAPS__PLACES.CARTO)
            └── Table / View / Stage / Function / Streamlit app / Network rule …
```

To read one table you need privileges at every level. The docs say that "to query mytable, a user must have the following privileges at a minimum: Database: USAGE on mydb / Schema: USAGE on myschema / Table: SELECT on mytable" (https://docs.snowflake.com/en/user-guide/security-access-control-considerations). The role also needs USAGE on a warehouse: "To query an object (for example, a table or view), a role must have the USAGE privilege on a warehouse" (https://docs.snowflake.com/en/user-guide/security-access-control-configure). **verified-in-spec**

### 1.3 How a query actually runs

1. The client connects (Snowsight, a driver, the SQL API). Cloud services authenticates the user. The session gets a **primary role**: the role named in the connection, otherwise the user's `DEFAULT_ROLE`, otherwise PUBLIC. It also gets a current warehouse, from the connection or `DEFAULT_WAREHOUSE`. **verified-in-spec** (overview page, "Authorization through primary role and secondary roles"; CREATE USER `DEFAULT_WAREHOUSE`)
2. Cloud services parses and optimises the SQL and checks privileges against the active roles. "There is no concept of a 'super-user' or 'super-role' in Snowflake that can bypass authorization checks." **verified-in-spec**
3. If the warehouse is suspended and auto-resume is on, it starts: "USAGE: Enables using a virtual warehouse … If the warehouse is configured to auto-resume when a SQL statement (e.g. query) is submitted to it, the warehouse resumes automatically" (https://docs.snowflake.com/en/user-guide/security-access-control-privileges). **verified-in-spec**
4. The warehouse runs the query against storage and returns results.
5. When there are no more queries, the warehouse auto-suspends after `AUTO_SUSPEND` seconds. **verified-in-spec**

### 1.4 Credits and auto-suspend (verified-in-spec)

Source: https://docs.snowflake.com/en/user-guide/warehouses-overview

- Gen1 standard warehouse rates: **X-Small 1 credit/hour**, Small 2, Medium 4, Large 8, X-Large 16, and so on (doubling per size). "X-Small … Default size for warehouses created in Snowsight and using CREATE WAREHOUSE."
- "Snowflake utilizes per-second billing (with a 60-second minimum each time the warehouse starts)". An X-Small running 0–60 s is billed 0.017 credits.
- Restarts can cost more than expected: "If a warehouse runs for 61 seconds, shuts down, and then restarts and runs for less than 60 seconds, it is billed for 121 seconds (60 + 1 + 60)" (https://docs.snowflake.com/en/user-guide/warehouses-considerations).

Source: https://docs.snowflake.com/en/sql-reference/sql/create-warehouse

- `AUTO_SUSPEND`: "Specifies the number of seconds of inactivity after which a warehouse is automatically suspended." The default is "600 (the warehouse suspends automatically after 10 minutes of inactivity)".
- "The background process that suspends a warehouse runs approximately every 30 seconds". Values below 30, or not a multiple of 30, "might not result in the expected behavior". **60 is a valid choice.**
- "Setting a 0 or NULL value means the warehouse never suspends." Avoid this.
- `CREATE WAREHOUSE` access: "Only the SYSADMIN role, or a higher role, has this privilege by default."

Trial advice (https://docs.snowflake.com/en/user-guide/admin-trial-account): "Do not disable auto-suspend when creating a warehouse. Choosing a short auto-suspend time period (e.g. 5 minutes or less) can reduce credit consumption." Also: "Serverless features, including AI features, also consume free credits when you use them."

Cost guard (https://docs.snowflake.com/en/user-guide/resource-monitors):
- "Only users with the ACCOUNTADMIN role can create a resource monitor".
- Example: `CREATE OR REPLACE RESOURCE MONITOR limit1 WITH CREDIT_QUOTA=1000 TRIGGERS ON 100 PERCENT DO SUSPEND; ALTER WAREHOUSE wh1 SET RESOURCE_MONITOR = limit1;`
- "Credit quota accounts for credits consumed by both user-managed virtual warehouses and virtual warehouses used by cloud services." The page does not list serverless AI usage, so a resource monitor probably does **not** cap AI_COMPLETE spend. **inferred**

---

## 2. Roles

### 2.1 Access-control model (verified-in-spec)

Source: https://docs.snowflake.com/en/user-guide/security-access-control-overview

- **DAC:** "Each object has an owner, who can in turn grant access to that object."
- **RBAC:** "Access privileges are assigned to roles, which are in turn assigned to users."
- **UBAC:** "Access privileges are assigned directly to users. Access control considers privileges assigned directly to users only when USE SECONDARY ROLE is set to ALL."
- "Granting a role to another role creates a role hierarchy." Privileges flow **upwards**: "The privileges associated with a role are inherited by any roles above that role in the hierarchy."

### 2.2 System-defined roles, in plain words

All quotes are from the overview page above unless another link is given. **verified-in-spec**

| Role | Plain meaning | Doc quote |
|---|---|---|
| **GLOBALORGADMIN** | Organisation boss. Manages accounts across the whole organisation. Only exists in the special "organization account". | "Role that performs organization-level tasks such as managing the lifecycle of accounts and viewing organization-level usage information. The role exists only in the organization account." |
| **ORGADMIN** | Older version of the org boss, run from an ordinary account. Being retired. | "The ORGADMIN role will be phased out in a future release, so organization administrators are encouraged to use the GLOBALORGADMIN role instead." It "is not included in the hierarchy of system roles." See also https://docs.snowflake.com/en/user-guide/organization-administrators |
| **ACCOUNTADMIN** | Account owner. Can do account-level settings and billing. Sits above SYSADMIN and SECURITYADMIN. | "Role that encapsulates the SYSADMIN and SECURITYADMIN system-defined roles. It is the top-level role in the system and should be granted only to a limited/controlled number of users in your account." |
| **SECURITYADMIN** | Permissions manager. Can grant or revoke anything (MANAGE GRANTS), and inherits USERADMIN. | "Role that can manage any object grant globally, as well as create, monitor, and manage users and roles." MANAGE GRANTS "does not give the SECURITYADMIN the ability to perform other actions such as creating objects." |
| **USERADMIN** | Creates users and roles, nothing else. | "Role that is dedicated to user and role management only … Is granted the CREATE USER and CREATE ROLE security privileges." |
| **SYSADMIN** | Builder. Creates warehouses, databases and everything inside them. | "Role that has privileges to create warehouses and databases (and other objects) in an account." |
| **PUBLIC** | Everyone. Automatically held by every user and role. | "Pseudo-role that is automatically granted to every user and every role in your account … the objects owned by the role are, by definition, available to every other user and role in your account." |

**Default hierarchy** (verified-in-spec, from the considerations page):

```
ACCOUNTADMIN
├── SECURITYADMIN
│   └── USERADMIN
└── SYSADMIN
    └── (your custom roles should be granted here)
PUBLIC  ← under everything (every role has it)
ORGADMIN / GLOBALORGADMIN  ← separate, outside this tree
```

### 2.3 Snowflake's own advice (verified-in-spec)

Source: https://docs.snowflake.com/en/user-guide/security-access-control-considerations

- **Do not build on ACCOUNTADMIN:** "it should not be used to create objects in your account, unless you absolutely need these objects to have the highest level of secure access … Snowflake recommends creating a hierarchy of roles aligned with business functions in your organization and ultimately assigning these roles to the SYSADMIN role."
- **Do not use ACCOUNTADMIN for scripts and apps:** "Snowflake recommends using a role other than ACCOUNTADMIN for automated scripts."
- **Do not make ACCOUNTADMIN anyone's default role:** "do not make ACCOUNTADMIN the default role for any users in the system".
- **Give ACCOUNTADMIN to at least two people, with MFA:** "Assign this role to at least two users. We follow strict security procedures for resetting a forgotten or lost password for users with the ACCOUNTADMIN role. These procedures can take up to two business days." For a team sharing a trial, two teammates should hold ACCOUNTADMIN. **inferred from quote**
- **Grant custom roles to SYSADMIN, or admins are locked out:** "By default, not even the ACCOUNTADMIN role can modify or drop objects created by a custom role. The custom role must be granted to the ACCOUNTADMIN role directly or, preferably, to another role in a hierarchy with the SYSADMIN role as the parent."
- **Do not add privileges to system roles:** "it is not recommended to mix account-management privileges and entity-specific privileges in the same role … Snowflake recommends granting the additional privileges to a custom role and assigning the custom role to the system-defined role" (overview page).
- **Least privilege:** "we recommend creating custom roles that align with the business functions in your organization to permit SQL actions on a narrow set of securable objects" (https://docs.snowflake.com/en/user-guide/security-access-control-configure).

### 2.4 Primary role, secondary roles, USE ROLE, default role (verified-in-spec)

- **Primary role:**
  - "Every active user session has a current role, also referred to as a primary role."
  - "Authorization to execute CREATE <object> statements comes from the primary role only. When an object is created, its ownership is set to the currently active primary role."
  - Source: overview page.
- **Secondary roles:**
  - "a session can activate any number of secondary roles at the same time"
  - "for any other SQL action, any permission granted to any active primary or secondary role can be used".
  - Set with `USE SECONDARY ROLES` (https://docs.snowflake.com/en/sql-reference/sql/use-secondary-roles).
- **USE ROLE:**
  - "Specifies the active/current primary role for the session."
  - "To use a role, the role must have been granted to the user."
  - Source: https://docs.snowflake.com/en/sql-reference/sql/use-role
- **Default role:**
  - "specifying a default role for a user does not grant the role to the user. The role must be granted explicitly to the user using the GRANT ROLE command."
  - `DEFAULT_SECONDARY_ROLES` "Default: ALL", so by default every role granted to a user is also active as a secondary role.
  - Source: https://docs.snowflake.com/en/sql-reference/sql/create-user
- **For the app** (inferred): give the service user exactly one role and set `DEFAULT_SECONDARY_ROLES = ()`. The app then cannot pick up extra privileges by accident. With a PAT this is enforced anyway: "Secondary roles are not used, even if DEFAULT_SECONDARY_ROLES is set to ('ALL') for the user" (PAT page).

### 2.5 Ownership (verified-in-spec)

- "Each securable object is owned by a single role, which by default is the role used to create the object."
- "In a regular schema, the owner role has all privileges on the object by default, including the ability to grant or revoke privileges".
- `GRANT OWNERSHIP` transfers ownership. In a *managed access schema* only the schema owner or MANAGE GRANTS can grant.
- "A role owner … does not inherit the privileges of the owned role." Owning a role is not the same as being above it in the hierarchy.
- Source: overview page.
- **Practical rule** (inferred): whoever *creates* an object controls who else can use it. Create the warehouse and database as SYSADMIN, then grant from SYSADMIN.

### 2.6 Other role types (verified-in-spec, overview page)

- **Database roles:** "To limit SQL actions to a single database". They "cannot be activated directly in a session. Grant database roles to account roles". "Account roles cannot be granted to database roles".
- **Application roles:** "To enable consumer access to objects in a Snowflake Native App, the provider creates the application role and grants privileges to the application role in the set up script." They are created only inside a Native App: "Application roles are similar to database roles, but may only be created within the app" (https://docs.snowflake.com/en/developer-guide/native-apps/creating-setup-script). Not needed for the compass app unless it becomes a Native App. **inferred**
- **Instance roles, system application roles, service roles:** feature-specific. For example, a service role for Snowpark Container Services endpoints (used in the custom-API sample below). Not needed here.
- **SNOWFLAKE.PUBLIC application role:** "SNOWFLAKE.PUBLIC is granted to the account-level PUBLIC role, so every user in the account receives its capabilities". One revocable capability shown in the docs is `'USE_AI_FUNCTIONS'` (https://docs.snowflake.com/en/user-guide/security-access-control-configure).

### 2.7 SNOWFLAKE database roles for Cortex AI (verified-in-spec)

Sources: https://docs.snowflake.com/en/sql-reference/snowflake-db-roles and https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-privileges-and-access

- **Two things are needed:** "Your users need both the USE AI FUNCTIONS account-level privilege (or a per-function USE AI FUNCTION <name> privilege) and one of the CORTEX_USER or AI_FUNCTIONS_USER database roles to use Snowflake Cortex AI Functions."
- **Both are on by default for everyone:**
  - "By default, the USE AI FUNCTIONS privilege is granted to the PUBLIC role."
  - "By default, the CORTEX_USER role is granted to the PUBLIC role."
  - So on a fresh account any role, including `COMPASS_APP_ROLE`, can call AI_COMPLETE once AI is enabled. On a trial that means after a card is added (see section 5).
- **AI_FUNCTIONS_USER** is the narrower option. It covers "all Cortex AI functions except the aggregate functions AI_AGG and AI_SUMMARIZE_AGG", without Agents, Analyst, Search or fine-tuning. "By default, this role is not granted to any roles."
- **Per-function grant:** `GRANT USE AI FUNCTION AI_COMPLETE ON ACCOUNT TO ROLE …` lets a role call only AI_COMPLETE.
- **ACCOUNTADMIN only:**
  - "You must use the ACCOUNTADMIN role to manage the USE AI FUNCTIONS account-level privilege."
  - Doc examples grant `SNOWFLAKE.CORTEX_USER` with `USE ROLE ACCOUNTADMIN`.
  - "The SNOWFLAKE.CORTEX_USER database role cannot be granted directly to a user."
- **Model access is a separate control:** "Use role-based access control (RBAC) on the model objects in the SNOWFLAKE.MODELS schema, or the legacy CORTEX_MODELS_ALLOWLIST parameter". Unverified whether a trial has any model restriction. Next check: run `SELECT AI_COMPLETE('<model>', 'hi');` as `COMPASS_APP_ROLE` after AI is enabled.
- **Other Cortex roles listed:** CORTEX_AGENT_USER (Agents and CoCo), CORTEX_EMBED_USER, CORTEX_REST_API_USER, COPILOT_USER. These are not needed for AI_COMPLETE from SQL.

### 2.8 Marketplace shares: how a non-admin role reads OVERTURE_MAPS__PLACES (verified-in-spec)

Sources: https://docs.snowflake.com/en/collaboration/consumer-listings-access and https://docs.snowflake.com/en/user-guide/data-share-consumers

1. **Getting the listing needs admin rights:** "You must use the ACCOUNTADMIN role or another role with the CREATE DATABASE and IMPORT SHARE privileges to access and install a listing." The Get dialog lets you "(Optional) Specify a database name" and "(Optional) Add roles to grant access to the database created from the listing." You may also be asked to complete your user profile (name and email) first; source: geo-for-ML quickstart, section 3 below.
2. **Granting the share to another role:**
   - "Allow users to access objects in a share by granting the IMPORTED PRIVILEGES privilege on an imported database to one or more roles in your account."
   - "A role can grant IMPORTED PRIVILEGES on an imported database only when it either: Owns the imported database … [or] Was granted the MANAGE GRANTS global privilege."
   - So run it as the role that clicked Get (usually ACCOUNTADMIN) or as SECURITYADMIN. Example: `grant imported privileges on database snow_sales to role r2;`
3. **Some shares use database roles instead** ("Option 2"): `SHOW DATABASE ROLES in DATABASE c1; GRANT DATABASE ROLE c1.r1 TO ROLE analyst;`. All official samples use IMPORTED PRIVILEGES for the Overture shares (section 3), so Option 1 applies. **verified-in-source.** Next check: `SHOW DATABASE ROLES IN DATABASE OVERTURE_MAPS__PLACES;` should return nothing relevant.
4. **SQL alternative to clicking Get:** `CREATE DATABASE <name> FROM LISTING '<listing_global_name>'`. Requirements: the listing "Can't be a paid listing"; "Listing terms, if not of type OFFLINE, must have been accepted using Snowsight"; data "must be available locally in the current region"; "You must have the IMPORT LISTING privilege" (https://docs.snowflake.com/en/sql-reference/sql/create-database). Official samples also call `SYSTEM$ACCEPT_LEGAL_TERMS(...)` from SQL. That function's docs page returned 404 on 2026-11-21, so it is **verified-in-source but not verified-in-spec**.
5. **Overture Places listing ID** is `GZT0Z4CM1E9KR`. **verified-in-source** in two places:
   - `sfquickstarts/site/sfguides/src/geo-for-machine-learning/geo-for-machine-learning.md:118` links `app.snowflake.com/marketplace/listing/GZT0Z4CM1E9KR/carto-overture-maps-places`.
   - The route-optimisation repo's `overture-schema.md:15,19-20` runs `CREATE DATABASE IF NOT EXISTS OVERTURE_MAPS__PLACES FROM LISTING GZT0Z4CM1E9KR;`.

---

## 3. Users and authentication for a web-app backend

### 3.1 User types (verified-in-spec)

Source: https://docs.snowflake.com/en/user-guide/admin-user-management

- `TYPE = PERSON` (or NULL) is a human user. `TYPE = SERVICE` is an app.
- What SERVICE users can't do: "They cannot log in using a password. They cannot enroll in MFA. They are not subject to authentication policy MFA enforcement." They also cannot have FIRST_NAME, LAST_NAME, PASSWORD, MUST_CHANGE_PASSWORD or MINS_TO_BYPASS_MFA.
- `LEGACY_SERVICE` "allows password authentication" but "is being deprecated" (https://docs.snowflake.com/en/sql-reference/sql/create-user).
- `CREATE USER` needs CREATE USER: "Only the USERADMIN role, or a higher role, has this privilege by default."

### 3.2 MFA and password deprecation (verified-in-spec)

Source: https://docs.snowflake.com/en/user-guide/security-mfa-rollout

- **Goal:** "require multi-factor authentication (MFA) for all human users using passwords, and disallow passwords for all service users."
- **Trial exemption:** "**The phases described in this topic don't apply to reader accounts, trial accounts, or Snowflake Postgres.** You can continue to sign in to these types of accounts with a single-factor password."
- **Phase 1** (Sep 2025 – Jan 2026): "Human users must authenticate with a second factor when using a password to access Snowsight, with no exceptions."
- **Phase 2** (May – Jul 2026):
  - "All human users that are created after this phase is enforced must use a second factor when authenticating with a password, including those using BI tools or similar".
  - "TYPE=LEGACY_SERVICE is an invalid option when executing a CREATE USER or ALTER USER command."
- **Phase 3** (Aug – Oct 2026): "human users cannot authenticate with a password alone" and "all non-human users are blocked from using a password to authenticate". Enforcement dates "vary by account and … may be extended".

What this means for the team (inferred):
- On a **self-service trial**, a backend could still log in as a human user with a password. Don't build on that.
- On a **sponsor or paid account**, a password user created today is already past Phase 2, and probably Phase 3 too. A backend that logs in with a password will fail. Use a `TYPE = SERVICE` user with a key pair or a PAT from the start; this works the same on both kinds of account.
- On a trial, Duo MFA is not available ("Using Duo for multi-factor authentication (MFA)" is in the trial limitations list), but passkeys or authenticator apps are not ruled out. **verified-in-spec** for the Duo line; other MFA methods are **unverified**.

### 3.3 Key-pair authentication (verified-in-spec)

Source: https://docs.snowflake.com/en/user-guide/key-pair-auth

- "This authentication method requires, as a minimum, a 2048-bit RSA key pair."
- The supported-clients table lists the Python connector and the Node.js driver with full support.
- Generate keys locally: `openssl genrsa 2048 | openssl pkcs8 -topk8 -v2 aes-256-cbc -inform PEM -out rsa_key.p8` (encrypted), then `openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub`.
- Who can assign the public key: "MODIFY PROGRAMMATIC AUTHENTICATION METHODS privilege on the user" or "OWNERSHIP privilege on the user".
- Two ways to assign it:
  - Recommended: `ALTER USER example_user ADD KEY PAIR my_key PUBLIC_KEY = 'MIIBIjANBgkqh...';`. This "supports role restriction, named key management, and key expiration".
  - Classic: `ALTER USER example_user SET RSA_PUBLIC_KEY='MIIBIjANBgkqh...';`, with "Exclude the public key delimiters".
- **The key-pair page does not mention a network-policy requirement.** That is the main practical advantage over a PAT for a hackathon backend on changing cloud IPs. **inferred** from its absence and the contrast with the PAT page.

### 3.4 Programmatic access tokens (PAT) (verified-in-spec)

Source: https://docs.snowflake.com/en/user-guide/programmatic-access-tokens

- **Where a PAT works:**
  - As a bearer token for the SQL API and REST APIs.
  - "as a replacement for a password in … Snowflake drivers".
  - Generated for "human users (users with TYPE=PERSON) as well as service users".
- **Network policy needed by default:**
  - "By default, the user must be subject to a network policy with one or more network rules to generate or use programmatic access tokens."
  - "For service users (where TYPE=SERVICE or TYPE=LEGACY_SERVICE for the user), you can only generate or use a token if the user is subject to a network policy."
  - Human users can generate a token without a policy, "but the user must be subject to a network policy to authenticate with this token". `MINS_TO_BYPASS_NETWORK_POLICY_REQUIREMENT` gives a temporary bypass, "but we don't recommend this".
- **Changing that requirement:** use an authentication policy with `PAT_POLICY = (NETWORK_POLICY_EVALUATION = ENFORCED_NOT_REQUIRED)` (or `NOT_ENFORCED`).
- **Service-user tokens must name a role:** "you must specify the ROLE_RESTRICTION parameter". Example: `ALTER USER IF EXISTS example_service_user ADD PROGRAMMATIC ACCESS TOKEN example_service_user_token ROLE_RESTRICTION = 'example_service_user_role';`
- **Who can create one for another user:** "you must use a role that has the OWNERSHIP or MODIFY PROGRAMMATIC AUTHENTICATION METHODS privilege on that user".
- **Expiry:** the default maximum is 365 days, and `DAYS_TO_EXPIRY` sets a shorter one.
- **Limits:**
  - "You can only view the secret for a programmatic access token when you create it."
  - "Each user can have a maximum of 15 programmatic access tokens."
  - The role restriction can't be changed after generation.
- **Best practice:** "Avoid exposing programmatic access tokens in code."

### 3.5 Network policies (verified-in-spec)

Source: https://docs.snowflake.com/en/user-guide/network-policies

- Network rule:
  - "You need the CREATE NETWORK RULE privilege on the schema to create a network rule. By default, only the ACCOUNTADMIN and SECURITYADMIN roles, along with the schema owner, have this privilege."
  - Network rules are schema objects. Their mode must be INGRESS.
- Network policy: "Only security administrators (i.e. users with the SECURITYADMIN role) or higher or a role with the global CREATE NETWORK POLICY privilege can create network policies."
- Applying it to a user:
  - "A role with the OWNERSHIP privilege on the user and USAGE privilege on the network policy, or a higher role, can activate a network policy for an individual user."
  - Syntax: `ALTER USER joe SET NETWORK_POLICY = my_policy;`
- Warning: "0.0.0.0/0 refers to all public and private IPv4 address ranges." An allow-all rule meets the PAT requirement but restricts nothing.

### 3.6 Which to pick (inferred)

| Option | Works on trial | Works on non-trial | Network policy | Effort | Verdict |
|---|---|---|---|---|---|
| Human user + password | yes (MFA rollout does not apply to trials) | no for new users since Phase 2; no for all users after Phase 3 | no | lowest | Don't. It breaks on a sponsor account. |
| SERVICE user + **key pair** | yes | yes | not required | medium (openssl, PEM in env var) | **Recommended** for a Node or Python backend. |
| SERVICE user + PAT | yes | yes | **required** (or an auth policy that lifts it) | low once the policy exists | Fine if the backend has a fixed IP, or you accept an `ENFORCED_NOT_REQUIRED` auth policy. |
| Streamlit in Snowflake (no external backend) | yes | yes | n/a | lowest | Good for a demo dashboard. It "eliminates the need for service account tokens" because the app runs with owner's rights (https://docs.snowflake.com/en/developer-guide/streamlit/object-management/owners-rights). It is not a phone compass UI. |

---

## 4. Official sample code: what the setup scripts actually do

All repos are from `github.com/Snowflake-Labs`, shallow-cloned on 2026-11-21 into `/private/tmp/claude-501/-Users-dust-Projects-first-year-hack-new-project/4ebaf192-5440-4dc8-9335-94f7adcd7ba0/scratchpad/repos-c/`. None of the code was run. All repos below are Apache-2.0 per their `LICENSE` file unless marked otherwise.

### 4.1 Summary table

| # | Repo @ commit (date) | Category | Role pattern | Least-privilege? | Label |
|---|---|---|---|---|---|
| 1 | `Summit26-InteractiveLab` @4e2730b (2026-11-17) | (d) setup.sql, service user, PAT | ACCOUNTADMIN runs everything. Custom role, `TYPE = SERVICE` user, key-pair auth policy, per-user IP network policy, reader role granted to SYSADMIN | Mostly yes; the newest pattern | verified-in-source |
| 2 | `sfguide-tasty-bytes-zero-to-app` @c6fcd92 (2023-08-14) | (c) Node/Express backend + (d) | ACCOUNTADMIN; custom API role; XS warehouse auto_suspend 300; USAGE + SELECT; key-pair user with `DEFAULT_ROLE` | Yes, but outdated (no `TYPE = SERVICE`, has FIRST/LAST_NAME) | verified-in-source |
| 3 | `sfquickstarts` guide `build-a-custom-api-in-python` @8db5823 (2026-11-20) | (c) Python Flask API + PAT | ACCOUNTADMIN; `GRANT ALL` on db/schema; IMPORTED PRIVILEGES on a share; PAT user with a **password**, `TYPE` unset, **allow-all** network policy | No; demo-grade | verified-in-source |
| 4 | `sfguide-snowflake-python-api` @b79cd80 (2025-05-08) | (c) Python Flask + connector | Key pair from env var; no role named in the connection (relies on the user's DEFAULT_ROLE) | n/a (no SQL setup) | verified-in-source |
| 5 | `sfquickstarts` guide `geo-for-machine-learning` @8db5823 | (a) Overture Places + Streamlit/pydeck | ACCOUNTADMIN to Get listings; `CORTEX_USER` via a custom role; IMPORTED PRIVILEGES to a Native App | Partly | verified-in-source |
| 6 | `sfguide-using-snowflake-cortex-and-streamlit-with-geospatial-data` @46e5bc8 (2025-04-17) | (a)+(b) UK Overture Places, Streamlit + pydeck, Cortex | `GRANT IMPORTED PRIVILEGES … TO ROLE PUBLIC` | **No**: shares the data with everyone | verified-in-source |
| 7 | `sfguide-building-geospatial-multilayer-app-with-snowflake-streamlit` @6491721 (2025-06-13) | (b) Streamlit in Snowflake deploy | `use role ACCOUNTADMIN` for the database, stages and `CREATE STREAMLIT` | No | verified-in-source |
| 8 | `sf-samples` `samples/geospatial/geocoding` @96ef1b2 (2026-11-19) | (a) Overture Addresses via SQL | No `USE ROLE`; runs as the caller; acquires the listing by SQL; troubleshooting says to grant IMPORTED PRIVILEGES | n/a | verified-in-source |
| 9 | `sfguide-create-a-route-optimisation-and-vehicle-route-plan-simulator` `overture-schema.md` @ec08f41 (2026-10-24) | (a) current Overture Places schema | Listing IDs and column notes | n/a | verified-in-source (read via `gh api`, not cloned). License: GitHub reports NOASSERTION; not checked further |

### 4.2 Line-level notes

**1. Summit26-InteractiveLab** (best reference for the role pattern)

- `sql/01_setup.sql:20-22`: "Create lab role and service user … Run as ACCOUNTADMIN or USERADMIN". `:23` is `USE ROLE ACCOUNTADMIN;`
- `:25-31`: `CREATE ROLE IF NOT EXISTS ARCADE_STREAMING_ROLE;` … `CREATE USER IF NOT EXISTS ARCADE_STREAMING_USER DEFAULT_ROLE = ARCADE_STREAMING_ROLE TYPE = SERVICE` … `GRANT ROLE ARCADE_STREAMING_ROLE TO USER ARCADE_STREAMING_USER;`
- `:40-48`: `CREATE AUTHENTICATION POLICY IF NOT EXISTS ARCADE_KEYPAIR_POLICY AUTHENTICATION_METHODS = ('KEYPAIR') MFA_ENROLLMENT = 'OPTIONAL' CLIENT_TYPES = ('DRIVERS');`, then `ALTER USER … SET AUTHENTICATION POLICY`.
- `:62-67`: `CREATE WAREHOUSE IF NOT EXISTS SUMMIT_TRAD_WH WAREHOUSE_SIZE = XSMALL AUTO_SUSPEND = 60 AUTO_RESUME = TRUE INITIALLY_SUSPENDED = TRUE`. This matches the requested XS / 60 s setup.
- `:166-170`: USAGE on database, schema and warehouse, plus `GRANT ALL ON TABLE …` for the writer role.
- `:173-182`: reader role with `GRANT SELECT ON TABLE`, then `GRANT ROLE ARCADE_LAB_READER TO ROLE SYSADMIN;` and `… TO ROLE ACCOUNTADMIN;`.
- `sql/02_service_auth.sh:19-20`: generates the key locally with the openssl commands from the docs.
- `:46-48`: `CREATE OR REPLACE NETWORK RULE GH_WORKSPACE_RULE TYPE = IPV4 MODE = INGRESS VALUE_LIST = ('${IP}/24'); CREATE NETWORK POLICY … ; ALTER USER ARCADE_STREAMING_USER SET NETWORK_POLICY = …`
- `:51`: `ALTER USER ARCADE_STREAMING_USER SET RSA_PUBLIC_KEY='${PUBK}';`
- `sql/04_generate_pat.sql:14-15`: `CREATE OR ALTER AUTHENTICATION POLICY pat_bypass_policy PAT_POLICY = ( NETWORK_POLICY_EVALUATION = ENFORCED_NOT_REQUIRED );`. This is the official way round the PAT network-policy rule, applied to a *human* user for the CLI.
- `:28-30`: `ALTER USER ADD PROGRAMMATIC ACCESS TOKEN SNOW_CLI_PAT`.
- Deviation from the docs: everything runs as ACCOUNTADMIN, not USERADMIN/SYSADMIN.

**2. sfguide-tasty-bytes-zero-to-app**

- `database/create_api_user.sql:1`: `USE ROLE accountadmin;`
- `:6`: `CREATE ROLE IF NOT EXISTS tasty_app_api_role;`
- `:9-17`: `create or replace warehouse tasty_app_api_wh with warehouse_size = 'xsmall' … auto_suspend = 300 auto_resume = true …; GRANT USAGE ON WAREHOUSE tasty_app_api_wh TO ROLE tasty_app_api_role;`
- `:38-40`: `GRANT USAGE ON DATABASE …; GRANT USAGE ON SCHEMA …; GRANT SELECT ON ALL TABLES IN SCHEMA frostbyte_tasty_bytes.app TO tasty_app_api_role;`
- `:42-56`: `CREATE USER IF NOT EXISTS tasty_app_api_user PASSWORD = NULL … FIRST_NAME = … DEFAULT_WAREHOUSE = tasty_app_api_wh DEFAULT_NAMESPACE = frostbyte_tasty_bytes.app DEFAULT_ROLE = tasty_app_api_role RSA_PUBLIC_KEY = '***REPLACE_WITH_PUBLIC_KEY***'`, then `GRANT ROLE … TO USER`.
- Written before user types existed. Today, add `TYPE = SERVICE` and drop FIRST/LAST_NAME, because SERVICE users "cannot have" those properties. **inferred from spec**
- The Node backend (`backend/connect.js:10`, `require('snowflake-sdk')`, `package.json:13` `"snowflake-sdk": "^1.6.19"`) is a lab skeleton. The connection code is in numbered TODO comments (`connect.js:16-18`), so the exact Node key-pair options were **not** verified in source. Next check: read the Node.js driver key-pair section at https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver-authenticate (not fetched).

**3. build-a-custom-api-in-python quickstart**

- `site/sfguides/src/build-a-custom-api-in-python/build-a-custom-api-in-python.md:184-186`: `USE ROLE ACCOUNTADMIN; CREATE WAREHOUSE IF NOT EXISTS DATA_API_WH WITH WAREHOUSE_SIZE='xsmall';`
- `:191`: "The application will run as a new role with minimal priviledges."
- `:196-203`: `CREATE ROLE IF NOT EXISTS DATA_API_ROLE; GRANT ALL ON DATABASE API …; GRANT ALL ON SCHEMA API.PUBLIC …; GRANT USAGE ON WAREHOUSE DATA_API_WH …; GRANT IMPORTED PRIVILEGES ON DATABASE SNOWFLAKE_SAMPLE_DATA TO ROLE DATA_API_ROLE; GRANT ROLE DATA_API_ROLE TO ROLE ACCOUNTADMIN;`. This is the share-grant pattern the compass app needs.
- `:392`: "the best practice is to create a user specifically for accessing this API endpoint, as well as a role for that user."
- `:402`: `CREATE USER IF NOT EXISTS APIUSER PASSWORD='<redacted>' … MUST_CHANGE_PASSWORD = FALSE;`. Problems: a hard-coded password, and no `TYPE = SERVICE`. **Don't copy.**
- `:404-405`: `CREATE NETWORK POLICY IF NOT EXISTS api_np ALLOWED_IP_LIST = ('0.0.0.0/0'); ALTER USER apiuser SET NETWORK_POLICY = api_np;`
- `:417`: "In order to use PAT, the user must have a network policy applied, so we create an "allow-all" network policy". This confirms the PAT gotcha in practice.
- `:422`: `ALTER USER IF EXISTS apiuser ADD PROGRAMMATIC ACCESS TOKEN api_token;`
- The network-policy docs say to prefer network rules over `ALLOWED_IP_LIST`.

**4. sfguide-snowflake-python-api**

- `config.py:2-7`: reads `SNOWFLAKE_ACCOUNT`, `SNOWFLAKE_USER`, `SNOWFLAKE_PRIVATE_KEY`, `SNOWFLAKE_DATABASE`, `SNOWFLAKE_SCHEMA`, `SNOWFLAKE_WAREHOUSE` from the environment.
- `connector.py:12-32`: `serialization.load_pem_private_key(config.SNOWFLAKE_PRIVATE_KEY.encode('utf-8'), password=None, …)`, then DER/PKCS8 bytes, then `snowflake.connector.connect(user=…, account=…, warehouse=…, schema=…, database=…, private_key=pkb, …)`.
- No `role=` argument, so the session uses the user's DEFAULT_ROLE. Pass `role=` explicitly for clarity. **inferred**
- `connector.py:52` builds SQL with f-strings after `params_valid(...)`. For user-supplied lat/lon, use bind parameters instead; the sample itself sets `paramstyle='qmark'` at `:22`. **inferred**

**5. geo-for-machine-learning quickstart**

- `geo-for-machine-learning.md:48`: prerequisites are "an existing Snowflake account with the `ACCOUNTADMIN` role or the `IMPORT SHARE `privilege".
- `:63`: "switch your current role from the default `SYSADMIN` to `ACCOUNTADMIN`. This increase in permissions will allow you to create shared databases from Snowflake Marketplace listings."
- `:118-124`: Overture Places listing `GZT0Z4CM1E9KR`; "keep the default database name OVERTURE_MAPS__PLACES".
- `:146-160`: queries `OVERTURE_MAPS__PLACES.CARTO.PLACE` with `NAMES['primary']`, `CATEGORIES['primary']` and `LATERAL FLATTEN(INPUT => ADDRESSES:list)`.
- `:885-888`: `CREATE ROLE IF NOT EXISTS cortex_user_role; GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE cortex_user_role; … GRANT ROLE cortex_user_role TO USER AA;`
- `:3028-3030`: `GRANT IMPORTED PRIVILEGES ON DATABASE OVERTURE_MAPS__PLACES TO application DEKART__…`. Imported privileges can also go to a Native App.
- `:3074-3079`: a UK filter via `OVERTURE_MAPS__DIVISIONS.CARTO.DIVISION_AREA WHERE COUNTRY = 'GB' AND SUBTYPE = 'country'` with `ST_CONTAINS`. Useful for scoping to London.

**6. sfguide-using-snowflake-cortex-and-streamlit-with-geospatial-data** (UK data, Streamlit in Snowflake)

- `uk_analytics_completed.ipynb` and `Trains and Restaurants.ipynb`, cell 2: `GRANT IMPORTED PRIVILEGES ON DATABASE OVERTURE_MAPS__PLACES TO ROLE PUBLIC;`. This works, but it opens the share to every user. For the compass app, grant to `COMPASS_APP_ROLE` instead.
- `sis002.py:2,18`: `from snowflake.snowpark.context import get_active_session`, `session = get_active_session()`. Inside Streamlit in Snowflake there are no credentials.
- `sis002.py:90-99`: `session.table('OVERTURE_MAPS__PLACES.CARTO.PLACE')`, filtered to `ADDRESSES['list'][0]['element']['country'] =='GB'`, selecting `CATEGORIES['primary']`.
- `sis002.py:233`: `st.pydeck_chart(pdk.Deck(...))` map.

**7. sfguide-building-geospatial-multilayer-app-with-snowflake-streamlit**

- `sql/deploy_streamlits.sql:1-5`: `use role ACCOUNTADMIN; create database if not exists ANALYSE_LOCATION_DATA; … CREATE STAGE …`
- `:42-45`: `CREATE OR REPLACE STREAMLIT … ROOT_LOCATION = '@…STREAMLIT1' MAIN_FILE = 'towns_with_roads.py' QUERY_WAREHOUSE = 'LOCATION_ANALYTICS'`
- The Streamlit app runs with the owner's privileges ("Run with the privileges of the owner, not the privileges of the caller", owner's-rights doc). If ACCOUNTADMIN owns it, the app runs as ACCOUNTADMIN. Create it as `COMPASS_APP_ROLE` (or a dedicated role) instead. **inferred from spec + source**

**8. sf-samples geocoding**

- `samples/geospatial/geocoding/sql/00_setup.sql:51-64`: wraps `CALL SYSTEM$ACCEPT_LEGAL_TERMS('DATA_EXCHANGE_LISTING', 'GZT0Z4CM1E9NQ');` and `'CREATE DATABASE IF NOT EXISTS OVERTURE_MAPS__ADDRESSES FROM LISTING GZT0Z4CM1E9NQ'` in an exception handler, because "a region where the listing is not auto-fulfillable" would otherwise abort.
- `:72-76`: tries both `OVERTURE_MAPS__ADDRESSES` and `DS_OVERTURE_MAPS__ADDRESSES`.
- `.cortex/skills/install-geocoding/references/overture-share.md:27-29`: the share may install "named either: `OVERTURE_MAPS__ADDRESSES` (no prefix), or `DS_OVERTURE_MAPS__ADDRESSES` (some accounts add a `DS_` prefix)". The same may happen with Places. **inferred.** Next check: `SHOW DATABASES LIKE '%OVERTURE%';` after Get.
- `:19`: "The acquiring role needs `CREATE DATABASE` / `IMPORT SHARE`."
- `references/troubleshooting.md:16`: when the sanity check returns 0 the cause is "role lacks `IMPORTED PRIVILEGES`", and the fix is "`GRANT IMPORTED PRIVILEGES ON DATABASE OVERTURE_MAPS__ADDRESSES TO ROLE <role>`".

**9. route-optimisation `overture-schema.md` (current Places columns)**

- `:15`: "`OVERTURE_MAPS__PLACES` | `CARTO.PLACE` | `GZT0Z4CM1E9KR` | ~66M global POIs".
- `:37`: "`TAXONOMY` … `p.TAXONOMY:primary::STRING` … (replaces the removed `CATEGORIES` column)".
- `:38`: "`BASIC_CATEGORY` | VARCHAR | … Flattened single category (preferred for filtering)".
- `:39`: "`GEOMETRY` | GEOGRAPHY | … longitude = ST_X, latitude = ST_Y".
- `:40`: `ADDRESSES` is accessed as `p.ADDRESSES[0]:locality`.
- **Conflict:** samples 5 and 6 (2024–2025) use `CATEGORIES['primary']` and `ADDRESSES:list…element`. This 2026 file says `CATEGORIES` was removed. Older quickstart SQL may fail on the current share. Treat as **unverified** until checked with `DESCRIBE TABLE OVERTURE_MAPS__PLACES.CARTO.PLACE;`. The earlier note's sketch used `taxonomy['primary']`, which agrees with the 2026 file.

### 4.3 Pattern across the samples (inferred)

- Every sample runs setup as **ACCOUNTADMIN**. The docs advise building under SYSADMIN with USERADMIN for users. Samples take the shortcut; the draft below follows the docs, with ACCOUNTADMIN only where the docs require it.
- Common shape: **one custom role**, an **XS warehouse** with USAGE, **USAGE on database and schema**, **SELECT** on tables, **IMPORTED PRIVILEGES** on shares, then **grant the role to a user** with `DEFAULT_ROLE` and `DEFAULT_WAREHOUSE`, and grant it up to SYSADMIN or ACCOUNTADMIN.
- Only the 2026 sample (Summit26) uses `TYPE = SERVICE` plus a key-pair-only authentication policy.

---

## 5. Hackathon blockers and gotchas

| # | Gotcha | Evidence | Label | What to do |
|---|---|---|---|---|
| G1 | **AI functions are off on self-service trials** until a credit card is added. Geospatial SQL still works. | "AI features are disabled by default on self-service trial accounts. To enable them, add a credit card to the account. Adding a credit card doesn't upgrade the trial to a paid account or end the trial period." https://docs.snowflake.com/en/user-guide/admin-trial-account | verified-in-spec | Ask the sponsor for an AI-enabled account, or decide deliberately on a card. Keep the compass working without AI_COMPLETE. |
| G2 | **Getting the Overture listing needs ACCOUNTADMIN** (or IMPORT SHARE + CREATE DATABASE). | Section 2.8 | verified-in-spec | On a sponsor account where you are *not* ACCOUNTADMIN, ask them to Get "Overture Maps - Places" and run `GRANT IMPORTED PRIVILEGES ON DATABASE OVERTURE_MAPS__PLACES TO ROLE <your role>`. |
| G3 | **Forgetting `GRANT IMPORTED PRIVILEGES`**: the app role then can't see the share ("does not exist or not authorized"). | Section 2.8; sf-samples `troubleshooting.md:16` | verified-in-spec + verified-in-source (exact error text: unverified) | Run the grant as the role that clicked Get. |
| G4 | **Password logins for backends.** Trials are exempt from the MFA rollout; non-trial accounts block password-only humans (Phase 3, Aug–Oct 2026) and all service-user passwords. | Section 3.2 | verified-in-spec | Use a `TYPE = SERVICE` user with a key pair from the start. |
| G5 | **A PAT on a service user requires a network policy.** Serverless hosts (e.g. Vercel) have no fixed IP. | Section 3.4; the quickstart's "allow-all" workaround at `build-a-custom-api-in-python.md:404-417` | verified-in-spec + verified-in-source | Prefer a key pair. If you use a PAT: either an allow-all network rule (weak) or an auth policy with `ENFORCED_NOT_REQUIRED` (Summit26 `04_generate_pat.sql:14-15`). |
| G6 | **ACCOUNTADMIN password lockout.** Resetting it "can take up to two business days". | Section 2.3 | verified-in-spec | Give ACCOUNTADMIN to two teammates on the trial. |
| G7 | **Trial credit and time limits.** "The trial continues for 30 days … or until you've depleted your free usage balance". At the end, "the account is suspended". Trial accounts lack external network access, hybrid tables, Openflow and Duo MFA. | https://docs.snowflake.com/en/user-guide/admin-trial-account | verified-in-spec | XS warehouse, AUTO_SUSPEND 60, an optional resource monitor. |
| G8 | **Overture columns changed.** Older samples use `CATEGORIES`; the 2026 schema note says it was removed in favour of `TAXONOMY` / `BASIC_CATEGORY`. The share may also install as `DS_OVERTURE_MAPS__PLACES`. | Section 4.2 (#5, #6, #8, #9) | verified-in-source (conflicting); live state unverified | Run `SHOW DATABASES LIKE '%OVERTURE%'; DESCRIBE TABLE <db>.CARTO.PLACE;` before writing queries. |
| G9 | **Full-table scans of ~66M POIs on every request** waste warehouse time. | `overture-schema.md:15` (row count) | inferred | Once, as SYSADMIN, copy a London-only subset into `COMPASS_DB.APP.LONDON_PLACES` (CTAS with a bounding box or `ST_DWITHIN`). The app then queries the small table. |
| G10 | **The listing may be unavailable in your region.** "Listing data products must be available locally in the current region"; the Get button may show "Request" instead. | CREATE DATABASE page; listings page | verified-in-spec; whether Overture Places is auto-fulfilled in AWS eu-west-2 is unverified | Next check: Marketplace page in the trial account shows "Get" (not "Request"). |
| G11 | **A resource monitor probably doesn't cap AI spend.** | Section 1.4 | inferred | Keep AI_COMPLETE calls cached or limited in the app. |
| G12 | **Streamlit apps run as their owner.** If ACCOUNTADMIN creates one, it has ACCOUNTADMIN power. | Owner's-rights doc; multilayer sample `deploy_streamlits.sql:1,42-45` | verified-in-spec + verified-in-source | Create Streamlit objects with `USE ROLE COMPASS_APP_ROLE` (after granting it CREATE STREAMLIT on the schema; inferred). |

---

## 6. Draft `setup.sql` for the compass app (DO NOT RUN as-is; not executed)

Conventions:
- `-- [spec]` marks a statement or role choice backed by the linked doc (verified-in-spec).
- `-- [source]` marks a match with a sample script.
- `-- [inferred]` marks a reasoned choice.
- Placeholders in `<…>` must be filled in. **No keys or tokens are included.**

```sql
-- =====================================================================
-- Compass app: least-privilege setup (draft, 2026-11-21, not executed)
-- Run section by section in a Snowsight worksheet, by a user who holds
-- ACCOUNTADMIN (and therefore SYSADMIN / SECURITYADMIN / USERADMIN).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Role (USERADMIN creates roles)
-- ---------------------------------------------------------------------
USE ROLE USERADMIN;                                   -- [spec] "Only user administrators (that is, users with the USERADMIN system role or higher), or another role with the CREATE ROLE privilege" can create roles. https://docs.snowflake.com/en/user-guide/security-access-control-configure
CREATE ROLE IF NOT EXISTS COMPASS_APP_ROLE
  COMMENT = 'Compass web app backend: read Overture Places, read/write own tables';
GRANT ROLE COMPASS_APP_ROLE TO ROLE SYSADMIN;         -- [spec] recommended hierarchy: custom roles under SYSADMIN, else "not even the ACCOUNTADMIN role can modify or drop objects created by a custom role". USERADMIN owns the role, so it may grant it (GRANT ROLE needs OWNERSHIP on the role or MANAGE GRANTS). https://docs.snowflake.com/en/sql-reference/sql/grant-role

-- ---------------------------------------------------------------------
-- 2. Warehouse + app database (SYSADMIN creates and owns them)
-- ---------------------------------------------------------------------
USE ROLE SYSADMIN;                                    -- [spec] CREATE WAREHOUSE: "Only the SYSADMIN role, or a higher role, has this privilege by default." https://docs.snowflake.com/en/sql-reference/sql/create-warehouse
CREATE WAREHOUSE IF NOT EXISTS COMPASS_WH
  WAREHOUSE_SIZE      = XSMALL                        -- [spec] 1 credit/hour (Gen1). https://docs.snowflake.com/en/user-guide/warehouses-overview
  AUTO_SUSPEND        = 60                            -- [spec] seconds; multiple of 30 because of the ~30 s poll. [source] Summit26 01_setup.sql:64
  AUTO_RESUME         = TRUE
  INITIALLY_SUSPENDED = TRUE                          -- [source] Summit26 01_setup.sql:66; [inferred] no credits until first query
  COMMENT = 'Compass app queries';

CREATE DATABASE IF NOT EXISTS COMPASS_DB;             -- [spec] SYSADMIN "has privileges to create warehouses and databases". https://docs.snowflake.com/en/user-guide/security-access-control-overview
CREATE SCHEMA   IF NOT EXISTS COMPASS_DB.APP;

-- Example app table (e.g. saved waypoints / visit log). [inferred]
CREATE TABLE IF NOT EXISTS COMPASS_DB.APP.WAYPOINTS (
  id          NUMBER AUTOINCREMENT,
  session_id  STRING,
  name        STRING,
  location    GEOGRAPHY,
  created_at  TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

-- Grants from the owner (SYSADMIN) to the app role.
GRANT USAGE ON WAREHOUSE COMPASS_WH      TO ROLE COMPASS_APP_ROLE;   -- [spec] "USAGE: Enables using a virtual warehouse … executing queries"; no OPERATE/MODIFY, so the app can't resize it. https://docs.snowflake.com/en/user-guide/security-access-control-privileges  [source] tasty-bytes create_api_user.sql:17
GRANT USAGE ON DATABASE  COMPASS_DB      TO ROLE COMPASS_APP_ROLE;   -- [spec] USAGE on db + schema + SELECT on table is the minimum to query. https://docs.snowflake.com/en/user-guide/security-access-control-considerations
GRANT USAGE ON SCHEMA    COMPASS_DB.APP  TO ROLE COMPASS_APP_ROLE;   -- [source] tasty-bytes create_api_user.sql:38-39
GRANT SELECT, INSERT ON TABLE COMPASS_DB.APP.WAYPOINTS TO ROLE COMPASS_APP_ROLE;  -- [inferred] only what the app needs; no CREATE/DROP
-- Optional, if the app should create its own tables later (broader):
-- GRANT CREATE TABLE ON SCHEMA COMPASS_DB.APP TO ROLE COMPASS_APP_ROLE;          -- [inferred]

-- ---------------------------------------------------------------------
-- 3. Overture Maps Places share (ACCOUNTADMIN gets the listing)
-- ---------------------------------------------------------------------
USE ROLE ACCOUNTADMIN;                                -- [spec] "You must use the ACCOUNTADMIN role or another role with the CREATE DATABASE and IMPORT SHARE privileges to access and install a listing." https://docs.snowflake.com/en/collaboration/consumer-listings-access
-- Option A (simplest, documented): Snowsight → Marketplace → "Overture Maps - Places" (CARTO) → Get,
--   keep database name OVERTURE_MAPS__PLACES, optionally add COMPASS_APP_ROLE under "Add roles".
-- Option B (SQL; terms must already be accepted in Snowsight per the CREATE DATABASE docs):
-- CREATE DATABASE IF NOT EXISTS OVERTURE_MAPS__PLACES FROM LISTING 'GZT0Z4CM1E9KR';
--   [spec] syntax + "must have the IMPORT LISTING privilege" + "Listing terms … must have been accepted using Snowsight": https://docs.snowflake.com/en/sql-reference/sql/create-database
--   [source] listing id GZT0Z4CM1E9KR: geo-for-machine-learning.md:118; overture-schema.md:19-20 (also calls SYSTEM$ACCEPT_LEGAL_TERMS; that function's doc page 404'd → unverified-in-spec)

GRANT IMPORTED PRIVILEGES ON DATABASE OVERTURE_MAPS__PLACES TO ROLE COMPASS_APP_ROLE;
  -- [spec] grantor must own the imported db (the role that clicked Get, here ACCOUNTADMIN) or hold MANAGE GRANTS. https://docs.snowflake.com/en/user-guide/data-share-consumers
  -- [source] same statement shape: build-a-custom-api-in-python.md:201; sf-samples troubleshooting.md:16
  -- Because COMPASS_APP_ROLE is granted to SYSADMIN, SYSADMIN also inherits read access (needed for step 3b). [spec: inheritance] [inferred: applies to imported privileges]
-- Sanity checks (run after):  SHOW DATABASES LIKE '%OVERTURE%';  DESCRIBE TABLE OVERTURE_MAPS__PLACES.CARTO.PLACE;   -- [inferred] G8

-- 3b. Optional: London subset to keep queries cheap (run as SYSADMIN so SYSADMIN owns it). [inferred]
-- USE ROLE SYSADMIN; USE WAREHOUSE COMPASS_WH;
-- CREATE OR REPLACE TABLE COMPASS_DB.APP.LONDON_PLACES AS
--   SELECT id, names:primary::STRING AS name, basic_category, geometry
--   FROM OVERTURE_MAPS__PLACES.CARTO.PLACE
--   WHERE ST_DWITHIN(geometry, ST_MAKEPOINT(-0.1276, 51.5072), 30000);   -- column names per overture-schema.md:36-39, unverified live
-- GRANT SELECT ON TABLE COMPASS_DB.APP.LONDON_PLACES TO ROLE COMPASS_APP_ROLE;

-- ---------------------------------------------------------------------
-- 4. Optional: Cortex AI (ACCOUNTADMIN only)
-- ---------------------------------------------------------------------
-- By default PUBLIC already has USE AI FUNCTIONS and SNOWFLAKE.CORTEX_USER, so these are
-- only needed if an admin revoked them from PUBLIC, or to make access explicit. [spec]
USE ROLE ACCOUNTADMIN;                                -- [spec] "You must use the ACCOUNTADMIN role to manage the USE AI FUNCTIONS account-level privilege." https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-privileges-and-access
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE COMPASS_APP_ROLE;     -- [spec] same page; [source] geo-for-machine-learning.md:886
GRANT USE AI FUNCTION AI_COMPLETE ON ACCOUNT TO ROLE COMPASS_APP_ROLE;  -- [spec] per-function privilege (narrower than USE AI FUNCTIONS)
-- Narrower alternative to CORTEX_USER: GRANT DATABASE ROLE SNOWFLAKE.AI_FUNCTIONS_USER TO ROLE COMPASS_APP_ROLE;  -- [spec]
-- Trial: does nothing until a credit card is added (G1). Cross-region: see rules-snowflake.md §2.

-- ---------------------------------------------------------------------
-- 5. Service user for the backend (USERADMIN creates users)
-- ---------------------------------------------------------------------
USE ROLE USERADMIN;                                   -- [spec] CREATE USER: "Only the USERADMIN role, or a higher role, has this privilege by default." https://docs.snowflake.com/en/sql-reference/sql/create-user
CREATE USER IF NOT EXISTS COMPASS_SVC
  TYPE                    = SERVICE                   -- [spec] no password, no MFA; [source] Summit26 01_setup.sql:28
  DEFAULT_ROLE            = COMPASS_APP_ROLE          -- [spec] does not grant the role by itself
  DEFAULT_WAREHOUSE       = COMPASS_WH
  DEFAULT_NAMESPACE       = 'COMPASS_DB.APP'          -- [source] tasty-bytes create_api_user.sql:51 (unquoted there); quoting form unverified
  DEFAULT_SECONDARY_ROLES = ()                        -- [spec] value '()' = "No roles"; [inferred] app uses exactly one role
  COMMENT                 = 'Compass web app backend';
GRANT ROLE COMPASS_APP_ROLE TO USER COMPASS_SVC;      -- [spec] USERADMIN owns the role → may grant it

-- 5a. RECOMMENDED: key-pair auth. Generate locally (never commit the private key):
--   openssl genrsa 2048 | openssl pkcs8 -topk8 -v2 aes-256-cbc -inform PEM -out rsa_key.p8
--   openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub
--   [spec] https://docs.snowflake.com/en/user-guide/key-pair-auth
ALTER USER COMPASS_SVC SET RSA_PUBLIC_KEY = '<public key body without BEGIN/END lines>';
  -- [spec] needs OWNERSHIP or MODIFY PROGRAMMATIC AUTHENTICATION METHODS on the user; USERADMIN created (owns) it.
  -- [spec] newer alternative: ALTER USER COMPASS_SVC ADD KEY PAIR compass_key PUBLIC_KEY = '<…>';  (supports role restriction + expiry)
  -- [source] Summit26 02_service_auth.sh:51; tasty-bytes create_api_user.sql:53
-- Verify: DESC USER COMPASS_SVC;  (RSA_PUBLIC_KEY_FP should match the local openssl fingerprint) [spec]

-- Optional hardening: allow ONLY key-pair for this user. [source] Summit26 01_setup.sql:40-48
-- Needs a schema to hold the policy and a role with CREATE AUTHENTICATION POLICY (ACCOUNTADMIN/SECURITYADMIN). [inferred]
-- USE ROLE ACCOUNTADMIN;
-- CREATE AUTHENTICATION POLICY COMPASS_DB.APP.COMPASS_KEYPAIR_ONLY AUTHENTICATION_METHODS = ('KEYPAIR') CLIENT_TYPES = ('DRIVERS');
-- ALTER USER COMPASS_SVC SET AUTHENTICATION POLICY COMPASS_DB.APP.COMPASS_KEYPAIR_ONLY;

-- 5b. ALTERNATIVE: PAT (needs a network policy for SERVICE users; G5)
-- USE ROLE ACCOUNTADMIN;                                                    -- [spec] network rule: ACCOUNTADMIN/SECURITYADMIN/schema owner; policy: SECURITYADMIN or higher. [inferred] ACCOUNTADMIN avoids extra USAGE grants on the schema
-- CREATE NETWORK RULE COMPASS_DB.APP.COMPASS_BACKEND_IPS TYPE = IPV4 MODE = INGRESS VALUE_LIST = ('<backend egress IP>/32');   -- [spec] mode must be INGRESS; [source] Summit26 02_service_auth.sh:46
-- CREATE NETWORK POLICY COMPASS_BACKEND_NP ALLOWED_NETWORK_RULE_LIST = ('COMPASS_DB.APP.COMPASS_BACKEND_IPS');                 -- [spec] https://docs.snowflake.com/en/user-guide/network-policies
-- ALTER USER COMPASS_SVC SET NETWORK_POLICY = COMPASS_BACKEND_NP;          -- [spec] needs OWNERSHIP on user + USAGE on policy, "or a higher role"
-- ALTER USER COMPASS_SVC ADD PROGRAMMATIC ACCESS TOKEN COMPASS_PAT
--   ROLE_RESTRICTION = 'COMPASS_APP_ROLE'                                   -- [spec] mandatory for SERVICE users
--   DAYS_TO_EXPIRY   = 7                                                    -- [inferred] hackathon lifetime
--   COMMENT          = 'Compass backend';
--   [spec] the secret is shown once; store it in the host's secret store, never in Git. https://docs.snowflake.com/en/user-guide/programmatic-access-tokens

-- ---------------------------------------------------------------------
-- 6. Optional: credit guard (ACCOUNTADMIN only)
-- ---------------------------------------------------------------------
-- USE ROLE ACCOUNTADMIN;                                                    -- [spec] "Only users with the ACCOUNTADMIN role can create a resource monitor"
-- CREATE OR REPLACE RESOURCE MONITOR COMPASS_RM WITH CREDIT_QUOTA = 10
--   TRIGGERS ON 90 PERCENT DO SUSPEND ON 100 PERCENT DO SUSPEND_IMMEDIATE;  -- [spec] syntax from https://docs.snowflake.com/en/user-guide/resource-monitors ; quota value [inferred]
-- ALTER WAREHOUSE COMPASS_WH SET RESOURCE_MONITOR = COMPASS_RM;            -- [spec] "only the ACCOUNTADMIN role can assign warehouses to resource monitors"
-- (Probably does not cap serverless AI credits: G11.)

-- ---------------------------------------------------------------------
-- 7. Smoke test as the app role (no service login needed)
-- ---------------------------------------------------------------------
-- USE ROLE COMPASS_APP_ROLE;   -- the admin user can do this only if the role is granted to them, e.g. GRANT ROLE COMPASS_APP_ROLE TO USER <you>; (USERADMIN) [spec: USE ROLE needs the role granted]
-- USE WAREHOUSE COMPASS_WH;
-- SELECT names:primary::STRING AS name,
--        ROUND(DEGREES(ST_AZIMUTH(ST_MAKEPOINT(-0.1174, 51.5131), geometry))) AS bearing_deg,
--        ROUND(ST_DISTANCE(ST_MAKEPOINT(-0.1174, 51.5131), geometry))         AS metres
-- FROM OVERTURE_MAPS__PLACES.CARTO.PLACE
-- WHERE ST_DWITHIN(geometry, ST_MAKEPOINT(-0.1174, 51.5131), 1000)
-- ORDER BY metres LIMIT 20;    -- [inferred] untested; column names per overture-schema.md, verify with DESCRIBE first
```

### 6.1 Who runs what (summary)

| Step | Role | Why that role | Label |
|---|---|---|---|
| CREATE ROLE, GRANT ROLE to SYSADMIN and to the user, CREATE USER, set the user's public key | USERADMIN | holds CREATE ROLE/CREATE USER; owns what it creates | verified-in-spec |
| CREATE WAREHOUSE/DATABASE/SCHEMA/TABLE; grant USAGE/SELECT/INSERT to the app role | SYSADMIN | holds CREATE WAREHOUSE/DATABASE; owner grants | verified-in-spec |
| Get the Overture listing; GRANT IMPORTED PRIVILEGES | ACCOUNTADMIN (or IMPORT SHARE + CREATE DATABASE, and owner/MANAGE GRANTS for the grant) | docs require it | verified-in-spec |
| CORTEX_USER and USE AI FUNCTION grants | ACCOUNTADMIN | docs require it | verified-in-spec |
| Network rule/policy and auth policy (PAT path) | ACCOUNTADMIN or SECURITYADMIN | docs; ACCOUNTADMIN chosen to avoid extra schema grants | spec + inferred |
| Resource monitor | ACCOUNTADMIN | docs require it | verified-in-spec |
| App queries at runtime | COMPASS_APP_ROLE via COMPASS_SVC | least privilege | inferred |

### 6.2 Backend connection sketch (inferred; not run)

The pattern follows `sfguide-snowflake-python-api/connector.py:12-32`. Add `role="COMPASS_APP_ROLE"` and use bind parameters for lat/lon. The private key PEM comes from a host secret or env var, never from Git.

For Node, the Snowflake Node.js driver supports key pair (key-pair page table). The exact connection option names were **unverified** in this pass. Next check: https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver-authenticate, or the `snowflake-connector-nodejs` README.

---

## 7. Open checks (next actions)

1. On the real account: `SHOW DATABASES LIKE '%OVERTURE%';`, then `DESCRIBE TABLE <db>.CARTO.PLACE;`. This confirms the database name and the TAXONOMY/BASIC_CATEGORY vs CATEGORIES columns (G8).
2. As `COMPASS_APP_ROLE`, run the step-7 smoke query. This confirms the imported privileges and the warehouse grant.
3. If AI is enabled, run `SELECT AI_COMPLETE('<model>','ping');` as `COMPASS_APP_ROLE`. This confirms the model is available and the region setting is right.
4. Read the Node.js driver auth page for the key-pair options, if the backend is Node.
5. Confirm with the sponsor whether accounts are trial or non-trial (this decides G1 and G4), and who holds ACCOUNTADMIN (G2).

---

## Search scope

- **Docs fetched** (docs.snowflake.com, 2026-11-21, converted to text locally):
  - user-guide: security-access-control-overview, -considerations, -configure, -privileges; warehouses-overview; warehouses-considerations; cost-understanding-compute; intro-key-concepts; snowflake-cortex/aisql; snowflake-cortex/aisql-privileges-and-access; data-share-consumers; programmatic-access-tokens; key-pair-auth; security-mfa-rollout; admin-user-management; organization-administrators; network-policies; resource-monitors; admin-trial-account
  - sql-reference: snowflake-db-roles; sql/create-warehouse; sql/create-user; sql/use-role; sql/use-secondary-roles; sql/grant-privilege; sql/grant-role; sql/grant-database-role; sql/create-database
  - collaboration/consumer-listings-access
  - developer-guide: native-apps/creating-setup-script; streamlit/object-management/owners-rights; streamlit/about-streamlit
  - 404: `developer-guide/native-apps/security-app-roles`, `sql-reference/functions/system_accept_legal_terms`, `developer-guide/streamlit/security/owners-rights`
- **GitHub:**
  - `gh search repos --owner Snowflake-Labs` for geospatial, overture, streamlit map, nodejs, express, react, flask, data app, custom api, carto, openstreetmap, sql api.
  - `gh search code --owner Snowflake-Labs` for `OVERTURE_MAPS__PLACES`, `GRANT IMPORTED PRIVILEGES ON DATABASE OVERTURE`, `ADD PROGRAMMATIC ACCESS TOKEN`, and `snowflake-sdk` in package.json.
  - Cloned (shallow, read only): Summit26-InteractiveLab, sfguide-tasty-bytes-zero-to-app, sfguide-build-a-custom-api-in-python-flask, sfguide-snowflake-python-api, sfguide-using-snowflake-cortex-and-streamlit-with-geospatial-data, sfguide-building-geospatial-multilayer-app-with-snowflake-streamlit, MCP-HOL-BUILD-2025 (its `create_pat.sql` is a single `ALTER USER ADD PROGRAMMATIC ACCESS TOKEN mcp_pat;` line), sfquickstarts (sparse: 4 guides), sf-samples (sparse: geospatial/geocoding, spcs/sf-connection/node).
  - One file read via `gh api`: route-optimisation `overture-schema.md`.
- **Not done:**
  - No Snowflake account used; no SQL executed; no cloned code run.
  - Node.js driver auth page not read.
  - Tasty Bytes guide markdown (holding the Node connection code) not located.
  - Community threads on trial/share failures not searched (covered by `TASK.md` scope / other workers).
  - Overture's own schema changelog not checked.
