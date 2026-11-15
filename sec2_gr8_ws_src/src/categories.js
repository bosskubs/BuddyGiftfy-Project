// Validate categories and maintain category relationships for product management.
import { query, transaction } from "./db.js";
import { problem } from "./commerce.js";

export const categoryOrder = "sort_order, name, category_id";
export async function listCategories() {
  return query(`SELECT * FROM categories ORDER BY ${categoryOrder}`);
}
export async function categoryCounts() {
  return query(
    `SELECT c.*,COUNT(p.product_id) AS total,SUM(CASE WHEN p.status<>'Inactive' THEN 1 ELSE 0 END) AS visible FROM categories c LEFT JOIN products p ON p.category=c.name GROUP BY c.category_id,c.name,c.sort_order,c.is_custom,c.created_at,c.updated_at ORDER BY c.sort_order,c.name,c.category_id`,
  );
}
export function categoryValues(body) {
  const name = String(body.name || "").trim(),
    sort = Number(body.sort_order ?? 0);
  if (!name || [...name].length > 80 || /[\u0000-\u001f\u007f]/u.test(name))
    throw problem(400, "กรุณาใส่ชื่อหมวดหมู่ 1–80 ตัวอักษร");
  if (!Number.isSafeInteger(sort) || sort < 0 || sort > 9999)
    throw problem(400, "ลำดับหมวดหมู่ต้องเป็นจำนวนเต็ม 0–9999");
  return { name, sort, custom: body.is_custom === "1" ? 1 : 0 };
}
export async function saveCategory(id, body) {
  const v = categoryValues(body);
  try {
    return await transaction(async (conn) => {
      const [rows] = await conn.execute(
        "SELECT category_id,name FROM categories ORDER BY category_id FOR UPDATE",
      );
      const target = id ? rows.find((r) => Number(r.category_id) === id) : null;
      if (id && !target) throw problem(404, "ไม่พบหมวดหมู่นี้ อาจถูกลบไปแล้ว");
      if (id) {
        await conn.execute(
          "UPDATE categories SET name=?,sort_order=?,is_custom=? WHERE category_id=?",
          [v.name, v.sort, v.custom, id],
        );
        // Explicitly synchronize case/accent-only renames too; FK comparisons use a case-insensitive collation.
        await conn.execute("UPDATE products SET category=? WHERE category=?", [
          v.name,
          target.name,
        ]);
      } else
        await conn.execute(
          "INSERT INTO categories(name,sort_order,is_custom) VALUES(?,?,?)",
          [v.name, v.sort, v.custom],
        );
      return v;
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      throw problem(409, "มีชื่อหมวดหมู่นี้แล้ว กรุณาใช้ชื่ออื่น");
    throw error;
  }
}
export async function deleteCategory(id, destination) {
  return transaction(async (conn) => {
    const [rows] = await conn.execute(
      "SELECT category_id,name FROM categories ORDER BY category_id FOR UPDATE",
    );
    const source = rows.find((r) => Number(r.category_id) === id);
    if (!source) throw problem(404, "ไม่พบหมวดหมู่นี้ อาจถูกลบไปแล้ว");
    const [products] = await conn.execute(
      "SELECT product_id FROM products WHERE category=? FOR UPDATE",
      [source.name],
    );
    const target = rows.find(
      (r) =>
        Number(r.category_id) === Number(destination) &&
        Number(r.category_id) !== id,
    );
    if (destination && !target)
      throw problem(400, "กรุณาเลือกหมวดหมู่ปลายทางอื่นที่ยังมีอยู่");
    if (products.length && !target)
      throw problem(
        409,
        "หมวดหมู่นี้มีสินค้าอยู่ กรุณาเลือกหมวดหมู่ที่จะย้ายสินค้าไปก่อนลบ",
      );
    if (products.length)
      await conn.execute("UPDATE products SET category=? WHERE category=?", [
        target.name,
        source.name,
      ]);
    await conn.execute("DELETE FROM categories WHERE category_id=?", [id]);
    return {
      name: source.name,
      moved: products.length,
      destination: target?.name,
    };
  });
}
