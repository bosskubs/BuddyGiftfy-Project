// Initialize session state, page access checks, data loading, and shared form behavior.
import { request } from "./api.js";
import { $, $$, bind, fields, text, visible, wireForms } from "./shared/dom.js";

export function notice(message, error = true) {
  const node = $("[data-page-error]");
  if (!node) return;
  node.hidden = !message;
  node.textContent = message || "";
  node.className =
    "flash notice " + (error ? "notice-error" : "notice-success");
  node.setAttribute("role", error ? "alert" : "status");
}
function fillSession(session) {
  for (const brand of $$(".brand > span"))
    if (brand.firstChild)
      brand.firstChild.textContent =
        session.settings.store_name || "BuddyGiftfy";
  text(
    ".announcement > span",
    session.settings.announcement || "ของขวัญที่เลือกด้วยใจ",
  );
  text(
    ".footer-bottom > span:first-child",
    "© " +
      new Date().getFullYear() +
      " " +
      (session.settings.store_name || "BuddyGiftfy"),
  );

  bind(document, {
    session,
    account: session.admin || {},
    customer: session.user || {},
  });
  for (const input of $$('[name="_csrf"]')) input.value = session.csrf || "";
  for (const node of $$("[data-cart-count]")) {
    const count = (session.cart || []).reduce((n, l) => n + l.quantity, 0);
    node.textContent = count;
    node.classList.toggle("is-zero", !count);
  }
  for (const node of $$("[data-favorite-count]")) {
    const count = (session.favorites || []).length;
    node.textContent = count;
    node.classList.toggle("is-zero", !count);
  }
  const account = $(".header-account");
  if (account) {
    account.href = session.user ? "/account" : "/login";
    text("span", session.user?.first_name || "เข้าสู่ระบบ", account);
  }
  for (const node of $$("[data-roles]"))
    node.hidden = !node.dataset.roles.split(",").includes(session.admin?.role);
  if (session.admin) {
    text(".admin-identity .avatar", session.admin.first_name.slice(0, 1));
    const name = $(".admin-identity > span:last-child");
    if (name) {
      name.firstChild.textContent = session.admin.first_name;
      text("small", session.admin.role, name);
    }
  }
  for (const link of $$('a[href^="mailto:"]'))
    if (link.closest("footer,.contact-copy")) {
      const email = session.settings.support_email;
      link.hidden = !email;
      if (email) {
        link.href = "mailto:" + email;
        const span = $("[data-bind]", link);
        if (span) span.textContent = email;
      }
    }
  for (const link of $$('a[href^="tel:"]')) {
    const phone = session.settings.support_phone;
    link.hidden = !phone;
    if (phone) link.href = "tel:" + phone.replace(/[^+\d]/g, "");
  }
  for (const link of $$(".bottom-nav a"))
    if (link.querySelector("span")?.textContent === "บัญชี")
      link.href = session.user ? "/account" : "/login";
}
// These browser checks guide navigation; the API independently enforces permissions.
function authorized(session) {
  const { access, page } = document.body.dataset;
  if (access === "customer" && !session.user) {
    location.replace(
      "/login?next=" +
        encodeURIComponent(location.pathname + location.search),
    );
    return false;
  }
  if (["admin", "owner", "operations"].includes(access) && !session.admin) {
    location.replace(
      "/admin/login?next=" +
        encodeURIComponent(location.pathname + location.search),
    );
    return false;
  }
  if (page === "dashboard" && session.admin?.role === "Editor") {
    location.replace("/admin/products");
    return false;
  }
  if (access === "owner" && session.admin?.role !== "Owner")
    throw Error("เฉพาะเจ้าของร้านที่เข้าถึงหน้านี้ได้");
  if (
    access === "operations" &&
    !["Owner", "Manager"].includes(session.admin?.role)
  )
    throw Error("บัญชีนี้ไม่มีสิทธิ์เข้าถึงหน้านี้");
  return true;
}
// Resolve identifiers from the URL and preserve search filters for the page endpoint.
function endpointForPage() {
  let endpoint = document.body.dataset.endpoint;
  if (!endpoint) return null;
  const query = new URLSearchParams(location.search);
  endpoint = endpoint.replace(/:(id|slug|number)/g, (_, name) => {
    const value = query.get(name);
    if (!value || (name === "id" && !/^[1-9]\d*$/.test(value)))
      throw Error("ไม่พบรหัสข้อมูลที่ต้องการ กรุณาเปิดจากหน้ารายการ");
    return encodeURIComponent(value);
  });
  for (const key of ["id", "slug", "number"]) query.delete(key);
  return endpoint + (query.size ? "?" + query : "");
}
// Load the session before protected page data, then bind the shared and page-specific UI.
export async function initPage(controller = () => {}) {
  let ready = false;
  try {
    const initial = await request("/api/session");
    let session = initial.session;
    if (!authorized(session)) return;
    const endpoint = endpointForPage();
    const response = endpoint ? await request(endpoint) : initial;
    if (response.redirect) {
      location.replace(response.redirect);
      return;
    }
    session = response.session || session;
    fillSession(session);
    wireForms(document, session);
    const data = endpoint ? response.data || {} : {};
    const context = {
      data,
      session,
      query: new URLSearchParams(location.search),
    };
    await controller(context);
    wireForms(document, session);
    await import("./app.js");
    if (document.body.dataset.page === "gift-budget")
      await import("./shared/public-service.js");
    ready = true;
    const flash = response.flash || initial.flash;
    if (flash) notice(flash.message, flash.type === "error");
    const status = $("[data-page-status]");
    if (status) status.textContent = "";
    document.documentElement.dataset.ready = "true";
    document.body.dataset.ready = "true";
  } catch (error) {
    if (error.result?.redirect) {
      location.replace(error.result.redirect);
      return;
    }
    notice(error.message || "โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่");
    text("[data-page-status]", "โหลดข้อมูลไม่สำเร็จ");
    document.documentElement.dataset.ready = "error";
  } finally {
    // Navigation and disclosure controls also work when a data service is unavailable.
    await import("./app.js");
    if (document.body.dataset.page === "gift-budget")
      await import("./shared/public-service.js");
  }
}
