<template>
  <section class="container ordering-shell">
    <div class="category-row card">
      <button
        v-for="category in categories"
        :key="category.id"
        :class="['category-chip', { active: category.id === activeCategory }]"
        type="button"
         @click="activeCategory = category.id"
      >
        {{ category.label }}
      </button>
    </div>

    <div v-if="!shopOpen" class="closed-notice card">
      <div class="closed-icon">🌙</div>
      <div class="closed-copy">
        <h3>{{ copy.shopClosedTitle || 'Currently Closed' }}</h3>
        <p>{{ copy.shopClosedDesc || 'We are currently taking a break. Please check back later!' }}</p>
      </div>
    </div>

    <div v-else-if="!dynamicLoaded" class="menu-loading">
      <div class="spinner"></div>
    </div>

    <div id="order-menu" class="menu-grid" v-else>
      <article v-for="product in filteredProducts" :key="product.id" class="product-card card">
        <button class="image-button" type="button" @click="openProduct(product)">
          <img
            :src="optimizedImage(product.image)"
            :srcset="imageSrcset(product.image)"
            sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1080px) 48vw, 31vw"
            :alt="`${product.name} ramen menu item`"
            class="product-image"
            loading="lazy"
            width="768"
            height="768"
          />
        </button>
        <div class="product-copy">
          <p class="product-kicker">{{ categories.find((item) => item.id === product.category)?.label }}</p>
          <div class="tag-row">
            <span v-for="tag in product.tags" :key="tag" class="tag-pill">{{ tag }}</span>
          </div>
          <div class="product-header">
            <div>
              <h3>{{ product.name }}</h3>
              <p>{{ product.description }}</p>
            </div>
            <strong>{{ format(product.price) }}</strong>
          </div>
          <div class="product-actions">
            <button class="primary-button" type="button" @click="quickAdd(product)">
              {{ copy.addToCart }}
            </button>
            <button class="secondary-button" type="button" @click="openProduct(product)">
              {{ copy.customize }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <button v-if="itemCount" class="mobile-cart" type="button" @click="cartOpen = true">
      <span>{{ copy.viewCart }} ({{ itemCount }} {{ itemCount === 1 ? copy.item : copy.items }})</span>
      <strong>{{ format(grandTotal) }}</strong>
    </button>

    <div v-if="productOpen" class="overlay" @click.self="closeProduct">
      <div class="modal card">
        <button class="close-button" type="button" @click="closeProduct">×</button>
        <img
          :src="optimizedImage(selected.image)"
          :srcset="imageSrcset(selected.image)"
          sizes="(max-width: 760px) calc(100vw - 36px), 824px"
          :alt="`${selected.name} with selected toppings`"
          class="modal-image"
          width="768"
          height="768"
        />
        <div class="modal-copy">
          <p class="modal-kicker">
            <span class="modal-kicker-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 8h16" />
                <path d="M6 12h12" />
                <path d="M8 16h8" />
              </svg>
            </span>
            {{ copy.customize }}
          </p>
          <div class="product-header">
            <div>
              <h3>{{ selected.name }}</h3>
              <p>{{ selected.description }}</p>
            </div>
            <strong>{{ format(modalTotal) }}</strong>
          </div>

          <div class="field-group">
            <label>{{ copy.quantity }}</label>
            <div class="quantity-control">
              <button type="button" @click="qty = Math.max(1, qty - 1)">-</button>
              <span>{{ qty }}</span>
              <button type="button" @click="qty += 1">+</button>
            </div>
          </div>

          <div v-if="selected.addOns.length" class="field-group">
            <label>{{ copy.addOns }}</label>
            <div class="addon-grid">
              <button
                v-for="addOn in selected.addOns"
                :key="addOn.id"
                type="button"
                :class="['addon-chip', { active: addOnIds.includes(addOn.id) }]"
                @click="toggleAddon(addOn.id)"
              >
                <span>{{ addOn.label }}</span>
                <span>{{ format(addOn.price) }}</span>
              </button>
            </div>
          </div>

          <div class="field-group">
            <label>{{ copy.notes }}</label>
            <textarea v-model="notes" :placeholder="copy.notesPlaceholder" rows="4"></textarea>
          </div>
        </div>

        <div class="sticky-cta">
          <div>
            <small>{{ copy.total }}</small>
            <strong>{{ format(modalTotal) }}</strong>
          </div>
          <button class="primary-button compact-button" type="button" @click="addConfiguredItem">
            <span class="button-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
                <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 7H7" />
              </svg>
            </span>
            {{ copy.addToCart }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="cartOpen" class="overlay cart-overlay" @click.self="cartOpen = false">
      <aside class="cart-panel card">
        <button class="close-button" type="button" @click="cartOpen = false">×</button>
        <div class="cart-body">
          <div class="cart-scroll">
            <div class="cart-heading">
              <p class="eyebrow-inner">{{ copy.checkout }}</p>
              <h3>
                <span class="heading-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="20" r="1" />
                    <circle cx="18" cy="20" r="1" />
                    <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 7H7" />
                  </svg>
                </span>
                {{ copy.cartTitle }}
              </h3>
            </div>

            <div v-if="!cart.length" class="empty-state">{{ copy.emptyCart }}</div>
            <div v-else class="cart-items">
              <article v-for="item in cart" :key="item.id" class="cart-item">
                <img
                  :src="optimizedImage(item.image)"
                  :srcset="imageSrcset(item.image)"
                  sizes="82px"
                  :alt="`${item.name} in cart`"
                  loading="lazy"
                  width="768"
                  height="768"
                />
                <div>
                  <div class="cart-item-head">
                    <strong>{{ item.name }}</strong>
                    <strong>{{ format(item.total) }}</strong>
                  </div>
                  <p v-if="item.addOnLabels.length">{{ item.addOnLabels.join(" · ") }}</p>
                  <p v-if="item.notes">{{ item.notes }}</p>
                  <div class="cart-item-actions">
                    <div class="quantity-control small">
                      <button type="button" @click="changeQty(item.id, -1)">-</button>
                      <span>{{ item.quantity }}</span>
                      <button type="button" @click="changeQty(item.id, 1)">+</button>
                    </div>
                    <button class="text-button" type="button" @click="removeItem(item.id)">Remove</button>
                  </div>
                </div>
              </article>
            </div>

            <div class="totals">
              <div><span>{{ copy.subtotal }}</span><strong>{{ format(subtotal) }}</strong></div>
              <div><span>{{ copy.deliveryFee }}</span><strong>{{ format(deliveryFee) }}</strong></div>
              <div><span>{{ copy.total }}</span><strong>{{ format(grandTotal) }}</strong></div>
            </div>

            <div class="checkout-box" v-if="cart.length">
              <div class="choice-group">
                <span>{{ copy.deliveryMethod }}</span>
                <div class="choice-row">
                  <button
                    type="button"
                    :class="['choice-chip', { active: checkout.fulfillment === 'delivery' }]"
                    @click="checkout.fulfillment = 'delivery'"
                  >
                    <span class="choice-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 7h11v8H3z" />
                        <path d="M14 10h3l4 3v2h-7z" />
                        <circle cx="7.5" cy="18" r="1.5" />
                        <circle cx="17.5" cy="18" r="1.5" />
                      </svg>
                    </span>
                    {{ copy.delivery }}
                  </button>
                  <button
                    type="button"
                    :class="['choice-chip', { active: checkout.fulfillment === 'pickup' }]"
                    @click="checkout.fulfillment = 'pickup'"
                  >
                    <span class="choice-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 10h12l-1 9H7z" />
                        <path d="M9 10V8a3 3 0 0 1 6 0v2" />
                        <path d="M8 14h8" />
                      </svg>
                    </span>
                    {{ copy.pickup }}
                  </button>
                </div>
              </div>

              <div class="choice-group">
                <span>{{ copy.paymentMethod }}</span>
                <div class="choice-row">
                  <button
                    type="button"
                    :class="['choice-chip', { active: checkout.paymentMethod === 'card' }]"
                    @click="checkout.paymentMethod = 'card'"
                  >
                    <span class="choice-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </span>
                    {{ copy.stripe }}
                  </button>
                  <button
                    type="button"
                    :class="['choice-chip', { active: checkout.paymentMethod === 'cash' }]"
                    @click="checkout.paymentMethod = 'cash'"
                  >
                    <span class="choice-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </span>
                    {{ copy.cash }}
                  </button>
                </div>
              </div>

              <div class="checkout-form card" v-if="checkout.paymentMethod === 'cash'">
                <div class="form-grid">
                  <label>
                    <span class="eyebrow-inner">{{ copy.name }}</span>
                    <input v-model="checkout.name" type="text" placeholder="John Doe" />
                  </label>
                  <label>
                    <span class="eyebrow-inner">{{ copy.phone }}</span>
                    <input v-model="checkout.phone" type="tel" placeholder="+1..." />
                  </label>
                  <label v-if="checkout.fulfillment === 'delivery'">
                    <span class="eyebrow-inner">{{ copy.address }}</span>
                    <textarea v-model="checkout.address" rows="2" placeholder="Street, Apt..."></textarea>
                  </label>
                </div>
              </div>

              <div class="checkout-actions">
                <button class="primary-button checkout-submit" type="button" :disabled="!canPlaceOrder || isSubmitting" @click="placeOrder">
                  <span class="button-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                  {{ isSubmitting ? (checkout.paymentMethod === 'card' ? "Redirecting to Stripe..." : "Placing Order...") : copy.placeOrder }}
                </button>
              </div>
              <div v-if="isSubmitting" class="checkout-progress" aria-live="polite">
                <span class="checkout-progress-spinner" aria-hidden="true"></span>
                <div>
                  <strong>{{ checkout.paymentMethod === 'card' ? "Preparing secure checkout..." : "Submitting your order..." }}</strong>
                  <p>{{ checkout.paymentMethod === 'card' ? "Your order is being saved and Stripe is loading." : "Please wait while we finalize your order." }}</p>
                </div>
              </div>
              <p v-if="paymentError" class="error-note">{{ paymentError }}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <div v-if="orderPlaced" class="overlay success-overlay" @click.self="closeSuccessModal">
      <div class="success-modal card">
        <button class="close-button" type="button" @click="closeSuccessModal">×</button>
        <div class="success-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <p class="eyebrow-inner">{{ copy.checkout }}</p>
        <h3>{{ successTitle }}</h3>
        <div class="order-code-box">
          <small>Order Code</small>
          <strong>{{ orderCode }}</strong>
        </div>
        <p class="success-modal-copy">{{ orderPlacedMessage }}</p>
        <button class="primary-button success-modal-button" type="button" @click="closeSuccessModal">
          Continue
        </button>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { formatPrice, getContent, normalizeLocale } from "@/data/site";

const CART_STORAGE_KEY = "sumi-ramen-cart";

const props = defineProps<{ lang?: string }>();
const lang = normalizeLocale(props.lang);
const copy = getContent(lang);

// Data refs
const categories = ref<Array<{ id: string; label: string }>>([]);
const products = ref<any[]>([]);
const shopOpen = ref(true);
const dynamicLoaded = ref(false);

const activeCategory = ref<string>("all");
const cartOpen = ref(false);
const productOpen = ref(false);
const selected = ref<any>(null);
const qty = ref(1);
const addOnIds = ref<string[]>([]);
const notes = ref("");
const orderPlaced = ref(false);
const orderCode = ref("");
const paymentError = ref("");
const isSubmitting = ref(false);

const cart = ref<
  Array<{
    id: string;
    productId: string;
    name: string;
    image: string;
    unitPrice: number;
    quantity: number;
    addOnIds: string[];
    addOnLabels: string[];
    notes: string;
    total: number;
  }>
>([]);

onMounted(async () => {
  const saved = localStorage.getItem(CART_STORAGE_KEY);
  if (saved) {
    try {
      cart.value = JSON.parse(saved);
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }

  // Load the storefront snapshot through one cached API call.
  try {
    const storefrontRes = await fetch("/api/storefront");
    const { categories: d1Cats, products: d1Prods, isOpen } = await storefrontRes.json();
    
    shopOpen.value = isOpen;

    // Map categories with labels from copy
    categories.value = [
      { id: "all", label: copy.categories.all },
      ...d1Cats.map((cat: any) => ({
        id: cat.id,
        label: (copy.categories as any)[cat.id] || cat.name,
      })),
    ];

    // Localize products
    products.value = d1Prods.map((p: any) => {
      let description = p.description;
      try {
        const descObj = JSON.parse(p.description);
        description = descObj[lang] || descObj.en || p.description;
      } catch {
        /* Not JSON */
      }

      const metadata = JSON.parse(p.metadataJson || "{}");
      const addOns = (metadata.addOns || []).map((ao: any) => ({
        ...ao,
        label: ao.label[lang] || ao.label.en || ao.label,
      }));

      return {
        id: p.id,
        name: p.name,
        category: p.categoryId,
        description,
        price: p.price,
        image: p.imageUrl,
        isAvailable: p.isAvailable && (p.inventoryCount === null || p.inventoryCount > 0),
        tags: (metadata.tags || []).map((t: string) => (copy.tags as any)[t] || t),
        addOns,
      };
    });

    products.value = products.value.filter(p => p.isAvailable);

    dynamicLoaded.value = true;
  } catch (err) {
    console.error("Failed to load shop data:", err);
  }
});

const checkout = reactive({
  fulfillment: "delivery",
  paymentMethod: "card",
  name: "",
  phone: "",
  address: "",
});

const filteredProducts = computed(() =>
  activeCategory.value === "all"
    ? products.value
    : products.value.filter((p) => p.category === activeCategory.value),
);
const subtotal = computed(() => cart.value.reduce((sum, item) => sum + item.total, 0));
const deliveryFee = computed(() => (cart.value.length ? (checkout.fulfillment === "pickup" ? 0 : 4.9) : 0));
const grandTotal = computed(() => subtotal.value + deliveryFee.value);
const itemCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0));
const canPlaceOrder = computed(() => {
  if (itemCount.value === 0) return false;
  if (checkout.paymentMethod === "cash") {
    if (!checkout.name.trim() || !checkout.phone.trim()) return false;
    if (checkout.fulfillment === "delivery" && !checkout.address.trim()) return false;
  }
  return true;
});
const successTitle = computed(() =>
  checkout.fulfillment === "pickup" ? "Pickup Confirmed" : "Order Confirmed",
);
const orderPlacedMessage = computed(() =>
  checkout.fulfillment === "pickup"
    ? "Pickup order confirmed. Track it from the order detail page."
    : "Delivery order confirmed. Track it from the order detail page.",
);
const modalTotal = computed(() => {
  const addOnTotal = selected.value.addOns
    .filter((addOn) => addOnIds.value.includes(addOn.id))
    .reduce((sum, item) => sum + item.price, 0);
  return (selected.value.price + addOnTotal) * qty.value;
});

const format = (value: number) => formatPrice(value, lang);
const optimizedImage = (path: string) => path.replace(/\.png$/, "-768.jpg");
const imageSrcset = (path: string) => `${optimizedImage(path)} 768w, ${path} 1024w`;

function openProduct(product: (typeof products)[number]) {
  selected.value = product;
  qty.value = 1;
  addOnIds.value = [];
  notes.value = "";
  productOpen.value = true;
}

function closeProduct() {
  productOpen.value = false;
}

function toggleAddon(id: string) {
  addOnIds.value = addOnIds.value.includes(id)
    ? addOnIds.value.filter((item) => item !== id)
    : [...addOnIds.value, id];
}

function pushCartItem(product: (typeof products)[number], quantity: number, selectedAddOnIds: string[], itemNotes: string) {
  const addOns = product.addOns.filter((item) => selectedAddOnIds.includes(item.id));
  const addOnTotal = addOns.reduce((sum, item) => sum + item.price, 0);
  const unitPrice = product.price + addOnTotal;
  cart.value = [
    ...cart.value,
    {
      id: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productId: product.id,
      name: product.name,
      image: product.image,
      quantity,
      addOnIds: selectedAddOnIds,
      addOnLabels: addOns.map((item) => item.label),
      addOnTotal,
      notes: itemNotes,
      unitPrice,
      total: unitPrice * quantity,
    },
  ];
}

function quickAdd(product: (typeof products)[number]) {
  pushCartItem(product, 1, [], "");
  cartOpen.value = true;
}

function addConfiguredItem() {
  pushCartItem(selected.value, qty.value, addOnIds.value, notes.value.trim());
  productOpen.value = false;
  cartOpen.value = true;
}

function changeQty(id: string, delta: number) {
  cart.value = cart.value.flatMap((item) => {
    if (item.id !== id) return [item];
    const nextQty = item.quantity + delta;
    if (nextQty <= 0) return [];
    return [{ ...item, quantity: nextQty, total: item.unitPrice * nextQty }];
  });
}

function removeItem(id: string) {
  cart.value = cart.value.filter((item) => item.id !== id);
}

function placeOrder() {
  if (!canPlaceOrder.value) return;
  if (checkout.paymentMethod === "card") {
    void beginStripeCheckout();
  } else {
    void placeCashOrder();
  }
}

function handleOpenCart() {
  cartOpen.value = true;
}

function closeSuccessModal() {
  orderPlaced.value = false;
}

async function beginStripeCheckout() {
  isSubmitting.value = true;
  paymentError.value = "";

  try {
    const response = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lang,
        cart: cart.value,
        checkout: {
          ...checkout,
          customerName: checkout.name, // compatibility with normalizeCreateOrderPayload
        },
      }),
    });

    const data = await response.json();
    const checkoutUrl = typeof data.checkoutUrl === "string" ? data.checkoutUrl.trim() : "";

    if (!response.ok || !checkoutUrl) {
      throw new Error(
        data.error ||
          "Unable to start Stripe checkout. Check your Cloudflare Workers Stripe variables.",
      );
    }

    orderCode.value = data.orderCode ?? "";
    if (typeof window !== "undefined") {
      window.location.assign(checkoutUrl);
    }
  } catch (error) {
    paymentError.value =
      error instanceof Error
        ? error.message
        : "Unable to start Stripe checkout. Check your Cloudflare Workers Stripe variables.";
  } finally {
    isSubmitting.value = false;
  }
}

async function placeCashOrder() {
  isSubmitting.value = true;
  paymentError.value = "";

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lang,
        cart: cart.value,
        checkout: {
          ...checkout,
          customerName: checkout.name,
        },
        paymentMethod: "cash",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to place cash order.");
    }

    cart.value = [];
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      window.location.assign(`/checkout/success?order=${data.orderNo}`);
    }
  } catch (error) {
    paymentError.value = error instanceof Error ? error.message : "Unable to place cash order.";
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  if (typeof window === "undefined") return;
  const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
  if (savedCart) {
    try {
      cart.value = JSON.parse(savedCart);
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }
  window.addEventListener("open-cart", handleOpenCart);
});

onBeforeUnmount(() => {
  window.removeEventListener("open-cart", handleOpenCart);
});

watch([cartOpen, productOpen], ([cartState, productState]) => {
  document.documentElement.style.overflow = cartState || productState ? "hidden" : "";
});

watch(
  cart,
  (value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(value));
  },
  { deep: true },
);

</script>

<style scoped>
.ordering-shell {
  padding: 24px 0 32px;
}
.product-kicker,
.eyebrow-inner {
  display: block;
  color: rgba(244,213,154,.82);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .2em;
  text-transform: uppercase;
}
.product-kicker {
  margin: 0 0 8px;
}
.category-row {
  position: sticky;
  top: calc(var(--site-header-offset, 90px) + 8px);
  z-index: 12;
  display: flex;
  gap: 8px;
  overflow: auto;
  padding: 8px;
  border-radius: 18px;
  margin: 0 0 14px;
  background:
    linear-gradient(180deg, rgba(24,18,16,.94), rgba(15,11,10,.9)),
    rgba(15,11,10,.92);
  border: 1px solid rgba(241,182,107,.12);
  box-shadow: 0 14px 30px rgba(0,0,0,.24);
  backdrop-filter: blur(14px);
}
:global(body[data-menu-focus="true"] .category-row) {
  top: 10px;
}
.category-chip {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.06);
  background: rgba(255,255,255,.02);
  color: rgba(246,239,230,.78);
  white-space: nowrap;
  font-family: "Trebuchet MS", "Helvetica Neue", sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: none;
  transition: background .18s ease, color .18s ease, border-color .18s ease, transform .18s ease;
}
.category-chip.active {
  background: linear-gradient(135deg, rgba(241,182,107,.95), rgba(255,217,146,.98));
  color: #1a100b;
  border-color: rgba(255,217,146,.68);
  box-shadow: 0 8px 18px rgba(195,75,45,.22);
}
.category-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(241,182,107,.24);
  color: #fff4e6;
}
.menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 18px;
}
.product-card {
  overflow: hidden;
  position: relative;
}
.product-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(125deg, transparent 0%, rgba(255,255,255,.04) 52%, transparent 100%);
  opacity: 0;
  transition: opacity .22s ease;
  pointer-events: none;
}
.image-button {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  overflow: hidden;
}
.product-image {
  width: 100%;
  height: 252px;
  object-fit: cover;
  transition: transform .22s ease, box-shadow .22s ease;
}
.product-card:hover .product-image {
  transform: scale(1.04);
}
.product-card:hover::after {
  opacity: 1;
}
.hidden {
  display: none;
}
.product-copy {
  padding: 16px;
}
.product-kicker {
  margin-bottom: 8px;
}
.tag-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.tag-pill {
  padding: 6px 9px;
  border-radius: 999px;
  background: rgba(212,165,74,.14);
  color: var(--gold-soft);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .16em;
  text-transform: uppercase;
}
.product-header {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: flex-start;
}
.product-header h3 {
  margin: 0;
  font-size: 1.36rem;
  line-height: 1.05;
}
.product-header p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.58;
  font-size: .95rem;
}
.product-header strong {
  white-space: nowrap;
  padding: 8px 12px;
  border-radius: 14px;
  border: 1px solid rgba(212,165,74,.18);
  background: rgba(212,165,74,.08);
  color: rgba(244,213,154,.95);
}
.product-actions,
.checkout-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
}
.primary-button,
.secondary-button,
.addon-chip,
.choice-chip,
.text-button,
.quantity-control button,
input,
select,
textarea {
  transition: all .16s ease;
}
.primary-button,
.secondary-button {
  min-height: 48px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .02em;
  cursor: pointer;
}
.primary-button {
  background: linear-gradient(135deg, var(--gold), var(--gold-soft));
  color: #160f08;
}
.secondary-button {
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.1);
  color: var(--text);
}
.checkout-form {
  margin-top: 16px;
  padding: 20px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.08);
}
.form-grid {
  display: grid;
  gap: 16px;
}
.form-grid label {
  display: grid;
  gap: 8px;
}
input,
textarea {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.05);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
}
input:focus,
textarea:focus {
  outline: none;
  border-color: var(--gold-soft);
  background: rgba(255,255,255,.08);
}
.error-note {
  margin-top: 12px;
  color: var(--danger);
  font-size: 13px;
  line-height: 1.5;
}
.checkout-box {
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.primary-button {
  border: 0;
  background: linear-gradient(135deg, var(--gold), var(--gold-soft));
  color: #160f08;
}
.primary-button:disabled,
.secondary-button:disabled,
.choice-chip:disabled {
  opacity: .45;
  cursor: not-allowed;
  pointer-events: none;
}
.secondary-button {
  border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.04);
  color: var(--text);
}
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(5,6,10,.74);
  backdrop-filter: blur(14px);
}
.embedded-overlay {
  z-index: 60;
}
.success-overlay {
  z-index: 70;
}
.cart-overlay {
  place-items: stretch end;
  padding: 0;
}
.embedded-modal {
  position: relative;
  width: min(1080px, calc(100vw - 24px));
  max-height: min(96vh, 1040px);
  overflow: auto;
  padding: 18px 28px 24px;
  box-sizing: border-box;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.02)),
    rgba(9,11,17,.96);
  box-shadow: 0 32px 80px rgba(0,0,0,.42);
}
.embedded-handle {
  width: 56px;
  height: 5px;
  margin: 0 auto 16px;
  border-radius: 999px;
  background: rgba(255,255,255,.14);
}
.embedded-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.embedded-kicker {
  margin: 0;
}
.embedded-code {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(212,165,74,.22);
  background: rgba(212,165,74,.08);
  color: rgba(244,213,154,.9);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .16em;
  text-transform: uppercase;
}
.embedded-close {
  top: 18px;
  right: 18px;
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,.06);
  backdrop-filter: blur(10px);
}
.embedded-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 22px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.embedded-head h3 {
  margin: 0;
  font-size: clamp(1.65rem, 3.4vw, 2.2rem);
  letter-spacing: -.03em;
}
.embedded-head p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.65;
  max-width: 34rem;
}
.embedded-copy {
  min-width: 0;
}
.embedded-total {
  white-space: nowrap;
  padding: 12px 16px;
  border-radius: 18px;
  border: 1px solid rgba(212,165,74,.18);
  background: rgba(255,255,255,.05);
  font-size: 1.05rem;
}
.embedded-state {
  min-height: 240px;
  display: grid;
  place-items: center;
  text-align: center;
  color: var(--muted);
}
#embedded-checkout {
  min-height: 760px;
}
.modal {
  position: relative;
  width: min(760px, 100%);
  max-height: min(90vh, 820px);
  padding: 14px;
  overflow: auto;
}
.modal-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-radius: 18px;
}
.modal-copy {
  display: grid;
  gap: 14px;
  padding: 14px 2px 96px;
}
.modal-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: rgba(244,213,154,.82);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .16em;
  text-transform: uppercase;
}
.modal-kicker-icon,
.heading-icon,
.button-icon,
.success-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.modal-kicker-icon {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: rgba(212,165,74,.14);
}
.modal-kicker-icon svg,
.button-icon svg,
.heading-icon svg,
.success-icon svg {
  width: 14px;
  height: 14px;
}
.sticky-cta {
  position: sticky;
  bottom: 0;
  margin-top: -68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(7,8,12,.94);
  border: 1px solid rgba(255,255,255,.08);
  z-index: 3;
}
.sticky-cta small {
  display: block;
  font-family: ui-sans-serif, system-ui, sans-serif;
  text-transform: uppercase;
  letter-spacing: .18em;
  color: var(--muted);
  margin-bottom: 6px;
}
.sticky-cta strong {
  font-size: 1rem;
}
.close-button {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.08);
  color: var(--text);
  font-size: 1rem;
}
.success-modal {
  position: relative;
  width: min(360px, 100%);
  padding: 18px;
}
.success-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: rgba(212,165,74,.14);
  color: var(--gold-soft);
}
.success-modal h3 {
  margin: 8px 0 0;
  font-size: 1.34rem;
  line-height: 1.05;
}
.success-modal-copy {
  margin: 12px 0 0;
  color: var(--muted);
  line-height: 1.55;
  font-size: .9rem;
}
.order-code-box {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(212,165,74,.24);
  background: rgba(212,165,74,.08);
}
.order-code-box small {
  display: block;
  margin-bottom: 8px;
  color: rgba(244,213,154,.82);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .18em;
  text-transform: uppercase;
}
.order-code-box strong {
  display: block;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 1rem;
  letter-spacing: .14em;
}
.error-note {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255,124,124,.12);
  color: #ffc5c5;
  font-size: 12px;
}
.success-modal-button {
  width: 100%;
  margin-top: 14px;
}
.field-group {
  display: grid;
  gap: 8px;
}
.field-group label,
.form-grid label span {
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(244,213,154,.82);
}
.quantity-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.04);
}
.quantity-control.small {
  transform: scale(.92);
  transform-origin: left center;
}
.quantity-control button {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 0;
  background: rgba(255,255,255,.07);
  color: var(--text);
}
.addon-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.addon-chip {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  min-height: 46px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.04);
  color: var(--text);
  text-align: center;
  font-size: 12px;
}
.addon-chip.active {
  background: rgba(212,165,74,.14);
  border-color: rgba(212,165,74,.4);
}
textarea,
input,
select {
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.04);
  color: var(--text);
}
textarea {
  min-height: 92px;
  padding-top: 12px;
  resize: vertical;
}
.cart-panel {
  position: relative;
  width: min(430px, 100%);
  height: 100vh;
  padding: 14px;
  border-radius: 28px 0 0 28px;
}
.cart-body {
  height: 100%;
  overflow: auto;
  padding-right: 4px;
}
.cart-scroll {
  display: grid;
  gap: 14px;
  min-height: 100%;
}
.cart-heading h3 {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.cart-body h3 {
  margin: 0;
  font-size: 1.36rem;
}
.empty-state {
  padding: 14px;
  border-radius: 14px;
  border: 1px dashed rgba(255,255,255,.14);
  color: var(--muted);
  font-size: .9rem;
}
.cart-items {
  display: grid;
  gap: 10px;
  min-height: min(54vh, 560px);
  align-content: start;
}
.cart-item {
  display: grid;
  grid-template-columns: 82px 1fr;
  gap: 10px;
  padding: 10px;
  border-radius: 14px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
}
.cart-item img {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 14px;
}
.cart-item-head,
.totals > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.cart-item p,
.totals {
  color: var(--muted);
  line-height: 1.45;
  font-size: .86rem;
}
.cart-item-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
}
.text-button {
  border: 0;
  background: transparent;
  color: var(--danger);
  font-size: 12px;
}
.totals {
  display: grid;
  gap: 6px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.08);
  background:
    linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)),
    rgba(255,255,255,.025);
}
.totals > div:last-child {
  color: var(--text);
  font-weight: 700;
  padding-top: 10px;
  margin-top: 2px;
  border-top: 1px solid rgba(255,255,255,.08);
}
.checkout-box {
  display: grid;
  gap: 12px;
  padding: 12px;
  margin-top: 8px;
  border-radius: 14px;
  background:
    radial-gradient(circle at top right, rgba(212,165,74,.08), transparent 28%),
    rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
}
.form-grid {
  display: grid;
  gap: 12px;
}
.form-grid label {
  display: grid;
  gap: 8px;
}
.choice-group {
  display: grid;
  gap: 10px;
}
.choice-group span {
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(244,213,154,.82);
}
.choice-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.choice-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.04);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.choice-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  line-height: 1;
}
.choice-icon svg {
  width: 18px;
  height: 18px;
}
.choice-chip.active {
  background: rgba(212,165,74,.14);
  border-color: rgba(212,165,74,.4);
  color: var(--gold-soft);
}
.checkout-submit {
  grid-column: 1 / -1;
}
.helper-note {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  color: var(--muted);
  line-height: 1.6;
}
.checkout-progress {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 10px;
  align-items: start;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(212,165,74,.24);
  background: rgba(212,165,74,.08);
  color: var(--text);
}
.checkout-progress strong {
  display: block;
  font-size: 0.84rem;
}
.checkout-progress p {
  margin: 4px 0 0;
  color: var(--muted);
  line-height: 1.4;
  font-size: 0.8rem;
}
.checkout-progress-spinner {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid rgba(241,182,107,.28);
  border-top-color: var(--gold-soft);
  animation: checkout-spin 0.8s linear infinite;
}
@keyframes checkout-spin {
  to {
    transform: rotate(360deg);
  }
}
.mobile-cart {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 20;
  min-height: 62px;
  display: none;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 0 18px;
  border-radius: 999px;
  border: 0;
  background: linear-gradient(135deg, var(--gold), var(--gold-soft));
  color: #160f08;
  box-shadow: 0 18px 40px rgba(212,165,74,.34);
}
.cart-item {
  box-shadow: inset 0 1px 0 rgba(255,255,255,.03);
}
.compact-button {
  min-height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  font-size: 12px;
}

@media (max-width: 1080px) {
  .category-row {
    top: calc(var(--site-header-offset, 84px) + 6px);
  }
  .menu-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 760px) {
  .category-row {
    top: calc(var(--site-header-offset, 78px) + 4px);
    padding: 7px;
    border-radius: 16px;
  }
  .embedded-overlay {
    display: block;
    padding: 0;
  }
  .menu-grid,
  .addon-grid,
  .choice-row,
  .product-actions,
  .checkout-actions {
    grid-template-columns: 1fr;
  }
  .product-image {
    height: 260px;
  }
  .modal-image {
    height: 208px;
  }
  .modal-copy {
    padding-bottom: 14px;
  }
  .sticky-cta {
    position: static;
    margin-top: 0;
    flex-direction: column;
    align-items: stretch;
  }
  .category-chip {
    min-height: 36px;
    padding: 0 12px;
    font-size: 11.5px;
  }
  .embedded-modal {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 100%;
    max-height: 96vh;
    min-height: 88vh;
    padding: 10px 12px 12px;
    border-radius: 24px 24px 0 0;
    margin: 0;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  .embedded-head {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 14px;
  }
  .embedded-head h3 {
    font-size: 1.35rem;
  }
  .embedded-topline {
    align-items: flex-start;
    padding-right: 52px;
  }
  .embedded-code {
    font-size: 10px;
    padding: 7px 10px;
  }
  .embedded-total {
    width: 100%;
    text-align: center;
  }
  #embedded-checkout {
    min-height: 78vh;
  }
  .cart-panel {
    width: 100%;
    height: 72vh;
    margin-top: auto;
    border-radius: 28px 28px 0 0;
  }
  .cart-items {
    min-height: 44vh;
  }
  .mobile-cart {
    display: flex;
  }
  .success-modal {
    width: min(340px, 100%);
    padding: 16px;
  }
}
.menu-loading {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
.spinner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid rgba(241,182,107,.1);
  border-top-color: var(--gold-soft);
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.closed-notice {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 80px 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  text-align: center;
  border-radius: 40px;
}
.closed-icon {
  font-size: 64px;
}
.closed-copy h3 {
  margin: 0 0 12px;
  font-size: 2rem;
  color: var(--gold-soft);
}
.closed-copy p {
  margin: 0;
  color: var(--muted);
  max-width: 400px;
}
</style>
