import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { githubActor, readGithubResult } from "@/lib/integrations/githubConnection";
import { OrganizationsClient } from "./OrganizationsClient";

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ githubResult?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const params = await searchParams;
  const user = await githubActor(userId);
  const result = user && params.githubResult
    ? await readGithubResult(params.githubResult, user.id)
    : null;
  return (
    <OrganizationsClient
      githubNotice={result?.outcome ?? null}
      githubOrganizationId={result?.organizationId ?? null}
      githubResultToken={result ? params.githubResult ?? null : null}
    />
  );
}
