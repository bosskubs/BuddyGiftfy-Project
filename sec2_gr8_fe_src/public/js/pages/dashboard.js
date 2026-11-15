// Render store metrics, recent orders, and low-stock products.
import { initPage } from "../common.js";
import {
  $,
  $$,
  bind,
  clone,
  replaceList,
  text,
  visible,
  money,
  badge,
  empty,
} from "../shared/dom.js";
import { orderList } from "../shared/orders.js";
import { photo } from "../shared/products.js";
initPage(({ data, session }) => {
  bind($("main"), { session, account: session.admin });
  const config = session.settings;
  visible(
    ".setup-banner",
    !(
      config.bank_name &&
      config.bank_account_name &&
      config.bank_account_number
    ),
  );
  const values = [
    money(data.metrics.sales),
    data.metrics.pending,
    data.metrics.proofs,
    data.metrics.messages,
  ];
  $$(".metric-card strong").forEach((n, i) => (n.textContent = values[i]));
  orderList('[data-list="orders"]', data.orders, session);
  if (!data.lowStock.length) {
    empty(
      '[data-list="low-stock"]',
      "สต็อกพร้อมแล้ว",
      "ยังไม่มีสินค้าที่ต้องเติม",
      null,
    );
    return;
  }
  replaceList('[data-list="low-stock"]', data.lowStock, (product) => {
    const node = clone("low-stock");
    bind(node, { product, session });
    node.href = "/admin/product-edit?id=" + product.product_id;
    photo($("img", node), product);
    badge(
      $(".status", node),
      product.stock_quantity ? "Pending" : "Out of stock",
      "เหลือ " + product.stock_quantity,
    );
    return node;
  });
});
