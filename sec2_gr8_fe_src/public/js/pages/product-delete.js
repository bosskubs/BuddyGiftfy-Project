// Show the selected product and confirmation fields before deletion.
import { initPage } from "../common.js";
import { $, bind, text, visible } from "../shared/dom.js";
import { photo } from "../shared/products.js";
initPage(({ data, session }) => {
  const product = data.product;
  bind($("main"), { product, session });
  photo($(".category-form > img"), product);
  const remove = $('main form[data-method="DELETE"]'),
    hide = $("[data-product-hide]");
  remove.action = "/api/admin/products/" + product.product_id;
  hide.action = "/api/admin/products/" + product.product_id + "/hide";
  remove.hidden = data.history > 0;
  hide.hidden = !data.history;
  visible("[data-product-history]", data.history > 0);
  text(
    "[data-product-history]",
    "สินค้ามีประวัติคำสั่งซื้อ " +
      data.history +
      " รายการ จึงเก็บประวัติไว้และใช้การซ่อนแทน",
  );
});
