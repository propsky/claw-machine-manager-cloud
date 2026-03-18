CREATE TABLE IF NOT EXISTS referrals (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  sharer_id  TEXT NOT NULL,
  scanned_at TEXT NOT NULL,
  user_agent TEXT,
  ip         TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_referrals_sharer ON referrals(sharer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_created ON referrals(created_at DESC);
