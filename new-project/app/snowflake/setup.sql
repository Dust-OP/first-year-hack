-- =====================================================================
-- Career Compass: Snowflake setup. NOT YET RUN on any account.
-- Run section by section in a Snowsight worksheet as a user who holds
-- ACCOUNTADMIN. Role design and the reasoning for each grant come from
-- ../../findings/snowflake-real-projects/roles-and-setup.md (section 6).
-- After it runs, verify with:  npm run snowflake:check
-- =====================================================================

-- 1. One least-privilege role for the app -------------------------------
USE ROLE USERADMIN;
CREATE ROLE IF NOT EXISTS COMPASS_APP_ROLE
  COMMENT = 'Career Compass backend: read/write its own three tables, nothing else';
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
  TOKEN_HASH    STRING,            -- SHA-256 of the session token; the token itself is never stored
  NAME          STRING NOT NULL,
  HEADLINE      STRING,
  LINKEDIN_URL  STRING NOT NULL,
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

GRANT USAGE ON WAREHOUSE COMPASS_WH     TO ROLE COMPASS_APP_ROLE;
GRANT USAGE ON DATABASE  COMPASS_DB     TO ROLE COMPASS_APP_ROLE;
GRANT USAGE ON SCHEMA    COMPASS_DB.APP TO ROLE COMPASS_APP_ROLE;
GRANT SELECT, INSERT                 ON TABLE USERS     TO ROLE COMPASS_APP_ROLE;
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
