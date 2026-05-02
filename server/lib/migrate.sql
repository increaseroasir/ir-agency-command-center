-- IR Agency Command Center — Database Schema
-- Run this against your Supabase PostgreSQL instance

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100),
  "metaAdAccountId" VARCHAR(64),
  "metaPageId" VARCHAR(64),
  "metaPixelId" VARCHAR(64),
  "ghlLocationId" VARCHAR(64),
  "ghlPrivateToken" TEXT,
  notes TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id INT DEFAULT 1 PRIMARY KEY,
  "metaAccessToken" TEXT,
  "ghlAgencyToken" TEXT,
  "ghlCompanyId" VARCHAR(64),
  "cplGreenMax" DECIMAL DEFAULT 35.00,
  "cplOrangeMax" DECIMAL DEFAULT 50.00,
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Always seed row 1 on first run
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS insights_cache (
  id SERIAL PRIMARY KEY,
  "cacheKey" VARCHAR(100) UNIQUE,
  data JSONB,
  "fetchedAt" TIMESTAMP DEFAULT NOW()
);
