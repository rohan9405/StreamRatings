-- Shared rating cache: one row per normalized "title:year" lookup
CREATE TABLE IF NOT EXISTS ratings (
  key  TEXT PRIMARY KEY,
  data TEXT    NOT NULL, -- JSON result (same shape the extension caches)
  ts   INTEGER NOT NULL  -- ms epoch when fetched from OMDb
);
