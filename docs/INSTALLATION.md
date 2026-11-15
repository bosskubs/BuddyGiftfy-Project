> คู่มือติดตั้ง BuddyGiftfy สำหรับชุดส่ง ITDS242 Phase II ตรวจวันที่ 9 พฤศจิกายน 2569 เริ่มคำสั่งจากโฟลเดอร์หลักของ repository เว้นแต่ระบุให้เข้าโฟลเดอร์ย่อย

# BuddyGiftfy — ITDS242 Phase II, Section 2 Group 8

เว็บร้านของขวัญ HTML/CSS/JavaScript ที่แยก frontend server และ Node.js JSON API server เชื่อม **MySQL 8** จริง หน้าบ้านเรียกบริการด้วย fetch มี public API เทียบงบของขวัญ และมีระบบร้านเดิมครบ


## โครงสร้างปัจจุบัน

- `sec2_gr8_fe_src/` — HTML, CSS, JavaScript, รูปและฟอนต์; เซิร์ฟเวอร์หน้าบ้าน
- `sec2_gr8_ws_src/` — Node.js API, business logic, migrations; เซิร์ฟเวอร์หลังบ้าน
- `sec2_gr8_database.sql` — schema และข้อมูลตัวอย่างจาก MySQL ไม่มีข้อมูลลูกค้า สลิป หรือบัญชีจริงของร้าน
- `sec2_gr8_report.pdf` — รายงาน Phase I และ II ที่หน้าแรกของ repository
- `docs/postman/` — collection และ environment สำหรับ Postman
- `docs/API.md` — endpoint, JSON, CSRF/cookie และวิธีทดสอบ
- `readme.txt` ที่โฟลเดอร์หลัก — สำเนาคู่มือติดตั้งฉบับข้อความ

ตัวงานสำหรับติดตั้งใหม่ใช้สองโฟลเดอร์ซอร์ส, SQL ตัวอย่าง และ docs พร้อม README/readme.txt ไม่ต้องยก node_modules หรือ runtime จากเครื่องเดิมไป เครื่องใหม่ต้องติดตั้ง Node.js/MySQL และ dependency เอง ข้อมูลร้านล่าสุดและไฟล์อัปโหลดต้องสำรองแยกต่างหาก

## ติดตั้งบนเครื่องใหม่ / เครื่องอาจารย์

ต้องมี Node.js 22 ขึ้นไป และ MySQL Server 8 เปิดอยู่ ตรวจด้วย `node -v`, `npm -v`, `mysql --version` เครื่องมือ MySQL Workbench เป็นตัวจัดการฐานข้อมูล ไม่ใช่ตัวเซิร์ฟเวอร์ฐานข้อมูล

### 1. นำเข้าฐานข้อมูลตัวอย่าง

ใช้ MySQL ที่ยังไม่มีฐานข้อมูล `buddygiftfy`  โดยเก็บฐานข้อมูลเดิมก่อนหากมีอยู่แล้ว จากโฟลเดอร์โครงการ:

```sh
mysql --default-character-set=utf8mb4 -u root -p < sec2_gr8_database.sql
```

`-p` ให้พิมพ์รหัส root ของ MySQL บนเครื่องนั้นเมื่อโปรแกรมถาม SQL ระบุ `CREATE DATABASE` และ `USE buddygiftfy` ไว้ จึงนำเข้า `buddygiftfy` เสมอ แม้เลือกฐานข้อมูลอื่นในโปรแกรมไว้ หากต้องการใช้ชื่ออื่น ต้องแก้สองบรรทัดนี้ในสำเนา SQL และตั้ง DB_NAME ให้ตรง ห้ามนำเข้าซ้ำในฐานข้อมูลเดิมเพราะมี INSERT ที่อาจชนรหัสเดิม

ระบุ `--default-character-set=utf8mb4` ทุกครั้งที่นำเข้า เพื่อให้ MySQL อ่านไฟล์ SQL แบบ UTF-8 ได้ถูกต้อง ตัวอักษรอย่าง `à¸` ในชื่อสินค้าและหมวดหมู่เกิดจากการอ่านข้อมูลด้วยชุดอักขระผิดตอนนำเข้า

- **PowerShell หรือ MySQL client แบบโต้ตอบ** เปิดด้วย `mysql --default-character-set=utf8mb4 -u root -p` แล้วใช้ `SOURCE /absolute/path/sec2_gr8_database.sql;` เปลี่ยนเป็นพาธจริงของไฟล์ เช่น `C:/BuddyGiftfy/sec2_gr8_database.sql` บน Windows
- **MySQL Workbench** เปิดไฟล์ SQL เป็น UTF-8 แล้วรัน `SET NAMES utf8mb4;` ใน session เดียวกันก่อนรันสคริปต์
- หลังนำเข้า เช็กชื่อหมวดหมู่ด้วย `SELECT name FROM buddygiftfy.categories;` ควรอ่านได้เป็นภาษาไทย เช่น “ของขวัญสั่งทำ” และ “ตุ๊กตา” หากข้อมูลเดิมเพี้ยนไปแล้ว ให้สำรองข้อมูลก่อน สำหรับฐานข้อมูลสาธิตให้ทดสอบนำเข้าใหม่บน MySQL ที่ยังไม่มีฐานข้อมูลชื่อนี้ การเพิ่มตัวเลือกมีผลกับการนำเข้าครั้งใหม่เท่านั้น

สร้างผู้ใช้สำหรับแอปใน MySQL (เปลี่ยนรหัสตัวอย่างเป็นของเครื่องตนเอง):

```sql
CREATE USER 'buddygiftfy'@'127.0.0.1' IDENTIFIED BY 'ChooseYourOwnDatabasePassword';
GRANT SELECT, INSERT, UPDATE, DELETE ON buddygiftfy.* TO 'buddygiftfy'@'127.0.0.1';
```

### 2. ตั้งค่าและติดตั้ง backend

```sh
cd sec2_gr8_ws_src
npm ci
cp .env.example .env
```

บน Windows คัดลอกไฟล์ด้วย File Explorer หรือ `copy .env.example .env` ใน Command Prompt แล้วเปิด `.env` แก้ `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` ให้ตรงกับ MySQL ของเครื่องนั้น ค่าเริ่มต้นพอร์ตฐานข้อมูลคือ 3306, API คือ 3001, frontend คือ 3000

```dotenv
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=buddygiftfy
DB_USER=buddygiftfy
DB_PASSWORD=ChooseYourOwnDatabasePassword
```

### 3. เปิด API server — Terminal แรก

อยู่ใน `sec2_gr8_ws_src` แล้วรัน:

```sh
node --env-file=.env src/server.js
```

เปิด `http://localhost:3001/api/health` ควรได้ JSON ที่มี `ok: true` และ version ของ MySQL

### 4. เปิด frontend server — Terminal ที่สอง

เปิด Terminal ใหม่ที่โฟลเดอร์หลัก BuddyGiftfy ก่อน (อย่าเริ่มจาก sec2_gr8_ws_src):

```sh
cd sec2_gr8_fe_src
node server.js
```

ตรวจ proxy ที่ `http://localhost:3000/api/health` ให้ได้ `ok: true` ด้วย

ไม่ต้องติดตั้ง dependency ของ frontend เพราะใช้ HTML/CSS/JavaScript และ Node built-in modules เปิด `http://localhost:3000/` ส่วนผู้ดูแลคือ `http://localhost:3000/admin/login` ปล่อยสอง Terminal เปิดไว้ กด Ctrl+C ในหน้าที่เปิดโปรแกรมเมื่อต้องการหยุดโปรแกรมนั้น

### 5. บัญชีสาธิตใน SQL

| บทบาท | อีเมล | รหัสผ่านสาธิต |
|---|---|---|
| Owner | owner@example.test | DemoGiftfy!2026Secure |
| Manager | manager@example.test | DemoGiftfy!2026Secure |
| Editor | editor@example.test | DemoGiftfy!2026Secure |

บัญชีเหล่านี้เป็นข้อมูลสาธิตสำหรับตรวจงาน ไม่มีรหัสบัญชีจริงของร้านอยู่ในชุดส่ง เมื่อใช้เป็นร้านจริงให้สร้างบัญชีและตั้งรหัสของตนเอง

## แคตตาล็อกสาธิต 25 รายการ

การนำเข้า SQL ใหม่มีสินค้า 25 รายการ ครอบคลุม 5 หมวด ราคา 89–1,590 บาท และมีตัวอย่างหมดชั่วคราว เปิด /shop แล้วลองค้นชื่อ กรองหมวด/ราคา และลองแบ่งหน้า (ชุดสาธิตมี 3 หน้า) หน้า /references รวมเครดิตภาพทั้งหมด พร้อม `docs/REFERENCES.md` สำหรับตารางแหล่งภาพสินค้า

สำหรับฐานข้อมูลสาธิตเดิม ให้ตรวจ DB_NAME และค่าการเชื่อมต่อใน .env ก่อน จากโฟลเดอร์ backend รันคำสั่งนี้เพื่อเพิ่มรายการที่ยังไม่มี

```sh
npm run db:seed-catalog
```

คำสั่งเปลี่ยนเฉพาะรูปที่ยังใช้ SVG เดิมของชุดสาธิต รักษาราคา สต็อก และรูปที่เปลี่ยนเอง และรันซ้ำได้ ใช้เฉพาะกับฐานข้อมูลสาธิตที่ตั้งใจเติมตัวอย่าง

## ทดลองใช้งาน

1. เข้า Owner -> ตั้งค่าร้าน ใส่บัญชีรับโอน ค่าส่ง และค่าห่อของขวัญของร้านให้ครบ การ checkout จะปิดจนกว่าจะตั้งธนาคารครบ ไม่มีบัญชีสมมติให้ลูกค้าโอน
2. หมวดหมู่: เพิ่ม แก้ชื่อ เรียงลำดับ ตั้งงานสั่งทำ; ลบหมวดที่มีสินค้าต้องเลือกย้ายสินค้าไปหมวดอื่น
3. สินค้า: ค้นหาด้วยคำค้น/หมวด/สถานะพร้อมกัน เพิ่ม แก้ไข อัปโหลดภาพ ซ่อน และลบ สินค้าที่เคยอยู่ในออเดอร์ให้ซ่อนเพื่อเก็บประวัติ
4. ทีมผู้ดูแล: ค้นหาด้วยคำค้น/บทบาท/สถานะ เพิ่ม แก้ไข และลบโดยยืนยันอีเมล ป้องกันลบบัญชีที่ใช้และ Owner คนสุดท้าย
5. ฝั่งลูกค้า: ค้นหาอย่างน้อย 3 เกณฑ์ บันทึกที่ชอบ ตะกร้า สมัคร/ล็อกอิน checkout แนบสลิป ติดตามออเดอร์
6. ร้านตรวจยอดเข้าบัญชีจริงแล้วอนุมัติ/ขอหลักฐานใหม่ จากนั้นเตรียมและกรอกขนส่ง/เลขพัสดุ การตรวจเงินทำโดยคน
7. หน้า “เทียบงบของขวัญ” เรียก Frankfurter public API ผ่าน fetch โดยตรง ข้อมูลมีวันที่อ้างอิงและข้อความเมื่อบริการขัดข้อง ยอดชำระร้านเป็นเงินบาท
8. About Us และทีมมีชื่อ รหัส รูป และ IG ของสมาชิกทั้ง 5 คน

## การตั้งค่าเพิ่มเติม

- ถ้าใช้ `127.0.0.1:3000` แทน `localhost:3000` ให้เพิ่ม origin นั้นใน `FRONTEND_ORIGIN` โดยคั่นด้วย comma ทั้งหน้าเว็บและ API ควรใช้ hostname เดียวกันเพื่อให้ cookie ทำงาน
- ตามค่าเริ่มต้น browser เรียก `/api/...` จากที่อยู่เดียวกับหน้าเว็บ และ frontend ส่งต่อไปที่ `http://127.0.0.1:3001` ถ้า API อยู่คนละเครื่องหรือพอร์ต ให้ตั้ง `API_UPSTREAM` ตอนเปิด frontend ให้เป็นที่อยู่ที่ frontend ติดต่อได้ ปล่อย `API_ORIGIN` ว่างเพื่อใช้ proxy; ตัวเลือกนี้ใช้เฉพาะกรณีตั้งใจให้ browser เรียก API แยกโดยตรง
- เมื่อใช้ Nginx Proxy Manager ให้ส่งคำขอทั้งโดเมนรวมถึง `/api/` ไปที่ frontend พอร์ต 3000 เพิ่ม origin แบบเต็ม เช่น `https://buddygiftfy.suraknet.space` ใน `FRONTEND_ORIGIN` ของ backend แล้วเปิดทั้งสองเซิร์ฟเวอร์ใหม่ ถ้าให้บริการผ่าน HTTPS เท่านั้น ให้ตั้ง `SESSION_COOKIE_SECURE=true` ที่ backend ด้วย ตรวจด้วยการเปิด `/api/health` ต่อท้ายโดเมนและลองล็อกอิน
- `DB_SOCKET_PATH` ใช้เฉพาะกรณี Unix socket ปกติปล่อยว่างเพื่อเชื่อม host/port
- สลิปเก็บโดยปริยายใน `sec2_gr8_ws_src/work/runtime/payment-proofs` (เปลี่ยนได้ด้วย PROOF_DIRECTORY); ภาพสินค้าที่อัปโหลดอยู่ `sec2_gr8_ws_src/public/images/uploads` ทั้งสองอย่างไม่รวมอยู่ใน SQL ตัวอย่าง
- เซสชันใช้ HttpOnly cookie และ CSRF; รหัสผ่านใช้ scrypt ไม่เก็บ plaintext; SQL ใช้ parameter binding
- ระบบปัจจุบันรัน backend หนึ่ง process ก่อนใช้หลาย instance ต้องมี shared session locking และ shared upload storage
- การเปิดผ่านอินเทอร์เน็ตต้องมี hosting/HTTPS และตั้ง cookie ตาม deployment; ชุดนี้ทดสอบ local frontend/backend ไม่ได้เผยแพร่ขึ้นอินเทอร์เน็ต

## พัฒนาและ migrations

ไฟล์ตั้งต้นแยกไว้ใน `sec2_gr8_ws_src/migrations/` ถ้านำเข้า SQL แล้ว migrations ถูกบันทึกว่าทำแล้ว ไม่ต้อง migrate หรือ seed เพื่อเปิดร้านตามปกติ แม้รัน migrations ซ้ำ ตัว runner ยังต้องมี CREATE เพื่อจัดการตารางบันทึก migration การอัปเดต schema ต้องใช้บัญชีสิทธิ์ที่เพียงพอตาม SQL เช่น CREATE/ALTER/INDEX/REFERENCES และสิทธิ์อ่านเขียน เริ่มจากโฟลเดอร์หลักแล้วเข้า backend ก่อน:

```sh
cd sec2_gr8_ws_src
npm run db:migrate
```

สำหรับติดตั้งจาก migrations แทน SQL ให้สร้าง schema ด้วย `001_init.sql`, รัน migrations ที่เหลือ แล้วตั้ง ADMIN_EMAIL/ADMIN_PASSWORD (รหัสอย่างน้อย 14 ตัวอักษร) ใน `.env` และ `npm run db:seed` ใช้วิธีใดวิธีหนึ่งในการติดตั้งครั้งแรก

## หลักฐานและการทดสอบ

ผลการทดสอบอยู่ในรายงาน PDF และ `docs/SERVICE-COVERAGE.md`

Postman: import collection และ environment ใน `docs/postman`, เลือก environment, ตั้ง baseUrl ของ API, ใช้บัญชีสาธิตและ Run Collection cookie/CSRF จะถูกจัดการตามลำดับ collection เพิ่ม/แก้ไข/ลบข้อมูลทดสอบ และเปลี่ยนชื่อ/ย้ายสินค้าในหมวดสาธิตก่อนคืนชื่อหมวด จึงควรรันกับฐานข้อมูลสาธิตแยกจากร้านจริง

## สำรองข้อมูลร้านจริง

SQL ที่ให้เป็นข้อมูลสาธิต ไม่ใช่ข้อมูลล่าสุดของเครื่องนี้ หากต้องย้ายร้านจริง ให้หยุดการเขียนข้อมูลชั่วคราว สำรองฐานข้อมูลด้วยเครื่องมือ MySQL ของเครื่องนั้น และเก็บสองโฟลเดอร์ไฟล์อัปโหลดที่ระบุข้างต้น รวมถึงค่าตั้งส่วนตัวแยกไว้ ไม่ใส่ข้อมูลจริงลงชุดส่งงาน

มีคำสั่ง `npm run db:backup` เมื่ออยู่ใน backend ซึ่งใช้ `.env` ของ backend และบันทึก SQL โดยปริยายที่ `sec2_gr8_ws_src/work/runtime/backups` เมื่อรันจากโฟลเดอร์นั้น (เปลี่ยนปลายทางได้ด้วย BACKUP_DIR) ไม่รวม sessions และไม่รวมไฟล์ภาพ/สลิป จึงไม่ใช่สำรองทั้งระบบ

## ตัวอย่างและหลักฐานบริการครบชุด

`docs/API.md` มีตัวอย่างสองชุดต่อบริการ 69 รายการ ผลแยกรายบริการอยู่ใน `docs/SERVICE-COVERAGE.md`

## แหล่งอ้างอิงและการใช้ AI

ข้อกำหนด: 69-1-ITDS242-Project Phase II.pdf ของรายวิชา; ดีไซน์และภาพจาก Figma BuddyGiftfy และ webproject.pdf ที่ทีมส่ง; รายชื่อ/IG จากข้อมูลสมาชิกที่ผู้ใช้ให้ ดู `docs/REFERENCES.md` และข้อความเปิดเผยการใช้ OpenAI Codex ในรายงาน ไม่มีการอ้างว่าโค้ดหรือรายงานทั้งหมดเขียนโดยสมาชิกด้วยตนเอง

## โครงหน้า HTML ปัจจุบัน

หน้าเว็บมีไฟล์ .html จริง 39 หน้าใน frontend/public พร้อมฟอร์มและ template รายการ JavaScript อยู่ public/js/pages และ shared อ่านข้อมูลจาก endpoint เฉพาะหน้า เช่น /api/store/products ดู docs/HTML-PAGE-MAP.md ส่วน URL เดิม redirect ไป URL ปัจจุบัน พร้อมเก็บ query/next ไม่มีการเปิดทุก URL ด้วย index.html เดียว


## เกณฑ์รหัสผ่านตามฟอร์มปัจจุบัน

- สมัครลูกค้า: 12–256 ตัวอักษร พร้อมยืนยันให้ตรงกัน
- เปลี่ยนรหัสผ่านตนเองทั้งลูกค้า/แอดมิน: 12–256 ตัวอักษร ตรวจรหัสเดิมและช่องยืนยัน
- Owner เพิ่มผู้ดูแลหรือกำหนดรหัสใหม่ในหน้าแก้บัญชีผู้ดูแล: 14–256 ตัวอักษร
- Seed ผู้ดูแลครั้งแรก: ADMIN_PASSWORD อย่างน้อย 14 ตัวอักษร (ตัว hash รองรับสูงสุด 256)

เกณฑ์แต่ละ flow ต่างกันตาม server.js, admin-routes.js, shop-routes.js และ seed.js รหัสในตัวอย่างทดสอบเลือกอย่างน้อย 14 ตัวอักษรเพื่อใช้ได้กับทุก flow
