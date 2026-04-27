import { defineMiddleware } from "astro:middleware";

const canonicalOrigin = "https://ramen.hisora.cc";
const legacyHosts = new Set([
  "ramen-hisora-cc.panhongwei1994.workers.dev",
  "ramen.panhongwei1994.workers.dev",
  "sora-site.panhongwei1994.workers.dev",
]);
const longCacheExtensions = new Set([
  ".avif",
  ".css",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".png",
  ".svg",
  ".webp",
  ".woff",
  ".woff2",
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

function hasExtension(pathname: string, extensions: Set<string>) {
  const lowerPath = pathname.toLowerCase();
  return Array.from(extensions).some((extension) => lowerPath.endsWith(extension));
}

function cachePolicyFor(pathname: string) {
  if (pathname === "/sw.js" || pathname === "/manifest.webmanifest") {
    return "no-cache";
  }

  if (pathname.startsWith("/api/") || pathname.startsWith("/admin")) {
    return "no-store";
  }

  if (pathname.startsWith("/_astro/")) {
    return "public, max-age=31536000, immutable";
  }

  if (pathname.startsWith("/ramen/") || pathname.startsWith("/icons/") || hasExtension(pathname, longCacheExtensions)) {
    return "public, max-age=2592000, stale-while-revalidate=604800";
  }

  return "";
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

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  if (legacyHosts.has(url.hostname)) {
    return Response.redirect(`${canonicalOrigin}${url.pathname}${url.search}`, 301);
  }

  if (isAdminRequest(url.pathname) && !isAuthorizedAdminRequest(context.request, context.locals)) {
    return unauthorized();
  }

  const response = await next();
  const cachePolicy = cachePolicyFor(url.pathname);
  if (!cachePolicy) return response;

  const headers = new Headers(response.headers);
  headers.set("Cache-Control", cachePolicy);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
