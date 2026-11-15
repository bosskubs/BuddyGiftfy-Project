// Share create/edit form initialization for products, administrators, and categories.
import { initPage, notice } from "../common.js";
import { $, $$, fields, bind, text, visible, wireForms } from "./dom.js";
import { photo } from "./products.js";
export const roleLabel = (role) =>
  ({
    Owner: "ผู้ดูแลระบบ (Admin)",
    Manager: "ผู้จัดการ (Manager)",
    Editor: "พนักงาน (Staff)",
  })[role] || role;
export function options(select, rows, value = "", placeholder) {
  const prototype =
    select.options[0]?.cloneNode(true) || document.createElement("option");
  const nodes = [];
  if (placeholder !== undefined) {
    const node = prototype.cloneNode(true);
    node.value = "";
    node.textContent = placeholder;
    nodes.push(node);
  }
  for (const row of rows) {
    const node = prototype.cloneNode(true);
    node.value = String(row.value);
    node.textContent = row.label;
    nodes.push(node);
  }
  select.replaceChildren(...nodes);
  select.value = String(value ?? "");
}
export function productFormPage(edit = false) {
  initPage(({ data, session }) => {
    const product = data.product || {},
      form = $(".pdf-product-form");
    bind(form, { product, session, category: { name: product.category } });
    fields(form, {
      name: "",
      description: "",
      price: "",
      stock_quantity: "",
      is_featured: false,
      status: "Available",
      ...product,
    });
    const categories = data.categories.map((c) => ({
      value: typeof c === "string" ? c : c.name,
      label: typeof c === "string" ? c : c.name,
    }));
    options(
      $('[name="category"]', form),
      categories,
      product.category || "",
      "เลือกหมวดหมู่",
    );
    form.action = edit
      ? "/api/admin/products/" + product.product_id
      : "/api/admin/products";
    form.dataset.method = edit ? "PUT" : "POST";
    const preview = $("[data-image-preview]", form);
    photo(preview, product);
    $('[name="image_url"]', form).value =
      product.image_url || "/images/product-placeholder.svg";
    $(".pdf-image-upload", form).classList.toggle(
      "has-image",
      !!product.product_id,
    );
    if (!categories.length) {
      notice("กรุณาเพิ่มหมวดหมู่ก่อนเพิ่มสินค้า");
      $(".pdf-form-actions button", form).disabled = true;
    }
  });
}
export function accountFormPage(edit = false) {
  initPage(({ data, session }) => {
    const account = data.account || {},
      form = $(".pdf-account-form");
    bind(form, { account, session });
    fields(form, {
      first_name: "",
      last_name: "",
      email: "",
      role: "Editor",
      age: "",
      address: "",
      preferences: "",
      status: "Active",
      ...account,
    });
    form.action = edit
      ? "/api/admin/accounts/" + account.admin_id
      : "/api/admin/accounts";
    form.dataset.method = edit ? "PUT" : "POST";
    const role = $('[name="role"]', form).value;
    for (const input of $$("[data-permission]", form))
      input.checked =
        input.dataset.permission === "orders"
          ? role !== "Editor"
          : role === "Owner";
  });
}
export function categoryFormPage(edit = false) {
  initPage(({ data, session }) => {
    const category = data.category || {},
      form = $('main form[method="post"]');
    bind(form, { category, session });
    fields(form, { name: "", sort_order: 0, is_custom: 0, ...category });
    form.action = edit
      ? "/api/admin/categories/" + category.category_id + "/edit"
      : "/api/admin/categories/new";
    form.dataset.method = "POST";
  });
}
