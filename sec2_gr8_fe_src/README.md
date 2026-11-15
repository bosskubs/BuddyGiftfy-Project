# BuddyGiftfy — หน้าบ้าน

ส่วนนี้เป็น HTML, CSS, JavaScript รูปภาพ และฟอนต์ รวมหน้าแอดมินด้วย การอ่าน/เขียน MySQL อยู่ใน [backend](../sec2_gr8_ws_src/README.md)

ใช้ Node.js 22 ขึ้นไป เปิด MySQL และ API ก่อนตาม [คู่มือติดตั้ง](../docs/INSTALLATION.md) จากโฟลเดอร์นี้พิมพ์ทีละคำสั่ง:

```sh
node server.js
```

เปิด [หน้าร้าน](http://localhost:3000/) หรือ [เข้าสู่ระบบแอดมิน](http://localhost:3000/admin/login) ไม่ต้อง npm install ในโฟลเดอร์ frontend เพราะ server ใช้ Node.js built-in modules

หน้าแรกใช้ URL `/` แต่ไฟล์ยังชื่อ `public/index.html`; `/index.html` redirect ไป `/` พร้อม query หน้าอื่นมีไฟล์ `.html` ของตัวเอง รวมทั้งหมด 39 ไฟล์ นับหน้า 404

| ส่วน | หน้าที่ |
|---|---|
| `public/*.html`, `public/admin/*.html` | โครงหน้า เมนู ฟอร์ม และ template สำหรับรายการซ้ำ |
| `public/js/pages/` | Controller ของแต่ละหน้า |
| `public/js/common.js` | อ่าน session ตรวจสิทธิ์ และเรียกข้อมูลของหน้า |
| `public/js/api.js` / `app.js` | fetch JSON และพฤติกรรมร่วม เช่น ส่งฟอร์ม เมนู อัปโหลด |
| `public/js/shared/` | DOM ฟอร์ม รูป ออเดอร์ และ Frankfurter public API |
| `server.js` / `page-paths.js` | ส่งไฟล์ เปลี่ยน URL เก่าเป็น URL ปัจจุบัน และส่งต่อ API/ไฟล์อัปโหลด |

Browser เรียก `/api/...` ที่พอร์ตของ frontend โดยปริยาย และ `server.js` ส่งต่อไป `http://127.0.0.1:3001` ตั้ง `FRONTEND_PORT` เพื่อเปลี่ยนพอร์ตหน้าบ้าน หรือ `API_UPSTREAM` เพื่อเปลี่ยนที่อยู่หลังบ้าน ตัวแปรเหล่านี้ตั้งใน environment ตอนเปิด frontend ส่วน `FRONTEND_ORIGIN` ของ backend ต้องมีที่อยู่หน้าเว็บที่ผู้ใช้เปิดจริง

เมื่อเปิดผ่าน reverse proxy หรือ Nginx Proxy Manager ให้ส่งทั้งหน้าเว็บและ `/api/` มาที่ frontend ใช้ `API_ORIGIN` เฉพาะเมื่อต้องการให้ browser เรียก backend แยกโดยตรง

อ่าน [รายการหน้าและ URL](../docs/HTML-PAGE-MAP.md) หรือ [คู่มือติดตั้ง](../docs/INSTALLATION.md) ต่อได้
