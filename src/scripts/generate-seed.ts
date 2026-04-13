import { products } from "../data/site.ts";

const now = new Date().toISOString();

const categoryMapping = {
  signature: "House Bowls",
  sashimi: "Tonkotsu & Rich",
  nigiri: "Clear & Lighter",
  boxes: "Sets",
  sides: "Small Plates",
  drinks: "Drinks",
};

const categories = Object.entries(categoryMapping).map(([id, name], idx) => ({
  id,
  name,
  sort_order: idx,
  created_at: now,
}));

const categorySql = categories
  .map(
    (c) =>
      `INSERT INTO categories (id, name, sort_order, created_at) VALUES ('${c.id}', '${c.name}', ${c.sort_order}, '${c.created_at}');`,
  )
  .join("\n");

const productSql = products
  .map((p, idx) => {
    const metadata = {
      addOns: p.addOns,
      tags: p.tags,
    };
    return `INSERT INTO products (id, category_id, name, description, image_url, price, is_available, inventory_count, sort_order, metadata_json, created_at, updated_at) VALUES ('${p.id}', '${p.category}', '${p.name.replace(/'/g, "''")}', '${JSON.stringify(p.description).replace(/'/g, "''")}', '${p.image}', ${p.price}, 1, NULL, ${idx}, '${JSON.stringify(metadata).replace(/'/g, "''")}', '${now}', '${now}');`;
  })
  .join("\n");

console.log("-- Seed Categories");
console.log(categorySql);
console.log("\n-- Seed Products");
console.log(productSql);
