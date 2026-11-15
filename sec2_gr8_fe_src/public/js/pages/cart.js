// Render cart items, quantities, and totals returned by the store API.
import { initPage } from "../common.js";
import {
  $,
  $$,
  bind,
  fields,
  clone,
  replaceList,
  text,
  visible,
  wireForms,
  money,
  empty,
} from "../shared/dom.js";
import { photo } from "../shared/products.js";
initPage(({ data, session }) => {
  text(".page-title p", data.items.length + " รายการที่คุณเลือกไว้");
  replaceList('[data-list="cart-items"]', data.items, (line) => {
    const node = clone("cart-items"),
      product = line.p;
    bind(node, {
      product,
      category: { name: product.category },
      item: { custom_note: line.customNote },
      line: { total: Number(product.price) * line.quantity },
      session,
    });
    photo($("img", node), product);
    fields(node, { product_id: product.product_id, quantity: line.quantity });
    const quantity = $('[name="quantity"]', node);
    quantity.max = Math.min(99, Math.max(1, product.stock_quantity));
    visible(".custom-note", !!line.customNote, node);
    const error = $("[data-cart-line-error]", node);
    if (error) {
      error.hidden = line.available;
      error.textContent =
        product.status !== "Available"
          ? "สินค้าไม่พร้อมจำหน่าย"
          : "เหลือสินค้า " + product.stock_quantity + " ชิ้น กรุณาปรับจำนวน";
    }
    wireForms(node, session);
    return node;
  });
  const amounts = $$(".order-summary .summary-line strong");
  if (amounts[0]) amounts[0].textContent = money(data.totals.subtotal / 100);
  if (amounts[1])
    amounts[1].textContent = data.totals.shipping
      ? money(data.totals.shipping / 100)
      : "ฟรี";
  text(".order-summary .summary-total strong", money(data.totals.total / 100));
  const valid = data.items.length && data.items.every((l) => l.available);
  visible('.order-summary a[href="/checkout"]', valid);
  visible("[data-cart-unavailable]", data.items.length && !valid);
  if (!data.items.length) {
    visible(".cart-layout", false);
    const host = $("[data-cart-empty]");
    host.hidden = false;
    empty(
      host,
      "ตะกร้ายังว่างอยู่เลย",
      "มีคนที่อยากส่งความรู้สึกดี ๆ ให้หรือยัง?",
      "/shop",
      "ไปเลือกของขวัญ",
    );
  }
});
