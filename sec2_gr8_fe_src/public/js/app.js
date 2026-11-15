// Handle shared browser interactions and submit mutation forms to the JSON API.
// Shared interaction handlers for the static HTML documents.
import { sendAction } from "./api.js";
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const currency = (value) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
function toast(message, { error = false, cart = false } = {}) {
  const stack = $(".toast-stack");
  if (!stack) return;
  const item = document.createElement("div");
  item.className = "toast" + (error ? " toast-error" : "");
  item.setAttribute("role", error ? "alert" : "status");
  const text = document.createElement("span");
  text.textContent = message;
  item.append(text);
  if (cart) {
    const link = document.createElement("a");
    link.href = "/cart";
    link.textContent = "ดูตะกร้า";
    item.append(link);
  }
  stack.append(item);
  setTimeout(() => item.remove(), error ? 7500 : 4500);
}
const request = sendAction;
function updateCount(selector, value) {
  for (const node of $$(selector)) {
    node.textContent = value;
    node.classList.toggle("is-zero", !value);
  }
  if (selector === "[data-cart-count]")
    for (const node of $$('a[href="/cart"][aria-label]'))
      node.setAttribute("aria-label", "ตะกร้าสินค้า " + value + " ชิ้น");
}
function busy(form, enabled) {
  form.dataset.busy = enabled ? "true" : "false";
  form.setAttribute("aria-busy", String(enabled));
  for (const button of $$('button[type="submit"],button.product-add', form))
    button.disabled = enabled;
}
function formObject(form) {
  return Object.fromEntries(new FormData(form));
}
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(Error("อ่านรูปภาพไม่ได้ กรุณาเลือกไฟล์ใหม่"));
    reader.readAsDataURL(file);
  });
}
function validateImage(file) {
  if (!file) throw Error("กรุณาเลือกไฟล์รูปภาพ");
  if (!["image/png", "image/jpeg"].includes(file.type))
    throw Error("รองรับภาพ PNG หรือ JPG เท่านั้น");
  if (file.size > 5 * 1024 * 1024)
    throw Error("ไฟล์มีขนาดเกิน 5 MB กรุณาเลือกรูปที่เล็กลง");
}
document.addEventListener("click", (event) => {
  const qty = event.target.closest("[data-qty]");
  if (qty) {
    const input = $('input[name="quantity"]', qty.closest("form"));
    if (input) {
      const min = Number(input.min || 1),
        max = Number(input.max || 99);
      input.value = Math.min(
        max,
        Math.max(min, Number(input.value || 1) + Number(qty.dataset.qty)),
      );
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return;
  }
  const dismiss = event.target.closest("[data-dismiss-notice]");
  if (dismiss) dismiss.closest(".notice")?.remove();
  const toggle = event.target.closest("[data-password-toggle]");
  if (toggle) {
    const input = document.getElementById(toggle.getAttribute("aria-controls"));
    if (input) {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.textContent = show ? "ซ่อน" : "แสดง";
      toggle.setAttribute("aria-pressed", String(show));
    }
  }
  const copy = event.target.closest("[data-copy]");
  if (copy) {
    const value = copy.dataset.copy;
    void (async () => {
      try {
        if (navigator.clipboard && window.isSecureContext)
          await navigator.clipboard.writeText(value);
        else {
          const input = document.createElement("textarea");
          input.value = value;
          input.style.position = "fixed";
          input.style.opacity = "0";
          document.body.append(input);
          input.select();
          const copied = document.execCommand("copy");
          input.remove();
          if (!copied) throw Error();
        }
        toast("คัดลอกแล้ว");
      } catch {
        toast("เลือกและคัดลอกหมายเลขนี้: " + value);
      }
    })();
  }
  if (event.target.closest("[data-go-back]")) {
    if (history.length > 1) history.back();
    else location.assign("/shop");
  }
});
document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (form.matches("[data-confirm]") && !window.confirm(form.dataset.confirm)) {
    event.preventDefault();
    return;
  }
  if (form.matches(".review-form") && event.submitter?.value === "reject") {
    const note = $('[name="review_note"]', form);
    if (!note.value.trim()) {
      event.preventDefault();
      note.setCustomValidity("กรุณาระบุเหตุผลให้ลูกค้าแก้ไขหลักฐาน");
      note.reportValidity();
      return;
    }
  }
  if (form.method.toLowerCase() !== "post") return;
  if (
    !form.matches("[data-add-cart],[data-favorite-form],[data-proof-upload]")
  ) {
    event.preventDefault();
    if (form.dataset.busy === "true") return;
    const data = formObject(form);
    if (event.submitter?.name)
      data[event.submitter.name] = event.submitter.value;
    try {
      busy(form, true);
      const result = await request(form.action, data, {
        method: form.dataset.method || "POST",
      });
      location.assign(result.redirect || location.pathname + location.search);
    } catch (error) {
      if (error.result?.redirect) {
        location.assign(error.result.redirect);
        return;
      }
      let feedback = $("[data-form-error]", form);
      if (!feedback) {
        feedback = document.createElement("p");
        feedback.dataset.formError = "";
        feedback.className = "notice notice-error";
        feedback.setAttribute("role", "alert");
        form.prepend(feedback);
      }
      feedback.textContent = error.message;
      feedback.scrollIntoView({ block: "center" });
      busy(form, false);
    }
    return;
  }
  event.preventDefault();
  if (form.dataset.busy === "true") return;
  const data = formObject(form),
    button = event.submitter;
  if (form.matches("[data-proof-upload]")) {
    const feedback = $(".upload-feedback", form);
    try {
      const file = $('input[type="file"]', form).files[0];
      validateImage(file);
      busy(form, true);
      feedback.textContent = "กำลังส่งหลักฐาน กรุณารอสักครู่...";
      data.image = await readFile(file);
      delete data.proof;
      const result = await request(form.action, data, {
        method: form.dataset.method || "POST",
      });
      feedback.textContent = result.message;
      location.assign(result.redirect);
    } catch (error) {
      feedback.textContent = error.message;
      toast(error.message, { error: true });
      busy(form, false);
    }
    return;
  }
  if (button) button.disabled = true;
  form.dataset.busy = "true";
  form.setAttribute("aria-busy", "true");
  try {
    const result = await request(form.action, data, {
      method: form.dataset.method || "POST",
    });
    if (form.matches("[data-add-cart]")) {
      updateCount("[data-cart-count]", result.count);
      toast(result.message, { cart: true });
    } else {
      for (const node of $$('[data-favorite="' + data.product_id + '"]')) {
        node.classList.toggle("is-saved", result.saved);
        node.setAttribute("aria-pressed", String(result.saved));
        const label = node.getAttribute("aria-label") || "";
        node.setAttribute(
          "aria-label",
          label.replace(
            /^(บันทึก|นำออกจาก)/,
            result.saved ? "นำออกจาก" : "บันทึก",
          ),
        );
      }
      updateCount("[data-favorite-count]", result.count);
      toast(result.message);
      if (location.pathname === "/favorites") location.reload();
    }
  } catch (error) {
    toast(error.message, { error: true });
  } finally {
    form.dataset.busy = "false";
    form.setAttribute("aria-busy", "false");
    if (button) button.disabled = false;
  }
});
document.addEventListener("change", (event) => {
  const input = event.target;
  if (input.matches("[data-auto-submit]")) input.form?.requestSubmit();
  if (input.matches("[data-role-permissions]")) {
    const form = input.form,
      orders = $('[data-permission="orders"]', form),
      accounts = $('[data-permission="accounts"]', form);
    if (orders) orders.checked = input.value !== "Editor";
    if (accounts) accounts.checked = input.value === "Owner";
  }
  if (input.matches('[data-proof-upload] input[type="file"]')) {
    const feedback = $(".upload-feedback", input.form);
    try {
      validateImage(input.files[0]);
      feedback.textContent = input.files[0].name + " · พร้อมส่งให้ร้าน";
    } catch (error) {
      feedback.textContent = error.message;
      input.value = "";
    }
  }
  if (input.matches('[data-checkout] input[name="gift_wrap"]'))
    updateCheckout(input.form);
  if (input.matches("[data-product-upload]"))
    void uploadProductImage(input, input.files[0]);
});
document.addEventListener("input", (event) => {
  const input = event.target,
    form = input.form;
  if (!form) return;
  if (input.name === "password" || input.name === "password_confirm") {
    const confirm = $('[name="password_confirm"]', form),
      password = $('[name="password"]', form);
    if (confirm && password)
      confirm.setCustomValidity(
        confirm.value === password.value ? "" : "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
      );
  }
  if (input.matches("[data-confirm-email]"))
    input.setCustomValidity(
      input.value.trim().toLowerCase() ===
        input.dataset.confirmEmail.toLowerCase()
        ? ""
        : "กรุณาพิมพ์อีเมลให้ตรงกับบัญชี",
    );
  if (input.name === "review_note") input.setCustomValidity("");
});
function updateCheckout(form) {
  const wrap = $('[name="gift_wrap"]', form).checked,
    fee = wrap ? Number(form.dataset.giftFee) : 0;
  const gift = $("[data-gift-total]", form),
    total = $("[data-checkout-total]", form);
  if (gift) gift.textContent = currency(fee / 100);
  if (total)
    total.textContent = currency(
      (Number(form.dataset.subtotal) + Number(form.dataset.shipping) + fee) /
        100,
    );
}
for (const form of $$("[data-checkout]")) updateCheckout(form);
async function uploadProductImage(input, file) {
  const form = input.form,
    status = $("[data-upload-status]", form),
    submit = $(".pdf-form-actions button", form);
  if (!file) return;
  try {
    validateImage(file);
    submit.disabled = true;
    status.textContent = "กำลังอัปโหลดรูปภาพ...";
    const result = await request("/api/admin/product-image", {
      image: await readFile(file),
      _csrf: $('[name="_csrf"]', form).value,
    });
    $('[name="image_url"]', form).value = result.url;
    $("[data-image-preview]", form).src = result.url;
    input.closest(".pdf-image-upload").classList.add("has-image");
    status.textContent = "อัปโหลดรูปภาพแล้ว กดบันทึกสินค้าเพื่อยืนยัน";
  } catch (error) {
    status.textContent = error.message;
    toast(error.message, { error: true });
  } finally {
    submit.disabled = false;
  }
}
for (const zone of $$(".pdf-image-upload")) {
  zone.addEventListener("dragover", (event) => event.preventDefault());
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    void uploadProductImage(
      $("[data-product-upload]", zone),
      event.dataTransfer.files[0],
    );
  });
}
const smallScreen = matchMedia("(max-width:760px)");
for (const panel of $$("[data-filter-panel]")) {
  panel.open = !smallScreen.matches;
  smallScreen.addEventListener("change", (event) => {
    panel.open = !event.matches;
  });
}
for (const toggle of $$("[data-menu-toggle]")) {
  const target = document.getElementById(toggle.getAttribute("aria-controls"));
  if (!target) continue;
  const admin = target.classList.contains("admin-side"),
    menuMedia = admin ? smallScreen : matchMedia("(max-width:950px)");
  let backdrop = null;
  function setOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "ปิดเมนู" : "เปิดเมนู");
    if (admin) {
      target.classList.toggle("is-open", open);
      target.inert = smallScreen.matches && !open;
      document.body.classList.toggle("menu-open", open);
      document.body.style.overflow = open ? "hidden" : "";
      if (open) {
        target.setAttribute("role", "dialog");
        target.setAttribute("aria-modal", "true");
        target.setAttribute("aria-label", "เมนูผู้ดูแลร้าน");
        backdrop = document.createElement("button");
        backdrop.className = "menu-backdrop";
        backdrop.setAttribute("aria-label", "ปิดเมนูผู้ดูแล");
        backdrop.addEventListener("click", () => setOpen(false));
        document.body.append(backdrop);
        $("a,button", target)?.focus();
      } else {
        target.removeAttribute("role");
        target.removeAttribute("aria-modal");
        backdrop?.remove();
        backdrop = null;
        toggle.focus();
      }
    } else target.hidden = !open;
  }
  if (admin) target.inert = smallScreen.matches;
  toggle.addEventListener("click", () =>
    setOpen(toggle.getAttribute("aria-expanded") !== "true"),
  );
  document.addEventListener("keydown", (event) => {
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      toggle.focus();
    }
    if (admin && event.key === "Tab") {
      const focusable = [
          toggle,
          ...$$("a[href],button:not([disabled])", target),
        ],
        first = focusable[0],
        last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  menuMedia.addEventListener("change", (event) => {
    if (admin) {
      if (toggle.getAttribute("aria-expanded") === "true") setOpen(false);
      target.inert = event.matches;
    } else if (!event.matches) setOpen(false);
  });
}
for (const image of $$(
  ".product-image img,.detail-image>img,.cart-photo img,.pdf-admin-product>a>img",
))
  image.addEventListener("error", () => {
    if (!image.src.endsWith("/images/product-placeholder.svg")) {
      image.src = "/images/product-placeholder.svg";
      image.classList.remove("pillow-photo", "pdf-pillow-image");
    }
  });

for (const search of $$(".header-search")) {
  search.addEventListener("toggle", () => {
    if (search.open) $("input", search)?.focus();
  });
  document.addEventListener("click", (event) => {
    if (search.open && !search.contains(event.target)) search.open = false;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && search.open) {
      search.open = false;
      $("summary", search)?.focus();
    }
  });
}
