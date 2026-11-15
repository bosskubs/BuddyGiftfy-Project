// Populate profile and password forms for the current customer or administrator.
import { initPage } from "../common.js";
import { $, bind, fields } from "./dom.js";
export function profilePage(admin = false) {
  initPage(({ data, session }) => {
    const user = admin ? data.account : data.customer;
    bind($("main"), { customer: user, account: user, session });
    fields($(".profile-grid form"), user);
  });
}
