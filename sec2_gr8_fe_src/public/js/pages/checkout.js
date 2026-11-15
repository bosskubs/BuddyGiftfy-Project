// Fill shipping details and render the server-calculated order summary.
import { initPage } from "../common.js";
import {
  $,
  $$,
  bind,
  fields,
  clone,
  replaceList,
  text,
  visible,
  wireForms,
  money,
} from "../shared/dom.js";
import { photo } from "../shared/products.js";
initPage(({ data, session }) => {
  const form = $("[data-checkout]"),
    draft = session.checkoutDraft || {},
    customer = data.customer,
    config = session.settings;
  const wrap =
    draft.gift_wrap === "1" ||
    (!Object.keys(draft).length && session.preferGiftWrap);
  fields(form, {
    shipping_name:
      draft.shipping_name ?? customer.first_name + " " + customer.last_name,
    shipping_phone: draft.shipping_phone ?? customer.phone ?? "",
    shipping_address: draft.shipping_address ?? customer.address ?? "",
    gift_wrap: wrap,
    gift_message: draft.gift_message || "",
    save_address: draft.save_address === "1",
    checkout_token: session.checkoutToken,
  });
  form.dataset.subtotal = data.totals.subtotal;
  form.dataset.shipping = data.totals.shipping;
  form.dataset.giftFee = Math.round(Number(config.gift_wrap_fee) * 100);
  replaceList('[data-list="checkout-items"]', data.items, (line) => {
    const node = clone("checkout-items");
    bind(node, {
      product: line.p,
      line: { total: Number(line.p.price) * line.quantity },
      session,
    });
    photo($("img", node), line.p);
    text(
      "small",
      "จำนวน " +
        line.quantity +
        (line.customNote ? " · มีรายละเอียดสั่งทำ" : ""),
      node,
    );
    return node;
  });
  const amounts = $$(".order-summary .summary-line strong");
  amounts[0].textContent = money(data.totals.subtotal / 100);
  amounts[1].textContent = data.totals.shipping
    ? money(data.totals.shipping / 100)
    : "ฟรี";
  text("[data-gift-total]", money(wrap ? config.gift_wrap_fee : 0));
  text(
    "[data-checkout-total]",
    money(
      (data.totals.subtotal + data.totals.shipping) / 100 +
        (wrap ? Number(config.gift_wrap_fee) : 0),
    ),
  );
  text(
    ".gift-panel .choice-card small",
    "เพิ่ม " + money(config.gift_wrap_fee) + " ต่อคำสั่งซื้อ",
  );
  text(
    ".order-summary > p.small",
    "ร้านจะสำรองสินค้าให้ " +
      config.payment_window_hours +
      " ชั่วโมง ระหว่างรอชำระเงิน",
  );
  const ready = !!(
    config.bank_name &&
    config.bank_account_name &&
    config.bank_account_number
  );
  visible("[data-checkout-unready]", !ready);
  $('button[type="submit"]', form).disabled = !ready;
});
