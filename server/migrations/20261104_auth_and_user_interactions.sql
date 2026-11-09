CREATE TABLE IF NOT EXISTS auth_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_sessions_token_hash (token_hash),
  KEY idx_auth_sessions_user_expiry (user_id, expires_at),
  CONSTRAINT fk_auth_sessions_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE movie_likes
  ADD COLUMN user_id INT NULL AFTER visitor_id,
  ADD UNIQUE KEY uq_movie_likes_movie_user (movie_id, user_id),
  ADD KEY idx_movie_likes_user (user_id),
  ADD CONSTRAINT fk_movie_likes_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE movie_comments
  ADD COLUMN user_id INT NULL AFTER visitor_id,
  ADD KEY idx_movie_comments_user_created (user_id, created_at),
  ADD CONSTRAINT fk_movie_comments_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL;
