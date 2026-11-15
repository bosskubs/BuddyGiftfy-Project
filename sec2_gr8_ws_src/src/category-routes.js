// Handle category management, including product reassignment before deletion.
import {
  listCategories,
  categoryCounts,
  saveCategory,
  deleteCategory,
} from "./categories.js";
import {
  categoriesPage,
  categoryForm,
  categoryDelete,
} from "./view-data.js";
import { problem } from "./commerce.js";
import { saveSession } from "./security.js";

// Create examples: POST /api/admin/categories/new {name:'Birthday',sort_order:1,_csrf:token}
// and {name:'Anniversary',sort_order:2,is_custom:'1',_csrf:token}.
// Update examples: POST /api/admin/categories/1/edit {name:'Birthday gifts',sort_order:1,_csrf:token}
// and /api/admin/categories/2/edit {name:'Custom gifts',sort_order:2,is_custom:'1',_csrf:token}.
// Delete examples: POST /api/admin/categories/1/delete {_csrf:token,destination_id:2}
// and /api/admin/categories/3/delete {_csrf:token} for an empty category.
export async function handleCategories(req, res, url, session, ctx, admin) {
  const p = url.pathname;
  if (!p.startsWith("/admin/categories")) return false;
  if (!["Owner", "Manager"].includes(admin.role))
    throw problem(403, "เฉพาะเจ้าของร้านหรือผู้จัดการที่จัดการหมวดหมู่ได้");
  const get = req.method === "GET",
    post = req.method === "POST",
    creating = p === "/admin/categories/new",
    edit = p.match(/^\/admin\/categories\/(\d+)\/edit$/),
    remove = p.match(/^\/admin\/categories\/(\d+)\/delete$/);
  const show = (name, body, status = 200) =>
    ctx.render(res, session, name, body, { admin: true, status });
  // SERVICE-EXAMPLES-BEGIN category-list
  // Read categories; Access: Owner/Manager
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/categories
  // 2. method: GET; URL: {{baseUrl}}/api/admin/categories
  // SERVICE-EXAMPLES-END category-list
  if (get && p === "/admin/categories") {
    await show("หมวดหมู่", categoriesPage(await categoryCounts(), session));
    return true;
  }
  // SERVICE-EXAMPLES-BEGIN category-insert
  // Create a category; Access: Owner/Manager
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/admin/categories/new
  // body: raw JSON {"_csrf":"{{csrf}}","name":"Birthday","sort_order":"1","is_custom":"0"}
  // 2. method: POST; URL: {{baseUrl}}/api/admin/categories/new
  // body: raw JSON {"_csrf":"{{csrf}}","name":"Anniversary","sort_order":"2","is_custom":"1"}
  // SERVICE-EXAMPLES-END category-insert
  // SERVICE-EXAMPLES-BEGIN category-update
  // Update a category; Access: Owner/Manager
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/admin/categories/{{id}}/edit
  // body: raw JSON {"_csrf":"{{csrf}}","name":"Birthday gifts","sort_order":"3","is_custom":"0"}
  // 2. method: POST; URL: {{baseUrl}}/api/admin/categories/{{id}}/edit
  // body: raw JSON {"_csrf":"{{csrf}}","name":"Custom gifts","sort_order":"4","is_custom":"1"}
  // SERVICE-EXAMPLES-END category-update
  if ((get || post) && (creating || edit)) {
    const id = edit ? Number(edit[1]) : null;
    let category = {};
    if (id) {
      category = (await listCategories()).find(
        (c) => Number(c.category_id) === id,
      );
      if (!category) throw problem(404, "ไม่พบหมวดหมู่นี้ อาจถูกลบไปแล้ว");
    }
    if (get) {
      await show("หมวดหมู่", categoryForm(session, category));
      return true;
    }
    try {
      const saved = await saveCategory(id, req.body);
      await ctx.logAction(
        session,
        req,
        id ? "category.updated" : "category.created",
        saved.name,
      );
    } catch (error) {
      if (![400, 409].includes(error.status)) throw error;
      await show(
        "ตรวจสอบหมวดหมู่",
        categoryForm(
          session,
          {
            ...category,
            name: String(req.body.name || ""),
            sort_order: req.body.sort_order,
            is_custom: req.body.is_custom === "1",
          },
          error.message,
        ),
        error.status,
      );
      return true;
    }
    ctx.setFlash(
      session,
      "success",
      id
        ? "บันทึกหมวดหมู่และอัปเดตสินค้าแล้ว"
        : "เพิ่มหมวดหมู่แล้ว เลือกใช้ในสินค้าได้ทันที",
    );
  // SERVICE-EXAMPLES-BEGIN category-delete
  // Delete a category and optionally move its products; Access: Owner/Manager
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/admin/categories/{{id}}/delete
  // body: raw JSON {"_csrf":"{{csrf}}"}
  // 2. method: POST; URL: {{baseUrl}}/api/admin/categories/{{id}}/delete
  // body: raw JSON {"_csrf":"{{csrf}}","destination_id":"{{destinationCategoryId}}"}
  // SERVICE-EXAMPLES-END category-delete
  } else if ((get || post) && remove) {
    const id = Number(remove[1]),
      rows = await categoryCounts(),
      category = rows.find((c) => Number(c.category_id) === id);
    if (!category) throw problem(404, "ไม่พบหมวดหมู่นี้ อาจถูกลบไปแล้ว");
    if (get) {
      await show("ลบหมวดหมู่", categoryDelete(session, category, rows));
      return true;
    }
    try {
      const result = await deleteCategory(
        id,
        String(req.body.destination_id || ""),
      );
      await ctx.logAction(
        session,
        req,
        "category.deleted",
        `${result.name}; moved ${result.moved} products to ${result.destination || "-"}`,
      );
      ctx.setFlash(
        session,
        "success",
        result.moved
          ? `ย้ายสินค้า ${result.moved} ชิ้นไป “${result.destination}” และลบหมวดหมู่แล้ว`
          : "ลบหมวดหมู่แล้ว",
      );
    } catch (error) {
      if (![400, 409].includes(error.status)) throw error;
      const fresh = await categoryCounts(),
        current = fresh.find((c) => Number(c.category_id) === id);
      await show(
        "ตรวจสอบการลบ",
        categoryDelete(
          session,
          current,
          fresh,
          error.message,
          req.body.destination_id,
        ),
        error.status,
      );
      return true;
    }
  } else return false;
  await saveSession(res, session);
  ctx.redirect(res, "/admin/categories");
  return true;
}
