import { defineMiddleware } from "astro:middleware";

const canonicalOrigin = "https://ramen.hisora.cc";
const legacyHosts = new Set([
  "ramen-hisora-cc.panhongwei1994.workers.dev",
  "ramen.panhongwei1994.workers.dev",
  "sora-site.panhongwei1994.workers.dev",
]);

function unauthorized() {
  return new Response("Admin access requires a staff login.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Sora Ramen Admin", charset="UTF-8"',
    },
  });
}

function getRuntimeEnv(locals: unknown) {
  return (locals as { runtime?: { env?: Record<string, string | undefined> } })?.runtime?.env ?? {};
}

function isAdminRequest(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

function isAuthorizedAdminRequest(request: Request, locals: unknown) {
  const env = getRuntimeEnv(locals);
  const password = env.ADMIN_PASSWORD?.trim();
  const username = env.ADMIN_USERNAME?.trim() || "admin";

  if (!password) {
    return false;
  }

  const header = request.headers.get("Authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return false;
  }

  try {
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex < 0) return false;
    const givenUser = decoded.slice(0, separatorIndex);
    const givenPassword = decoded.slice(separatorIndex + 1);
    return givenUser === username && givenPassword === password;
  } catch {
    return false;
  }
}

export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.request.url);

  if (legacyHosts.has(url.hostname)) {
    return Response.redirect(`${canonicalOrigin}${url.pathname}${url.search}`, 301);
  }

  if (isAdminRequest(url.pathname) && !isAuthorizedAdminRequest(context.request, context.locals)) {
    return unauthorized();
  }

  return next();
});
