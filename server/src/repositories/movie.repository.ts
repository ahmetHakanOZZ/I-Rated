import { db } from "../config/database.js";

class MovieRepository {
  async getMovies(visitorId: string | null, userId: number | null) {
    const [rows] = await db.query(
      `SELECT m.*,
          (SELECT COUNT(*) FROM movie_likes l WHERE l.movie_id = m.id) AS like_count,
          (SELECT COUNT(*) FROM movie_comments c WHERE c.movie_id = m.id) AS comment_count,
          EXISTS(SELECT 1 FROM movie_likes l WHERE l.movie_id = m.id AND
            ((? IS NOT NULL AND l.user_id = ?) OR (l.user_id IS NULL AND l.visitor_id = ?))) AS liked_by_me
       FROM movies m
       ORDER BY m.created_at DESC, m.id DESC`,
      [userId, userId, visitorId ?? ""],
    );
    return rows;
  }

  async getMovieById(id: number) {
    const [rows] = await db.query("SELECT * FROM movies WHERE id = ?", [id]);
    return rows;
  }

  async getComments(movieId: number) {
    const [rows] = await db.query(
      `SELECT id, author_name, body, created_at
       FROM movie_comments WHERE movie_id = ?
       ORDER BY created_at DESC, id DESC`,
      [movieId],
    );
    return rows;
  }

  async addComment(movieId: number, visitorId: string, userId: number | null, authorName: string, body: string) {
    const [result] = await db.execute(
      "INSERT INTO movie_comments (movie_id, visitor_id, user_id, author_name, body) VALUES (?, ?, ?, ?, ?)",
      [movieId, visitorId, userId, authorName, body],
    );
    return result;
  }

  async addLike(movieId: number, visitorId: string, userId: number | null) {
    await db.execute(
      "INSERT IGNORE INTO movie_likes (movie_id, visitor_id, user_id) VALUES (?, ?, ?)",
      [movieId, visitorId, userId],
    );
  }

  async removeLike(movieId: number, visitorId: string, userId: number | null) {
    if (userId !== null) {
      await db.execute(
        "DELETE FROM movie_likes WHERE movie_id = ? AND (user_id = ? OR (user_id IS NULL AND visitor_id = ?))",
        [movieId, userId, visitorId],
      );
      return;
    }
    await db.execute("DELETE FROM movie_likes WHERE movie_id = ? AND visitor_id = ? AND user_id IS NULL", [movieId, visitorId]);
  }
}

export default new MovieRepository();
