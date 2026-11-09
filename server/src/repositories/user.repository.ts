import type { RowDataPacket } from "mysql2";
import { db } from "../config/database.js";

export type UserRole = "USER" | "ADMIN";

export type PublicUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
};

type UserRow = RowDataPacket & PublicUser & { password_hash: string };

class UserRepository {
  async findByEmail(email: string) {
    const [rows] = await db.execute<UserRow[]>(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    return rows[0] ?? null;
  }

  async createUser(name: string, email: string, passwordHash: string) {
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'USER')",
      [name, email, passwordHash],
    );
    return Number((result as { insertId: number }).insertId);
  }

  async createSession(userId: number, tokenHash: string, expiresAt: Date) {
    await db.execute("INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)", [userId, tokenHash, expiresAt]);
  }

  async findBySessionHash(tokenHash: string) {
    const [rows] = await db.execute<UserRow[]>(
      `SELECT u.id, u.name, u.email, u.role
       FROM auth_sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP LIMIT 1`,
      [tokenHash],
    );
    return rows[0] ?? null;
  }

  async deleteSession(tokenHash: string) {
    await db.execute("DELETE FROM auth_sessions WHERE token_hash = ?", [tokenHash]);
  }

  async claimVisitorInteractions(userId: number, visitorId: string) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        `DELETE guest FROM movie_likes guest
         JOIN movie_likes owned ON owned.movie_id = guest.movie_id AND owned.user_id = ?
         WHERE guest.visitor_id = ? AND guest.user_id IS NULL`,
        [userId, visitorId],
      );
      await connection.execute("UPDATE movie_likes SET user_id = ? WHERE visitor_id = ? AND user_id IS NULL", [userId, visitorId]);
      await connection.execute("UPDATE movie_comments SET user_id = ? WHERE visitor_id = ? AND user_id IS NULL", [userId, visitorId]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getDashboard(userId: number) {
    const [likes] = await db.execute(
      `SELECT DISTINCT m.id, m.title, m.release_year, m.image_path
       FROM movie_likes l JOIN movies m ON m.id = l.movie_id
       WHERE l.user_id = ?
       ORDER BY m.title`,
      [userId],
    );
    const [comments] = await db.execute(
      `SELECT c.id, c.body, c.created_at, m.id AS movie_id, m.title AS movie_title
       FROM movie_comments c JOIN movies m ON m.id = c.movie_id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC, c.id DESC`,
      [userId],
    );
    return { likes, comments };
  }

  async getAdminOverview() {
    const [[users]] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM users");
    const [[movies]] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM movies");
    const [[comments]] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM movie_comments");
    const [[likes]] = await db.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM movie_likes");
    const [recentComments] = await db.query(
      `SELECT c.id, c.author_name, c.body, c.created_at, m.title AS movie_title, c.user_id
       FROM movie_comments c JOIN movies m ON m.id = c.movie_id
       ORDER BY c.created_at DESC, c.id DESC LIMIT 50`,
    );
    return {
      stats: {
        users: Number(users?.count ?? 0),
        movies: Number(movies?.count ?? 0),
        comments: Number(comments?.count ?? 0),
        likes: Number(likes?.count ?? 0),
      },
      recentComments,
    };
  }

  async listUsers() {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
          (SELECT COUNT(*) FROM movie_comments c WHERE c.user_id = u.id) AS comment_count,
          (SELECT COUNT(*) FROM movie_likes l WHERE l.user_id = u.id) AS like_count
       FROM users u ORDER BY u.created_at DESC, u.id DESC`,
    );
    return rows;
  }

  async deleteComment(commentId: number) {
    const [result] = await db.execute("DELETE FROM movie_comments WHERE id = ?", [commentId]);
    return (result as { affectedRows: number }).affectedRows > 0;
  }
}

export default new UserRepository();
