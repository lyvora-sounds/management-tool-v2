// Liveness probe for the container platform. It must answer without a session and without touching the
// database, so a Neon cold start never makes Cloud Run think the container is dead.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" });
}
