// Resolve explicit API routes and adapt legacy business handlers to JSON responses.
// JSON service contract. Each service has two Postman-ready examples.
// First GET /api/session to obtain a cookie and csrf; send _csrf in mutation JSON.
const definitions = [
  // Admin authentication: POST /api/auth/admin/login
  // Example 1: {"email":"owner@example.test","password":"DemoGiftfy!2026Secure","_csrf":"{{csrf}}"}
  // Example 2: {"email":"owner@example.test","password":"wrong-password","_csrf":"{{csrf}}"} => 401/422
  ["POST", /^\/auth\/admin\/login$/, () => "/admin/login"],
  // Customer authentication: POST /api/auth/login
  // Example 1: {"email":"customer@example.test","password":"DemoGiftfy!2026Secure","_csrf":"{{csrf}}"}
  // Example 2: {"email":"missing@example.test","password":"invalid","_csrf":"{{csrf}}"}
  ["POST", /^\/auth\/login$/, () => "/login"],
  // Registration: POST /api/auth/register
  // Example 1: {"first_name":"Gift","last_name":"Buyer","email":"buyer1@example.test","password":"DemoGiftfy!2026Secure","password_confirm":"DemoGiftfy!2026Secure","_csrf":"{{csrf}}"}
  // Example 2: {"first_name":"Buddy","last_name":"Buyer","email":"buyer2@example.test","password":"DemoGiftfy!2026Secure","password_confirm":"DemoGiftfy!2026Secure","_csrf":"{{csrf}}"}
  ["POST", /^\/auth\/register$/, () => "/register"],
  // Product search: GET /api/admin/products?q=bear&category=ตุ๊กตา&status=Available
  // Example 1: GET /api/admin/products (all products)
  // Example 2: GET /api/admin/products?q=bear&status=Available (combine any subset of three criteria)
  ["GET", /^\/admin\/products$/, () => "/admin/products"],
  // Product detail: GET /api/admin/products/1; Example 2: GET /api/admin/products/2
  ["GET", /^\/admin\/products\/(\d+)$/, (m) => `/admin/products/${m[1]}/edit`],
  // Product insertion: POST /api/admin/products
  // Example 1: {"name":"Gift A","category":"ตุ๊กตา","description":"Soft gift","price":"250","stock_quantity":"5","image_url":"/images/product-placeholder.svg","_csrf":"{{csrf}}"}
  // Example 2: {"name":"Gift B","category":"ตุ๊กตา","description":"Birthday gift","price":"350","stock_quantity":"8","image_url":"/images/product-placeholder.svg","_csrf":"{{csrf}}"}
  ["POST", /^\/admin\/products$/, () => "/admin/products/new"],
  // Product update: PUT /api/admin/products/1
  // Example 1: {"name":"Gift A","category":"ตุ๊กตา","description":"Soft gift","price":"299","stock_quantity":"5","image_url":"/images/product-placeholder.svg","_csrf":"{{csrf}}"}
  // Example 2: PUT /api/admin/products/2 {"name":"Gift B","category":"ตุ๊กตา","description":"Birthday gift","price":"350","stock_quantity":"12","image_url":"/images/product-placeholder.svg","_csrf":"{{csrf}}"}
  ["PUT", /^\/admin\/products\/(\d+)$/, (m) => `/admin/products/${m[1]}/edit`],
  // Product deletion: DELETE /api/admin/products/1
  // Example 1: {"confirm_sku":"BG-000001","_csrf":"{{csrf}}"}
  // Example 2: DELETE /api/admin/products/2 {"confirm_sku":"BG-000002","_csrf":"{{csrf}}"}
  // Sold products return 409; use the separate hide action to retain order history.
  [
    "DELETE",
    /^\/admin\/products\/(\d+)$/,
    (m) => `/admin/products/${m[1]}/delete`,
  ],
  // Admin search: GET /api/admin/accounts (all); Example 2: ?q=owner&role=Owner&status=Active
  ["GET", /^\/admin\/accounts$/, () => "/admin/accounts"],
  // Admin detail: GET /api/admin/accounts/1; Example 2: GET /api/admin/accounts/2
  ["GET", /^\/admin\/accounts\/(\d+)$/, (m) => `/admin/accounts/${m[1]}/edit`],
  // Admin insertion: POST /api/admin/accounts
  // Example 1: {"first_name":"Demo","last_name":"Editor","email":"editor1@example.test","role":"Editor","password":"DemoGiftfy!2026Secure","password_confirm":"DemoGiftfy!2026Secure","_csrf":"{{csrf}}"}
  // Example 2: {"first_name":"Buddy","last_name":"Editor","email":"editor2@example.test","role":"Editor","password":"DemoGiftfy!2026Secure","password_confirm":"DemoGiftfy!2026Secure","_csrf":"{{csrf}}"}
  ["POST", /^\/admin\/accounts$/, () => "/admin/accounts/new"],
  // Admin update: PUT /api/admin/accounts/2
  // Example 1: {"first_name":"Demo","last_name":"Editor","email":"editor1@example.test","role":"Manager","status":"Active","_csrf":"{{csrf}}"}
  // Example 2: PUT /api/admin/accounts/3 {"first_name":"Buddy","last_name":"Editor","email":"editor2@example.test","role":"Editor","status":"Active","_csrf":"{{csrf}}"}
  ["PUT", /^\/admin\/accounts\/(\d+)$/, (m) => `/admin/accounts/${m[1]}/edit`],
  // Admin deletion: DELETE /api/admin/accounts/2
  // Example 1: {"confirm_email":"editor1@example.test","_csrf":"{{csrf}}"}
  // Example 2: DELETE /api/admin/accounts/3 {"confirm_email":"editor2@example.test","_csrf":"{{csrf}}"}
  // Current and last active Owner accounts are protected.
  [
    "DELETE",
    /^\/admin\/accounts\/(\d+)$/,
    (m) => `/admin/accounts/${m[1]}/delete`,
  ],
];

// View models: GET /api/page?path=/shop and GET /api/page?path=/admin/products/new
// Compatibility reads return named JSON {ok,data,session}; HTML controllers use
// the canonical data endpoints below. This API never serves frontend HTML.
export function apiTarget(url, method) {
  // Named data endpoints consumed by the individual HTML page controllers.
  // SERVICE-EXAMPLES-BEGIN view-home
  // Read data for the home page; Access: public
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/store/home
  // 2. method: GET; URL: {{baseUrl}}/api/store/home?q=Buddy
  // SERVICE-EXAMPLES-END view-home
  // SERVICE-EXAMPLES-BEGIN view-shop
  // Read data for the catalog page; Access: public
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/store/products
  // 2. method: GET; URL: {{baseUrl}}/api/store/products?q=Buddy
  // SERVICE-EXAMPLES-END view-shop
  // SERVICE-EXAMPLES-BEGIN view-product
  // Read data for the product details page; Access: public
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/store/products/buddy-bear
  // 2. method: GET; URL: {{baseUrl}}/api/store/products/custom-face-pillow
  // SERVICE-EXAMPLES-END view-product
  // SERVICE-EXAMPLES-BEGIN view-favorites
  // Read data for the favorites page; Access: public
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/customer/favorites
  // 2. method: GET; URL: {{baseUrl}}/api/customer/favorites?q=Buddy
  // SERVICE-EXAMPLES-END view-favorites
  // SERVICE-EXAMPLES-BEGIN view-cart
  // Read data for the cart page; Access: public
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/customer/cart
  // 2. method: GET; URL: {{baseUrl}}/api/customer/cart?q=Buddy
  // SERVICE-EXAMPLES-END view-cart
  // SERVICE-EXAMPLES-BEGIN view-checkout
  // Read data for the checkout page; Access: customer
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/customer/checkout
  // 2. method: GET; URL: {{baseUrl}}/api/customer/checkout?q=Buddy
  // SERVICE-EXAMPLES-END view-checkout
  // SERVICE-EXAMPLES-BEGIN view-account
  // Read data for the customer account page; Access: customer
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/customer/account
  // 2. method: GET; URL: {{baseUrl}}/api/customer/account?q=Buddy
  // SERVICE-EXAMPLES-END view-account
  // SERVICE-EXAMPLES-BEGIN view-profile
  // Read data for the customer profile page; Access: customer
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/customer/profile
  // 2. method: GET; URL: {{baseUrl}}/api/customer/profile?q=Buddy
  // SERVICE-EXAMPLES-END view-profile
  // SERVICE-EXAMPLES-BEGIN view-order
  // Read data for the customer order page; Access: customer
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/customer/orders/{{orderNumber}}
  // 2. method: GET; URL: {{baseUrl}}/api/customer/orders/{{otherOrderNumber}}
  // SERVICE-EXAMPLES-END view-order
  // SERVICE-EXAMPLES-BEGIN view-dashboard
  // Read data for the dashboard page; Access: operations
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/overview
  // 2. method: GET; URL: {{baseUrl}}/api/admin/overview?q=Buddy
  // SERVICE-EXAMPLES-END view-dashboard
  // SERVICE-EXAMPLES-BEGIN view-product-new
  // Read data for the new product page; Access: admin
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/product-options
  // 2. method: GET; URL: {{baseUrl}}/api/admin/product-options?q=Buddy
  // SERVICE-EXAMPLES-END view-product-new
  // SERVICE-EXAMPLES-BEGIN view-product-delete
  // Read data for the product deletion page; Access: admin
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/products/1/deletion
  // 2. method: GET; URL: {{baseUrl}}/api/admin/products/2/deletion
  // SERVICE-EXAMPLES-END view-product-delete
  // SERVICE-EXAMPLES-BEGIN view-account-new
  // Read data for the new administrator page; Access: owner
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/account-options
  // 2. method: GET; URL: {{baseUrl}}/api/admin/account-options?q=Buddy
  // SERVICE-EXAMPLES-END view-account-new
  // SERVICE-EXAMPLES-BEGIN view-account-delete
  // Read data for the administrator deletion page; Access: owner
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/accounts/1/deletion
  // 2. method: GET; URL: {{baseUrl}}/api/admin/accounts/2/deletion
  // SERVICE-EXAMPLES-END view-account-delete
  // SERVICE-EXAMPLES-BEGIN view-category-new
  // Read data for the new category page; Access: operations
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/category-options
  // 2. method: GET; URL: {{baseUrl}}/api/admin/category-options?q=Buddy
  // SERVICE-EXAMPLES-END view-category-new
  // SERVICE-EXAMPLES-BEGIN view-category-edit
  // Read data for the category editing page; Access: operations
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/categories/1
  // 2. method: GET; URL: {{baseUrl}}/api/admin/categories/2
  // SERVICE-EXAMPLES-END view-category-edit
  // SERVICE-EXAMPLES-BEGIN view-category-delete
  // Read data for the category deletion page; Access: operations
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/categories/1/deletion
  // 2. method: GET; URL: {{baseUrl}}/api/admin/categories/2/deletion
  // SERVICE-EXAMPLES-END view-category-delete
  // SERVICE-EXAMPLES-BEGIN view-admin-orders
  // Read data for the administrator order list page; Access: operations
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/orders
  // 2. method: GET; URL: {{baseUrl}}/api/admin/orders?q=Buddy
  // SERVICE-EXAMPLES-END view-admin-orders
  // SERVICE-EXAMPLES-BEGIN view-admin-order
  // Read data for the administrator order details page; Access: operations
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/orders/1
  // 2. method: GET; URL: {{baseUrl}}/api/admin/orders/2
  // SERVICE-EXAMPLES-END view-admin-order
  // SERVICE-EXAMPLES-BEGIN view-payments
  // Read data for the payment review page; Access: operations
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/payments
  // 2. method: GET; URL: {{baseUrl}}/api/admin/payments?q=Buddy
  // SERVICE-EXAMPLES-END view-payments
  // SERVICE-EXAMPLES-BEGIN view-customers
  // Read data for the customer directory page; Access: operations
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/customers
  // 2. method: GET; URL: {{baseUrl}}/api/admin/customers?q=Buddy
  // SERVICE-EXAMPLES-END view-customers
  // SERVICE-EXAMPLES-BEGIN view-messages
  // Read data for the customer messages page; Access: operations
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/messages
  // 2. method: GET; URL: {{baseUrl}}/api/admin/messages?q=Buddy
  // SERVICE-EXAMPLES-END view-messages
  // SERVICE-EXAMPLES-BEGIN view-settings
  // Read data for the store settings page; Access: owner
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/settings
  // 2. method: GET; URL: {{baseUrl}}/api/admin/settings?q=Buddy
  // SERVICE-EXAMPLES-END view-settings
  // SERVICE-EXAMPLES-BEGIN view-admin-profile
  // Read data for the administrator profile page; Access: admin
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/profile
  // 2. method: GET; URL: {{baseUrl}}/api/admin/profile?q=Buddy
  // SERVICE-EXAMPLES-END view-admin-profile
  if (method === "GET") {
    const routes = {
      "/store/home": "/",
      "/store/products": "/shop",
      "/customer/favorites": "/favorites",
      "/customer/cart": "/cart",
      "/customer/checkout": "/checkout",
      "/customer/account": "/account",
      "/customer/profile": "/account/profile",
      "/admin/overview": "/admin",
      "/admin/product-options": "/admin/products/new",
      "/admin/account-options": "/admin/accounts/new",
      "/admin/category-options": "/admin/categories/new",
    };
    const current = url.pathname.startsWith("/api/")
      ? url.pathname.slice(4)
      : "";
    if (routes[current])
      return { url: new URL(routes[current] + url.search, url), method };
    let match;
    if ((match = current.match(/^\/store\/products\/([^/]+)$/)))
      return { url: new URL("/product/" + match[1] + url.search, url), method };
    if ((match = current.match(/^\/customer\/orders\/([^/]+)$/)))
      return { url: new URL("/order/" + match[1] + url.search, url), method };
    if (
      (match = current.match(
        /^\/admin\/(products|accounts|categories)\/(\d+)\/deletion$/,
      ))
    )
      return {
        url: new URL(
          "/admin/" + match[1] + "/" + match[2] + "/delete" + url.search,
          url,
        ),
        method,
      };
    if ((match = current.match(/^\/admin\/categories\/(\d+)$/)))
      return {
        url: new URL(
          "/admin/categories/" + match[1] + "/edit" + url.search,
          url,
        ),
        method,
      };
  }

  // SERVICE-EXAMPLES-BEGIN session
  // Read the session and CSRF token; Access: Public
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/session
  // 2. method: GET; URL: {{baseUrl}}/api/session
  // SERVICE-EXAMPLES-END session
  if (url.pathname === "/api/session" && method === "GET")
    return { url: new URL("/login", url), method: "GET" };
  // SERVICE-EXAMPLES-BEGIN page
  // Read page data through a legacy URL; Access: Depends on page permissions
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/page?path=%2Fshop
  // 2. method: GET; URL: {{baseUrl}}/api/page?path=%2Fadmin%2Fproducts
  // SERVICE-EXAMPLES-END page
  if (url.pathname === "/api/page" && method === "GET") {
    const path = url.searchParams.get("path") || "/";
    if (
      !path.startsWith("/") ||
      path.startsWith("//") ||
      /[\\\u0000-\u001f]/.test(path)
    )
      return null;
    const target = new URL(path, url);
    if (target.origin !== url.origin) return null;
    return { url: target, method: "GET" };
  }
  if (!url.pathname.startsWith("/api/")) return null;
  const path = url.pathname.slice(4);
  for (const [verb, pattern, route] of definitions) {
    const match = path.match(pattern);
    if (verb === method && match)
      return {
        url: new URL(route(match) + url.search, url),
        method: verb === "GET" ? "GET" : "POST",
      };
  }
  // Explicit action endpoints used by fetch forms and documented in docs/API.md.
  if (
    (method === "POST" || method === "GET") &&
    /^\/(?:cart|checkout|favorites|order|payment-proof|images|contact|account|logout|register|login|admin)(?:\/|$)/.test(
      path,
    )
  )
    return { url: new URL(path + url.search, url), method };
  return null;
}
