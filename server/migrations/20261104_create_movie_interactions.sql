CREATE TABLE IF NOT EXISTS movie_likes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  movie_id INT NOT NULL,
  visitor_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_movie_likes_movie_visitor (movie_id, visitor_id),
  KEY idx_movie_likes_visitor (visitor_id),
  CONSTRAINT fk_movie_likes_movie
    FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movie_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  movie_id INT NOT NULL,
  visitor_id CHAR(36) NOT NULL,
  author_name VARCHAR(80) NOT NULL DEFAULT 'Misafir',
  body VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_movie_comments_movie_created (movie_id, created_at),
  KEY idx_movie_comments_visitor (visitor_id),
  CONSTRAINT fk_movie_comments_movie
    FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
