CREATE USER shopwave WITH PASSWORD 'shopwave123';
ALTER ROLE shopwave SET client_encoding TO 'utf8';
ALTER ROLE shopwave SET default_transaction_isolation TO 'read committed';
ALTER ROLE shopwave SET timezone TO 'UTC';
ALTER USER shopwave CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO shopwave;
GRANT ALL ON SCHEMA public TO shopwave;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO shopwave;
