/** The cookie that carries a GitHub setup result's token from the redirect to the organizations page. */
export const GITHUB_RESULT_COOKIE = "github_setup_result";

const RESULT_TTL_MS = 10 * 60 * 1000;

export const GITHUB_SETUP_OUTCOMES = ["connected", "error", "requested", "updated", "waiting", "choose"] as const;
export type GithubSetupOutcome = (typeof GITHUB_SETUP_OUTCOMES)[number];

export function githubResultCookie(token: string) {
  return {
    name: GITHUB_RESULT_COOKIE,
    value: token,
    options: githubResultCookieOptions(RESULT_TTL_MS / 1000),
  };
}

export function clearGithubResultCookie() {
  return {
    name: GITHUB_RESULT_COOKIE,
    value: "",
    options: githubResultCookieOptions(0),
  };
}

function githubResultCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
