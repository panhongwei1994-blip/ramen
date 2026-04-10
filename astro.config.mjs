import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import vue from "@astrojs/vue";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://sora-site.panhongwei1994.workers.dev",
  integrations: [vue(), sitemap()],
  adapter: cloudflare(),
  output: "server",
});
