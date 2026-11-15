// Manage password hashes, session cookies, CSRF validation, and safe redirect paths.
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { query } from "./db.js";

const scrypt = promisify(scryptCallback);
const cookieName = "bg_session";
const sessionTtlMs =
  Math.max(1, Number(process.env.SESSION_DAYS || 7)) * 86400_000;

export async function hashPassword(password) {
  if (String(password).length < 12 || String(password).length > 256)
    throw new Error("Password length must be between 12 and 256 characters");
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${Buffer.from(key).toString("hex")}`;
}

export async function verifyPassword(password, encoded) {
  if (String(password || "").length > 256) return false;
  const [scheme, salt, expectedHex] = String(encoded || "").split("$");
  if (scheme !== "scrypt" || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(await scrypt(password, salt, expected.length));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function cookieOptions(maxAge = sessionTtlMs) {
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(maxAge / 1000)}${process.env.SESSION_COOKIE_SECURE === "true" ? "; Secure" : ""}`;
}

export async function createSession(res, data = {}) {
  const id = randomBytes(32).toString("base64url");
  const csrf = randomBytes(24).toString("base64url");
  const expires = new Date(Date.now() + sessionTtlMs);
  await query(
    "INSERT INTO sessions (session_id, data_json, expires_at) VALUES (:id, :data, :expires)",
    {
      id,
      data: JSON.stringify({ csrf, cart: [], ...data }),
      expires,
    },
  );
  res.setHeader("Set-Cookie", `${cookieName}=${id}; ${cookieOptions()}`);
  return { id, csrf, cart: [], ...data };
}

export async function loadSession(req, res) {
  const cookie = req.headers.cookie || "";
  const id = cookie
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  if (!id || !/^[A-Za-z0-9_-]{40,60}$/.test(id)) return createSession(res);
  const rows = await query(
    "SELECT data_json FROM sessions WHERE session_id = :id AND expires_at > NOW()",
    { id },
  );
  if (!rows.length) {
    res.setHeader("Set-Cookie", `${cookieName}=; ${cookieOptions(0)}`);
    return createSession(res);
  }
  try {
    const data = rows[0].data_json;
    return { id, ...(typeof data === "string" ? JSON.parse(data) : data) };
  } catch {
    return rotateSession(res, id);
  }
}

export async function saveSession(res, session) {
  await query(
    "UPDATE sessions SET data_json = :data, expires_at = :expires WHERE session_id = :id",
    {
      id: session.id,
      data: JSON.stringify({
        csrf: session.csrf,
        cart: session.cart || [],
        userId: session.userId || null,
        adminId: session.adminId || null,
        favorites: session.favorites || [],
        preferGiftWrap: session.preferGiftWrap === true,
        checkoutToken: session.checkoutToken || null,
        checkoutDraft: session.checkoutDraft || null,
        authDraft: session.authDraft || null,
        flash: session.flash || null,
      }),
      expires: new Date(Date.now() + sessionTtlMs),
    },
  );
  res.setHeader(
    "Set-Cookie",
    `${cookieName}=${session.id}; ${cookieOptions()}`,
  );
}

export async function rotateSession(res, oldId, data = {}) {
  if (oldId)
    await query("DELETE FROM sessions WHERE session_id = :id", { id: oldId });
  return createSession(res, data);
}

export function csrfField(session) {
  return `<input type="hidden" name="_csrf" value="${escapeHtml(session.csrf)}">`;
}

export function checkCsrf(body, session) {
  const a = Buffer.from(String(body?._csrf || ""));
  const b = Buffer.from(String(session.csrf || ""));
  if (!a.length || a.length !== b.length || !timingSafeEqual(a, b)) {
    const error = new Error("แบบฟอร์มหมดอายุ กรุณาลองใหม่อีกครั้ง");
    error.status = 403;
    throw error;
  }
}

export function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
}

export function safeNext(value, fallback = "/") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    /[\\\u0000-\u001f]/.test(value)
  )
    return fallback;
  try {
    const target = new URL(value, "http://buddygiftfy.local");
    return target.origin === "http://buddygiftfy.local"
      ? `${target.pathname}${target.search}${target.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
