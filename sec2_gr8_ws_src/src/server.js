// Run the HTTP API and coordinate sessions, authentication, and business route handlers.
import http from "node:http";
import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool, query } from "./db.js";
import {
  loadSession,
  saveSession,
  rotateSession,
  hashPassword,
  verifyPassword,
  checkCsrf,
  safeNext,
} from "./security.js";
import {
  settings,
  mergeFavorites,
  normalizedCart,
  expireOrders,
  problem,
} from "./commerce.js";
import { apiTarget } from "./service-contract.js";
import { frontendPath } from "./frontend-paths.js";
import { handleShop } from "./shop-routes.js";
import { handleAdmin } from "./admin-routes.js";
import { serializeSession } from "./session-queue.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  attempts = new Map();
const jsonRequested = (req) =>
  req.headers.accept?.includes("application/json") ||
  req.headers["content-type"]?.includes("application/json");
// All successful page requests return a JSON view model; HTML is rendered only by the frontend.
function cleanJSON(key, value) {
  if (key === "redirect") return frontendPath(value);
  if (["password_hash", "session_id"].includes(key)) return undefined;
  if (key === "proof_path") return Boolean(value);
  if (
    value &&
    typeof value === "object" &&
    value.csrf &&
    Array.isArray(value.cart)
  ) {
    const { id, ...safe } = value;
    return safe;
  }
  return value;
}
function respond(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}
function json(res, status, data) {
  respond(res, status, JSON.stringify(data, cleanJSON));
}
function redirect(res, url) {
  const flash = res.currentSession?.flash;
  json(res, flash?.type === "error" ? 422 : 200, {
    ok: flash?.type !== "error",
    redirect: url,
    message: flash?.message || "",
  });
}
function setFlash(session, type, message) {
  session.flash = { type, message };
}
// Return named records only; static HTML belongs to the frontend server.
async function render(res, session, name, data, options = {}) {
  const flash = session.flash;
  session.flash = null;
  await saveSession(res, session);
  json(res, options.status || 200, {
    ok: !(options.status >= 400),
    data,
    session,
    flash,
    message: options.status >= 400 ? data.error || "กรุณาตรวจสอบข้อมูล" : "",
  });
}
async function requireCustomer(req, res, session, next) {
  if (!session.userId || !session.user) {
    await saveSession(res, session);
    json(res, 401, {
      ok: false,
      message: "กรุณาเข้าสู่ระบบ",
      redirect: "/login?next=" + encodeURIComponent(next),
    });
    return null;
  }
  return session.user;
}
async function requireAdmin(req, res, session) {
  if (!session.adminId) {
    json(res, 401, {
      ok: false,
      message: "กรุณาเข้าสู่ระบบผู้ดูแล",
      redirect: "/admin/login",
    });
    return null;
  }
  const [admin] = await query(
    "SELECT admin_id,email,first_name,last_name,role,status,age,address,preferences FROM admin_accounts WHERE admin_id=:id",
    { id: session.adminId },
  );
  if (!admin || admin.status !== "Active") {
    session.adminId = null;
    await saveSession(res, session);
    json(res, 401, {
      ok: false,
      message: "บัญชีนี้ไม่พร้อมใช้งาน",
      redirect: "/admin/login",
    });
    return null;
  }
  session.admin = admin;
  return admin;
}
async function logAction(
  session,
  req,
  action,
  description,
  status = "Success",
) {
  await query(
    "INSERT INTO activity_logs(admin_id,customer_id,action,description,ip_address,status,device) VALUES(:admin,:customer,:action,:description,:ip,:status,:device)",
    {
      admin: session.adminId || null,
      customer: session.userId || null,
      action,
      description: String(description).slice(0, 1000),
      ip: String(req.socket.remoteAddress || "").slice(0, 45),
      status,
      device: String(req.headers["user-agent"] || "").slice(0, 255),
    },
  );
}
async function parseBody(req, limit) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > limit) throw problem(413, "ข้อมูลมีขนาดใหญ่เกินไป");
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (req.headers["content-type"]?.includes("application/json")) {
    let value;
    try {
      value = JSON.parse(raw);
    } catch {
      throw problem(400, "ข้อมูลไม่ถูกต้อง");
    }
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw problem(400, "ข้อมูลไม่ถูกต้อง");
    return value;
  }
  return Object.fromEntries(new URLSearchParams(raw));
}
// SERVICE-EXAMPLES-BEGIN uploaded-image
// Read an uploaded product image; Access: Public
// Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
// Use the demo database and replace ID/token placeholders with actual values.
// Image requests require a complete data URL; see docs/service-catalog.json.
// 1. method: GET; URL: {{baseUrl}}/api/images/uploads/{{imageFilename}}
// 2. method: GET; URL: {{baseUrl}}/api/images/uploads/missing.webp
// SERVICE-EXAMPLES-END uploaded-image
async function staticFile(req, res, url) {
  const raw = decodeURIComponent(url.pathname),
    file = path.resolve(root, "public", "." + raw);
  if (!file.startsWith(path.join(root, "public") + path.sep))
    throw problem(404, "ไม่พบไฟล์");
  let bytes;
  try {
    if (!(await stat(file)).isFile()) throw Error();
    bytes = await readFile(file);
  } catch {
    throw problem(404, "ไม่พบไฟล์");
  }
  const ext = path.extname(file).toLowerCase(),
    type =
      {
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".ttf": "font/ttf",
        ".woff2": "font/woff2",
      }[ext] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": [".css", ".js"].includes(ext)
      ? "no-cache"
      : "public, max-age=86400",
  });
  res.end(req.method === "HEAD" ? undefined : bytes);
}
const carry = (session) => ({
  cart: session.cart || [],
  favorites: session.favorites || [],
  preferGiftWrap: session.preferGiftWrap === true,
});
// SERVICE-EXAMPLES-BEGIN admin-login
// Sign in as an administrator; Access: Public
// Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
// Use the demo database and replace ID/token placeholders with actual values.
// Image requests require a complete data URL; see docs/service-catalog.json.
// 1. method: POST; URL: {{baseUrl}}/api/auth/admin/login
// body: raw JSON {"_csrf":"{{csrf}}","email":"owner@example.test","password":"{{demoPassword}}"}
// 2. method: POST; URL: {{baseUrl}}/api/auth/admin/login
// body: raw JSON {"_csrf":"{{csrf}}","email":"owner@example.test","password":"wrong-password"}
// SERVICE-EXAMPLES-END admin-login
// SERVICE-EXAMPLES-BEGIN customer-login
// Sign in as a customer; Access: Public
// Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
// Use the demo database and replace ID/token placeholders with actual values.
// Image requests require a complete data URL; see docs/service-catalog.json.
// 1. method: POST; URL: {{baseUrl}}/api/auth/login
// body: raw JSON {"_csrf":"{{csrf}}","email":"buyer@example.test","password":"{{demoPassword}}"}
// 2. method: POST; URL: {{baseUrl}}/api/auth/login
// body: raw JSON {"_csrf":"{{csrf}}","email":"buyer@example.test","password":"wrong-password"}
// SERVICE-EXAMPLES-END customer-login
// SERVICE-EXAMPLES-BEGIN register
// Register a customer; Access: Public
// Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
// Use the demo database and replace ID/token placeholders with actual values.
// Image requests require a complete data URL; see docs/service-catalog.json.
// 1. method: POST; URL: {{baseUrl}}/api/auth/register
// body: raw JSON {"_csrf":"{{csrf}}","first_name":"Gift","last_name":"Buyer","email":"buyer-a@example.test","password":"{{demoPassword}}","password_confirm":"{{demoPassword}}"}
// 2. method: POST; URL: {{baseUrl}}/api/auth/register
// body: raw JSON {"_csrf":"{{csrf}}","first_name":"Buddy","last_name":"Buyer","email":"buyer-b@example.test","password":"{{demoPassword}}","password_confirm":"{{demoPassword}}"}
// SERVICE-EXAMPLES-END register
async function authPost(req, res, url, session) {
  const p = url.pathname,
    admin = p === "/admin/login",
    register = p === "/register";
  if (
    !["/login", "/register", "/admin/login"].includes(p) ||
    req.method !== "POST"
  )
    return false;
  const body = req.body,
    email = String(body.email || "")
      .trim()
      .toLowerCase(),
    next = safeNext(body.next, admin ? "/admin" : "/account"),
    back = p + "?next=" + encodeURIComponent(next);
  session.authDraft = {
    email,
    first_name: String(body.first_name || "").slice(0, 80),
    last_name: String(body.last_name || "").slice(0, 80),
  };
  const fail = async (message) => {
    setFlash(session, "error", message);
    await saveSession(res, session);
    json(res, register ? 422 : 401, { ok: false, message, redirect: back });
    return true;
  };
  if (attempts.size > 10000) {
    for (const [k, v] of attempts)
      if (Date.now() - v.time > 900000) attempts.delete(k);
  }
  const key =
      (admin ? "admin:" : "customer:") + req.socket.remoteAddress + ":" + email,
    hits = attempts.get(key) || { count: 0, time: Date.now() };
  if (Date.now() - hits.time > 900000) {
    hits.count = 0;
    hits.time = Date.now();
  }
  if (hits.count >= 8)
    return fail("ลองเข้าสู่ระบบหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่");
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254)
    return fail("กรุณากรอกอีเมลให้ถูกต้อง");
  if (register) {
    const first = session.authDraft.first_name.trim(),
      last = session.authDraft.last_name.trim(),
      password = String(body.password || "");
    if (
      !first ||
      !last ||
      password.length < 12 ||
      password.length > 256 ||
      password !== body.password_confirm
    )
      return fail(
        "กรอกข้อมูลให้ครบ และใช้รหัสผ่านอย่างน้อย 12 ตัวอักษรที่ตรงกับช่องยืนยัน",
      );
    let result;
    try {
      result = await query(
        "INSERT INTO customers(email,password_hash,first_name,last_name) VALUES(:email,:hash,:first,:last)",
        { email, hash: await hashPassword(password), first, last },
      );
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY")
        return fail("อีเมลนี้สมัครสมาชิกแล้ว สามารถเข้าสู่ระบบได้เลย");
      throw error;
    }
    await mergeFavorites(session, result.insertId);
    const fresh = await rotateSession(res, session.id, {
      ...carry(session),
      userId: result.insertId,
    });
    setFlash(fresh, "success", "ยินดีต้อนรับสู่ BuddyGiftfy");
    await saveSession(res, fresh);
    redirect(res, next);
    return true;
  }
  const [user] = await query(
    `SELECT * FROM ${admin ? "admin_accounts" : "customers"} WHERE email=:email`,
    { email },
  );
  if (
    !user ||
    user.status !== "Active" ||
    !(await verifyPassword(body.password, user.password_hash))
  ) {
    hits.count++;
    attempts.set(key, hits);
    await logAction(
      session,
      req,
      admin ? "admin.login.failed" : "customer.login.failed",
      "Rejected login for " + email,
      "Failed",
    );
    return fail("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  }
  attempts.delete(key);
  if (!admin) await mergeFavorites(session, user.customer_id);
  const fresh = await rotateSession(res, session.id, {
    ...carry(session),
    ...(admin
      ? { adminId: user.admin_id, userId: session.userId || null }
      : { userId: user.customer_id, adminId: session.adminId || null }),
  });
  await logAction(
    fresh,
    req,
    admin ? "admin.login" : "customer.login",
    "Signed in",
  );
  await saveSession(res, fresh);
  redirect(res, next);
  return true;
}
async function route(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  const origin = req.headers.origin,
    allowed = (
      process.env.FRONTEND_ORIGIN ||
      "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",");
  if (origin) {
    if (!allowed.includes(origin)) throw problem(403, "Origin is not allowed");
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Accept",
    });
    res.end();
    return;
  }
  const incoming = new URL(req.url, "http://localhost");
  // SERVICE-EXAMPLES-BEGIN health
  // Check MySQL availability; Access: Public
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/health
  // 2. method: GET; URL: {{baseUrl}}/api/health
  // SERVICE-EXAMPLES-END health
  if (incoming.pathname === "/api/health") {
    const [database] = await query(
      "SELECT VERSION() AS version,DATABASE() AS name",
    );
    json(res, 200, { ok: true, database });
    return;
  }
  const target = apiTarget(incoming, req.method);
  if (!target) throw problem(404, "ไม่พบเว็บเซอร์วิส");
  const url = target.url;
  req.method = target.method;
  if (url.pathname.startsWith("/images/")) {
    await staticFile(req, res, url);
    return;
  }
  const session = await loadSession(req, res);
  req.appSession = session;
  res.currentSession = session;
  session.path = url.pathname;
  session.cart = normalizedCart(session.cart);
  session.favorites = Array.isArray(session.favorites)
    ? session.favorites.map(Number).filter(Number.isSafeInteger).slice(0, 100)
    : [];
  session.settings = await settings();
  // HTML pages check their access using /api/session before loading page data.
  // Re-read the account so suspension, deletion and role changes apply immediately.
  session.admin = null;
  if (session.adminId) {
    const [admin] = await query(
      "SELECT admin_id,email,first_name,last_name,role,status,age,address,preferences FROM admin_accounts WHERE admin_id=:id",
      { id: session.adminId },
    );
    if (admin?.status === "Active") session.admin = admin;
    else session.adminId = null;
  }
  if (session.userId) {
    const [user] = await query(
      "SELECT customer_id,email,first_name,last_name,phone,address,status FROM customers WHERE customer_id=:id",
      { id: session.userId },
    );
    if (user?.status === "Active") {
      session.user = user;
      session.favorites = (
        await query(
          "SELECT product_id FROM wishlist_items WHERE customer_id=:id ORDER BY created_at DESC LIMIT 100",
          { id: session.userId },
        )
      ).map((r) => Number(r.product_id));
    } else {
      session.userId = null;
      session.user = null;
    }
  }
  if (req.method === "POST") {
    const large =
      url.pathname === "/admin/product-image" ||
      /^\/order\/[^/]+\/proof$/.test(url.pathname);
    req.body = await parseBody(req, large ? 7 * 1024 * 1024 : 64 * 1024);
    checkCsrf(req.body, session);
  }
  if (await authPost(req, res, url, session)) return;
  // SERVICE-EXAMPLES-BEGIN logout
  // Sign out the customer; Access: Session
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/logout
  // body: raw JSON {"_csrf":"{{csrf}}"}
  // 2. method: POST; URL: {{baseUrl}}/api/logout
  // body: raw JSON {"_csrf":"invalid-token"}
  // SERVICE-EXAMPLES-END logout
  // SERVICE-EXAMPLES-BEGIN admin-logout
  // Sign out the administrator; Access: Session
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/admin/logout
  // body: raw JSON {"_csrf":"{{csrf}}"}
  // 2. method: POST; URL: {{baseUrl}}/api/admin/logout
  // body: raw JSON {"_csrf":"invalid-token"}
  // SERVICE-EXAMPLES-END admin-logout
  if (
    req.method === "POST" &&
    ["/logout", "/admin/logout"].includes(url.pathname)
  ) {
    const admin = url.pathname.startsWith("/admin"),
      fresh = await rotateSession(res, session.id, {
        ...carry(session),
        ...(admin
          ? { userId: session.userId || null }
          : { adminId: session.adminId || null }),
      });
    setFlash(fresh, "success", "ออกจากระบบแล้ว");
    await saveSession(res, fresh);
    redirect(res, admin ? "/admin/login" : "/");
    return;
  }
  const ctx = {
    render,
    redirect,
    setFlash,
    requireCustomer,
    requireAdmin,
    logAction,
  };
  if (await handleShop(req, res, url, session, ctx)) return;
  if (await handleAdmin(req, res, url, session, ctx)) return;
  // SERVICE-EXAMPLES-BEGIN contact
  // Send a message to the store; Access: Public
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/contact
  // body: raw JSON {"_csrf":"{{csrf}}","first_name":"Gift","last_name":"Buyer","email":"gift@example.test","message":"สอบถามของขวัญและการจัดส่ง"}
  // 2. method: POST; URL: {{baseUrl}}/api/contact
  // body: raw JSON {"_csrf":"{{csrf}}","first_name":"Buddy","last_name":"Buyer","email":"buddy@example.test","message":"ต้องการสอบถามงานสั่งทำ"}
  // SERVICE-EXAMPLES-END contact
  if (req.method === "POST" && url.pathname === "/contact") {
    const b = req.body,
      first = String(b.first_name || "")
        .trim()
        .slice(0, 80),
      last = String(b.last_name || "")
        .trim()
        .slice(0, 80),
      email = String(b.email || "")
        .trim()
        .toLowerCase(),
      message = String(b.message || "")
        .trim()
        .slice(0, 4000);
    if (
      !first ||
      !last ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      email.length > 254 ||
      message.length < 3
    )
      throw problem(400, "กรุณากรอกข้อมูลและข้อความให้ครบ");
    await query(
      "INSERT INTO contact_messages(first_name,last_name,email,message) VALUES(:first,:last,:email,:message)",
      { first, last, email, message },
    );
    setFlash(
      session,
      "success",
      "ส่งข้อความถึงร้านแล้ว เราจะติดต่อกลับตามอีเมลที่ให้ไว้",
    );
    await saveSession(res, session);
    redirect(res, "/contact");
    return;
  }
  throw problem(404, "ไม่พบหน้าที่ต้องการ");
}
export const server = http.createServer(async (req, res) => {
  try {
    await serializeSession(req, () => route(req, res));
  } catch (error) {
    if (res.headersSent) {
      res.end();
      return;
    }
    const status = Number(error.status) || 500;
    console.error(
      "API request failed",
      status,
      error.code || "",
      error.message,
    );
    json(res, status, {
      ok: false,
      message:
        status >= 500
          ? "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง"
          : error.message,
    });
  }
});
let expirationRunning = false,
  intervals = [];
export async function start(port = Number(process.env.PORT || 3001)) {
  await query("SELECT 1");
  await query("SELECT setting_key FROM store_settings LIMIT 1");
  await expireOrders();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, resolve);
  });
  intervals.push(
    setInterval(async () => {
      if (expirationRunning) return;
      expirationRunning = true;
      try {
        await expireOrders();
      } catch (error) {
        console.error("Order expiry failed:", error.message);
      } finally {
        expirationRunning = false;
      }
    }, 60000),
  );
  intervals.push(
    setInterval(() => {
      query("DELETE FROM sessions WHERE expires_at<NOW()").catch((error) =>
        console.error(error.message),
      );
      for (const [key, v] of attempts)
        if (Date.now() - v.time > 900000) attempts.delete(key);
    }, 3600000),
  );
  intervals.forEach((i) => i.unref());
  return server;
}
export async function stop() {
  intervals.forEach(clearInterval);
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  start()
    .then(() =>
      console.log(
        "BuddyGiftfy API is ready at http://localhost:" + server.address().port,
      ),
    )
    .catch((error) => {
      console.error(
        "Cannot start: configure MySQL and run db:migrate.",
        error.message,
      );
      process.exit(1);
    });
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => stop().then(() => process.exit(0)));
}
