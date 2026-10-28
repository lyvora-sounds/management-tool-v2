import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GITHUB_RESULT_COOKIE, githubActor, readGithubResult } from "@/lib/integrations/githubConnection";
import { OrganizationsClient } from "./OrganizationsClient";

export default async function OrganizationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await githubActor(userId);
  const token = (await cookies()).get(GITHUB_RESULT_COOKIE)?.value;
  const result = user && token ? await readGithubResult(token, user.id) : null;
  return (
    <OrganizationsClient
      githubNotice={result?.outcome ?? null}
      githubOrganizationId={result?.organizationId ?? null}
    />
  );
}
