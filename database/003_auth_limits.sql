CREATE TABLE auth_rate_limits (
  bucket CHAR(64) PRIMARY KEY,
  window_started DATETIME(3) NOT NULL,
  requests INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;
