import { handleMcpPost, mcpMethodNotAllowed } from "@/lib/mcp/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleMcpPost(request);
}

export function GET() {
  return mcpMethodNotAllowed();
}

export const DELETE = GET;
