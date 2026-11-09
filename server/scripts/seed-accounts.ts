import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import userRepository from "../src/repositories/user.repository.js";
import { db } from "../src/config/database.js";

const sampleAccounts = [
  { name: "admin", email: "admin@i-rated.local", role: "ADMIN" },
  { name: "demo", email: "demo@i-rated.local", role: "USER" },
] as const;

for (const account of sampleAccounts) {
  const existing = await userRepository.findByEmail(account.email);
  if (existing) {
    if (existing.role !== account.role) {
      await db.execute("UPDATE users SET role = ? WHERE id = ?", [account.role, existing.id]);
    }
    console.log(`${account.name}: account already exists; password was not changed.`);
    continue;
  }

  const password = randomBytes(18).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = await userRepository.createUser(account.name, account.email, passwordHash);
  if (account.role === "ADMIN") {
    await db.execute("UPDATE users SET role = 'ADMIN' WHERE id = ?", [userId]);
  }
  console.log(`${account.name} | ${account.email} | ${password}`);
}

await db.end();
