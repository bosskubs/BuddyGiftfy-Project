// Fill ordering guidance with the current store settings.
import { initPage } from "../common.js";
import { text, money } from "../shared/dom.js";
initPage(({ session }) => {
  const config = session.settings;
  text(
    "#ordering details:nth-of-type(3) p",
    "ร้านสำรองสินค้าให้ " +
      config.payment_window_hours +
      " ชั่วโมง หากหมดเวลาและยังไม่ได้ส่งหลักฐาน ระบบจะยกเลิกรายการและคืนสินค้าเข้าคลัง คำสั่งซื้อที่ส่งสลิปแล้วจะรอร้านตรวจสอบ",
  );
  text(
    "#shipping details:first-of-type p",
    (Number(config.shipping_fee)
      ? "ค่าจัดส่ง " + money(config.shipping_fee)
      : "ไม่มีค่าจัดส่งเพิ่มเติม") +
      (Number(config.free_shipping_threshold) > 0
        ? " · ส่งฟรีเมื่อยอดสินค้าครบ " + money(config.free_shipping_threshold)
        : ""),
  );
  text(
    "section:last-of-type details:first-of-type p",
    "เลือกห่อของขวัญได้ในขั้นตอนจัดส่ง ค่าห่อ " +
      money(config.gift_wrap_fee) +
      " ต่อคำสั่งซื้อ และใส่ข้อความบนการ์ดได้ไม่เกิน 500 ตัวอักษร",
  );
});
