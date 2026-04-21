import { defineMiddleware } from "astro:middleware";

const canonicalOrigin = "https://ramen.hisora.cc";
const legacyHosts = new Set([
  "ramen-hisora-cc.panhongwei1994.workers.dev",
  "ramen.panhongwei1994.workers.dev",
  "sora-site.panhongwei1994.workers.dev",
]);

export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.request.url);

  if (legacyHosts.has(url.hostname)) {
    return Response.redirect(`${canonicalOrigin}${url.pathname}${url.search}`, 301);
  }

  return next();
});
