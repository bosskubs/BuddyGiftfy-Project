// Resolve clean URLs and legacy page links.
// Keep clean page URLs canonical while accepting historical paths and .html links.
// API URLs and private media URLs are not frontend page routes.
const fixed = {
  "/": "/",
  "/index.html": "/",
  "/shop": "/shop",
  "/search": "/shop",
  "/shop/advanced": "/shop",
  "/about": "/about",
  "/team": "/team",
  "/login": "/login",
  "/register": "/register",
  "/favorites": "/favorites",
  "/cart": "/cart",
  "/checkout": "/checkout",
  "/account": "/account",
  "/account/profile": "/profile",
  "/account/password": "/profile",
  "/contact": "/contact",
  "/help": "/help",
  "/references": "/references",
  "/gift-budget": "/gift-budget",
  "/admin": "/admin",
  "/admin/": "/admin",
  "/admin/login": "/admin/login",
  "/admin/products": "/admin/products",
  "/admin/products/new": "/admin/product-new",
  "/admin/accounts": "/admin/accounts",
  "/admin/accounts/new": "/admin/account-new",
  "/admin/categories": "/admin/categories",
  "/admin/categories/new": "/admin/category-new",
  "/admin/orders": "/admin/orders",
  "/admin/payments": "/admin/payments",
  "/admin/customers": "/admin/customers",
  "/admin/messages": "/admin/messages",
  "/admin/settings": "/admin/settings",
  "/admin/profile": "/admin/profile",
  "/admin/profile/password": "/admin/profile",
  "/shop.html": "/shop",
  "/product.html": "/product",
  "/product": "/product",
  "/about.html": "/about",
  "/team.html": "/team",
  "/login.html": "/login",
  "/register.html": "/register",
  "/favorites.html": "/favorites",
  "/cart.html": "/cart",
  "/checkout.html": "/checkout",
  "/account.html": "/account",
  "/profile.html": "/profile",
  "/profile": "/profile",
  "/order.html": "/order",
  "/order": "/order",
  "/contact.html": "/contact",
  "/help.html": "/help",
  "/references.html": "/references",
  "/gift-budget.html": "/gift-budget",
  "/404.html": "/404",
  "/404": "/404",
  "/admin/index.html": "/admin",
  "/admin/login.html": "/admin/login",
  "/admin/products.html": "/admin/products",
  "/admin/product-new.html": "/admin/product-new",
  "/admin/product-new": "/admin/product-new",
  "/admin/product-edit.html": "/admin/product-edit",
  "/admin/product-edit": "/admin/product-edit",
  "/admin/product-delete.html": "/admin/product-delete",
  "/admin/product-delete": "/admin/product-delete",
  "/admin/accounts.html": "/admin/accounts",
  "/admin/account-new.html": "/admin/account-new",
  "/admin/account-new": "/admin/account-new",
  "/admin/account-edit.html": "/admin/account-edit",
  "/admin/account-edit": "/admin/account-edit",
  "/admin/account-delete.html": "/admin/account-delete",
  "/admin/account-delete": "/admin/account-delete",
  "/admin/categories.html": "/admin/categories",
  "/admin/category-new.html": "/admin/category-new",
  "/admin/category-new": "/admin/category-new",
  "/admin/category-edit.html": "/admin/category-edit",
  "/admin/category-edit": "/admin/category-edit",
  "/admin/category-delete.html": "/admin/category-delete",
  "/admin/category-delete": "/admin/category-delete",
  "/admin/orders.html": "/admin/orders",
  "/admin/order.html": "/admin/order",
  "/admin/order": "/admin/order",
  "/admin/payments.html": "/admin/payments",
  "/admin/customers.html": "/admin/customers",
  "/admin/messages.html": "/admin/messages",
  "/admin/settings.html": "/admin/settings",
  "/admin/profile.html": "/admin/profile",
};
export function frontendPath(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  )
    return value;
  const url = new URL(value, "http://frontend.invalid");
  let target = fixed[url.pathname];
  if (!target && url.pathname.endsWith("/"))
    target = fixed[url.pathname.slice(0, -1)];
  let match;
  if ((match = url.pathname.match(/^\/product\/([^/]+)$/))) {
    target = "/product";
    url.searchParams.set("slug", decodeURIComponent(match[1]));
  }
  if ((match = url.pathname.match(/^\/order\/([^/]+)$/))) {
    target = "/order";
    url.searchParams.set("number", decodeURIComponent(match[1]));
  }
  if (
    (match = url.pathname.match(
      /^\/admin\/(products|accounts|categories)\/(\d+)\/(edit|delete)$/,
    ))
  ) {
    target =
      "/admin/" +
      { products: "product", accounts: "account", categories: "category" }[
        match[1]
      ] +
      "-" +
      match[3];
    url.searchParams.set("id", match[2]);
  }
  if ((match = url.pathname.match(/^\/admin\/orders\/(\d+)$/))) {
    target = "/admin/order";
    url.searchParams.set("id", match[1]);
  }
  if (!target) return value;
  if (url.searchParams.has("next"))
    url.searchParams.set("next", frontendPath(url.searchParams.get("next")));
  return target + url.search + url.hash;
}

// Resolve only known page routes to physical HTML documents.
const pageFiles = {
  "/": "index.html",
  "/shop": "shop.html",
  "/product": "product.html",
  "/about": "about.html",
  "/team": "team.html",
  "/login": "login.html",
  "/register": "register.html",
  "/favorites": "favorites.html",
  "/cart": "cart.html",
  "/checkout": "checkout.html",
  "/account": "account.html",
  "/profile": "profile.html",
  "/order": "order.html",
  "/contact": "contact.html",
  "/help": "help.html",
  "/references": "references.html",
  "/gift-budget": "gift-budget.html",
  "/404": "404.html",
  "/admin": "admin/index.html",
  "/admin/login": "admin/login.html",
  "/admin/products": "admin/products.html",
  "/admin/product-new": "admin/product-new.html",
  "/admin/product-edit": "admin/product-edit.html",
  "/admin/product-delete": "admin/product-delete.html",
  "/admin/accounts": "admin/accounts.html",
  "/admin/account-new": "admin/account-new.html",
  "/admin/account-edit": "admin/account-edit.html",
  "/admin/account-delete": "admin/account-delete.html",
  "/admin/categories": "admin/categories.html",
  "/admin/category-new": "admin/category-new.html",
  "/admin/category-edit": "admin/category-edit.html",
  "/admin/category-delete": "admin/category-delete.html",
  "/admin/orders": "admin/orders.html",
  "/admin/order": "admin/order.html",
  "/admin/payments": "admin/payments.html",
  "/admin/customers": "admin/customers.html",
  "/admin/messages": "admin/messages.html",
  "/admin/settings": "admin/settings.html",
  "/admin/profile": "admin/profile.html",
};
export const pageFile = (pathname) => pageFiles[pathname] || null;
