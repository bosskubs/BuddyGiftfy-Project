// Handle store browsing, checkout, profiles, payment review, and order fulfillment.
import { fileURLToPath } from "node:url";
import path from "node:path";
import { listCategories } from "./categories.js";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import sharp from "sharp";
import { query, transaction } from "./db.js";
import {
  saveSession,
  hashPassword,
  verifyPassword,
  safeNext,
} from "./security.js";
import {
  settings,
  defaults,
  cents,
  amount,
  totals,
  cartLines,
  normalizedCart,
  createOrder,
  cancelOrder,
  reviewPayment,
  advanceOrder,
  problem,
} from "./commerce.js";
import { decodeProductImage } from "./product-images.js";
import * as page from "./view-data.js";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url))),
  proofDirectory =
    process.env.PROOF_DIRECTORY ||
    path.join(root, "work/runtime/payment-proofs");
const integer = (v, min = 1, max = Number.MAX_SAFE_INTEGER) =>
  Number.isSafeInteger(Number(v)) && Number(v) >= min && Number(v) <= max
    ? Number(v)
    : null;
export async function handleShop(req, res, url, session, ctx) {
  const {
      render,
      redirect,
      setFlash,
      requireCustomer,
      requireAdmin,
      logAction,
    } = ctx,
    p = url.pathname,
    post = req.method === "POST",
    get = req.method === "GET";
  const show = (name, body, options = {}) =>
    render(res, session, name, body, options);
  const sendJson = (status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
  };
  const go = async (to, message, type = "success") => {
    if (message) setFlash(session, type, message);
    await saveSession(res, session);
    redirect(res, to);
    return true;
  };
  // Page data example 1: GET /api/page?path=/ ; example 2: GET /api/page?path=/shop
  if (get && p === "/") {
    const products = await query(
        "SELECT * FROM products WHERE status='Available' ORDER BY is_featured DESC,product_id LIMIT 8",
      ),
      categories = await query(
        "SELECT c.name AS category,COUNT(p.product_id) AS amount FROM categories c JOIN products p ON p.category=c.name AND p.status<>'Inactive' GROUP BY c.category_id,c.name,c.sort_order ORDER BY c.sort_order,c.name,c.category_id LIMIT 5",
      );
    await show(
      "ของขวัญที่เลือกด้วยใจ",
      page.home(products, categories, session),
    );
    return true;
  }
  if (get && ["/shop", "/search", "/shop/advanced"].includes(p)) {
    const options = {
      q: (url.searchParams.get("q") || "").trim().slice(0, 100),
      category: (url.searchParams.get("category") || "").slice(0, 80),
      min: url.searchParams.get("min") || "",
      max: url.searchParams.get("max") || "",
      custom: url.searchParams.get("custom") === "1",
      stock: url.searchParams.get("stock") === "1",
      sort: url.searchParams.get("sort") || "featured",
    };
    const clauses = ["status<>'Inactive'"],
      params = {};
    if (options.stock) clauses.push("status='Available' AND stock_quantity>0");
    if (options.q) {
      clauses.push("(name LIKE :q OR description LIKE :q OR category LIKE :q)");
      params.q = "%" + options.q + "%";
    }
    if (options.category) {
      clauses.push("category=:category");
      params.category = options.category;
    }
    for (const [key, op] of [
      ["min", ">="],
      ["max", "<="],
    ]) {
      if (
        options[key] !== "" &&
        Number.isFinite(Number(options[key])) &&
        Number(options[key]) >= 0
      ) {
        params[key] = Math.min(99999999, Number(options[key]));
        clauses.push("price " + op + " :" + key);
      } else options[key] = "";
    }
    if (options.custom)
      clauses.push(
        "(category IN (SELECT name FROM categories WHERE is_custom=1) OR name LIKE '%custom%' OR description LIKE '%custom%')",
      );
    const sorts = {
      featured: "is_featured DESC, product_id",
      newest: "created_at DESC,product_id DESC",
      "price-asc": "price ASC,product_id",
      "price-desc": "price DESC,product_id",
    };
    const [count] = await query(
      "SELECT COUNT(*) AS amount FROM products WHERE " + clauses.join(" AND "),
      params,
    );
    options.total = Number(count.amount);
    options.pages = Math.max(1, Math.ceil(options.total / 12));
    options.page = Math.min(
      options.pages,
      Math.max(1, Math.floor(Number(url.searchParams.get("page")) || 1)),
    );
    const products = await query(
        `SELECT * FROM products WHERE ${clauses.join(" AND ")} ORDER BY ${sorts[options.sort] || sorts.featured} LIMIT 12 OFFSET ${(options.page - 1) * 12}`,
        params,
      ),
      categories = (await listCategories()).map((c) => ({
        ...c,
        category: c.name,
      }));
    await show(
      "เลือกของขวัญ",
      page.catalog(products, categories, session, options),
    );
    return true;
  }
  if (get && p.startsWith("/product/")) {
    const slug = decodeURIComponent(p.slice(9)),
      [product] = await query(
        "SELECT p.*,c.is_custom AS category_is_custom FROM products p JOIN categories c ON c.name=p.category WHERE p.slug=:slug AND p.status<>'Inactive'",
        { slug },
      );
    if (!product) throw problem(404, "ไม่พบสินค้านี้");
    const related = await query(
      "SELECT * FROM products WHERE product_id<>:id AND status<>'Inactive' ORDER BY (category=:category) DESC,is_featured DESC LIMIT 4",
      { id: product.product_id, category: product.category },
    );
    await show(product.name, page.detail(product, related, session));
    return true;
  }
  if (get && p === "/favorites") {
    const ids = (session.favorites || [])
        .map(Number)
        .filter(Number.isSafeInteger)
        .slice(0, 100),
      products = ids.length
        ? await query(
            `SELECT * FROM products WHERE product_id IN (${ids.map(() => "?").join(",")}) AND status<>'Inactive'`,
            ids,
          )
        : [];
    await show("ของขวัญที่ชอบ", page.favorites(products, session));
    return true;
  }
  // Wishlist examples: POST /api/favorites/toggle {product_id:1,_csrf:token}
  // and POST /api/favorites/toggle {product_id:2,_csrf:token}; repeat to remove.
  // SERVICE-EXAMPLES-BEGIN favorite
  // Toggle a favorite product; Access: Session
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/favorites/toggle
  // body: raw JSON {"_csrf":"{{csrf}}","product_id":"{{productId}}"}
  // 2. method: POST; URL: {{baseUrl}}/api/favorites/toggle
  // body: raw JSON {"_csrf":"{{csrf}}","product_id":"{{otherProductId}}"}
  // SERVICE-EXAMPLES-END favorite
  if (post && p === "/favorites/toggle") {
    const id = integer(req.body.product_id),
      [product] = id
        ? await query(
            "SELECT product_id FROM products WHERE product_id=:id AND status<>'Inactive'",
            { id },
          )
        : [];
    if (!product) throw problem(404, "ไม่พบสินค้านี้");
    const ids = new Set((session.favorites || []).map(Number)),
      saved = !ids.has(id);
    if (saved) {
      if (ids.size >= 100)
        throw problem(400, "บันทึกของขวัญได้สูงสุด 100 ชิ้น");
      ids.add(id);
    } else ids.delete(id);
    session.favorites = [...ids];
    if (session.userId) {
      if (saved)
        await query(
          "INSERT IGNORE INTO wishlist_items(customer_id,product_id) VALUES(:customer,:product)",
          { customer: session.userId, product: id },
        );
      else
        await query(
          "DELETE FROM wishlist_items WHERE customer_id=:customer AND product_id=:product",
          { customer: session.userId, product: id },
        );
    }
    await saveSession(res, session);
    if (req.headers.accept?.includes("application/json"))
      sendJson(200, {
        saved,
        count: ids.size,
        message: saved ? "เก็บของขวัญที่ชอบแล้ว" : "นำออกจากของขวัญที่ชอบแล้ว",
      });
    else redirect(res, safeNext(req.body.next, "/favorites"));
    return true;
  }
  // Cart example 1: POST /api/cart/add {product_id:1,quantity:1,_csrf:token}
  // Example 2: POST /api/cart/add {product_id:2,quantity:2,custom_note:'Buddy',_csrf:token}
  // SERVICE-EXAMPLES-BEGIN cart-add
  // Add a product to the cart; Access: Session
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/cart/add
  // body: raw JSON {"_csrf":"{{csrf}}","product_id":"{{productId}}","quantity":"1"}
  // 2. method: POST; URL: {{baseUrl}}/api/cart/add
  // body: raw JSON {"_csrf":"{{csrf}}","product_id":"{{productId}}","quantity":"2","custom_note":"Buddy","gift_wrap":"1"}
  // SERVICE-EXAMPLES-END cart-add
  if (post && p === "/cart/add") {
    const id = integer(req.body.product_id),
      quantity = integer(req.body.quantity, 1, 99);
    if (!id || !quantity) throw problem(400, "จำนวนสินค้าไม่ถูกต้อง");
    const [product] = await query(
      "SELECT * FROM products WHERE product_id=:id",
      { id },
    );
    if (
      !product ||
      product.status !== "Available" ||
      product.stock_quantity < quantity
    )
      throw problem(409, "สินค้าชิ้นนี้มีจำนวนไม่พอหรือหมดชั่วคราว");
    session.cart = normalizedCart(session.cart);
    const entry = session.cart.find((x) => x.productId === id),
      newQuantity = (entry?.quantity || 0) + quantity;
    if (newQuantity > Math.min(99, product.stock_quantity))
      throw problem(
        409,
        `เพิ่มได้อีกไม่เกิน ${Math.max(0, Math.min(99, product.stock_quantity) - (entry?.quantity || 0))} ชิ้น`,
      );
    const customNote = String(req.body.custom_note || "")
      .trim()
      .slice(0, 500);
    if (entry) {
      entry.quantity = newQuantity;
      if (customNote) entry.customNote = customNote;
    } else session.cart.push({ productId: id, quantity, customNote });
    if (req.body.gift_wrap === "1") session.preferGiftWrap = true;
    session.checkoutToken = null;
    if (req.headers.accept?.includes("application/json")) {
      await saveSession(res, session);
      sendJson(200, {
        count: session.cart.reduce((s, x) => s + x.quantity, 0),
        message: "เพิ่มของขวัญลงตะกร้าแล้ว",
      });
      return true;
    }
    return go("/cart", "เพิ่มของขวัญลงตะกร้าแล้ว");
  }
  if (get && p === "/cart") {
    await show("ตะกร้าของขวัญ", page.cart(await cartLines(session), session));
    return true;
  }
  // SERVICE-EXAMPLES-BEGIN cart-update
  // Change a cart quantity; Access: Session
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/cart/update
  // body: raw JSON {"_csrf":"{{csrf}}","product_id":"{{productId}}","quantity":"2"}
  // 2. method: POST; URL: {{baseUrl}}/api/cart/update
  // body: raw JSON {"_csrf":"{{csrf}}","product_id":"{{productId}}","step":"-1"}
  // SERVICE-EXAMPLES-END cart-update
  // SERVICE-EXAMPLES-BEGIN cart-remove
  // Remove a cart item; Access: Session
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/cart/remove
  // body: raw JSON {"_csrf":"{{csrf}}","product_id":"{{productId}}"}
  // 2. method: POST; URL: {{baseUrl}}/api/cart/remove
  // body: raw JSON {"_csrf":"{{csrf}}","product_id":"{{otherProductId}}"}
  // SERVICE-EXAMPLES-END cart-remove
  if (post && ["/cart/update", "/cart/remove"].includes(p)) {
    session.cart = normalizedCart(session.cart);
    const id = integer(req.body.product_id),
      entry = session.cart.find((x) => x.productId === id);
    if (!entry) return go("/cart");
    if (p.endsWith("remove"))
      session.cart = session.cart.filter((x) => x.productId !== id);
    else {
      const step =
        req.body.step === undefined ? null : integer(req.body.step, -1, 1);
      if (step !== null && step !== -1 && step !== 1)
        throw problem(400, "จำนวนไม่ถูกต้อง");
      const quantity =
        step === null
          ? integer(req.body.quantity, 1, 99)
          : entry.quantity + step;
      const [product] = await query(
        "SELECT stock_quantity,status FROM products WHERE product_id=:id",
        { id },
      );
      if (
        !product ||
        product.status !== "Available" ||
        product.stock_quantity < 1
      )
        return go(
          "/cart",
          "สินค้าชิ้นนี้ไม่พร้อมจำหน่าย กรุณานำออกจากตะกร้า",
          "error",
        );
      if (
        !quantity ||
        quantity < 1 ||
        quantity > Math.min(99, product.stock_quantity)
      )
        return go(
          "/cart",
          "กรุณาเลือกจำนวนระหว่าง 1 ถึง " +
            Math.min(99, product.stock_quantity) +
            " ชิ้น",
          "error",
        );
      entry.quantity = quantity;
    }
    session.checkoutToken = null;
    return go(
      "/cart",
      p.endsWith("remove") ? "นำสินค้าออกจากตะกร้าแล้ว" : null,
    );
  }
  if (get && ["/login", "/register", "/admin/login"].includes(p)) {
    await show(
      p === "/register" ? "สมัครสมาชิก" : "เข้าสู่ระบบ",
      page.auth(session, {
        register: p === "/register",
        admin: p === "/admin/login",
        next: safeNext(url.searchParams.get("next"), "/account"),
      }),
    );
    return true;
  }
  if (get && p === "/checkout") {
    const user = await requireCustomer(req, res, session, "/checkout");
    if (!user) return true;
    const lines = await cartLines(session);
    if (!lines.length)
      return go("/cart", "เลือกของขวัญก่อนดำเนินการต่อ", "info");
    if (lines.some((l) => !l.available))
      return go("/cart", "มีสินค้าที่จำนวนไม่พอ กรุณาตรวจสอบตะกร้า", "error");
    if (!session.checkoutToken)
      session.checkoutToken = randomBytes(24).toString("hex");
    await show("จัดส่งของขวัญ", page.checkout(lines, user, session));
    return true;
  }
  // Checkout example 1: POST /api/checkout {_csrf:token,checkout_token:fromPage,shipping_name:'Gift Buyer',shipping_phone:'0812345678',shipping_address:'99 Bangkok',gift_wrap:'1'}
  // Example 2: same endpoint with shipping_name:'Buddy Buyer',shipping_phone:'0899999999',shipping_address:'88 Chiang Mai',gift_wrap:'0'. Tokens come from GET /api/page?path=/checkout.
  // SERVICE-EXAMPLES-BEGIN checkout
  // Create an order and reserve stock; Access: Customer
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/checkout
  // body: raw JSON {"_csrf":"{{csrf}}","checkout_token":"{{checkoutToken}}","shipping_name":"Gift Buyer","shipping_phone":"0812345678","shipping_address":"99 Bangkok Thailand","gift_wrap":"1"}
  // 2. method: POST; URL: {{baseUrl}}/api/checkout
  // body: raw JSON {"_csrf":"{{csrf}}","checkout_token":"{{checkoutToken}}","shipping_name":"Buddy Buyer","shipping_phone":"0812345678","shipping_address":"99 Bangkok Thailand","gift_wrap":"0"}
  // SERVICE-EXAMPLES-END checkout
  if (post && p === "/checkout") {
    const user = await requireCustomer(req, res, session, "/checkout");
    if (!user) return true;
    session.checkoutDraft = Object.fromEntries(
      [
        "shipping_name",
        "shipping_phone",
        "shipping_address",
        "gift_wrap",
        "gift_message",
        "save_address",
      ].map((k) => [k, String(req.body[k] || "").slice(0, 1500)]),
    );
    const currentCheckout =
      !!session.checkoutToken &&
      req.body.checkout_token === session.checkoutToken;
    let number;
    try {
      number = await createOrder(user, session, req.body, session.settings);
    } catch (error) {
      if (error.status && error.status < 500)
        return go(
          error.status === 409 && /สินค้า|ตะกร้า/.test(error.message)
            ? "/cart"
            : "/checkout",
          error.message,
          "error",
        );
      throw error;
    }
    if (currentCheckout) {
      session.cart = [];
      session.checkoutToken = null;
      session.checkoutDraft = null;
      session.preferGiftWrap = false;
    }
    await logAction(session, req, "order.created", "Created order " + number);
    return go("/order/" + number);
  }
  if (get && p === "/account") {
    const user = await requireCustomer(req, res, session, p);
    if (!user) return true;
    const orders = await query(
      "SELECT o.*,(SELECT COUNT(*) FROM order_items i WHERE i.order_id=o.order_id) AS item_count FROM orders o WHERE customer_id=:id ORDER BY created_at DESC LIMIT 50",
      { id: user.customer_id },
    );
    await show("บัญชีของฉัน", page.account(user, orders, session));
    return true;
  }
  // SERVICE-EXAMPLES-BEGIN customer-profile
  // Update the customer profile; Access: Customer
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/account/profile
  // body: raw JSON {"_csrf":"{{csrf}}","first_name":"Happy","last_name":"Buyer","phone":"0812345678","address":"99 Bangkok Thailand"}
  // 2. method: POST; URL: {{baseUrl}}/api/account/profile
  // body: raw JSON {"_csrf":"{{csrf}}","first_name":"Buddy","last_name":"Gift","phone":"0899999999","address":"88 Chiang Mai Thailand"}
  // SERVICE-EXAMPLES-END customer-profile
  // SERVICE-EXAMPLES-BEGIN customer-password
  // Change the customer password; Access: Customer
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/account/password
  // body: raw JSON {"_csrf":"{{csrf}}","current_password":"{{demoPassword}}","password":"{{newPassword}}","password_confirm":"{{newPassword}}"}
  // 2. method: POST; URL: {{baseUrl}}/api/account/password
  // body: raw JSON {"_csrf":"{{csrf}}","current_password":"wrong-password","password":"{{newPassword}}","password_confirm":"{{newPassword}}"}
  // SERVICE-EXAMPLES-END customer-password
  // SERVICE-EXAMPLES-BEGIN admin-self-profile
  // Update the current administrator profile; Access: Admin
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/admin/profile
  // body: raw JSON {"_csrf":"{{csrf}}","first_name":"Happy","last_name":"Buyer","phone":"0812345678","address":"99 Bangkok Thailand"}
  // 2. method: POST; URL: {{baseUrl}}/api/admin/profile
  // body: raw JSON {"_csrf":"{{csrf}}","first_name":"Buddy","last_name":"Gift","phone":"0899999999","address":"88 Chiang Mai Thailand"}
  // SERVICE-EXAMPLES-END admin-self-profile
  // SERVICE-EXAMPLES-BEGIN admin-self-password
  // Change the current administrator password; Access: Admin
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/admin/profile/password
  // body: raw JSON {"_csrf":"{{csrf}}","current_password":"{{demoPassword}}","password":"{{newPassword}}","password_confirm":"{{newPassword}}"}
  // 2. method: POST; URL: {{baseUrl}}/api/admin/profile/password
  // body: raw JSON {"_csrf":"{{csrf}}","current_password":"wrong-password","password":"{{newPassword}}","password_confirm":"{{newPassword}}"}
  // SERVICE-EXAMPLES-END admin-self-password
  if (
    [
      "/account/profile",
      "/account/password",
      "/admin/profile",
      "/admin/profile/password",
    ].includes(p)
  ) {
    const admin = p.startsWith("/admin"),
      user = await (admin
        ? requireAdmin(req, res, session)
        : requireCustomer(req, res, session, p));
    if (!user) return true;
    const table = admin ? "admin_accounts" : "customers",
      idField = admin ? "admin_id" : "customer_id",
      id = user[idField],
      back = admin ? "/admin/profile" : "/account/profile";
    if (get) {
      await show("ข้อมูลของฉัน", page.profile(user, session, { admin }), {
        admin,
      });
      return true;
    }
    if (post && p.endsWith("password")) {
      const [row] = await query(
        `SELECT password_hash FROM ${table} WHERE ${idField}=:id`,
        { id },
      );
      if (!(await verifyPassword(req.body.current_password, row.password_hash)))
        return go(back, "รหัสผ่านปัจจุบันไม่ถูกต้อง", "error");
      const password = String(req.body.password || "");
      if (
        password.length < 12 ||
        password.length > 256 ||
        password !== req.body.password_confirm
      )
        return go(
          back,
          "รหัสผ่านใหม่ต้องยาวอย่างน้อย 12 ตัวอักษร และตรงกับช่องยืนยัน",
          "error",
        );
      await query(
        `UPDATE ${table} SET password_hash=:hash WHERE ${idField}=:id`,
        { hash: await hashPassword(password), id },
      );
      await query(
        `DELETE FROM sessions WHERE JSON_UNQUOTE(JSON_EXTRACT(data_json,'$.${admin ? "adminId" : "userId"}'))=:id AND session_id<>:session`,
        { id: String(id), session: session.id },
      );
      return go(back, "เปลี่ยนรหัสผ่านแล้ว อุปกรณ์อื่นจะต้องเข้าสู่ระบบใหม่");
    }
    if (post) {
      const first = String(req.body.first_name || "")
          .trim()
          .slice(0, 80),
        last = String(req.body.last_name || "")
          .trim()
          .slice(0, 80),
        phone = String(req.body.phone || "")
          .trim()
          .slice(0, 30),
        address = String(req.body.address || "")
          .trim()
          .slice(0, 1500);
      if (!first || !last || (phone && !/^[+\d\s()-]{8,30}$/.test(phone)))
        return go(back, "กรุณากรอกชื่อ นามสกุล และเบอร์โทรให้ถูกต้อง", "error");
      await query(
        `UPDATE ${table} SET first_name=:first,last_name=:last${admin ? "" : ",phone=:phone,address=:address"} WHERE ${idField}=:id`,
        { first, last, phone, address, id },
      );
      return go(back, "บันทึกข้อมูลแล้ว");
    }
  }
  const orderMatch = p.match(/^\/order\/([^/]+)(?:\/(proof|cancel))?$/);
  if (orderMatch) {
    const user = await requireCustomer(
      req,
      res,
      session,
      "/order/" + orderMatch[1],
    );
    if (!user) return true;
    const [order] = await query(
      "SELECT * FROM orders WHERE order_number=:number AND customer_id=:customer",
      { number: orderMatch[1], customer: user.customer_id },
    );
    if (!order) throw problem(404, "ไม่พบคำสั่งซื้อนี้");
    // SERVICE-EXAMPLES-BEGIN order-cancel
    // Cancel an unpaid customer order; Access: Customer
    // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
    // Use the demo database and replace ID/token placeholders with actual values.
    // Image requests require a complete data URL; see docs/service-catalog.json.
    // 1. method: POST; URL: {{baseUrl}}/api/order/{{orderNumber}}/cancel
    // body: raw JSON {"_csrf":"{{csrf}}"}
    // 2. method: POST; URL: {{baseUrl}}/api/order/{{orderNumber}}/cancel
    // body: raw JSON {"_csrf":"{{csrf}}"}
    // SERVICE-EXAMPLES-END order-cancel
    if (post && orderMatch[2] === "cancel") {
      await cancelOrder(order.order_id, { customerId: user.customer_id });
      return go("/order/" + order.order_number, "ยกเลิกคำสั่งซื้อแล้ว");
    }
    // SERVICE-EXAMPLES-BEGIN order-proof
    // Upload payment proof; Access: Customer
    // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
    // Use the demo database and replace ID/token placeholders with actual values.
    // Image requests require a complete data URL; see docs/service-catalog.json.
    // 1. method: POST; URL: {{baseUrl}}/api/order/{{orderNumber}}/proof
    // body: raw JSON {"_csrf":"{{csrf}}","image":"{{imageDataUrl}}"}
    // 2. method: POST; URL: {{baseUrl}}/api/order/{{orderNumber}}/proof
    // body: raw JSON {"_csrf":"{{csrf}}","image":"invalid-image"}
    // SERVICE-EXAMPLES-END order-proof
    if (post && orderMatch[2] === "proof") {
      let bytes;
      try {
        const decoded = decodeProductImage(req.body.image);
        bytes = await sharp(decoded.bytes, { limitInputPixels: 40000000 })
          .rotate()
          .resize({
            width: 1800,
            height: 2200,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 88 })
          .toBuffer();
      } catch {
        throw problem(
          400,
          "กรุณาใช้ภาพสลิป PNG หรือ JPG ที่ถูกต้อง ขนาดไม่เกิน 5 MB",
        );
      }
      const filename = randomBytes(18).toString("hex") + ".webp";
      await mkdir(proofDirectory, { recursive: true });
      await writeFile(path.join(proofDirectory, filename), bytes, {
        flag: "wx",
      });
      let old;
      try {
        await transaction(async (conn) => {
          const [orders] = await conn.execute(
            "SELECT status FROM orders WHERE order_id=? FOR UPDATE",
            [order.order_id],
          );
          const [payments] = await conn.execute(
            "SELECT * FROM payments WHERE order_id=? ORDER BY payment_id DESC LIMIT 1 FOR UPDATE",
            [order.order_id],
          );
          const payment = payments[0];
          if (
            orders[0].status === "Cancelled" ||
            payment.payment_status === "Completed"
          )
            throw problem(409, "คำสั่งซื้อนี้ไม่สามารถส่งหลักฐานเพิ่มได้");
          if (
            !payment.proof_path &&
            new Date(payment.deadline + "Z") < new Date()
          )
            throw problem(409, "หมดเวลาชำระเงินแล้ว กรุณาสั่งซื้อใหม่");
          old = payment.proof_path;
          await conn.execute(
            "UPDATE payments SET proof_path=?,submitted_at=NOW(),payment_status='Pending',review_note=NULL WHERE payment_id=?",
            [filename, payment.payment_id],
          );
        });
      } catch (error) {
        await unlink(path.join(proofDirectory, filename)).catch(() => {});
        throw error;
      }
      if (old && /^[a-f0-9]{36}\.webp$/.test(old))
        await unlink(path.join(proofDirectory, old)).catch(() => {});
      await logAction(
        session,
        req,
        "payment.proof.submitted",
        "Submitted proof for " + order.order_number,
      );
      await saveSession(res, session);
      sendJson(200, {
        redirect: "/order/" + order.order_number,
        message: "ได้รับหลักฐานแล้ว ร้านจะตรวจสอบยอดให้คุณ",
      });
      return true;
    }
    if (get && !orderMatch[2]) {
      const items = await query(
          "SELECT * FROM order_items WHERE order_id=:id",
          { id: order.order_id },
        ),
        [payment] = await query(
          "SELECT * FROM payments WHERE order_id=:id ORDER BY payment_id DESC LIMIT 1",
          { id: order.order_id },
        );
      await show(
        "คำสั่งซื้อ " + order.order_number,
        page.orderPage(order, items, payment, session),
      );
      return true;
    }
  }
  const proofMatch = p.match(/^\/payment-proof\/(\d+)$/);
  // SERVICE-EXAMPLES-BEGIN payment-proof
  // Read private payment proof; Access: Order owner/Owner/Manager
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/payment-proof/{{paymentId}}
  // 2. method: GET; URL: {{baseUrl}}/api/payment-proof/99999999
  // SERVICE-EXAMPLES-END payment-proof
  if (get && proofMatch) {
    const [proof] = await query(
      "SELECT p.*,o.customer_id FROM payments p JOIN orders o USING(order_id) WHERE payment_id=:id",
      { id: proofMatch[1] },
    );
    if (!proof?.proof_path) throw problem(404, "ไม่พบหลักฐาน");
    let allowed =
      session.userId && Number(proof.customer_id) === Number(session.userId);
    if (!allowed && session.adminId) {
      const admin = await requireAdmin(req, res, session);
      if (!admin) return true;
      allowed = ["Owner", "Manager"].includes(admin.role);
    }
    if (!allowed) throw problem(403, "คุณไม่มีสิทธิ์ดูหลักฐานนี้");
    if (!/^[a-f0-9]{36}\.webp$/.test(proof.proof_path))
      throw problem(404, "ไม่พบไฟล์");
    const bytes = await readFile(path.join(proofDirectory, proof.proof_path));
    res.writeHead(200, {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
    });
    res.end(bytes);
    return true;
  }
  // Contact page examples: GET /api/page?path=/contact ; GET /api/page?path=/contact%3Forder%3DBGTEST
  if (get && p === "/contact") {
    await show(
      "ติดต่อร้าน",
      page.contact(session, { order: url.searchParams.get("order") || "" }),
    );
    return true;
  }
  if (get && p === "/about") {
    await show("เรื่องของเรา", page.about());
    return true;
  }
  if (get && p === "/team") {
    await show("ทีม BuddyGiftfy", page.team());
    return true;
  }
  if (get && p === "/help") {
    await show("คำถามที่พบบ่อย", page.help(session));
    return true;
  }
  if (get && p === "/references") {
    await show("แหล่งอ้างอิง", page.references());
    return true;
  }
  if (get && p === "/gift-budget") {
    await show("เทียบงบของขวัญ", page.giftBudget(session));
    return true;
  }
  const managed =
    p === "/admin" ||
    [
      "/admin/orders",
      "/admin/payments",
      "/admin/messages",
      "/admin/settings",
    ].includes(p) ||
    /^\/admin\/(orders|messages|payments)\/\d+(?:\/(status|review|cancel))?$/.test(
      p,
    );
  if (managed) {
    const admin = await requireAdmin(req, res, session);
    if (!admin) return true;
    if (admin.role === "Editor") {
      if (p === "/admin") return go("/admin/products");
      throw problem(403, "บัญชีนี้ไม่มีสิทธิ์ดูแลคำสั่งซื้อหรือการตั้งค่าร้าน");
    }
    if (p === "/admin/settings") {
      if (admin.role !== "Owner")
        throw problem(403, "เฉพาะเจ้าของร้านที่แก้ไขการตั้งค่าได้");
      if (get) {
        await show(
          "ตั้งค่าร้าน",
          page.settingsPage(session.settings, session),
          { admin: true },
        );
        return true;
      }
      // SERVICE-EXAMPLES-BEGIN settings
      // Update store settings; Access: Owner
      // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
      // Use the demo database and replace ID/token placeholders with actual values.
      // Image requests require a complete data URL; see docs/service-catalog.json.
      // 1. method: POST; URL: {{baseUrl}}/api/admin/settings
      // body: raw JSON {"_csrf":"{{csrf}}","store_name":"Demo Gift Shop","support_email":"demo@example.test","bank_name":"Demo Bank (test only)","bank_account_name":"Demo Only","bank_account_number":"0000000000","shipping_fee":"50","free_shipping_threshold":"1000","gift_wrap_fee":"49","payment_window_hours":"24","announcement":"ร้านสาธิต"}
      // 2. method: POST; URL: {{baseUrl}}/api/admin/settings
      // body: raw JSON {"_csrf":"{{csrf}}","store_name":"Demo Gift Shop","shipping_fee":"-1"}
      // SERVICE-EXAMPLES-END settings
      if (post) {
        const values = { ...defaults };
        for (const k of Object.keys(defaults))
          values[k] = String(req.body[k] ?? "")
            .trim()
            .slice(0, k === "support_email" ? 254 : 160);
        if (
          !values.store_name ||
          values.store_name.length > 80 ||
          (values.support_email && !/^\S+@\S+\.\S+$/.test(values.support_email))
        )
          return go(p, "กรุณาตรวจชื่อร้านและอีเมลติดต่อ", "error");
        for (const k of [
          "shipping_fee",
          "free_shipping_threshold",
          "gift_wrap_fee",
        ]) {
          if (
            values[k] === "" ||
            !Number.isFinite(Number(values[k])) ||
            Number(values[k]) < 0 ||
            Number(values[k]) > 1000000
          )
            return go(
              p,
              "ค่าบริการต้องเป็นตัวเลขตั้งแต่ 0 ถึง 1,000,000",
              "error",
            );
          values[k] = amount(cents(values[k]));
        }
        if (!integer(values.payment_window_hours, 1, 168))
          return go(p, "เวลาสำรองสินค้าต้องอยู่ระหว่าง 1–168 ชั่วโมง", "error");
        const filled = [
          "bank_name",
          "bank_account_name",
          "bank_account_number",
        ].filter((k) => values[k]).length;
        if (filled && filled !== 3)
          return go(p, "กรุณากรอกธนาคาร ชื่อบัญชี และเลขบัญชีให้ครบ", "error");
        if (
          values.bank_account_number &&
          !/^[\d -]{6,40}$/.test(values.bank_account_number)
        )
          return go(p, "กรุณาตรวจเลขบัญชีธนาคาร", "error");
        await transaction(async (conn) => {
          for (const [k, v] of Object.entries(values))
            await conn.execute(
              "INSERT INTO store_settings(setting_key,setting_value) VALUES(?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)",
              [k, v],
            );
        });
        await logAction(
          session,
          req,
          "store.settings.updated",
          "Updated store configuration",
        );
        return go(p, "บันทึกการตั้งค่าร้านแล้ว");
      }
    }
    if (get && p === "/admin") {
      const [sales] = await query(
          "SELECT COALESCE(SUM(amount),0) AS amount FROM payments WHERE payment_status='Completed' AND paid_at>=DATE_FORMAT(NOW(),'%Y-%m-01')",
        ),
        [pending] = await query(
          "SELECT COUNT(*) AS amount FROM orders WHERE status IN('Pending','Confirmed','Preparing')",
        ),
        [proofs] = await query(
          "SELECT COUNT(*) AS amount FROM payments p JOIN orders o USING(order_id) WHERE p.payment_status='Pending' AND proof_path IS NOT NULL AND o.status<>'Cancelled'",
        ),
        [messages] = await query(
          "SELECT COUNT(*) AS amount FROM contact_messages WHERE status='New'",
        );
      const orders = await query(
          "SELECT o.*,c.first_name,c.last_name,p.payment_status,(p.proof_path IS NOT NULL) AS has_proof FROM orders o JOIN customers c USING(customer_id) LEFT JOIN payments p USING(order_id) ORDER BY o.created_at DESC LIMIT 6",
        ),
        low = await query(
          "SELECT * FROM products WHERE status<>'Inactive' AND stock_quantity<=7 ORDER BY stock_quantity LIMIT 5",
        );
      await show(
        "ภาพรวมร้าน",
        page.adminDashboard(
          {
            sales: sales.amount,
            pending: pending.amount,
            proofs: proofs.amount,
            messages: messages.amount,
          },
          orders,
          low,
          session,
        ),
        { admin: true },
      );
      return true;
    }
    if (get && ["/admin/orders", "/admin/payments"].includes(p)) {
      const payments = p === "/admin/payments",
        status = url.searchParams.get("status") || "",
        q = (url.searchParams.get("q") || "").trim().slice(0, 100),
        clauses = [],
        params = {};
      if (q) {
        clauses.push(
          "(o.order_number LIKE :q OR c.first_name LIKE :q OR c.last_name LIKE :q OR c.email LIKE :q)",
        );
        params.q = "%" + q + "%";
      }
      if (payments && status === "review")
        clauses.push(
          "p.proof_path IS NOT NULL AND p.payment_status='Pending' AND o.status<>'Cancelled'",
        );
      else if (
        status &&
        ([
          "Pending",
          "Confirmed",
          "Preparing",
          "Shipped",
          "Completed",
          "Cancelled",
        ].includes(status) ||
          (payments && ["Failed", "Refunded"].includes(status)))
      ) {
        clauses.push((payments ? "p.payment_status" : "o.status") + "=:status");
        params.status = status;
      }
      const orders = await query(
        `SELECT o.*,c.first_name,c.last_name,p.payment_status,(p.proof_path IS NOT NULL) AS has_proof FROM orders o JOIN customers c USING(customer_id) LEFT JOIN payments p USING(order_id) ${clauses.length ? "WHERE " + clauses.join(" AND ") : ""} ORDER BY o.created_at DESC LIMIT 150`,
        params,
      );
      await show(
        payments ? "ตรวจสอบการชำระเงิน" : "คำสั่งซื้อ",
        page.adminOrders(orders, { status, q, payments }),
        { admin: true },
      );
      return true;
    }
    const adminOrder = p.match(
      /^\/admin\/orders\/(\d+)(?:\/(status|review|cancel))?$/,
    );
    if (adminOrder) {
      const id = Number(adminOrder[1]);
      if (get && !adminOrder[2]) {
        const [order] = await query("SELECT * FROM orders WHERE order_id=:id", {
          id,
        });
        if (!order) throw problem(404, "ไม่พบคำสั่งซื้อ");
        const items = await query(
            "SELECT * FROM order_items WHERE order_id=:id",
            { id },
          ),
          [payment] = await query(
            "SELECT * FROM payments WHERE order_id=:id ORDER BY payment_id DESC LIMIT 1",
            { id },
          );
        await show(
          "คำสั่งซื้อ " + order.order_number,
          page.orderPage(order, items, payment, session, { admin: true }),
          { admin: true },
        );
        return true;
      }
      // SERVICE-EXAMPLES-BEGIN order-review
      // Review payment proof; Access: Owner/Manager
      // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
      // Use the demo database and replace ID/token placeholders with actual values.
      // Image requests require a complete data URL; see docs/service-catalog.json.
      // 1. method: POST; URL: {{baseUrl}}/api/admin/orders/{{id}}/review
      // body: raw JSON {"_csrf":"{{csrf}}","decision":"approve","review_note":"ตรวจยอดแล้ว"}
      // 2. method: POST; URL: {{baseUrl}}/api/admin/orders/{{id}}/review
      // body: raw JSON {"_csrf":"{{csrf}}","decision":"reject","review_note":"ยอดไม่ตรง กรุณาส่งหลักฐานใหม่"}
      // SERVICE-EXAMPLES-END order-review
      // SERVICE-EXAMPLES-BEGIN order-status
      // Advance the fulfillment status; Access: Owner/Manager
      // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
      // Use the demo database and replace ID/token placeholders with actual values.
      // Image requests require a complete data URL; see docs/service-catalog.json.
      // 1. method: POST; URL: {{baseUrl}}/api/admin/orders/{{id}}/status
      // body: raw JSON {"_csrf":"{{csrf}}","status":"Preparing"}
      // 2. method: POST; URL: {{baseUrl}}/api/admin/orders/{{id}}/status
      // body: raw JSON {"_csrf":"{{csrf}}","status":"Shipped","carrier":"Demo Carrier","tracking":"DEMO123456"}
      // SERVICE-EXAMPLES-END order-status
      // SERVICE-EXAMPLES-BEGIN admin-order-cancel
      // Cancel an unpaid order as an administrator; Access: Owner/Manager
      // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
      // Use the demo database and replace ID/token placeholders with actual values.
      // Image requests require a complete data URL; see docs/service-catalog.json.
      // 1. method: POST; URL: {{baseUrl}}/api/admin/orders/{{id}}/cancel
      // body: raw JSON {"_csrf":"{{csrf}}"}
      // 2. method: POST; URL: {{baseUrl}}/api/admin/orders/{{id}}/cancel
      // body: raw JSON {"_csrf":"{{csrf}}"}
      // SERVICE-EXAMPLES-END admin-order-cancel
      if (post) {
        try {
          if (adminOrder[2] === "review") {
            if (!["approve", "reject"].includes(req.body.decision))
              throw problem(400, "กรุณาเลือกผลการตรวจสอบ");
            await reviewPayment(id, {
              approved: req.body.decision === "approve",
              note: String(req.body.review_note || ""),
            });
          } else if (adminOrder[2] === "cancel") await cancelOrder(id);
          else if (adminOrder[2] === "status")
            await advanceOrder(id, req.body.status, {
              carrier: String(req.body.carrier || ""),
              tracking: String(req.body.tracking || ""),
            });
          else return false;
        } catch (error) {
          if (error.status && error.status < 500)
            return go("/admin/orders/" + id, error.message, "error");
          throw error;
        }
        await logAction(session, req, "order.updated", "Updated order " + id);
        return go("/admin/orders/" + id, "อัปเดตคำสั่งซื้อแล้ว");
      }
    }
    // SERVICE-EXAMPLES-BEGIN legacy-payment-status
    // Reject attempts to bypass payment review; Access: Owner/Manager
    // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
    // Use the demo database and replace ID/token placeholders with actual values.
    // Image requests require a complete data URL; see docs/service-catalog.json.
    // 1. method: POST; URL: {{baseUrl}}/api/admin/payments/{{id}}/status
    // body: raw JSON {"_csrf":"{{csrf}}","status":"Completed"}
    // 2. method: POST; URL: {{baseUrl}}/api/admin/payments/{{id}}/status
    // body: raw JSON {"_csrf":"{{csrf}}","status":"Failed"}
    // SERVICE-EXAMPLES-END legacy-payment-status
    if (post && /^\/admin\/payments\/\d+\/status$/.test(p))
      throw problem(
        400,
        "กรุณาตรวจหลักฐานและยืนยันจากหน้ารายละเอียดคำสั่งซื้อ",
      );
    if (get && p === "/admin/messages") {
      const rows = await query(
        "SELECT * FROM contact_messages ORDER BY (status='New') DESC,created_at DESC LIMIT 100",
      );
      await show("ข้อความจากลูกค้า", page.messages(rows, session), {
        admin: true,
      });
      return true;
    }
    const messageMatch = p.match(/^\/admin\/messages\/(\d+)\/status$/);
    // SERVICE-EXAMPLES-BEGIN message-status
    // Change a customer message status; Access: Owner/Manager
    // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
    // Use the demo database and replace ID/token placeholders with actual values.
    // Image requests require a complete data URL; see docs/service-catalog.json.
    // 1. method: POST; URL: {{baseUrl}}/api/admin/messages/{{id}}/status
    // body: raw JSON {"_csrf":"{{csrf}}","status":"Read"}
    // 2. method: POST; URL: {{baseUrl}}/api/admin/messages/{{id}}/status
    // body: raw JSON {"_csrf":"{{csrf}}","status":"Resolved"}
    // SERVICE-EXAMPLES-END message-status
    if (post && messageMatch) {
      if (!["New", "Read", "Resolved"].includes(req.body.status))
        throw problem(400, "สถานะไม่ถูกต้อง");
      await query(
        "UPDATE contact_messages SET status=:status WHERE message_id=:id",
        { status: req.body.status, id: messageMatch[1] },
      );
      return go("/admin/messages", "อัปเดตข้อความแล้ว");
    }
  }
  return false;
}
