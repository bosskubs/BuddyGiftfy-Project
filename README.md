# BuddyGiftfy — ITDS242 Project Phase II

เว็บไซต์ร้านของขวัญสำหรับเลือกซื้อสินค้า สั่งซื้อด้วยการโอนเงินและแนบสลิป พร้อมระบบผู้ดูแลสำหรับจัดการสินค้า หมวดหมู่ บัญชีผู้ดูแล และคำสั่งซื้อ

**Section 2 · Group 8**

## สมาชิก

| รหัสนักศึกษา | ชื่อ–นามสกุล |
|---|---|
| 6887062 | สุรักษ์ งามบุษกรโสภณ |
| 6887089 | สุตาภัทร ฉิมมา |
| 6887107 | ปิยพร ภูมิพัฒน์ |
| 6887111 | ภัทร์ธนัชนนท์ สุดถาวรเจริญ |
| 6887120 | รัฐพงศ์ คูสกุลธรรม |

## เทคโนโลยีและโครงสร้างระบบ

- **Frontend:** HTML จริงแยก 39 หน้า พร้อม CSS และ JavaScript controllers; Node.js server ส่งไฟล์ให้ browser
- **Backend:** Node.js HTTP server ให้บริการ JSON API แยกจาก frontend
- **Database:** MySQL เชื่อมผ่าน mysql2
- **Public API:** Frankfurter สำหรับเทียบงบเงินบาทเป็นสกุลเงินอื่น โดยยอดชำระจริงยังเป็นเงินบาท
- **ส่วนเสริม:** sharp สำหรับตรวจและแปลงรูปภาพ

JavaScript ของโปรเจกต์ใช้ไฟล์ `.js` และ `"type": "module"` จึงใช้ `import/export` ได้เหมือนเดิม ทั้ง frontend, backend และเครื่องมือทดสอบ

HTML มีโครงหน้า/ฟอร์มจริง รายการซ้ำใช้ `<template>` แล้ว controller เติมข้อมูลชื่อช่องจาก JSON โดยไม่สร้างทั้ง body จากชื่อ template ใน API

หน้าแรกเปิดที่ `http://localhost:3000/` หน้าอื่นใช้ URL เช่น `/shop` และ `/admin/orders` โดยเซิร์ฟเวอร์ส่งไฟล์ HTML จริงให้ ลิงก์เดิมที่ลงท้าย `.html` จะเปลี่ยนไป URL ปัจจุบันพร้อม query string

Browser โหลดหน้าเว็บและเรียก `/api/...` ผ่าน frontend พอร์ต 3000 ตัว frontend ส่งต่อคำขอไปยัง Node.js API ที่ `127.0.0.1:3001` ส่วน API ตรวจข้อมูลและสิทธิ์ก่อนอ่านหรือเขียน MySQL ดูวิธีตั้งโดเมนและเปลี่ยนที่อยู่ API ใน [คู่มือติดตั้ง](docs/INSTALLATION.md)

| ไฟล์ / โฟลเดอร์ | หน้าที่ |
|---|---|
| `sec2_gr8_fe_src/` | โค้ด frontend, รูปภาพ, ฟอนต์ และ server หน้าบ้าน |
| `sec2_gr8_ws_src/` | โค้ด Node.js API, การเชื่อมฐานข้อมูล และ migrations |
| `sec2_gr8_database.sql` | โครงสร้างและข้อมูลสาธิตสำหรับติดตั้งใหม่ |
| `docs/` | คู่มือ รายละเอียด API และไฟล์ทดสอบ Postman |
| `sec2_gr8_report.pdf` | รายงาน Phase I และ II |
| `readme.txt` | คู่มือติดตั้งฉบับข้อความ |

## สิ่งที่ต้องติดตั้งก่อน

1. **Node.js 22 ขึ้นไป** พร้อม npm
2. **MySQL Server 8** ที่เปิดใช้งานแล้ว พร้อม MySQL command-line client หรือ MySQL Workbench

ตรวจโปรแกรมจาก Terminal หรือ Command Prompt:

```sh
node -v
npm -v
mysql --version
```

ขั้นตอนด้านล่างเริ่มจากโฟลเดอร์หลักของโปรเจกต์ที่มีไฟล์ README.md นี้ ค่าเริ่มต้นคือ MySQL พอร์ต 3306, API พอร์ต 3001 และ frontend พอร์ต 3000

## 1. นำเข้าฐานข้อมูลสาธิต

ใช้ MySQL instance ที่ยังไม่มีฐานข้อมูล `buddygiftfy` สำหรับงานนี้ SQL มีทั้งคำสั่งสร้างฐานข้อมูลและข้อมูลตัวอย่าง จึงไม่ควรนำเข้าซ้ำในฐานข้อมูลที่ใช้งานอยู่แล้ว

บน Linux/macOS Terminal หรือ Windows Command Prompt:

```sh
mysql --default-character-set=utf8mb4 -u root -p < sec2_gr8_database.sql
```

พิมพ์รหัสผ่าน root ของ MySQL บนเครื่องที่กำลังติดตั้งเมื่อโปรแกรมถาม ใช้ `--default-character-set=utf8mb4` เพื่อให้ MySQL อ่านข้อมูลภาษาไทยจากไฟล์ SQL เป็น UTF-8 ตอนนำเข้า

หากใช้ PowerShell หรือไม่สะดวกใช้เครื่องหมาย `<` ให้เปิด MySQL client:

```sh
mysql --default-character-set=utf8mb4 -u root -p
```

จากนั้นพิมพ์คำสั่งนี้ใน MySQL โดยแทนเส้นทางให้ตรงกับไฟล์บนเครื่อง:

```sql
SOURCE C:/path/to/BuddyGiftfy/sec2_gr8_database.sql;
```

บน Linux/macOS ใช้เส้นทางเช่น `/path/to/BuddyGiftfy/sec2_gr8_database.sql` หรือเปิดไฟล์ SQL ใน Workbench แล้วรัน `SET NAMES utf8mb4;` ใน session เดียวกันก่อนรันสคริปต์ได้เช่นกัน SQL จะสร้างและเลือกฐานข้อมูลชื่อ `buddygiftfy`

สร้างบัญชีฐานข้อมูลสำหรับแอปด้วยบัญชี MySQL ที่มีสิทธิ์จัดการผู้ใช้ โดยเปลี่ยนรหัสตัวอย่างด้านล่างเป็นรหัสของเครื่องตนเอง:

```sql
CREATE USER 'buddygiftfy'@'127.0.0.1' IDENTIFIED BY 'ChooseYourOwnDatabasePassword';
GRANT SELECT, INSERT, UPDATE, DELETE ON buddygiftfy.* TO 'buddygiftfy'@'127.0.0.1';
```

หากใช้ MySQL client อยู่ พิมพ์ `EXIT;` เพื่อกลับ Terminal ก่อนทำขั้นตอนถัดไป

## 2. ติดตั้งและตั้งค่า backend

จากโฟลเดอร์หลักของโปรเจกต์:

```sh
cd sec2_gr8_ws_src
npm ci
```

คัดลอก `.env.example` เป็น `.env`:

```sh
cp .env.example .env
```

บน Windows Command Prompt ใช้ `copy .env.example .env` หรือคัดลอกผ่าน File Explorer; PowerShell ใช้ `Copy-Item .env.example .env`

เปิดไฟล์ `.env` ในโฟลเดอร์ backend แล้วตั้งค่าต่อไปนี้ให้ตรงกับ MySQL ของเครื่อง:

```dotenv
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=buddygiftfy
DB_USER=buddygiftfy
DB_PASSWORD=ChooseYourOwnDatabasePassword
SESSION_COOKIE_SECURE=false
```

DB_PASSWORD ต้องตรงกับรหัสที่กำหนดตอน CREATE USER หาก MySQL ใช้พอร์ตอื่น ให้แก้ DB_PORT ตามจริง เมื่อนำเข้า SQL ตัวอย่างแล้ว **ไม่ต้องรัน db:seed ซ้ำ**

## 3. เปิด API — Terminal แรก

เมื่ออยู่ใน `sec2_gr8_ws_src`:

```sh
node --env-file=.env src/server.js
```

ตรวจที่ [API health](http://localhost:3001/api/health) ต้องได้ JSON ที่มี `ok: true` พร้อมชื่อและเวอร์ชันฐานข้อมูล ปล่อย Terminal นี้เปิดไว้

## 4. เปิดหน้าบ้าน — Terminal ที่สอง

เปิด Terminal ใหม่ โดยเริ่มที่โฟลเดอร์หลักของโปรเจกต์ แล้วพิมพ์:

```sh
cd sec2_gr8_fe_src
node server.js
```

Frontend ใช้ Node.js built-in modules จึงไม่ต้อง `npm install` ในโฟลเดอร์นี้

- หน้าร้าน: [http://localhost:3000](http://localhost:3000)
- ผู้ดูแล: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

ใช้ hostname `localhost` ตามค่าที่ตั้งไว้ทั้งสองฝั่ง กด **Ctrl+C** ใน Terminal ของโปรแกรมนั้นเมื่อต้องการหยุด

## บัญชีสาธิตสำหรับตรวจงาน

บัญชีต่อไปนี้ใช้กับฐานข้อมูลที่นำเข้าจาก `sec2_gr8_database.sql`:

| บทบาท | อีเมล | รหัสผ่านสาธิต |
|---|---|---|
| Owner | owner@example.test | DemoGiftfy!2026Secure |
| Manager | manager@example.test | DemoGiftfy!2026Secure |
| Editor | editor@example.test | DemoGiftfy!2026Secure |

บัญชีลูกค้าสามารถสมัครใหม่ผ่านหน้าเว็บไซต์ได้ บัญชีในตารางเป็นข้อมูลสาธิตสำหรับโครงงาน

## แนวทางทดลองฟังก์ชัน

1. เปิดหน้าร้าน ค้นหาแบบไม่ใส่เกณฑ์ และทดลองรวมคำค้น หมวดหมู่ และช่วงราคา แล้วเปิดรายละเอียดสินค้า
2. เข้า Owner ทดลองค้นหา เพิ่ม แก้ไข และลบสินค้า/บัญชีผู้ดูแล โดยยืนยัน SKU หรืออีเมลก่อนลบ
3. ทดลองเพิ่ม แก้ไข และลบหมวดหมู่ หมวดที่มีสินค้าต้องเลือกหมวดปลายทางก่อนลบ
4. เปิด About Us เพื่อตรวจข้อมูล รูป และ Instagram ของสมาชิกทั้งห้าคน
5. เปิดหน้าเทียบงบของขวัญเพื่อเรียก Public API ต้องใช้อินเทอร์เน็ต
6. หากทดลองซื้อ ให้ Owner ตั้งค่าธนาคารรับโอนใน “ตั้งค่าร้าน” ให้ครบก่อน แล้วสมัครลูกค้า เพิ่มสินค้าในตะกร้า สั่งซื้อ และแนบสลิป โดยใช้ข้อมูล/ภาพสาธิตในการตรวจงาน
7. เข้า Owner หรือ Manager เพื่อตรวจหลักฐาน อนุมัติ/ปฏิเสธ แล้วเปลี่ยนสถานะเตรียมสินค้า จัดส่ง และเสร็จสิ้น

การตรวจเงินเป็นการตรวจโดยผู้ดูแล ไม่มีการติดต่อธนาคารอัตโนมัติ สินค้าที่มีประวัติคำสั่งซื้อใช้การซ่อนแทนการลบเพื่อรักษาประวัติ

## แคตตาล็อกสาธิต

ไฟล์ SQL มีสินค้า 25 รายการใน 5 หมวด มีทั้งพร้อมส่งและหมดชั่วคราว เปิด /shop เพื่อดูสินค้าทั้งสามหน้า หรือลองค้น `เซรามิก` พร้อมหมวดของขวัญสั่งทำและงบไม่เกิน 300 บาท

ถ้ามีฐานข้อมูลสาธิตจากรุ่นก่อนแล้ว ใช้ `npm run db:seed-catalog` จาก `sec2_gr8_ws_src` หลังเช็กว่า `.env` ชี้ไปฐานข้อมูลสาธิต คำสั่งเติมสินค้าที่ขาดและเปลี่ยนเฉพาะรูปที่ยังใช้ SVG เดิมของชุดสาธิต โดยเก็บราคา สต็อก และรูปที่เปลี่ยนเองไว้

เครดิตภาพรวมอยู่ที่ [/references บนเว็บ](http://localhost:3000/references) และ [แหล่งภาพ 25 รายการ](docs/REFERENCES.md#แหล่งภาพสินค้าสาธิต)

## เอกสารและการทดสอบ

- [รายงาน Phase I และ II (PDF)](sec2_gr8_report.pdf) — บันทึกผลจากชุดสาธิตเดิม 20 รายการ ส่วนเครดิตแคตตาล็อกปัจจุบันอยู่ใน [REFERENCES.md](docs/REFERENCES.md)
- [คู่มือติดตั้งฉบับเต็ม](docs/INSTALLATION.md)
- [แผนผังหน้าเว็บ](docs/HTML-PAGE-MAP.md) และ [บริการ Frankfurter](docs/PUBLIC-API-TH.md)
- [รายละเอียด API](docs/API.md) และ [ผลทดสอบแยกรายบริการ](docs/SERVICE-COVERAGE.md)
- [แหล่งอ้างอิงและการใช้ AI](docs/REFERENCES.md)

หากต้องการทดสอบ API ให้เปิด API server แล้วนำเข้า [Postman collection](docs/postman/sec2_gr8.postman_collection.json) และ [environment](docs/postman/local.postman_environment.json) ตั้ง `baseUrl` ให้ตรงกับ API และใช้บัญชีสาธิตตามคู่มือติดตั้ง

## การใช้ Generative AI

ใช้ OpenAI Codex ช่วยวางโครงสร้าง เขียน/แก้โค้ด ทดสอบ และเตรียมเอกสาร รายละเอียดอยู่ในรายงานและ REFERENCES.md สมาชิกควรอ่าน ตรวจสอบ และเข้าใจโค้ดก่อนนำเสนอ
