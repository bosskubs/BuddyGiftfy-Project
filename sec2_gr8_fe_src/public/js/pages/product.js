// Fill product details, purchase options, and related products.
import { initPage } from "../common.js";
import {
  $,
  bind,
  fields,
  text,
  visible,
  badge,
  wireForms,
} from "../shared/dom.js";
import { photo, productList, buttonLabel } from "../shared/products.js";
initPage(({ data, session }) => {
  const product = data.product;
  const root = $("main");
  bind(root, { product, category: { name: product.category }, session });
  fields(root, { product_id: product.product_id });
  photo($(".detail-image > img"), product, true);
  badge($(".detail-price .status"), product.status);
  const available =
    product.status === "Available" && product.stock_quantity > 0;
  const form = $(".purchase-form");
  const qty = $('[name="quantity"]', form);
  qty.max = Math.min(99, Math.max(1, product.stock_quantity));
  qty.value = 1;
  fields(form, { gift_wrap: session.preferGiftWrap });
  const add = $('button[type="submit"]', form);
  add.disabled = !available;
  buttonLabel(add, available ? "เพิ่มลงตะกร้า" : "หมดชั่วคราว");
  text(".stock-detail", "พร้อมส่ง " + product.stock_quantity + " ชิ้น");
  visible(".stock-detail", available);
  const note = $('[name="custom_note"]', form);
  note.closest(".field-group").hidden = !(
    product.category_is_custom ||
    /custom/i.test(product.name + product.description)
  );
  const favorite = $("[data-favorite]");
  const saved = (session.favorites || [])
    .map(Number)
    .includes(product.product_id);
  favorite.dataset.favorite = product.product_id;
  favorite.classList.toggle("is-saved", saved);
  favorite.setAttribute("aria-pressed", String(saved));
  favorite.setAttribute(
    "aria-label",
    (saved ? "นำออกจาก" : "บันทึก") + "ของขวัญที่ชอบ: " + product.name,
  );
  productList(".related-section .product-grid", data.related, session);
  visible(".related-section", data.related.length > 0);
});
