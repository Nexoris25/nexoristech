-- Create one database per app on the shared PostgreSQL server, and enable pgvector on the
-- Oge database for embeddings. Runs once on first boot via the Docker init hook.

SELECT 'CREATE DATABASE nexoris_cms'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nexoris_cms')\gexec

SELECT 'CREATE DATABASE nexoris_oge'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nexoris_oge')\gexec

SELECT 'CREATE DATABASE nexoris_admin'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nexoris_admin')\gexec

\connect nexoris_oge
CREATE EXTENSION IF NOT EXISTS vector;
