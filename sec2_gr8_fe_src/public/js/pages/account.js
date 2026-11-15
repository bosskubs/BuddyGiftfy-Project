// Render the customer account summary and recent orders.
import { initPage } from "../common.js";
import {
  $,
  bind,
  clone,
  replaceList,
  text,
  wireForms,
  badge,
  empty,
} from "../shared/dom.js";
initPage(({ data, session }) => {
  bind($("main"), { customer: data.customer, session });
  text(".account-welcome .avatar", data.customer.first_name.slice(0, 1));
  text(
    ".account-orders .section-heading > span",
    data.orders.length + " รายการล่าสุด",
  );
  if (data.orders.length)
    replaceList('[data-list="account-orders"]', data.orders, (order) => {
      const node = clone("account-orders");
      bind(node, { order, session });
      badge($(".status", node), order.status);
      text(".muted.small", (order.item_count || 0) + " รายการ", node);
      return node;
    });
  else
    empty(
      '[data-list="account-orders"]',
      "ของขวัญชิ้นแรกกำลังรอคุณอยู่",
      "เมื่อสั่งซื้อแล้ว คุณจะติดตามรายการทั้งหมดได้ที่นี่",
    );
});
