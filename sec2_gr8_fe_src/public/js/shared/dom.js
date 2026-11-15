// Small DOM helpers: page markup and repeated-row templates live in .html files.
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [
  ...root.querySelectorAll(selector),
];
export const money = (value) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
export const date = (value) => {
  if (!value) return "—";
  const d = new Date(
    typeof value === "string" && !/[Z+]\d*$/.test(value)
      ? value.replace(" ", "T") + "Z"
      : value,
  );
  return Number.isNaN(d.valueOf())
    ? "—"
    : new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Bangkok",
      }).format(d);
};
export function text(selector, value, root = document) {
  const node = $(selector, root);
  if (node) node.textContent = value ?? "";
  return node;
}
export function visible(selector, show, root = document) {
  for (const node of $$(selector, root)) node.hidden = !show;
}
export function fields(root, values = {}) {
  for (const input of $$("input[name],select[name],textarea[name]", root)) {
    if (!Object.hasOwn(values, input.name)) continue;
    const value = values[input.name];
    if (input.type === "checkbox") input.checked = !!value && value !== "0";
    else if (input.type === "radio")
      input.checked = String(input.value) === String(value);
    else if (input.type !== "file") input.value = value ?? "";
  }
}
// Clone inert HTML template content instead of building page markup in JavaScript.
export function clone(id) {
  const source = document.getElementById(id);
  if (!(source instanceof HTMLTemplateElement))
    throw Error("ไม่พบโครงรายการ " + id);
  return source.content.firstElementChild.cloneNode(true);
}
export function replaceList(container, items, render) {
  const root = typeof container === "string" ? $(container) : container;
  if (!root) return;
  root.replaceChildren(...items.map(render));
}
const readPath = (object, path) =>
  path.split(".").reduce((v, k) => v?.[k], object);
function format(expression, data) {
  const [path, type] = expression.split("|");
  const value = readPath(data, path);
  if (type === "money") return money(value);
  if (type === "cents") return money(Number(value || 0) / 100);
  if (type === "date") return date(value);
  return value ?? "";
}
export function bind(root, data) {
  for (const node of $$("[data-bind]", root))
    node.textContent = format(node.dataset.bind, data);
  for (const node of [root, ...$$("*", root)])
    for (const attr of [...(node.attributes || [])])
      if (attr.name.startsWith("data-bind-")) {
        const name = attr.name.slice(10);
        let value = attr.value.replace(/\{\{([^}]+)\}\}/g, (_, expression) => {
          const result = String(format(expression, data));
          return ["href", "action"].includes(name)
            ? encodeURIComponent(result)
            : result;
        });
        if (
          name === "href" &&
          value &&
          !/^(?:\/|#|https?:|mailto:|tel:)/.test(value)
        )
          value = "#";
        node.setAttribute(name, value);
        if (name === "value" && "value" in node) node.value = value;
      }
}
// Refresh CSRF fields on existing forms and on rows added by a page controller.
export function wireForms(root, session) {
  for (const input of $$('input[name="_csrf"]', root))
    input.value = session.csrf || "";
  for (const button of $$("[data-session-lock]", root)) {
    button.disabled = false;
    delete button.dataset.sessionLock;
  }
}
export function empty(
  container,
  heading = "ยังไม่มีรายการ",
  detail = "ลองเปลี่ยนเกณฑ์ค้นหาหรือกลับมาใหม่",
  href = "/shop",
  label = "เลือกของขวัญ",
) {
  const node = clone("empty-state-template");
  text("h2", heading, node);
  text("p", detail, node);
  const link = $("a", node);
  if (link) {
    link.href = href || "#";
    link.textContent = label;
    link.hidden = !href;
  }
  const target = typeof container === "string" ? $(container) : container;
  target?.replaceChildren(node);
  return node;
}
export const statusLabels = {
  Pending: "รอชำระเงิน",
  Confirmed: "ชำระเงินแล้ว",
  Preparing: "กำลังเตรียมสินค้า",
  Shipped: "จัดส่งแล้ว",
  Completed: "สำเร็จ",
  Cancelled: "ยกเลิก",
  Failed: "ต้องแก้ไข",
  Available: "พร้อมขาย",
  "Out of stock": "หมด",
  Inactive: "ซ่อน",
  Active: "ใช้งาน",
  Suspended: "ระงับ",
};
export function badge(node, status, label) {
  if (!node) return;
  node.className =
    "status status-" + String(status).toLowerCase().replaceAll(" ", "-");
  node.textContent = label || statusLabels[status] || status;
}
