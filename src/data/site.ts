export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

export type Product = {
  id: string;
  category: "signature" | "sashimi" | "nigiri" | "boxes" | "sides" | "drinks";
  name: string;
  description: Record<Locale, string>;
  price: number;
  image: string;
  tags: ("bestSeller" | "chefPick" | "popular")[];
  addOns: { id: string; label: Record<Locale, string>; price: number }[];
};

const sameText = (value: string): Record<Locale, string> => ({
  en: value,
  zh: value,
});

export const siteContent = {
  en: {
    lang: "en",
    locale: "en-US",
    currency: "USD",
    brand: "Sora Ramen",
    metaTitle: "Sora Ramen | Tokyo-Style Ramen Bar",
    metaDescription:
      "Late-night Japanese ramen with slow-simmered broth, springy noodles, crisp small plates, and fast checkout.",
    heroBadge: "Slow-simmered broth. Fast hands. Open until the early hours.",
    heroTitle: "Tokyo midnight ramen, crafted bowl by bowl.",
    heroBody:
      "16-hour silky pork broth, springy artisan noodles, and flame-finished dark soy chashu. A premium late-night izakaya experience delivered without the wait.",
    orderNow: "Order Now",
    cartNav: "Cart",
    viewMenu: "View Menu",
    addToHomeScreen: "Install App",
    installHintIos: "Tap Share, then Add to Home Screen.",
    installHintGeneric: "Use your browser menu and choose Add to Home Screen or Install App.",
    trust: [
      "4.9/5 from 900+ locals",
      "Broth simmered 16 hours",
      "Kitchen open until 1:00 AM",
      "Pickup or delivery in 25-40 minutes",
    ],
    trustBody: [
      "Regulars come back after midnight for the same rich bowl.",
      "Built from bones, kombu, aromatics, and time.",
      "Late-night comfort without the wait.",
      "Clear pricing and a fast mobile checkout.",
    ],
    categories: {
      all: "All",
      signature: "House Bowls",
      sashimi: "Tonkotsu & Rich",
      nigiri: "Clear & Lighter",
      boxes: "Sets",
      sides: "Small Plates",
      drinks: "Drinks",
    },
    tags: {
      bestSeller: "BEST SELLER",
      chefPick: "CHEF PICK",
      popular: "LATE NIGHT FAVORITE",
    },
    shopClosedTitle: "Currently closed",
    shopClosedDesc: "Online ordering is paused for now. Please check back during service hours.",
    addToCart: "Add to Cart",
    customize: "Customize",
    quantity: "Quantity",
    addOns: "Add-ons",
    notes: "Kitchen Notes",
    notesPlaceholder: "Extra chili oil, no scallions, softer noodles...",
    total: "Total",
    subtotal: "Subtotal",
    deliveryFee: "Delivery fee",
    checkout: "Checkout",
    placeOrder: "Place Order",
    cartTitle: "Your Cart",
    emptyCart: "Your cart is empty. Add a bowl or a few sides to begin.",
    viewCart: "View Cart",
    item: "item",
    items: "items",
    name: "Name",
    phone: "Phone",
    address: "Address",
    deliveryMethod: "Delivery / Pickup",
    delivery: "Delivery",
    pickup: "Pickup",
    paymentMethod: "Payment method",
    stripe: "Card Payment",
    cash: "Cash on Delivery",
    reviewTitle: "Late-night ramen with regulars for a reason",
    reviewBody:
      "Our guests stay for the deeply complex broth and return for an ordering experience built without friction.",
    galleryTitle: "Bowls, sides, and the late-night rhythm.",
    galleryBody:
      "Creamy tonkotsu, golden snacks, cold drinks, and a compact menu built for midnight cravings.",
    futureTitle: "The art of our sold-out bowls",
    future: [
      "Broth prepared in small daily batches for better texture and depth.",
      "Noodles finished to order so pickup and delivery still hold their bite.",
      "House chili oil, ajitama, and chashu upgrades that actually change the bowl.",
      "The late-night menu is built for one person or for the whole table.",
    ],
    locationAddress: "241 Noren Alley, San Francisco, CA 94107",
    phoneLabel: "+1 (415) 555-0188",
    email: "hello@soraramen.com",
    hoursWeek: "Mon-Thu, Sun · 11:30-01:00",
    hoursWeekend: "Fri-Sat · 11:30-02:00",
    footerHeading: "Broth-forward ramen with the pace of a modern noodle bar.",
    footerMeta: [
      "16-hour broth",
      "Bowls finished to order",
      "Open late",
    ],
    footerStory:
      "Tokyo alley energy, small-batch broth, and a quick digital order flow for late service.",
    footerLinks: ["Midnight Tonkotsu", "Gyoza Set", "Pickup", "Late Delivery"],
  },
  zh: {
    lang: "zh",
    locale: "zh-CN",
    currency: "USD",
    brand: "Sora Ramen",
    metaTitle: "Sora Ramen | 东京风格拉面店",
    metaDescription:
      "深夜日式拉面，慢火熬制的高汤，劲道的面条，酥脆的小食，快速结账。",
    heroBadge: "慢火熬制。快捷出餐。营业至凌晨。",
    heroTitle: "正宗东京深夜拉面，匠心打造。",
    heroBody:
      "16小时丝滑猪骨高汤，手作劲道面条，火枪喷炙叉烧。为您提供无需等待的高端深夜居酒屋体验。",
    orderNow: "立即下单",
    cartNav: "购物车",
    viewMenu: "查看菜单",
    addToHomeScreen: "安装应用",
    installHintIos: "点击分享，然后选择‘添加到主屏幕’。",
    installHintGeneric: "使用浏览器菜单，选择‘添加到主屏幕’或‘安装应用’。",
    trust: [
      "900+ 好评，均分 4.9",
      "高汤熬制 16 小时",
      "厨房营业至凌晨 1:00",
      "自取或外送仅需 25-40 分钟",
    ],
    trustBody: [
      "老顾客总是在午夜回来寻味。",
      "选用大骨、昆布、香料和时间精心熬制。",
      "无需漫长等待的深夜慰藉。",
      "价格透明，移动端结账迅速。",
    ],
    categories: {
      all: "全部",
      signature: "招牌拉面",
      sashimi: "浓郁博多风",
      nigiri: "清爽淡雅风",
      boxes: "超值套餐",
      sides: "精致小食",
      drinks: "清爽饮品",
    },
    tags: {
      bestSeller: "销量冠军",
      chefPick: "主厨精选",
      popular: "深夜最爱",
    },
    shopClosedTitle: "休息中",
    shopClosedDesc: "我们目前已休息。请稍后再来，或在营业时间访问！",
    addToCart: "加入购物车",
    customize: "个性化定制",
    quantity: "数量",
    addOns: "加料",
    notes: "备注",
    notesPlaceholder: "多点辣油，不要葱，面软点...",
    total: "总计",
    subtotal: "小计",
    deliveryFee: "配送费",
    checkout: "结账",
    placeOrder: "提交订单",
    cartTitle: "您的购物车",
    emptyCart: "购物车是空的。加一碗拉面或几份小食开始吧。",
    viewCart: "查看购物车",
    item: "件商品",
    items: "件商品",
    name: "姓名",
    phone: "电话号码",
    address: "配送地址",
    deliveryMethod: "配送 / 自取",
    delivery: "送餐",
    pickup: "自取",
    paymentMethod: "支付方式",
    stripe: "在线支付",
    cash: "货到付款 / 到店支付",
    reviewTitle: "一个让人流连忘返的深夜拉面庇护所",
    reviewBody:
      "醇厚的汤头第一次就征服了客人，而流畅的下单体验让他们成为了常客。",
    galleryTitle: "匠心之作：拉面、小食与深夜的韵律。",
    galleryBody:
      "快速扫一眼定义我们餐厅的质感：浓郁的高汤、金黄酥脆的小吃、冰凉的饮料，以及为深夜渴望量身定制的菜单。",
    futureTitle: "为什么我们的拉面总是售罄",
    future: [
      "高汤每日小批量准备，以确保更好的质感和深度。",
      "面条即点即做，无论是自取还是外送都能保持劲道。",
      "自制辣油、味玉和叉烧升级，真正提升整碗面的口感。",
      "深夜菜单适合独自享用，也适合聚会分享。",
    ],
    locationAddress: "241 Noren Alley, San Francisco, CA 94107",
    phoneLabel: "+1 (415) 555-0188",
    email: "hello@soraramen.com",
    hoursWeek: "周一至周四，周日 · 11:30-01:00",
    hoursWeekend: "周五至周六 · 11:30-02:00",
    footerHeading: "以汤为本的拉面，现代面馆的高效节奏。",
    footerMeta: [
      "16小时熬制高汤",
      "手作拉面",
      "营业至深夜",
    ],
    footerStory:
      "Sora Ramen 将东京小巷的活力与纯净的数字订单流相结合，让食物保持浓郁口感的同时，结账流程依然迅速。",
    footerLinks: ["深夜博多拉面", "饺子套餐", "到店自取", "深夜外送"],
  },
} as const;

export const reviews = [
  {
    name: "Mika T.",
    quote:
      "The broth has real depth, and the noodles still arrive with bite. It feels like a proper late-night ramen bar.",
  },
  {
    name: "Jordan P.",
    quote:
      "Fast checkout, clean packaging, and black garlic tonkotsu that tastes built with care.",
  },
  {
    name: "Elena R.",
    quote:
      "The menu is tight, the ordering flow is easy, and the late-night mood feels intentional.",
  },
] as const;

export const products: Product[] = [
  {
    id: "midnight-tonkotsu",
    category: "signature",
    name: "Midnight Tonkotsu",
    description: sameText("Creamy pork broth, thin noodles, ajitama, chashu, scallion, and sesame."),
    price: 19,
    image: "/ramen/bowl-tonkotsu-midnight.png",
    tags: ["bestSeller", "popular"],
    addOns: [
      { id: "egg", label: sameText("Ajitama egg"), price: 2.5 },
      { id: "chashu", label: sameText("Extra chashu"), price: 4.5 },
      { id: "nori", label: sameText("Nori sheet"), price: 1.5 },
    ],
  },
  {
    id: "spicy-miso-burn",
    category: "signature",
    name: "Spicy Miso Burn",
    description: sameText("Red miso broth, curled noodles, chili crisp, sweet corn, and butter."),
    price: 20,
    image: "/ramen/bowl-miso-spicy.png",
    tags: ["chefPick", "popular"],
    addOns: [
      { id: "heat", label: sameText("Extra chili oil"), price: 1.5 },
      { id: "corn", label: sameText("Sweet corn"), price: 1.5 },
      { id: "butter", label: sameText("Cultured butter"), price: 2 },
    ],
  },
  {
    id: "yuzu-shio-glow",
    category: "signature",
    name: "Yuzu Shio Glow",
    description: sameText("Clear chicken-sea salt broth with yuzu, bamboo shoots, and charred chicken."),
    price: 18,
    image: "/ramen/bowl-shio-yuzu.png",
    tags: ["popular"],
    addOns: [
      { id: "yuzu", label: sameText("Extra yuzu kosho"), price: 1.5 },
      { id: "greens", label: sameText("Seasonal greens"), price: 2 },
    ],
  },
  {
    id: "black-garlic-tonkotsu",
    category: "sashimi",
    name: "Black Garlic Tonkotsu",
    description: sameText("Rich tonkotsu layered with mayu black garlic oil, kikurage, and roasted pork."),
    price: 21,
    image: "/ramen/bowl-tonkotsu-black.png",
    tags: ["chefPick"],
    addOns: [
      { id: "garlic", label: sameText("Extra mayu"), price: 1.5 },
      { id: "noodles", label: sameText("Extra noodles"), price: 3 },
    ],
  },
  {
    id: "tokyo-shoyu-classic",
    category: "sashimi",
    name: "Tokyo Shoyu Classic",
    description: sameText("Soy broth with wavy noodles, menma, chicken oil, and a clean savory finish."),
    price: 18,
    image: "/ramen/bowl-shoyu-tokyo.png",
    tags: ["bestSeller"],
    addOns: [
      { id: "egg", label: sameText("Ajitama egg"), price: 2.5 },
      { id: "menma", label: sameText("Extra bamboo shoots"), price: 2 },
    ],
  },
  {
    id: "chicken-paitan-white",
    category: "nigiri",
    name: "Chicken Paitan White",
    description: sameText("Velvety chicken broth with sous-vide chicken, cabbage, and white pepper."),
    price: 19,
    image: "/ramen/bowl-paitan-chicken.png",
    tags: ["chefPick"],
    addOns: [
      { id: "chicken", label: sameText("Extra chicken"), price: 4 },
      { id: "scallion", label: sameText("Extra scallion"), price: 1 },
    ],
  },
  {
    id: "sesame-vegan-tantan",
    category: "nigiri",
    name: "Sesame Vegan Tantan",
    description: sameText("Creamy sesame broth with tofu crumble, bok choy, mushrooms, and chili threads."),
    price: 18,
    image: "/ramen/bowl-vegan-tantan.png",
    tags: ["popular"],
    addOns: [
      { id: "tofu", label: sameText("Extra tofu"), price: 2.5 },
      { id: "mushroom", label: sameText("Roasted mushrooms"), price: 3 },
    ],
  },
  {
    id: "ramen-gyoza-set",
    category: "boxes",
    name: "Ramen + Gyoza Set",
    description: sameText("Choose one signature bowl with a crisp gyoza plate and house pickles."),
    price: 25,
    image: "/ramen/set-ramen-gyoza.png",
    tags: ["bestSeller"],
    addOns: [],
  },
  {
    id: "late-night-feast-for-two",
    category: "boxes",
    name: "Late Night Feast for Two",
    description: sameText("Two bowls, one gyoza plate, cucumber salad, and two sparkling yuzu sodas."),
    price: 49,
    image: "/ramen/set-feast-two.png",
    tags: ["chefPick", "popular"],
    addOns: [],
  },
  {
    id: "crispy-gyoza",
    category: "sides",
    name: "Crispy Gyoza Plate",
    description: sameText("Five pan-seared pork and cabbage dumplings with sesame soy dip."),
    price: 9,
    image: "/ramen/snack-gyoza-crispy.png",
    tags: ["bestSeller"],
    addOns: [],
  },
  {
    id: "tokyo-karaage",
    category: "sides",
    name: "Tokyo Karaage",
    description: sameText("Soy-marinated fried chicken with lemon, kewpie, and togarashi salt."),
    price: 11,
    image: "/ramen/snack-karaage.png",
    tags: ["popular"],
    addOns: [],
  },
  {
    id: "sesame-cucumber-salad",
    category: "sides",
    name: "Sesame Cucumber Salad",
    description: sameText("Cold smashed cucumber with rice vinegar, sesame, and chili threads."),
    price: 7,
    image: "/ramen/snack-cucumber.png",
    tags: [],
    addOns: [],
  },
  {
    id: "yuzu-soda",
    category: "drinks",
    name: "Sparkling Yuzu Soda",
    description: sameText("Citrus-bright soda with yuzu peel and a crisp finish."),
    price: 5,
    image: "/ramen/drink-yuzu-soda.png",
    tags: [],
    addOns: [],
  },
  {
    id: "hojicha-milk-tea",
    category: "drinks",
    name: "Hojicha Milk Tea",
    description: sameText("Roasted tea, creamy milk, and a softly smoky finish over ice."),
    price: 6,
    image: "/ramen/drink-hojicha.png",
    tags: ["chefPick"],
    addOns: [],
  },
  {
    id: "matcha-lemon-fizz",
    category: "drinks",
    name: "Matcha Lemon Fizz",
    description: sameText("Bright lemon sparkle finished with ceremonial matcha foam."),
    price: 6,
    image: "/ramen/drink-matcha.png",
    tags: [],
    addOns: [],
  },
];

export function normalizeLocale(lang?: string): Locale {
  return (locales.includes((lang || "en") as Locale) ? lang : "en") as Locale;
}

export function getContent(lang?: string) {
  return siteContent[normalizeLocale(lang)];
}

export function getLocalizedProducts(lang?: string) {
  const content = getContent(lang);
  return products.map((product) => ({
    ...product,
    description: product.description[content.lang],
    tags: product.tags.map((tag) => content.tags[tag]),
    addOns: product.addOns.map((addOn) => ({
      id: addOn.id,
      label: addOn.label[content.lang],
      price: addOn.price,
    })),
  }));
}

export function formatPrice(value: number, lang?: string) {
  const content = getContent(lang);
  return new Intl.NumberFormat(content.locale, {
    style: "currency",
    currency: content.currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getLocaleUrls(current: Locale) {
  return locales.map((locale) => ({
    locale,
    url: locale === "en" ? "/" : `/${locale}`,
    active: locale === current,
  }));
}

export function getRestaurantSchema(siteUrl: string, lang?: string) {
  const content = getContent(lang);
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: content.brand,
    image: [new URL("/ramen/hero-poster-768.jpg", siteUrl).toString()],
    servesCuisine: ["Japanese", "Ramen"],
    priceRange: "$$",
    telephone: "+1 (415) 555-0188",
    address: {
      "@type": "PostalAddress",
      streetAddress: "241 Noren Alley",
      addressLocality: "San Francisco",
      addressRegion: "CA",
      postalCode: "94107",
      addressCountry: "US",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"],
        opens: "11:30",
        closes: "01:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Friday", "Saturday"],
        opens: "11:30",
        closes: "02:00",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "900",
    },
  };
}
