// Render category management rows and product counts.
import { initPage } from "../common.js";
import {
  $,
  $$,
  bind,
  clone,
  replaceList,
  text,
  visible,
  empty,
} from "../shared/dom.js";
initPage(({ data, session }) => {
  const counts = $$(".category-overview > span > strong");
  counts[0].textContent = data.categories.length;
  counts[1].textContent = data.categories.reduce(
    (n, c) => n + Number(c.total),
    0,
  );
  if (!data.categories.length) {
    empty(
      '[data-list="categories"]',
      "เริ่มจัดหมวดหมู่ร้านของคุณ",
      "สร้างหมวดหมู่แรก แล้วเลือกหมวดนี้ตอนเพิ่มสินค้า",
      "/admin/category-new",
      "เพิ่มหมวดหมู่",
    );
    return;
  }
  replaceList('[data-list="categories"]', data.categories, (category) => {
    const node = clone("categories");
    node.dataset.categoryId = category.category_id;
    bind(node, { category, session });
    text(".category-order strong", category.sort_order, node);
    text(".category-info p a", category.total + " สินค้า", node);
    text(
      ".category-info p > span",
      " · แสดงหน้าร้าน " + category.visible + " ชิ้น",
      node,
    );
    visible(".category-info .status", !!category.is_custom, node);
    for (const a of $$(".category-actions a", node))
      a.href =
        "/admin/category-" +
        (a.href.includes("category-delete") ? "delete" : "edit") +
        "?id=" +
        category.category_id;
    return node;
  });
});
