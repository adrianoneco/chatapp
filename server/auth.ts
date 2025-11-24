import { hash, verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, type User, type UserPublic } from "@shared/schema";

export const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return await verify(hash, password, ARGON2_OPTIONS);
}

export async function createUser(
  email: string,
  password: string,
  displayName: string,
  role: "client" | "attendant" | "admin" = "client"
): Promise<UserPublic> {
  const passwordHash = await hashPassword(password);
  
  const [user] = await db.insert(users).values({
    email,
    passwordHash,
    displayName,
    role,
  }).returning();

  return sanitizeUser(user);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users)
    .where(eq(users.email, email));
  
  if (user && user.deleted) {
    return undefined;
  }
  
  return user;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users)
    .where(eq(users.id, id));
  
  if (user && user.deleted) {
    return undefined;
  }
  
  return user;
}

export function sanitizeUser(user: User): UserPublic {
  const { passwordHash, passwordResetToken, passwordResetExpires, ...publicUser } = user;
  return publicUser;
}

export async function updatePasswordResetToken(
  email: string,
  token: string | null,
  expires: Date | null
): Promise<UserPublic | undefined> {
  const [user] = await db.update(users)
    .set({
      passwordResetToken: token,
      passwordResetExpires: expires,
      updatedAt: new Date(),
    })
    .where(eq(users.email, email))
    .returning();
  
  return user ? sanitizeUser(user) : undefined;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token));
  
  if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    return false;
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  
  return true;
}
