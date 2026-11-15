// Populate administrator search filters and account rows from API data.
import { initPage } from "../common.js";
import {
  $,
  $$,
  fields,
  bind,
  clone,
  replaceList,
  text,
} from "../shared/dom.js";
import { roleLabel } from "../shared/admin-forms.js";
initPage(({ data, session }) => {
  fields($(".pdf-account-filters"), data.filters);
  replaceList('[data-list="accounts"]', data.accounts, (account) => {
    const node = clone("accounts");
    const cells = $$("td", node);
    cells[0].textContent = account.first_name + " " + account.last_name;
    cells[1].textContent = account.email;
    cells[2].textContent = roleLabel(account.role);
    const status = $(".pdf-account-status", node);
    status.textContent = {
      Active: "ใช้งาน",
      Inactive: "ปิดใช้งาน",
      Suspended: "ระงับ",
    }[account.status];
    status.classList.toggle("inactive", account.status !== "Active");
    for (const a of $$("a", node))
      a.href =
        "/admin/account-" +
        (a.href.includes("account-delete") ? "delete" : "edit") +
        "?id=" +
        account.admin_id;
    return node;
  });
  text(
    ".pdf-account-count",
    "แสดง " +
      data.accounts.length +
      " บัญชี จากทั้งหมด " +
      data.accounts.length +
      " บัญชี",
  );
  if (!data.accounts.length) {
    const row = clone("accounts");
    row.replaceChildren();
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "ไม่พบบัญชี";
    row.append(td);
    $('[data-list="accounts"]').append(row);
  }
});
