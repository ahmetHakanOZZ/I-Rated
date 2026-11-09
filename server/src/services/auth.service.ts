import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import userRepository, { type PublicUser } from "../repositories/user.repository.js";

const SESSION_LENGTH_DAYS = 7;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

class AuthService {
  async register(name: string, email: string, password: string, visitorId: string | null) {
    const normalizedEmail = email.trim().toLowerCase();
    if (await userRepository.findByEmail(normalizedEmail)) {
      throw new Error("EMAIL_IN_USE");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = await userRepository.createUser(name.trim(), normalizedEmail, passwordHash);
    return this.createSession(userId, { id: userId, name: name.trim(), email: normalizedEmail, role: "USER" }, visitorId);
  }

  async login(email: string, password: string, visitorId: string | null) {
    const user = await userRepository.findByEmail(email.trim().toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return null;
    return this.createSession(user.id, { id: user.id, name: user.name, email: user.email, role: user.role }, visitorId);
  }

  async currentUser(token: string) {
    return userRepository.findBySessionHash(hashToken(token));
  }

  async logout(token: string) {
    await userRepository.deleteSession(hashToken(token));
  }

  getDashboard(userId: number) {
    return userRepository.getDashboard(userId);
  }

  getAdminOverview() {
    return userRepository.getAdminOverview();
  }

  listUsers() {
    return userRepository.listUsers();
  }

  deleteComment(commentId: number) {
    return userRepository.deleteComment(commentId);
  }

  private async createSession(userId: number, user: PublicUser, visitorId: string | null) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_LENGTH_DAYS * 24 * 60 * 60 * 1000);
    if (visitorId) await userRepository.claimVisitorInteractions(userId, visitorId);
    await userRepository.createSession(userId, hashToken(token), expiresAt);
    return { token, user };
  }
}

export default new AuthService();
