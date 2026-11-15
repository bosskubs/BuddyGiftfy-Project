// Share order search and result rendering between order and payment pages.
import { initPage } from "../common.js";
import { $, fields } from "./dom.js";
import { orderList } from "./orders.js";
export function ordersPage() {
  initPage(({ data, session }) => {
    fields($(".admin-toolbar"), data.filters);
    orderList('[data-list="orders"]', data.orders, session);
  });
}
