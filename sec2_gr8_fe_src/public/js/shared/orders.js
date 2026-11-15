// Render order details and show actions allowed by the current order state.
import {
  $,
  $$,
  bind,
  clone,
  replaceList,
  text,
  badge,
  empty,
  wireForms,
  money,
  date,
  visible,
  fields,
} from "./dom.js";
export function orderList(container, orders, session) {
  if (!orders.length) {
    empty(container, "ยังไม่มีคำสั่งซื้อ", "คำสั่งซื้อใหม่จะแสดงที่นี่", null);
    return;
  }
  replaceList(container, orders, (order) => {
    const node = clone("orders");
    bind(node, {
      order,
      customer: {
        first_name: order.first_name || "",
        last_name: order.last_name || "",
      },
      session,
    });
    node.href = "/admin/order?id=" + order.order_id;
    badge(
      $(".status", node),
      order.status,
      order.has_proof && order.payment_status === "Pending" ? "รอตรวจสลิป" : "",
    );
    return node;
  });
}
export function fillOrderPage(data, session, admin = false) {
  const { order, items } = data,
    payment = data.payment || {},
    config = session.settings,
    root = $("main");
  bind(root, { order, payment, session });
  const paid = payment.payment_status === "Completed",
    submitted = !!payment.proof_path,
    cancelled = order.status === "Cancelled",
    reviewing = submitted && payment.payment_status === "Pending";
  const heading = cancelled
    ? "คำสั่งซื้อถูกยกเลิกแล้ว"
    : reviewing
      ? "ได้รับสลิปแล้ว กำลังรอร้านตรวจสอบ"
      : paid
        ? "ร้านได้รับยอดชำระแล้ว"
        : payment.payment_status === "Failed"
          ? "กรุณาตรวจสอบหลักฐานการชำระเงิน"
          : "เหลืออีกนิดเดียว ของขวัญก็พร้อมเดินทาง";
  text(".order-status-banner h2", heading);
  text(
    ".order-status-banner p",
    cancelled
      ? "สินค้าที่สำรองไว้ถูกคืนเข้าคลังแล้ว"
      : reviewing
        ? "คุณสามารถติดตามผลการตรวจสอบได้ในหน้านี้"
        : paid
          ? "ติดตามความคืบหน้าและหมายเลขพัสดุได้ด้านล่าง"
          : "โอนเงินตามยอดที่ระบุ แล้วแนบสลิปเพื่อให้ร้านตรวจสอบ",
  );
  badge(
    $(".order-status-banner .status"),
    order.status,
    reviewing ? "รอตรวจสอบสลิป" : "",
  );
  const icon = clone(
    "icon-" +
      (cancelled ? "info" : paid ? "check" : reviewing ? "clock" : "gift"),
  );
  $(".order-status-banner > .icon")?.replaceWith(icon);
  const steps = ["Pending", "Confirmed", "Preparing", "Shipped", "Completed"],
    current = steps.indexOf(order.status);
  visible(".order-timeline", !cancelled);
  for (const [index, li] of $$(".order-timeline li").entries()) {
    li.classList.toggle("reached", index <= current);
    li.removeAttribute("aria-current");
    if (index === current) li.setAttribute("aria-current", "step");
    const number = $("span", li);
    number.replaceChildren(
      index < current
        ? clone("icon-check")
        : document.createTextNode(String(index + 1)),
    );
  }
  replaceList('[data-list="order-items"]', items, (item) => {
    const node = clone("order-items");
    bind(node, { item, order, session });
    text("small", money(item.unit_price) + " × " + item.quantity, node);
    visible(".custom-note", !!item.custom_note, node);
    return node;
  });
  const totals = $$(
    ".order-detail-grid > div > section:first-child .summary-line strong",
  );
  [order.subtotal, order.shipping_fee, order.gift_wrap_fee].forEach(
    (value, index) => {
      totals[index].textContent =
        index === 1 && !Number(value) ? "ฟรี" : money(value);
    },
  );
  text(".order-detail-grid .summary-total strong", money(order.total_price));
  const labels = $$(
    ".order-detail-grid > div > section:first-child .summary-line > span",
  );
  labels[2].textContent =
    "ห่อของขวัญ" + (order.gift_wrap ? " · เลือกไว้แล้ว" : "");
  visible(".gift-message", !!order.gift_message);
  visible(".tracking-box", !!order.tracking_number);
  visible("[data-payment-paid]", paid);
  visible("[data-payment-cancelled]", cancelled);
  visible(".bank-details", !paid && !cancelled);
  visible(
    "[data-payment-deadline]",
    !!payment.deadline && !submitted && !paid && !cancelled,
  );
  text("[data-payment-deadline]", "กรุณาชำระภายใน " + date(payment.deadline));
  const review = $("[data-review-note]");
  if (review) {
    review.hidden = !payment.review_note;
    review.classList.toggle(
      "notice-error",
      payment.payment_status === "Failed",
    );
    text("p", payment.review_note || "", review);
  }
  const proof = $(".proof-preview");
  proof.hidden = !submitted;
  if (submitted) {
    proof.href = "/payment-proof/" + payment.payment_id;
    const image = $("img", proof);
    image.src = proof.href;
    image.alt = "หลักฐานการชำระเงินคำสั่งซื้อ " + order.order_number;
    text(
      "span",
      "เปิดดูหลักฐาน" +
        (payment.submitted_at ? " · " + date(payment.submitted_at) : ""),
      proof,
    );
  }
  const upload = $("[data-proof-upload]");
  if (upload) {
    upload.hidden = paid || cancelled;
    upload.action =
      "/api/order/" + encodeURIComponent(order.order_number) + "/proof";
    text(
      ".slip-upload strong",
      submitted ? "ส่งหลักฐานฉบับใหม่" : "แนบสลิปการโอนเงิน",
      upload,
    );
  }
  const reviewForm = $(".review-form");
  if (reviewForm) {
    reviewForm.hidden = paid || cancelled || !submitted;
    reviewForm.action = "/api/admin/orders/" + order.order_id + "/review";
  }
  const cancel = $(".cancel-order");
  cancel.hidden = cancelled || paid || (!admin && order.status !== "Pending");
  cancel.action = admin
    ? "/api/admin/orders/" + order.order_id + "/cancel"
    : "/api/order/" + encodeURIComponent(order.order_number) + "/cancel";
  if (admin && paid && !cancelled) {
    const section = clone("fulfillment-template"),
      form = $("form", section);
    const next = {
      Confirmed: "Preparing",
      Preparing: "Shipped",
      Shipped: "Completed",
    }[order.status];
    form.action = "/api/admin/orders/" + order.order_id + "/status";
    fields(form, {
      status: next || "",
      carrier: order.shipping_carrier || "",
      tracking: order.tracking_number || "",
    });
    form.hidden = !next;
    visible("[data-fulfillment-done]", !next, section);
    for (const input of $$("[name=carrier],[name=tracking]", form)) {
      input.disabled = order.status !== "Preparing";
      input.closest(".field-group").hidden = order.status !== "Preparing";
    }
    const button = $("button", form);
    button.textContent =
      {
        Confirmed: "เริ่มเตรียมสินค้า",
        Preparing: "ยืนยันจัดส่งสินค้า",
        Shipped: "ปิดคำสั่งซื้อสำเร็จ",
      }[order.status] || "เสร็จสิ้น";
    wireForms(section, session);
    $(".order-detail-grid > div").append(section);
  }
  const help = $(".order-help");
  if (help)
    help.href = "/contact?order=" + encodeURIComponent(order.order_number);
}
