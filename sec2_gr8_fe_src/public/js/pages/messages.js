// Render customer messages and prepare their status update forms.
import { initPage } from "../common.js";
import {
  $,
  fields,
  bind,
  clone,
  replaceList,
  text,
  badge,
  empty,
  wireForms,
} from "../shared/dom.js";
initPage(({ data, session }) => {
  if (!data.messages.length) {
    empty(
      '[data-list="messages"]',
      "ยังไม่มีข้อความ",
      "เมื่อมีลูกค้าติดต่อ ข้อความจะแสดงที่นี่",
      null,
    );
    return;
  }
  replaceList('[data-list="messages"]', data.messages, (message) => {
    const node = clone("messages");
    bind(node, {
      customer: message,
      message,
      order: { created_at: message.created_at },
      session,
    });
    badge(
      $(".status", node),
      message.status,
      { New: "ข้อความใหม่", Read: "อ่านแล้ว", Resolved: "ดูแลแล้ว" }[
        message.status
      ],
    );
    const form = $("form", node);
    form.action = "/api/admin/messages/" + message.message_id + "/status";
    fields(form, { status: message.status });
    const select = $("select", form);
    select.id = "message-" + message.message_id;
    $("label", form).htmlFor = select.id;
    wireForms(node, session);
    return node;
  });
});
