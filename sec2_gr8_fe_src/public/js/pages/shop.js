// Render catalog results, category choices, and pagination from the active filters.
import { initPage } from "../common.js";
import { $, $$, fields, clone, replaceList, text } from "../shared/dom.js";
import { productList } from "../shared/products.js";
initPage(({ data, session }) => {
  const filters = data.filters;
  const categories = [
    { category: "", name: "ของขวัญทั้งหมด" },
    ...data.categories.map((c) => ({
      category: c.category || c.name,
      name: c.category || c.name,
    })),
  ];
  const fieldset = $('[data-list="category-filter"]');
  const legend = fieldset.querySelector("legend");
  const choices = categories.map((c) => {
    const node = clone("category-filter");
    const input = $("input", node);
    input.value = c.category;
    input.checked = c.category === filters.category;
    text("span", c.name, node);
    return node;
  });
  fieldset.replaceChildren(legend, ...choices);
  // A fieldset legend stays outside repeated labels in the HTML.
  if (!fieldset.querySelector("legend")) {
    const legend = document.createElement("legend");
    legend.textContent = "หมวดหมู่";
    fieldset.prepend(legend);
  }
  for (const form of $$("main form")) {
    fields(form, filters);
    form.action = "/shop";
    for (const name of ["custom", "stock"])
      if (!form.querySelector('[name="' + name + '"]') && filters[name]) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = "1";
        form.append(input);
      }
  }
  const count = ["category", "min", "max", "custom", "stock"].filter(
    (k) => filters[k],
  ).length;
  text("[data-filter-count]", count ? "มีตัวกรอง" : "");
  text(".results-toolbar > span > strong", data.pagination.total);
  productList('[data-list="products"]', data.products, session);
  const nav = $("[data-pagination]");
  nav.hidden = data.pagination.pages <= 1;
  nav.replaceChildren();
  const link = (label, page, current = false, aria) => {
    const node = clone("pagination-link-template");
    const params = new URLSearchParams(location.search);
    params.set("page", page);
    node.href = "/shop?" + params;
    node.textContent = label;
    if (current) node.setAttribute("aria-current", "page");
    if (aria) node.setAttribute("aria-label", aria);
    nav.append(node);
  };
  if (data.pagination.page > 1)
    link("‹", data.pagination.page - 1, false, "หน้าก่อนหน้า");
  for (let n = 1; n <= data.pagination.pages; n++)
    if (
      n === 1 ||
      n === data.pagination.pages ||
      Math.abs(n - data.pagination.page) <= 1
    )
      link(n, n, n === data.pagination.page);
  if (data.pagination.page < data.pagination.pages)
    link("›", data.pagination.page + 1, false, "หน้าถัดไป");
});
