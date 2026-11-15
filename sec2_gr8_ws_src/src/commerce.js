// Apply cart totals, stock reservations, payment review, and order state transitions.
import { createHash } from "node:crypto";
import { query, transaction } from "./db.js";
export function problem(status, message) {
  return Object.assign(new Error(message), { status });
}
// Calculate monetary values in integer cents to avoid floating-point rounding errors.
export function cents(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 99999999)
    throw problem(400, "จำนวนเงินไม่ถูกต้อง");
  return Math.round((n + Number.EPSILON) * 100);
}
export const amount = (value) => (value / 100).toFixed(2);
export const defaults = {
  store_name: "BuddyGiftfy",
  announcement: "ของขวัญที่เลือกด้วยใจ สำหรับคนที่คุณนึกถึง",
  support_email: "",
  support_phone: "",
  bank_name: "",
  bank_account_name: "",
  bank_account_number: "",
  shipping_fee: "0",
  free_shipping_threshold: "0",
  gift_wrap_fee: "49",
  payment_window_hours: "24",
};
export async function settings() {
  return {
    ...defaults,
    ...Object.fromEntries(
      (await query("SELECT setting_key,setting_value FROM store_settings")).map(
        (r) => [r.setting_key, r.setting_value],
      ),
    ),
  };
}
export function totals(lines, config, wrap = false) {
  const subtotal = lines.reduce(
      (sum, line) => sum + cents(line.p.price) * line.quantity,
      0,
    ),
    threshold = cents(config.free_shipping_threshold),
    shipping =
      threshold > 0 && subtotal >= threshold ? 0 : cents(config.shipping_fee),
    gift = wrap ? cents(config.gift_wrap_fee) : 0;
  return { subtotal, shipping, gift, total: subtotal + shipping + gift };
}
export function normalizedCart(cart) {
  if (!Array.isArray(cart)) return [];
  const seen = new Set();
  return cart
    .filter(
      (x) =>
        Number.isSafeInteger(Number(x.productId)) &&
        Number(x.productId) > 0 &&
        Number.isInteger(Number(x.quantity)) &&
        Number(x.quantity) > 0 &&
        !seen.has(Number(x.productId)) &&
        seen.add(Number(x.productId)),
    )
    .slice(0, 60)
    .map((x) => ({
      productId: Number(x.productId),
      quantity: Math.min(99, Number(x.quantity)),
      customNote: String(x.customNote || "").slice(0, 500),
    }));
}
export async function cartLines(session) {
  session.cart = normalizedCart(session.cart);
  if (!session.cart.length) return [];
  const ids = session.cart.map((x) => x.productId),
    rows = await query(
      `SELECT * FROM products WHERE product_id IN (${ids.map(() => "?").join(",")})`,
      ids,
    ),
    byId = new Map(rows.map((p) => [Number(p.product_id), p]));
  session.cart = session.cart.filter((x) => byId.has(x.productId));
  return session.cart.map((x) => ({
    ...x,
    p: byId.get(x.productId),
    available:
      byId.get(x.productId).status === "Available" &&
      byId.get(x.productId).stock_quantity >= x.quantity,
  }));
}
export async function mergeFavorites(session, userId) {
  const ids = [
    ...new Set(
      (session.favorites || []).map(Number).filter(Number.isSafeInteger),
    ),
  ].slice(0, 100);
  for (const id of ids)
    await query(
      "INSERT IGNORE INTO wishlist_items(customer_id,product_id) SELECT :customer,product_id FROM products WHERE product_id=:product AND status<>'Inactive'",
      { customer: userId, product: id },
    );
}
// Reuse the checkout key on repeated submissions to avoid creating duplicate orders.
export async function createOrder(user, session, body, config) {
  const key = createHash("sha256")
    .update(session.id + ":" + String(body.checkout_token || ""))
    .digest("hex");
  const existing = await query(
    "SELECT order_number FROM orders WHERE checkout_key=:key AND customer_id=:customer",
    { key, customer: user.customer_id },
  );
  if (existing.length) return existing[0].order_number;
  if (!session.checkoutToken || body.checkout_token !== session.checkoutToken)
    throw problem(
      409,
      "ตะกร้าของคุณมีการเปลี่ยนแปลง กรุณาตรวจสอบรายการและยืนยันอีกครั้ง",
    );
  if (
    !config.bank_name ||
    !config.bank_account_name ||
    !config.bank_account_number
  )
    throw problem(
      409,
      "ร้านยังไม่ได้ตั้งค่าบัญชีรับชำระเงิน กรุณาติดต่อร้านก่อนสั่งซื้อ",
    );
  const shipping = {
    name: String(body.shipping_name || "")
      .trim()
      .slice(0, 160),
    phone: String(body.shipping_phone || "")
      .trim()
      .slice(0, 30),
    address: String(body.shipping_address || "")
      .trim()
      .slice(0, 1500),
  };
  if (
    !shipping.name ||
    !/^[+\d\s()-]{8,30}$/.test(shipping.phone) ||
    shipping.address.length < 10
  )
    throw problem(
      400,
      "กรุณาระบุชื่อผู้รับ เบอร์โทรศัพท์ และที่อยู่จัดส่งให้ครบถ้วน",
    );
  const cart = normalizedCart(session.cart);
  if (!cart.length) throw problem(409, "ตะกร้าของคุณยังไม่มีสินค้า");
  const wrap = body.gift_wrap === "1",
    message = String(body.gift_message || "")
      .trim()
      .slice(0, 500),
    number =
      "BG" +
      Date.now().toString(36).toUpperCase() +
      key.slice(0, 4).toUpperCase();
  try {
    return await transaction(async (conn) => {
      const ids = cart.map((x) => x.productId).sort((a, b) => a - b),
        [rows] = await conn.execute(
          `SELECT * FROM products WHERE product_id IN (${ids.map(() => "?").join(",")}) ORDER BY product_id FOR UPDATE`,
          ids,
        ),
        byId = new Map(rows.map((p) => [Number(p.product_id), p]));
      const lines = cart.map((x) => ({ ...x, p: byId.get(x.productId) }));
      for (const line of lines)
        if (
          !line.p ||
          line.p.status !== "Available" ||
          line.p.stock_quantity < line.quantity
        )
          throw problem(
            409,
            `สินค้า ${line.p?.name || ""} มีจำนวนไม่พอหรือไม่พร้อมจำหน่าย กรุณาปรับตะกร้า`,
          );
      const sum = totals(lines, config, wrap);
      const [order] = await conn.execute(
        "INSERT INTO orders(order_number,customer_id,status,subtotal,gift_wrap_fee,shipping_fee,total_price,gift_wrap,gift_message,shipping_name,shipping_phone,shipping_address,checkout_key) VALUES(?,?,'Pending',?,?,?,?,?,?,?,?,?,?)",
        [
          number,
          user.customer_id,
          amount(sum.subtotal),
          amount(sum.gift),
          amount(sum.shipping),
          amount(sum.total),
          wrap ? 1 : 0,
          message || null,
          shipping.name,
          shipping.phone,
          shipping.address,
          key,
        ],
      );
      for (const line of lines) {
        await conn.execute(
          "INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity,line_total,custom_note) VALUES(?,?,?,?,?,?,?)",
          [
            order.insertId,
            line.productId,
            line.p.name,
            amount(cents(line.p.price)),
            line.quantity,
            amount(cents(line.p.price) * line.quantity),
            line.customNote || null,
          ],
        );
        await conn.execute(
          "UPDATE products SET status=IF(stock_quantity-?>0,'Available','Out of stock'),stock_quantity=stock_quantity-? WHERE product_id=?",
          [line.quantity, line.quantity, line.productId],
        );
      }
      await conn.execute(
        "INSERT INTO payments(order_id,amount,provider_name,payment_status,deadline) VALUES(?,?,'Bank transfer','Pending',DATE_ADD(NOW(),INTERVAL ? HOUR))",
        [
          order.insertId,
          amount(sum.total),
          Math.min(168, Math.max(1, Number(config.payment_window_hours) || 24)),
        ],
      );
      if (body.save_address === "1")
        await conn.execute(
          "UPDATE customers SET phone=?,address=? WHERE customer_id=?",
          [shipping.phone, shipping.address, user.customer_id],
        );
      return number;
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const [previous] = await query(
        "SELECT order_number FROM orders WHERE checkout_key=:key AND customer_id=:customer",
        { key, customer: user.customer_id },
      );
      if (previous) return previous.order_number;
    }
    throw error;
  }
}
// Return reserved quantities through the same transaction that changes the order state.
async function releaseStock(conn, orderId) {
  const [items] = await conn.execute(
    "SELECT product_id,quantity FROM order_items WHERE order_id=? ORDER BY product_id",
    [orderId],
  );
  for (const i of items)
    await conn.execute(
      "UPDATE products SET stock_quantity=stock_quantity+?,status=IF(status='Inactive','Inactive','Available') WHERE product_id=?",
      [i.quantity, i.product_id],
    );
}
export async function cancelOrder(
  orderId,
  { customerId = null, expired = false } = {},
) {
  return transaction(async (conn) => {
    const [rows] = await conn.execute(
      "SELECT * FROM orders WHERE order_id=? FOR UPDATE",
      [orderId],
    );
    const o = rows[0];
    if (!o || (customerId && Number(o.customer_id) !== Number(customerId)))
      throw problem(404, "ไม่พบคำสั่งซื้อ");
    if (o.status === "Cancelled") return false;
    const [payments] = await conn.execute(
        "SELECT * FROM payments WHERE order_id=? ORDER BY payment_id DESC LIMIT 1 FOR UPDATE",
        [orderId],
      ),
      p = payments[0];
    if (customerId && o.status !== "Pending")
      throw problem(409, "คำสั่งซื้อนี้เริ่มดำเนินการแล้ว กรุณาติดต่อร้าน");
    if (
      ["Shipped", "Completed"].includes(o.status) ||
      p?.payment_status === "Completed"
    )
      throw problem(
        409,
        "คำสั่งซื้อนี้ชำระเงินหรือจัดส่งแล้ว กรุณาติดต่อร้านเพื่อดำเนินการ",
      );
    if (
      expired &&
      (o.status !== "Pending" ||
        p?.proof_path ||
        !p?.deadline ||
        new Date(p.deadline + "Z") > new Date())
    )
      return false;
    await conn.execute(
      "UPDATE orders SET status='Cancelled' WHERE order_id=?",
      [orderId],
    );
    await releaseStock(conn, orderId);
    await conn.execute(
      "UPDATE payments SET payment_status='Failed',review_note=? WHERE order_id=? AND payment_status<>'Completed'",
      [expired ? "หมดเวลาชำระเงิน" : "คำสั่งซื้อถูกยกเลิก", orderId],
    );
    return true;
  });
}
export async function reviewPayment(orderId, { approved, note = "" }) {
  return transaction(async (conn) => {
    const [orders] = await conn.execute(
      "SELECT * FROM orders WHERE order_id=? FOR UPDATE",
      [orderId],
    );
    const o = orders[0];
    if (!o) throw problem(404, "ไม่พบคำสั่งซื้อ");
    if (o.status === "Cancelled") throw problem(409, "คำสั่งซื้อถูกยกเลิกแล้ว");
    const [payments] = await conn.execute(
      "SELECT * FROM payments WHERE order_id=? ORDER BY payment_id DESC LIMIT 1 FOR UPDATE",
      [orderId],
    );
    const p = payments[0];
    if (!p?.proof_path) throw problem(409, "ยังไม่มีหลักฐานการชำระเงิน");
    if (p.payment_status === "Completed")
      throw problem(409, "ยืนยันยอดชำระเงินนี้แล้ว");
    if (!approved && !note.trim())
      throw problem(400, "กรุณาระบุเหตุผลเพื่อให้ลูกค้าแก้ไขหลักฐาน");
    await conn.execute(
      "UPDATE payments SET payment_status=?,paid_at=IF(?=1,NOW(),NULL),review_note=? WHERE payment_id=?",
      [
        approved ? "Completed" : "Failed",
        approved ? 1 : 0,
        note.trim().slice(0, 500) || null,
        p.payment_id,
      ],
    );
    if (approved && o.status === "Pending")
      await conn.execute(
        "UPDATE orders SET status='Confirmed' WHERE order_id=?",
        [orderId],
      );
    return true;
  });
}
export async function advanceOrder(
  orderId,
  status,
  { carrier = "", tracking = "" } = {},
) {
  if (status === "Cancelled") return cancelOrder(orderId);
  return transaction(async (conn) => {
    const [rows] = await conn.execute(
      "SELECT * FROM orders WHERE order_id=? FOR UPDATE",
      [orderId],
    );
    const o = rows[0];
    if (!o) throw problem(404, "ไม่พบคำสั่งซื้อ");
    const next = {
      Pending: [],
      Confirmed: ["Preparing"],
      Preparing: ["Shipped"],
      Shipped: ["Completed"],
      Completed: [],
      Cancelled: [],
    };
    if (status !== o.status && !next[o.status]?.includes(status))
      throw problem(409, "สถานะคำสั่งซื้อเปลี่ยนไปแล้ว กรุณาตรวจสอบอีกครั้ง");
    const [payments] = await conn.execute(
      "SELECT payment_id FROM payments WHERE order_id=? AND payment_status='Completed'",
      [orderId],
    );
    if (!payments.length)
      throw problem(409, "กรุณาตรวจสอบการชำระเงินก่อนดำเนินการจัดส่ง");
    if (status === "Shipped" && (!carrier.trim() || !tracking.trim()))
      throw problem(400, "กรุณาระบุขนส่งและหมายเลขติดตามพัสดุ");
    await conn.execute(
      "UPDATE orders SET status=?,shipping_carrier=COALESCE(NULLIF(?,''),shipping_carrier),tracking_number=COALESCE(NULLIF(?,''),tracking_number) WHERE order_id=?",
      [
        status,
        carrier.trim().slice(0, 80),
        tracking.trim().slice(0, 100),
        orderId,
      ],
    );
    return true;
  });
}
export async function expireOrders() {
  const rows = await query(
    "SELECT o.order_id FROM orders o JOIN payments p USING(order_id) WHERE o.status='Pending' AND p.payment_status<>'Completed' AND p.proof_path IS NULL AND p.deadline<NOW() LIMIT 50",
  );
  for (const row of rows) await cancelOrder(row.order_id, { expired: true });
}
