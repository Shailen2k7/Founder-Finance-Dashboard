-- ============================================
-- Founder Finance Dashboard — Supabase Setup
-- Run this ONCE in your Supabase SQL Editor
-- ============================================

-- Transactions table (core data)
CREATE TABLE IF NOT EXISTS ffd_entries (
  id bigint PRIMARY KEY,
  date text NOT NULL,
  business text NOT NULL DEFAULT '',
  account text NOT NULL DEFAULT 'default',
  type text NOT NULL CHECK (type IN ('Income', 'Expense')),
  category text NOT NULL DEFAULT 'Uncategorized',
  description text DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  is_duplicate boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Income channels / revenue sources
CREATE TABLE IF NOT EXISTS ffd_channels (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  biz text DEFAULT '',
  clr text DEFAULT '#6366F1',
  bg text DEFAULT '#EEF2FF',
  cats jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- App settings (key-value)
CREATE TABLE IF NOT EXISTS ffd_settings (
  key text PRIMARY KEY,
  value jsonb
);

-- Enable Row Level Security
ALTER TABLE ffd_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ffd_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ffd_settings ENABLE ROW LEVEL SECURITY;

-- Public access policies (for anon key usage)
-- NOTE: For production with auth, replace these with user-scoped policies
CREATE POLICY "public_access" ON ffd_entries  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON ffd_channels FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON ffd_settings FOR ALL TO anon USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entries_date ON ffd_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_business ON ffd_entries(business);
CREATE INDEX IF NOT EXISTS idx_entries_account ON ffd_entries(account);
CREATE INDEX IF NOT EXISTS idx_entries_type ON ffd_entries(type);
CREATE INDEX IF NOT EXISTS idx_entries_category ON ffd_entries(category);

-- Enable real-time for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE ffd_entries;

-- Done! Refresh your app after running this.
