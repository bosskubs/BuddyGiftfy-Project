// Render product cards, and purchase controls from API data.
import {
  $,
  $$,
  bind,
  fields,
  clone,
  replaceList,
  empty,
  wireForms,
  text,
  visible,
  money,
  badge,
} from "./dom.js";
import { imageSource, imageSet } from "./image-assets.js";
export function photo(img, product, eager = false) {
  if (!img) return;
  img.src = imageSource(product.image_url || "/images/product-placeholder.svg");
  const set = imageSet(product.image_url);
  if (set) {
    img.srcset = set;
    img.sizes = eager
      ? "(max-width:760px) 100vw, 50vw"
      : "(max-width:480px) 46vw, 30vw";
  } else img.removeAttribute("srcset");
  img.alt = product.name || "ภาพสินค้า";
  img.classList.toggle("pillow-photo", product.slug === "custom-face-pillow");
  if (img.closest(".pdf-admin-product"))
    img.classList.toggle(
      "pdf-pillow-image",
      product.slug === "custom-face-pillow",
    );
  img.loading = eager ? "eager" : "lazy";
}
export function buttonLabel(button, value) {
  if (!button) return;
  const last = button.lastChild;
  if (last?.nodeType === Node.TEXT_NODE) last.textContent = value;
  else {
    const span = document.createElement("span");
    span.textContent = value;
    button.append(span);
  }
}
export function productCard(product, session) {
  const node = clone("product-card-template");
  bind(node, { product, category: { name: product.category }, session });
  photo($("img", node), product);
  fields(node, { product_id: product.product_id });
  const available =
    product.status === "Available" && product.stock_quantity > 0;
  visible(".product-tag", !!product.is_featured, node);
  const stock = $(".stock-label", node);
  stock.textContent = available ? "พร้อมส่ง" : "หมดชั่วคราว";
  stock.classList.toggle("sold-out", !available);
  const add = $(".product-add", node);
  add.disabled = !available;
  buttonLabel(add, available ? "เพิ่มลงตะกร้า" : "สินค้าหมด");
  const favorite = $("[data-favorite]", node);
  const saved = (session.favorites || [])
    .map(Number)
    .includes(Number(product.product_id));
  favorite.dataset.favorite = product.product_id;
  favorite.classList.toggle("is-saved", saved);
  favorite.setAttribute("aria-pressed", String(saved));
  favorite.setAttribute(
    "aria-label",
    (saved ? "นำออกจาก" : "บันทึก") + "ของขวัญที่ชอบ: " + product.name,
  );
  wireForms(node, session);
  return node;
}
export function productList(container, products, session) {
  if (products.length)
    replaceList(container, products, (p) => productCard(p, session));
  else
    empty(
      container,
      "ยังไม่เจอชิ้นที่ตรงใจ",
      "ลองเปลี่ยนคำค้นหา ขยายงบประมาณ หรือล้างตัวกรอง",
    );
}
