// Prefill the contact form with customer details and an optional order reference.
import { initPage } from "../common.js";
import { $, fields } from "../shared/dom.js";
initPage(({ session, query }) => {
  const form = $('main form[method="post"]');
  fields(form, session.user || {});
  const number = query.get("order");
  if (number) $('[name="message"]', form).value = "คำสั่งซื้อ " + number + "\n";
});
