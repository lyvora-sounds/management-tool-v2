import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrganizationsClient } from "./OrganizationsClient";

export default async function OrganizationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <OrganizationsClient />;
}
