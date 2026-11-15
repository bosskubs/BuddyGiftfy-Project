// Handle administrator product and account operations with server-side permission checks.
import { fileURLToPath } from "node:url";
import path from "node:path";
import { stat, mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import approvedImages from "./approved-images.json" with { type: "json" };
const approved = new Set(approvedImages);
import { listCategories } from "./categories.js";
import { handleCategories } from "./category-routes.js";
import { query, transaction } from "./db.js";
import { hashPassword, saveSession } from "./security.js";
import { problem, cents, amount } from "./commerce.js";
import { decodeProductImage } from "./product-images.js";
import {
  adminProductsPage,
  productFormPage,
  accountsPage,
  accountFormPage,
  accountDeletePage,
  productDeletePage,
} from "./view-data.js";
import { customerDirectory } from "./view-data.js";
const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const slugify = (value) =>
  String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9ก-๙]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160) || "gift";
async function imagePath(value) {
  if (approved.has(value)) return value;
  if (!/^\/images\/[A-Za-z0-9._/-]+\.(?:png|jpe?g|webp|svg)$/i.test(value))
    throw problem(400, "กรุณาเลือกรูปภาพสินค้า");
  const file = path.resolve(root, "public", "." + value);
  if (!file.startsWith(path.join(root, "public/images") + path.sep))
    throw problem(400, "รูปภาพไม่ถูกต้อง");
  try {
    if (!(await stat(file)).isFile()) throw Error();
  } catch {
    throw problem(400, "ไม่พบรูปภาพ กรุณาอัปโหลดใหม่");
  }
  return value;
}
export async function handleAdmin(req, res, url, session, ctx) {
  if (!url.pathname.startsWith("/admin")) return false;
  const { requireAdmin, render, redirect, setFlash, logAction } = ctx,
    admin = await requireAdmin(req, res, session);
  if (!admin) return true;
  const p = url.pathname,
    get = req.method === "GET",
    post = req.method === "POST";
  const show = (name, body) =>
    render(res, session, name, body, { admin: true });
  const go = async (to, message, type = "success") => {
    if (message) setFlash(session, type, message);
    await saveSession(res, session);
    redirect(res, to);
    return true;
  };
  if (await handleCategories(req, res, url, session, ctx, admin)) return true;
  // SERVICE-EXAMPLES-BEGIN product-image
  // Upload a product image; Access: Owner/Manager/Editor
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/admin/product-image
  // body: raw JSON {"_csrf":"{{csrf}}","image":"{{imageDataUrl}}"}
  // 2. method: POST; URL: {{baseUrl}}/api/admin/product-image
  // body: raw JSON {"_csrf":"{{csrf}}","image":"not-an-image"}
  // SERVICE-EXAMPLES-END product-image
  if (post && p === "/admin/product-image") {
    let bytes;
    try {
      const decoded = decodeProductImage(req.body.image);
      bytes = await sharp(decoded.bytes, { limitInputPixels: 40000000 })
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw problem(
        400,
        "กรุณาใช้ภาพ PNG หรือ JPG ที่ถูกต้อง ขนาดไม่เกิน 5 MB",
      );
    }
    const directory = path.join(root, "public/images/uploads");
    await mkdir(directory, { recursive: true });
    const filename = randomBytes(18).toString("hex") + ".webp";
    await writeFile(path.join(directory, filename), bytes, { flag: "wx" });
    res.writeHead(201, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify({ url: "/images/uploads/" + filename }));
    return true;
  }
  // SERVICE-EXAMPLES-BEGIN product-list
  // Search products with optional combined criteria; Access: Owner/Manager/Editor
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/products
  // 2. method: GET; URL: {{baseUrl}}/api/admin/products?q=Gift&category=ตุ๊กตา&status=Available
  // SERVICE-EXAMPLES-END product-list
  if (get && p === "/admin/products") {
    const q = (url.searchParams.get("q") || "").trim().slice(0, 100),
      category = (url.searchParams.get("category") || "").slice(0, 80),
      status = url.searchParams.get("status") || "",
      clauses = [],
      params = {};
    if (q) {
      clauses.push("(name LIKE :q OR sku LIKE :q)");
      params.q = "%" + q + "%";
    }
    if (category) {
      clauses.push("category=:category");
      params.category = category;
    }
    if (["Available", "Out of stock", "Inactive"].includes(status)) {
      clauses.push("status=:status");
      params.status = status;
    }
    const products = await query(
        `SELECT * FROM products ${clauses.length ? "WHERE " + clauses.join(" AND ") : ""} ORDER BY status='Inactive',created_at DESC,product_id DESC`,
        params,
      ),
      categories = await listCategories();
    await show(
      "สินค้า",
      adminProductsPage(products, session, {
        q,
        category,
        status,
        categories: categories.map((r) => r.name),
      }),
    );
    return true;
  }
  const edit = p.match(/^\/admin\/products\/(\d+)\/edit$/),
    hide = p.match(/^\/admin\/products\/(\d+)\/hide$/),
    remove = p.match(/^\/admin\/products\/(\d+)\/delete$/);
  // SERVICE-EXAMPLES-BEGIN product-detail
  // Read one product; Access: Owner/Manager/Editor
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: GET; URL: {{baseUrl}}/api/admin/products/{{productId}}
  // 2. method: GET; URL: {{baseUrl}}/api/admin/products/99999999
  // SERVICE-EXAMPLES-END product-detail
  if (get && (p === "/admin/products/new" || edit)) {
    let product = {};
    if (edit) {
      [product] = await query("SELECT * FROM products WHERE product_id=:id", {
        id: edit[1],
      });
      if (!product) throw problem(404, "ไม่พบสินค้า");
    }
    await show(
      edit ? "แก้ไขสินค้า" : "เพิ่มสินค้า",
      productFormPage(session, product, await listCategories()),
    );
    return true;
  }
  // SERVICE-EXAMPLES-BEGIN product-insert
  // Create a product; Access: Owner/Manager/Editor
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/admin/products
  // body: raw JSON {"_csrf":"{{csrf}}","name":"Gift A","category":"ตุ๊กตา","description":"ของขวัญสาธิต","price":"250.50","stock_quantity":"5","image_url":"/images/product-placeholder.svg","status":"Available"}
  // 2. method: POST; URL: {{baseUrl}}/api/admin/products
  // body: raw JSON {"_csrf":"{{csrf}}","name":"Gift B","category":"ตุ๊กตา","description":"ของขวัญสาธิต","price":"250.50","stock_quantity":"5","image_url":"/images/product-placeholder.svg","status":"Available"}
  // SERVICE-EXAMPLES-END product-insert
  // SERVICE-EXAMPLES-BEGIN product-update
  // Update a product; Access: Owner/Manager/Editor
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: PUT; URL: {{baseUrl}}/api/admin/products/{{id}}
  // body: raw JSON {"_csrf":"{{csrf}}","name":"Gift A","category":"ตุ๊กตา","description":"ของขวัญสาธิต","price":"399.25","stock_quantity":"5","image_url":"/images/product-placeholder.svg","status":"Available"}
  // 2. method: PUT; URL: {{baseUrl}}/api/admin/products/{{id}}
  // body: raw JSON {"_csrf":"{{csrf}}","name":"Gift A","category":"ตุ๊กตา","description":"ของขวัญสาธิต","price":"399.25","stock_quantity":"8","image_url":"/images/product-placeholder.svg","status":"Available"}
  // SERVICE-EXAMPLES-END product-update
  if (post && (p === "/admin/products/new" || edit)) {
    const v = req.body,
      name = String(v.name || "")
        .trim()
        .slice(0, 180),
      category = String(v.category || "")
        .trim()
        .slice(0, 80),
      description = String(v.description || "")
        .trim()
        .slice(0, 3000),
      stock = Number(v.stock_quantity),
      price = Number(v.price),
      status =
        v.status === "Inactive"
          ? "Inactive"
          : stock > 0
            ? "Available"
            : "Out of stock";
    if (
      !name ||
      !category ||
      !description ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      stock > 100000 ||
      v.price === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 99999999
    )
      throw problem(
        400,
        "กรุณาตรวจชื่อ หมวดหมู่ รายละเอียด ราคา และจำนวนสินค้า",
      );
    const image = await imagePath(String(v.image_url || ""));
    const params = {
      name,
      category,
      description,
      stock,
      price: amount(cents(price)),
      status,
      image,
      featured: v.is_featured === "1" ? 1 : 0,
    };
    await transaction(async (conn) => {
      await conn.execute(
        "SELECT category_id FROM categories ORDER BY category_id FOR UPDATE",
      );
      const [categoryRows] = await conn.execute(
        "SELECT name FROM categories WHERE name=:name",
        { name: category },
      );
      if (!categoryRows.length)
        throw problem(
          400,
          "หมวดหมู่นี้ไม่มีแล้ว กรุณาเลือกหมวดหมู่จากรายการปัจจุบัน",
        );
      params.category = categoryRows[0].name;
      if (edit) {
        params.id = edit[1];
        const [exists] = (
          await conn.execute(
            "SELECT product_id FROM products WHERE product_id=:id",
            { id: edit[1] },
          )
        )[0];
        if (!exists) throw problem(404, "ไม่พบสินค้า");
        await conn.execute(
          "UPDATE products SET name=:name,category=:category,description=:description,stock_quantity=:stock,price=:price,status=:status,image_url=:image,is_featured=:featured WHERE product_id=:id",
          params,
        );
      } else {
        params.slug = slugify(name) + "-" + randomBytes(3).toString("hex");
        params.sku = "BG-" + randomBytes(4).toString("hex").toUpperCase();
        await conn.execute(
          "INSERT INTO products(name,category,description,stock_quantity,price,status,image_url,is_featured,slug,sku) VALUES(:name,:category,:description,:stock,:price,:status,:image,:featured,:slug,:sku)",
          params,
        );
      }
    });
    await logAction(
      session,
      req,
      edit ? "product.updated" : "product.created",
      edit ? "Updated product " + edit[1] : "Created product " + params.sku,
    );
    return go("/admin/products", edit ? "บันทึกสินค้าแล้ว" : "เพิ่มสินค้าแล้ว");
  }
  // DELETE /api/admin/products/:id. See service-contract.js for two raw-JSON examples.
  // SERVICE-EXAMPLES-BEGIN product-delete
  // Delete a product after confirmation; Access: Owner/Manager/Editor
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: DELETE; URL: {{baseUrl}}/api/admin/products/{{id}}
  // body: raw JSON {"_csrf":"{{csrf}}","confirm_sku":"{{productSku}}"}
  // 2. method: DELETE; URL: {{baseUrl}}/api/admin/products/{{id}}
  // body: raw JSON {"_csrf":"{{csrf}}","confirm_sku":"wrong"}
  // SERVICE-EXAMPLES-END product-delete
  if ((get || post) && remove) {
    const id = Number(remove[1]),
      [product] = await query("SELECT * FROM products WHERE product_id=:id", {
        id,
      });
    if (!product) throw problem(404, "ไม่พบสินค้า");
    const [history] = await query(
      "SELECT COUNT(*) AS amount FROM order_items WHERE product_id=:id",
      { id },
    );
    if (get) {
      await show(
        "ยืนยันลบสินค้า",
        productDeletePage(product, history.amount, session),
      );
      return true;
    }
    if (String(req.body.confirm_sku || "").trim() !== product.sku)
      throw problem(400, "กรุณาพิมพ์ SKU ยืนยันให้ตรงกับสินค้า");
    try {
      await query("DELETE FROM products WHERE product_id=:id", { id });
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2")
        throw problem(
          409,
          "สินค้านี้มีประวัติคำสั่งซื้อ กรุณาซ่อนสินค้าเพื่อเก็บประวัติไว้",
        );
      throw error;
    }
    await logAction(
      session,
      req,
      "product.deleted",
      "Deleted " + product.sku + " " + product.name,
    );
    return go("/admin/products", "ลบสินค้าออกจากฐานข้อมูลแล้ว");
  }
  // SERVICE-EXAMPLES-BEGIN product-hide
  // Hide a product; Access: Owner/Manager/Editor
  // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
  // Use the demo database and replace ID/token placeholders with actual values.
  // Image requests require a complete data URL; see docs/service-catalog.json.
  // 1. method: POST; URL: {{baseUrl}}/api/admin/products/{{id}}/hide
  // body: raw JSON {"_csrf":"{{csrf}}"}
  // 2. method: POST; URL: {{baseUrl}}/api/admin/products/{{id}}/hide
  // body: raw JSON {"_csrf":"{{csrf}}"}
  // SERVICE-EXAMPLES-END product-hide
  if (post && hide) {
    await query("UPDATE products SET status='Inactive' WHERE product_id=:id", {
      id: hide[1],
    });
    await logAction(
      session,
      req,
      "product.hidden",
      "Hidden product " + hide[1],
    );
    return go(
      "/admin/products",
      "ซ่อนสินค้าจากหน้าร้านแล้ว เปิดขายใหม่ได้จากหน้าแก้ไขสินค้า",
    );
  }
  if (get && p === "/admin/customers") {
    if (!["Owner", "Manager"].includes(admin.role))
      throw problem(403, "ไม่มีสิทธิ์เข้าถึงข้อมูลลูกค้า");
    const q = (url.searchParams.get("q") || "").trim().slice(0, 100),
      rows = await query(
        `SELECT customer_id,email,first_name,last_name,phone,status,created_at FROM customers ${q ? "WHERE email LIKE :q OR first_name LIKE :q OR last_name LIKE :q" : ""} ORDER BY created_at DESC LIMIT 150`,
        q ? { q: "%" + q + "%" } : {},
      );
    await show("ลูกค้า", customerDirectory(rows, q));
    return true;
  }
  if (p.startsWith("/admin/accounts")) {
    if (admin.role !== "Owner")
      throw problem(403, "เฉพาะเจ้าของร้านที่จัดการทีมผู้ดูแลได้");
    // SERVICE-EXAMPLES-BEGIN admin-list
    // Search administrator accounts with optional combined criteria; Access: Owner
    // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
    // Use the demo database and replace ID/token placeholders with actual values.
    // Image requests require a complete data URL; see docs/service-catalog.json.
    // 1. method: GET; URL: {{baseUrl}}/api/admin/accounts
    // 2. method: GET; URL: {{baseUrl}}/api/admin/accounts?q=Demo&role=Editor&status=Active
    // SERVICE-EXAMPLES-END admin-list
    if (get && p === "/admin/accounts") {
      const options = {
          q: (url.searchParams.get("q") || "").trim().slice(0, 100),
          role: url.searchParams.get("role") || "",
          status: url.searchParams.get("status") || "",
        },
        clauses = [],
        params = {};
      if (options.q) {
        clauses.push(
          "(first_name LIKE :q OR last_name LIKE :q OR email LIKE :q)",
        );
        params.q = "%" + options.q + "%";
      }
      for (const k of ["role", "status"])
        if (
          (k === "role"
            ? ["Owner", "Manager", "Editor"]
            : ["Active", "Inactive", "Suspended"]
          ).includes(options[k])
        ) {
          clauses.push(k + "=:" + k);
          params[k] = options[k];
        }
      const rows = await query(
        `SELECT admin_id,email,first_name,last_name,role,status,age,address,preferences FROM admin_accounts ${clauses.length ? "WHERE " + clauses.join(" AND ") : ""} ORDER BY created_at`,
        params,
      );
      await show("ทีมผู้ดูแล", accountsPage(rows, session, options));
      return true;
    }
    const editAccount = p.match(/^\/admin\/accounts\/(\d+)\/edit$/),
      deleteAccount = p.match(/^\/admin\/accounts\/(\d+)\/delete$/),
      creating = p === "/admin/accounts/new";
    // SERVICE-EXAMPLES-BEGIN admin-detail
    // Read one administrator account; Access: Owner
    // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
    // Use the demo database and replace ID/token placeholders with actual values.
    // Image requests require a complete data URL; see docs/service-catalog.json.
    // 1. method: GET; URL: {{baseUrl}}/api/admin/accounts/{{adminId}}
    // 2. method: GET; URL: {{baseUrl}}/api/admin/accounts/99999999
    // SERVICE-EXAMPLES-END admin-detail
    if (get && (creating || editAccount || deleteAccount)) {
      let target = {};
      if (!creating) {
        [target] = await query(
          "SELECT admin_id,email,first_name,last_name,role,status,age,address,preferences FROM admin_accounts WHERE admin_id=:id",
          { id: (editAccount || deleteAccount)[1] },
        );
        if (!target) throw problem(404, "ไม่พบบัญชี");
      }
      await show(
        creating
          ? "เพิ่มผู้ดูแล"
          : deleteAccount
            ? "ลบบัญชีผู้ดูแล"
            : "แก้ไขผู้ดูแล",
        deleteAccount
          ? accountDeletePage(session, target)
          : accountFormPage(session, target),
      );
      return true;
    }
    // SERVICE-EXAMPLES-BEGIN admin-insert
    // Create an administrator account; Access: Owner
    // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
    // Use the demo database and replace ID/token placeholders with actual values.
    // Image requests require a complete data URL; see docs/service-catalog.json.
    // 1. method: POST; URL: {{baseUrl}}/api/admin/accounts
    // body: raw JSON {"_csrf":"{{csrf}}","first_name":"Demo","last_name":"Editor","email":"editor-a@example.test","role":"Editor","age":"22","address":"ที่อยู่สาธิต กรุงเทพฯ","preferences":"ดูแลสินค้า","password":"{{demoPassword}}","password_confirm":"{{demoPassword}}"}
    // 2. method: POST; URL: {{baseUrl}}/api/admin/accounts
    // body: raw JSON {"_csrf":"{{csrf}}","first_name":"Demo","last_name":"Editor","email":"editor-b@example.test","role":"Editor","age":"22","address":"ที่อยู่สาธิต กรุงเทพฯ","preferences":"ดูแลสินค้า","password":"{{demoPassword}}","password_confirm":"{{demoPassword}}"}
    // SERVICE-EXAMPLES-END admin-insert
    // SERVICE-EXAMPLES-BEGIN admin-update
    // Update an administrator account; Access: Owner
    // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
    // Use the demo database and replace ID/token placeholders with actual values.
    // Image requests require a complete data URL; see docs/service-catalog.json.
    // 1. method: PUT; URL: {{baseUrl}}/api/admin/accounts/{{id}}
    // body: raw JSON {"_csrf":"{{csrf}}","first_name":"Demo","last_name":"Editor","email":"editor-a@example.test","role":"Manager","age":"22","address":"ที่อยู่สาธิต กรุงเทพฯ","preferences":"ดูแลสินค้า","status":"Active"}
    // 2. method: PUT; URL: {{baseUrl}}/api/admin/accounts/{{id}}
    // body: raw JSON {"_csrf":"{{csrf}}","first_name":"Demo","last_name":"Editor","email":"editor-a@example.test","role":"Manager","age":"23","address":"ที่อยู่สาธิต กรุงเทพฯ","preferences":"ดูแลสินค้า","status":"Active"}
    // SERVICE-EXAMPLES-END admin-update
    if (post && (creating || editAccount)) {
      const v = req.body,
        email = String(v.email || "")
          .trim()
          .toLowerCase(),
        first = String(v.first_name || "")
          .trim()
          .slice(0, 80),
        last = String(v.last_name || "")
          .trim()
          .slice(0, 80),
        password = String(v.password || ""),
        role = v.role,
        status = creating ? "Active" : v.status;
      if (
        !first ||
        !last ||
        !/^\S+@\S+\.\S+$/.test(email) ||
        email.length > 254 ||
        !["Owner", "Manager", "Editor"].includes(role) ||
        !["Active", "Inactive", "Suspended"].includes(status) ||
        ((creating || password) &&
          (password.length < 14 || password.length > 256)) ||
        (creating && password !== v.password_confirm)
      )
        throw problem(400, "กรุณาตรวจข้อมูลและรหัสผ่านอย่างน้อย 14 ตัวอักษร");
      const age = v.age === "" || v.age == null ? null : Number(v.age),
        address = String(v.address || "")
          .trim()
          .slice(0, 1500),
        preferences = String(v.preferences || "")
          .trim()
          .slice(0, 1000);
      if (age !== null && (!Number.isInteger(age) || age < 0 || age > 120))
        throw problem(400, "อายุต้องเป็นจำนวนเต็ม 0–120 ปี");
      try {
        if (creating)
          await query(
            "INSERT INTO admin_accounts(email,first_name,last_name,password_hash,role,status,age,address,preferences) VALUES(:email,:first,:last,:hash,:role,'Active',:age,:address,:preferences)",
            {
              email,
              first,
              last,
              hash: await hashPassword(password),
              role,
              age,
              address,
              preferences,
            },
          );
        else {
          const id = Number(editAccount[1]),
            hash = password ? await hashPassword(password) : null;
          await transaction(async (conn) => {
            const [rows] = await conn.execute(
              "SELECT admin_id,role,status FROM admin_accounts ORDER BY admin_id FOR UPDATE",
            );
            const target = rows.find((r) => Number(r.admin_id) === id);
            if (!target) throw problem(404, "ไม่พบบัญชี");
            if (
              id === Number(admin.admin_id) &&
              (role !== "Owner" || status !== "Active")
            )
              throw problem(
                400,
                "ไม่สามารถลดสิทธิ์หรือปิดบัญชีที่กำลังใช้งานได้",
              );
            if (
              target.role === "Owner" &&
              target.status === "Active" &&
              (role !== "Owner" || status !== "Active") &&
              rows.filter((r) => r.role === "Owner" && r.status === "Active")
                .length <= 1
            )
              throw problem(
                409,
                "ต้องมีเจ้าของร้านที่ใช้งานได้อย่างน้อยหนึ่งบัญชี",
              );
            await conn.execute(
              `UPDATE admin_accounts SET email=?,first_name=?,last_name=?,role=?,status=?,age=?,address=?,preferences=?${hash ? ",password_hash=?" : ""} WHERE admin_id=?`,
              [
                email,
                first,
                last,
                role,
                status,
                age,
                address,
                preferences,
                ...(hash ? [hash] : []),
                id,
              ],
            );
          });
          if (password)
            await query(
              "DELETE FROM sessions WHERE JSON_UNQUOTE(JSON_EXTRACT(data_json,'$.adminId'))=:id AND session_id<>:session",
              { id: String(id), session: session.id },
            );
        }
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY")
          throw problem(400, "อีเมลนี้มีบัญชีผู้ดูแลแล้ว");
        throw error;
      }
      await logAction(
        session,
        req,
        creating ? "admin.account.created" : "admin.account.updated",
        "Updated team account " + email,
      );
      return go(
        "/admin/accounts",
        creating ? "เพิ่มบัญชีผู้ดูแลแล้ว" : "บันทึกบัญชีผู้ดูแลแล้ว",
      );
    }
    // SERVICE-EXAMPLES-BEGIN admin-delete
    // Delete an administrator account after confirmation; Access: Owner
    // Postman: GET /api/session; retain the cookie and CSRF token; refresh them after login.
    // Use the demo database and replace ID/token placeholders with actual values.
    // Image requests require a complete data URL; see docs/service-catalog.json.
    // 1. method: DELETE; URL: {{baseUrl}}/api/admin/accounts/{{id}}
    // body: raw JSON {"_csrf":"{{csrf}}","confirm_email":"{{adminEmail}}"}
    // 2. method: DELETE; URL: {{baseUrl}}/api/admin/accounts/{{id}}
    // body: raw JSON {"_csrf":"{{csrf}}","confirm_email":"wrong@example.test"}
    // SERVICE-EXAMPLES-END admin-delete
    if (post && deleteAccount) {
      const id = Number(deleteAccount[1]);
      await transaction(async (conn) => {
        const [rows] = await conn.execute(
            "SELECT admin_id,email,role,status FROM admin_accounts ORDER BY admin_id FOR UPDATE",
          ),
          target = rows.find((r) => Number(r.admin_id) === id);
        if (!target) throw problem(404, "ไม่พบบัญชี");
        if (id === Number(admin.admin_id))
          throw problem(400, "ไม่สามารถลบบัญชีที่กำลังใช้งานได้");
        if (
          String(req.body.confirm_email || "")
            .trim()
            .toLowerCase() !== target.email.toLowerCase()
        )
          throw problem(400, "อีเมลยืนยันไม่ตรงกับบัญชี");
        if (
          target.role === "Owner" &&
          target.status === "Active" &&
          rows.filter((r) => r.role === "Owner" && r.status === "Active")
            .length <= 1
        )
          throw problem(
            409,
            "ต้องมีเจ้าของร้านที่ใช้งานได้อย่างน้อยหนึ่งบัญชี",
          );
        await conn.execute("DELETE FROM admin_accounts WHERE admin_id=?", [id]);
        await conn.execute(
          "DELETE FROM sessions WHERE JSON_UNQUOTE(JSON_EXTRACT(data_json,'$.adminId'))=?",
          [String(id)],
        );
      });
      await logAction(
        session,
        req,
        "admin.account.deleted",
        "Deleted admin " + id,
      );
      return go("/admin/accounts", "ลบบัญชีผู้ดูแลออกจากฐานข้อมูลแล้ว");
    }
  }
  return false;
}
