// Adds X-Robots-Tag: noindex on non-production hosts (staging branch
// deploys + PR deploy-previews). Netlify's netlify.toml headers can't be
// context-scoped, so we do this at the edge.
//
// Production hosts (the OpptyCon app + any pinned domains) get nothing
// added — they stay crawlable.
import type { Context } from "https://edge.netlify.com";

const PROD_HOSTS = new Set([
  // OpptyCon production hostnames as of 2026-05 — extend this list as the
  // app graduates to app.netherops.com / opptycon.com / etc.
  "opptycon.netlify.app",
  "app.netherops.com",
]);

export default async (request: Request, context: Context) => {
  const response = await context.next();
  const host = new URL(request.url).hostname;
  if (!PROD_HOSTS.has(host)) {
    response.headers.set(
      "X-Robots-Tag",
      "noindex, nofollow, noarchive, nosnippet",
    );
  }
  return response;
};

export const config = {
  path: "/*",
};
