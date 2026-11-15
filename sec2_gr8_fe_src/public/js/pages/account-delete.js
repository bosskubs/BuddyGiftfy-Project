// Display the administrator account and required confirmation before deletion.
import { initPage } from "../common.js";
import { $, $$, bind, fields } from "../shared/dom.js";
import { roleLabel } from "../shared/admin-forms.js";
initPage(({ data, session }) => {
  const account = data.account;
  bind($("main"), { account, session });
  const dd = $$("main dl dd");
  dd[0].textContent = account.first_name + " " + account.last_name;
  dd[1].textContent = account.email;
  dd[2].textContent = roleLabel(account.role);
  const form = $(".pdf-account-delete");
  form.action = "/api/admin/accounts/" + account.admin_id;
  const confirm = $('[name="confirm_email"]', form);
  confirm.dataset.confirmEmail = account.email;
  confirm.placeholder = "พิมพ์ " + account.email;
});
