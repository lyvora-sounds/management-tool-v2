import { Resend } from "resend";

let client: Resend | undefined;

// The client is created on first use. `new Resend()` throws without a key, and creating it when the module
// loads made `next build` (and any route importing it) fail wherever RESEND_API_KEY is not set, such as the
// container build, which deliberately has no secrets.
export function getResend(): Resend {
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}
