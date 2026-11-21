-- =====================================================================
-- Career Compass: Snowflake setup. Run on the team's trial account on 21 Nov 2026 (with the public key filled in).
-- Run section by section in a Snowsight worksheet as a user who holds
-- ACCOUNTADMIN. Role design and the reasoning for each grant come from
-- ../../findings/snowflake-real-projects/roles-and-setup.md (section 6).
-- After it runs, verify with:  npm run snowflake:check
-- =====================================================================

-- 1. One least-privilege role for the app -------------------------------
USE ROLE USERADMIN;
CREATE ROLE IF NOT EXISTS COMPASS_APP_ROLE
  COMMENT = 'Career Compass backend: read/write its own tables, nothing else';
GRANT ROLE COMPASS_APP_ROLE TO ROLE SYSADMIN;

-- 2. Compute and storage ------------------------------------------------
USE ROLE SYSADMIN;
CREATE WAREHOUSE IF NOT EXISTS COMPASS_WH
  WAREHOUSE_SIZE = XSMALL
  AUTO_SUSPEND = 60
  AUTO_RESUME = TRUE
  INITIALLY_SUSPENDED = TRUE
  COMMENT = 'Career Compass queries';

CREATE DATABASE IF NOT EXISTS COMPASS_DB;
CREATE SCHEMA IF NOT EXISTS COMPASS_DB.APP;
USE SCHEMA COMPASS_DB.APP;

-- Times are epoch milliseconds so the app reads them without parsing.
CREATE TABLE IF NOT EXISTS USERS (
  ID            STRING NOT NULL,
  LOGTO_SUB     STRING,            -- sign-in identity: Logto user id, or 'linkedin|<sub>'; NULL for quick sign-ups and demo bots
  EMAIL         STRING,            -- verified by Logto; never shown to other users (a LinkedIn email goes to LINKEDIN_PROFILES)
  TOKEN_HASH    STRING,            -- SHA-256 of the session token; the token itself is never stored
  NAME          STRING NOT NULL,
  HEADLINE      STRING,
  LINKEDIN_URL  STRING,            -- NULL until the profile is completed
  OFFERS        STRING,            -- JSON array of tags
  SEEKS         STRING,            -- JSON array of tags
  IS_DEMO       BOOLEAN DEFAULT FALSE,
  CREATED_MS    NUMBER(15, 0)
);

-- One row per person: their latest position only. No location history is kept.
CREATE TABLE IF NOT EXISTS LOCATIONS (
  USER_ID     STRING NOT NULL,
  GEOG        GEOGRAPHY NOT NULL,
  ACCURACY_M  FLOAT,
  UPDATED_MS  NUMBER(15, 0)
);

CREATE TABLE IF NOT EXISTS REQUESTS (
  ID            STRING NOT NULL,
  FROM_ID       STRING NOT NULL,
  TO_ID         STRING NOT NULL,
  STATUS        STRING NOT NULL,   -- pending | accepted | declined
  CREATED_MS    NUMBER(15, 0),
  RESPONDED_MS  NUMBER(15, 0)
);

-- ---------------------------------------------------------------------
-- Added 21 Nov 2026 for Sign in with LinkedIn and profile pictures.
-- WRITTEN, NOT YET RUN on any account.
-- MIGRATION for an account where this file was already run: run this
-- block again, from "USE ROLE SYSADMIN" below to the end of section 2.
-- Every statement is CREATE ... IF NOT EXISTS or a GRANT, so running it
-- twice changes nothing, and the three tables above are not altered.
-- Then check with:  npm run snowflake:check
-- ---------------------------------------------------------------------
USE ROLE SYSADMIN;
USE SCHEMA COMPASS_DB.APP;

-- What LinkedIn returned when a person signed in with LinkedIn: one row per
-- user, refreshed only when that person signs in again (never on a schedule).
-- Kept apart from USERS so it can be read by a later job and deleted on its
-- own when the person asks. EMAIL here is never shown to other users.
CREATE TABLE IF NOT EXISTS LINKEDIN_PROFILES (
  USER_ID            STRING NOT NULL,   -- USERS.ID
  LINKEDIN_SUB       STRING NOT NULL,   -- LinkedIn's id for this member; specific to our LinkedIn app
  NAME               STRING,
  GIVEN_NAME         STRING,
  FAMILY_NAME        STRING,
  EMAIL              STRING,            -- optional in LinkedIn's answer
  EMAIL_VERIFIED     BOOLEAN,           -- optional in LinkedIn's answer
  PICTURE_URL        STRING,            -- a LinkedIn media link; it can expire
  LOCALE             STRING,            -- e.g. en-US
  PROFILE_URL        STRING,            -- linkedin.com/in/... typed by the user; LinkedIn does not provide it
  RAW_CLAIMS         VARIANT,           -- the userinfo answer exactly as received
  FIRST_SEEN_MS      NUMBER(15, 0),
  LAST_REFRESHED_MS  NUMBER(15, 0)
);

-- The photo a person picked on the profile form, if any: a 256 px JPEG as a data URL.
CREATE TABLE IF NOT EXISTS USER_PHOTOS (
  USER_ID     STRING NOT NULL,
  PHOTO       STRING NOT NULL,
  UPDATED_MS  NUMBER(15, 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE LINKEDIN_PROFILES TO ROLE COMPASS_APP_ROLE;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE USER_PHOTOS       TO ROLE COMPASS_APP_ROLE;

GRANT USAGE ON WAREHOUSE COMPASS_WH     TO ROLE COMPASS_APP_ROLE;
GRANT USAGE ON DATABASE  COMPASS_DB     TO ROLE COMPASS_APP_ROLE;
GRANT USAGE ON SCHEMA    COMPASS_DB.APP TO ROLE COMPASS_APP_ROLE;
GRANT SELECT, INSERT, UPDATE         ON TABLE USERS     TO ROLE COMPASS_APP_ROLE;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE LOCATIONS TO ROLE COMPASS_APP_ROLE;
GRANT SELECT, INSERT, UPDATE         ON TABLE REQUESTS  TO ROLE COMPASS_APP_ROLE;

-- 3. Service user for the backend (key pair, no password) -----------------
-- On your laptop, outside the repo:
--   openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out compass_key.p8 -nocrypt
--   openssl rsa -in compass_key.p8 -pubout -out compass_key.pub
-- Paste the public key body (no BEGIN/END lines, no line breaks) below.
-- Never commit either file.
USE ROLE USERADMIN;
CREATE USER IF NOT EXISTS COMPASS_SVC
  TYPE = SERVICE
  DEFAULT_ROLE = COMPASS_APP_ROLE
  DEFAULT_WAREHOUSE = COMPASS_WH
  RSA_PUBLIC_KEY = '<paste public key body here>'
  COMMENT = 'Career Compass backend';
GRANT ROLE COMPASS_APP_ROLE TO USER COMPASS_SVC;

-- 4. Cost guard (optional, ACCOUNTADMIN) ----------------------------------
-- USE ROLE ACCOUNTADMIN;
-- CREATE RESOURCE MONITOR IF NOT EXISTS COMPASS_LIMIT WITH CREDIT_QUOTA = 10
--   TRIGGERS ON 100 PERCENT DO SUSPEND;
-- ALTER WAREHOUSE COMPASS_WH SET RESOURCE_MONITOR = COMPASS_LIMIT;
