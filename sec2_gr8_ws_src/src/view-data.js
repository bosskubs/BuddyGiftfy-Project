// Named JSON data for the HTML page controllers. This module never produces HTML
// or tells the browser which template/function to execute.
import { totals } from "./commerce.js";

export const home = (products, categories) => ({ products, categories });
export const catalog = (products, categories, session, options = {}) => ({
  products,
  categories,
  filters: {
    q: options.q || "",
    category: options.category || "",
    min: options.min || "",
    max: options.max || "",
    custom: !!options.custom,
    stock: !!options.stock,
    sort: options.sort || "featured",
  },
  pagination: {
    total: options.total || 0,
    page: options.page || 1,
    pages: options.pages || 1,
  },
});
export const detail = (product, related) => ({ product, related });
export const favorites = (products) => ({ products });
export const cart = (items, session) => ({
  items,
  totals: totals(items, session.settings),
});
export const checkout = (items, customer, session) => ({
  items,
  customer,
  totals: totals(
    items,
    session.settings,
    session.checkoutDraft
      ? session.checkoutDraft.gift_wrap === "1"
      : !!session.preferGiftWrap,
  ),
});
export const auth = (
  session,
  { register = false, admin = false, next = "/account" } = {},
) => ({
  mode: admin ? "admin" : register ? "register" : "customer",
  next,
  draft: session.authDraft || {},
});
export const account = (customer, orders) => ({ customer, orders });
export const profile = (user, session, { admin = false } = {}) =>
  admin ? { account: user } : { customer: user };
export const orderPage = (order, items, payment) => ({ order, items, payment });
export const adminDashboard = (metrics, orders, lowStock) => ({
  metrics,
  orders,
  lowStock,
});
export const adminOrders = (orders, options = {}) => ({
  orders,
  filters: { q: options.q || "", status: options.status || "" },
  payments: !!options.payments,
});
export const settingsPage = (settings) => ({ settings });
export const contact = (session, { order = "" } = {}) => ({
  orderNumber: order,
});
export const messages = (messages) => ({ messages });
export const about = () => ({});
export const team = () => ({});
export const help = () => ({});
export const giftBudget = () => ({});
export const customerDirectory = (customers, q = "") => ({
  customers,
  filters: { q },
});
export const references = () => ({});

export const adminProductsPage = (products, session, options = {}) => ({
  products,
  categories: options.categories || [],
  filters: {
    q: options.q || "",
    category: options.category || "",
    status: options.status || "",
  },
});
export const productFormPage = (session, product = {}, categories = []) => ({
  product,
  categories,
});
export const productDeletePage = (product, history) => ({
  product,
  history: Number(history),
});
export const accountsPage = (accounts, session, filters = {}) => ({
  accounts,
  filters,
});
export const accountFormPage = (session, account = {}) => ({ account });
export const accountDeletePage = (session, account) => ({ account });
export const categoriesPage = (categories) => ({ categories });
export const categoryForm = (session, category = {}, error = "") => ({
  category,
  error,
});
export const categoryDelete = (
  session,
  category,
  categories,
  error = "",
  destination = "",
) => ({ category, categories, error, destination });
