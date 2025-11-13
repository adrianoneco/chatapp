import { User, PublicUser } from "@shared/schema";

export function sanitizeUser(user: User): PublicUser {
  const { password, ...publicUser } = user;
  return publicUser;
}
