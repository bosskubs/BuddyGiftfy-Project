// Render the customer directory and preserve its search keyword.
import { initPage } from "../common.js";
import {
  $,
  $$,
  fields,
  bind,
  clone,
  replaceList,
  badge,
} from "../shared/dom.js";
initPage(({ data, session }) => {
  fields($(".admin-toolbar"), data.filters);
  replaceList('[data-list="customers"]', data.customers, (customer) => {
    const node = clone("customers");
    bind(node, { customer, session });
    badge($(".status", node), customer.status);
    return node;
  });
  if (!data.customers.length) {
    const row = clone("customers");
    row.replaceChildren();
    const cell = document.createElement("td");
    cell.colSpan = 3;
    cell.textContent = "ไม่พบลูกค้า";
    row.append(cell);
    $('[data-list="customers"]').append(row);
  }
});
