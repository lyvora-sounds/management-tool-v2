import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiServerGet } from "@/lib/apiServer";
import type { ApiGithubResult } from "@/lib/api/types";
import { GITHUB_RESULT_COOKIE } from "@/lib/integrations/githubResultCookie";
import { OrganizationsClient } from "./OrganizationsClient";

/** What the GitHub setup just left for this person, if anything. The banner is not worth a broken page. */
async function githubResult(token: string | undefined) {
  if (!token) return null;
  try {
    const res = await apiServerGet<ApiGithubResult>("/v1/integrations/github/result", {
      dates: "keep",
      headers: { "x-github-result-token": token },
    });
    return res.ok ? res.data.result : null;
  } catch {
    return null;
  }
}

export default async function OrganizationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const result = await githubResult((await cookies()).get(GITHUB_RESULT_COOKIE)?.value);
  return (
    <OrganizationsClient
      githubNotice={result?.outcome ?? null}
      githubOrganizationId={result?.organizationId ?? null}
    />
  );
}
