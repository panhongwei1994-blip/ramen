import { getContent, normalizeLocale, products, type Locale, type Product } from "@/data/site";

const PRODUCT_SEED_TIMESTAMP = "2026-04-10T00:00:00.000Z";

export type CatalogAddOn = {
  id: string;
  label: string;
  price: number;
};

export type ProductRecord = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  isAvailable: boolean;
  category: Product["category"];
  addOns: CatalogAddOn[];
  createdAt: string;
  updatedAt: string;
};

function localizeProduct(product: Product, lang?: string): ProductRecord {
  const locale = normalizeLocale(lang);
  const content = getContent(locale);

  return {
    id: product.id,
    name: product.name,
    description: product.description[locale],
    imageUrl: product.image,
    price: product.price,
    isAvailable: true,
    category: product.category,
    addOns: product.addOns.map((addOn) => ({
      id: addOn.id,
      label: addOn.label[content.lang],
      price: addOn.price,
    })),
    createdAt: PRODUCT_SEED_TIMESTAMP,
    updatedAt: PRODUCT_SEED_TIMESTAMP,
  };
}

export function listSeedProducts(lang?: string) {
  return products.map((product) => localizeProduct(product, lang));
}

export function getSeedProduct(productId: string, lang?: string) {
  const product = products.find((item) => item.id === productId);
  return product ? localizeProduct(product, lang) : null;
}

export function getProductSource(productId: string) {
  return products.find((item) => item.id === productId) ?? null;
}

export function getProductLocale(lang?: string): Locale {
  return normalizeLocale(lang);
}
