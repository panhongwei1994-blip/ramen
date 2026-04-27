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
  if (pathname === "/sw.js" || pathname === "/manifest.webmanifest" || pathname === "/admin-manifest.webmanifest") {
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

type AdminAuth = {
  role: "admin" | "staff";
  username: string;
};

function parseBasicAuth(request: Request) {
  const header = request.headers.get("Authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) return null;

  try {
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex < 0) return null;
    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

function authenticateAdminRequest(request: Request, locals: unknown): AdminAuth | null {
  const env = getRuntimeEnv(locals);
  const adminPassword = env.ADMIN_PASSWORD?.trim();
  const adminUsername = env.ADMIN_USERNAME?.trim() || "admin";
  const staffUsername = env.STAFF_USERNAME?.trim() || "ser1";
  const staffPassword = env.STAFF_PASSWORD?.trim() || "12345";
  const credentials = parseBasicAuth(request);

  if (!credentials) {
    return null;
  }

  if (adminPassword && credentials.username === adminUsername && credentials.password === adminPassword) {
    return { role: "admin", username: adminUsername };
  }

  if (credentials.username === staffUsername && credentials.password === staffPassword) {
    return { role: "staff", username: staffUsername };
  }

  return null;
}

function forbidden() {
  return new Response("This staff account cannot access this admin area.", { status: 403 });
}

function staffKitchenRedirect(url: URL) {
  const nextUrl = new URL(url);
  nextUrl.pathname = "/admin/orders";
  nextUrl.searchParams.set("mode", "kitchen");
  return Response.redirect(nextUrl.toString(), 302);
}

function isStaffForbiddenPath(pathname: string) {
  if (pathname === "/admin/settings" || pathname.startsWith("/admin/products")) return true;
  if (pathname.startsWith("/admin/orders/history")) return true;
  if (pathname.startsWith("/api/admin/settings") || pathname.startsWith("/api/admin/products")) return true;
  if (pathname.endsWith("/accept") && pathname.startsWith("/api/admin/orders/")) return true;
  return false;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  if (legacyHosts.has(url.hostname)) {
    return Response.redirect(`${canonicalOrigin}${url.pathname}${url.search}`, 301);
  }

  if (isAdminRequest(url.pathname)) {
    const auth = authenticateAdminRequest(context.request, context.locals);
    if (!auth) {
      return unauthorized();
    }

    (context.locals as { adminAuth?: AdminAuth }).adminAuth = auth;

    if (auth.role === "staff") {
      if (isStaffForbiddenPath(url.pathname)) {
        return forbidden();
      }
      if (url.pathname === "/admin/orders" && url.searchParams.get("mode") !== "kitchen") {
        return staffKitchenRedirect(url);
      }
    }
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
