// Display category deletion details and available product transfer destinations.
import { initPage } from "../common.js";
import { $, bind, text, visible } from "../shared/dom.js";
import { options } from "../shared/admin-forms.js";
import { buttonLabel } from "../shared/products.js";
initPage(({ data, session }) => {
  const category = data.category,
    others = data.categories.filter(
      (c) => c.category_id !== category.category_id,
    ),
    used = Number(category.total) > 0;
  bind($("main"), { category, session });
  const form = $('main form[method="post"]');
  form.action = "/api/admin/categories/" + category.category_id + "/delete";
  text("form > p", "มีสินค้า " + category.total + " ชิ้น รวมสินค้าที่ซ่อนอยู่");
  visible(".notice-warning", used);
  const select = $('[name="destination_id"]');
  options(
    select,
    others.map((c) => ({ value: c.category_id, label: c.name })),
    data.destination || "",
    "เลือกหมวดหมู่ปลายทาง",
  );
  select.required = used;
  const submit = $('button[type="submit"]', form);
  submit.disabled = used && !others.length;
  buttonLabel(submit, used ? "ย้ายสินค้าและลบหมวดหมู่" : "ยืนยันลบหมวดหมู่");
});
