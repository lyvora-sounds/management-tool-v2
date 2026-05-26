import { currentUser } from "@clerk/nextjs/server";
import db from "@/lib/db";

export async function getOrCreateUser(clerkId: string) {
  const byClerkId = await db.user.findUnique({ where: { clerkId } });
  if (byClerkId) return byClerkId;

  let clerkUser: Awaited<ReturnType<typeof currentUser>>;
  try {
    clerkUser = await currentUser();
  } catch {
    return null;
  }
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0].emailAddress;
  const name =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null;

  // Email already exists (e.g. email/password account + Google OAuth same email)
  // Link the existing account to this Clerk identity instead of creating a duplicate
  const byEmail = await db.user.findUnique({ where: { email } });
  if (byEmail) {
    return db.user.update({ where: { email }, data: { clerkId, name: name ?? byEmail.name } });
  }

  return db.user.create({ data: { clerkId, email, name } });
}
