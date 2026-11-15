// Render product management results while preserving active search filters.
import { initPage } from "../common.js";
import {
  $,
  $$,
  fields,
  bind,
  clone,
  replaceList,
  text,
  empty,
} from "../shared/dom.js";
import { photo } from "../shared/products.js";
initPage(({ data, session }) => {
  fields($(".pdf-admin-products-top form"), data.filters);
  replaceList(
    '[data-list="admin-category-filter"]',
    [
      { name: "ทั้งหมด", value: "" },
      ...data.categories.map((c) => ({
        name: typeof c === "string" ? c : c.name,
        value: typeof c === "string" ? c : c.name,
      })),
    ],
    (c) => {
      const node = clone("admin-category-filter");
      const params = new URLSearchParams(data.filters);
      params.set("category", c.value);
      node.href = "/admin/products?" + params;
      node.textContent = c.name;
      node.classList.toggle("selected", c.value === data.filters.category);
      return node;
    },
  );
  if (!data.products.length) {
    empty(
      '[data-list="admin-products"]',
      "ไม่พบสินค้า",
      "ลองเปลี่ยนคำค้นหา หมวดหมู่ หรือสถานะ",
      null,
    );
    return;
  }
  replaceList('[data-list="admin-products"]', data.products, (product) => {
    const node = clone("admin-products");
    bind(node, { product, category: { name: product.category }, session });
    photo($("a > img", node), product);
    const ps = $$("p", node);
    ps[0].textContent =
      "฿ " +
      Number(product.price).toLocaleString("th-TH", {
        maximumFractionDigits: 2,
      });
    ps[1].textContent = "Stock: " + product.stock_quantity;
    const status = $(".pdf-stock", node);
    status.className =
      "pdf-stock " +
      (product.status === "Inactive" || !product.stock_quantity
        ? "out"
        : product.stock_quantity <= 7
          ? "low"
          : "");
    status.textContent =
      product.status === "Inactive"
        ? "ซ่อนสินค้า"
        : !product.stock_quantity
          ? "สินค้าหมด"
          : product.stock_quantity <= 7
            ? "สินค้าใกล้หมด"
            : "มีสินค้า";
    for (const a of $$("a", node))
      a.href =
        "/admin/product-" +
        (a.href.includes("product-delete") ? "delete" : "edit") +
        "?id=" +
        product.product_id;
    return node;
  });
});
