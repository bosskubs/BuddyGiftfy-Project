# BuddyGiftfy — Node.js API และ MySQL

ใช้ Node.js 22 ขึ้นไป และ MySQL 8 อ่าน [README หลัก](../README.md) หรือ [ขั้นตอนติดตั้ง](../docs/INSTALLATION.md) ก่อน เริ่มจากนำเข้า `sec2_gr8_database.sql` ใน MySQL สำหรับสาธิตโดยระบุ `--default-character-set=utf8mb4` ตอนเรียก MySQL client แล้วใช้คำสั่งในโฟลเดอร์นี้:

```sh
npm ci
cp .env.example .env
```

Windows Command Prompt ใช้ `copy .env.example .env`; PowerShell ใช้ `Copy-Item .env.example .env` จากนั้นเปิด .env ตั้ง DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD ให้ตรงกับเครื่อง และ FRONTEND_ORIGIN ให้ตรงหน้าบ้าน แล้วเปิด API:

```sh
node --env-file=.env src/server.js
```

ค่าเริ่มต้น API คือ 3001 ตรวจ [API health](http://localhost:3001/api/health) แล้วเปิด frontend อีก Terminal ตามคู่มือ

`src/service-contract.js` จับ URL/method ไปยัง route ที่ทำงานจริงใน server.js, shop-routes.js, admin-routes.js และ category-routes.js `view-data.js` จัด JSON ชื่อช่องให้ controller ไม่มี HTML ใน API

ตัวอย่าง method/URL/JSON อย่างน้อยสองชุดอยู่เหนือโค้ดบริการตาม `docs/service-example-locations.json` ไม่ได้รวมอยู่ใน service-contract.js ไฟล์เดียว ดู [API](../docs/API.md), [ผลทดสอบ](../docs/SERVICE-COVERAGE.md) และ [แผนผังหน้า](../docs/HTML-PAGE-MAP.md)

หลังนำเข้า SQL สาธิตไม่ต้อง seed ซ้ำ คำสั่ง db:migrate ใช้เปลี่ยน schema และต้องใช้บัญชี MySQL ที่มี CREATE/ALTER/INDEX/REFERENCES ตาม migrations แยกจากบัญชี DML สำหรับเปิดร้านตามคู่มือ

ไฟล์ .env จริง ข้อมูล MySQL, node_modules, ภาพร้านที่อัปโหลดและสลิปจริงเป็นข้อมูลเฉพาะเครื่อง ส่วน .env.example, migrations, ซอร์ส และเอกสารเก็บใน repository ได้
