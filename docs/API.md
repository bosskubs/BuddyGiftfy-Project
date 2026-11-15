# คู่มือ API ของ BuddyGiftfy

ตรวจและสร้างจากซอร์ส/ผลทดสอบปัจจุบันวันที่ 9 พฤศจิกายน 2569 API เรียกตรงได้ที่ http://localhost:3001 ส่วน browser เรียก /api/... ผ่าน frontend ที่ http://localhost:3000 ซึ่งส่งต่อไป backend ตาม API_UPSTREAM

## เริ่มทดสอบ

1. ใช้ฐานข้อมูลสาธิตเท่านั้น คำขอเปลี่ยนข้อมูลจริง
2. GET /api/session แล้วเก็บ bg_session cookie และ session.csrf
3. หลัง login/register/logout ให้ GET /api/session อีกครั้งเพื่อใช้ CSRF ใหม่
4. ใช้บัญชี demo ใน SQL และแทน {{demoPassword}} ตามคู่มือ
5. ID/หมายเลขออเดอร์/token/ไฟล์ภาพต้องมาจากข้อมูลที่สร้างในขั้นก่อน
6. ออเดอร์ตัวอย่าง A/B ใช้คนละรายการเมื่อคำสั่งเปลี่ยนสถานะหรือยกเลิก
7. {{imageDataUrl}} คือ data:image/png;base64,... หรือ JPEG ของไฟล์ไม่เกิน 5 MB ไม่ใช่ข้อความตัวย่อ
8. ตัวอย่างที่จงใจผิดคาดหวัง 4xx; legacy-payment-status คาดหวัง 400 เสมอ

Postman collection หลักใน docs/postman มี 66 requests / 93 assertions สำหรับงานหลักตามโจทย์ ส่วนบริการทั้งหมดรวมบริการเสริมตรวจด้วยชุดทดสอบใน branch พัฒนาที่ใช้ Playwright API request และ Newman จริงกับ MySQL แยก ไม่ได้ใช้ response จำลอง

## ค่าที่ต้องแทนในตัวอย่าง

| ตัวแปร | ได้จากที่ไหน |
|---|---|
| baseUrl | URL ของ API เช่น http://localhost:3001 |
| csrf | session.csrf จาก GET /api/session ของ cookie jar เดียวกัน |
| demoPassword | รหัสสาธิตจาก INSTALLATION.md ใช้กับฐานข้อมูลสาธิต |
| newPassword | รหัสใหม่สำหรับทดสอบอย่างน้อย 14 ตัวอักษร แล้วใช้ค่านั้นเข้าใหม่ |
| id / adminId / productId / otherProductId | รหัสของรายการที่สร้างหรืออ่านจากบริการค้นหา ตามชนิดข้อมูลของ endpoint |
| adminEmail / productSku | อีเมลหรือ SKU ของรายการที่กำลังลบ ใช้ยืนยันให้ตรงจริง |
| orderNumber / otherOrderNumber / paymentId | หมายเลขออเดอร์/รหัส payment ที่สร้างจาก checkout |
| checkoutToken | session.checkoutToken จากหน้า checkout ที่มีตะกร้าไม่ว่าง |
| destinationCategoryId | หมวดปลายทางอื่นก่อนลบหมวดที่มีสินค้า |
| imageDataUrl | ข้อมูลภาพ PNG/JPEG แบบ data URL เต็ม ไม่ใช่ข้อความตัวย่อ |
| imageFilename | ชื่อไฟล์จริงจาก URL ที่บริการอัปโหลดคืน |

ตัวอย่างที่จงใจส่งรหัสผิด CSRF ผิด หรือไฟล์ผิด ต้องได้ 4xx จึงถือว่าระบบป้องกันได้ ส่วนสองตัวอย่างที่เปลี่ยนสถานะควรเตรียมข้อมูลแยกตามเงื่อนไข ไม่ใช้ ID เดียวโดยไม่ตรวจสถานะเดิม

## วิธีรับส่งและผลลัพธ์

- ส่ง body แบบ raw JSON พร้อม Content-Type: application/json และ Accept: application/json
- เก็บ bg_session cookie ของผู้ใช้แต่ละคนแยกกัน; fetch ฝั่ง browser ใช้ credentials: include
- หลัง login/register/logout session และ CSRF จะเปลี่ยน ต้องอ่านใหม่
- หน้าเว็บมีไฟล์ .html จริงและ controller ใน public/js/pages; เรียก GET endpoint เฉพาะหน้า เช่น /api/store/products แล้วเติม DOM ด้วยข้อมูลชื่อช่องใน {ok,data,session,flash}; /api/page เป็นเส้นทางรองรับ URL รุ่นเดิม
- Mutation ทั่วไปตอบ {ok,message,redirect}; redirect เป็นข้อมูลให้ frontend นำทาง
- health ตอบ {ok,database:{version,name}}; upload ตอบ {url} กับ HTTP 201; GET รูป/สลิปตอบ bytes ภาพ
- ไม่ส่ง password_hash หรือ session id กลับใน JSON

| Status | ความหมาย |
|---|---|
| 200 | สำเร็จ |
| 201 | อัปโหลดรูปสำเร็จ |
| 400 | ข้อมูล/คำยืนยันผิด |
| 401 | ต้องล็อกอิน/credentials ไม่ผ่าน |
| 403 | บทบาท/CSRF/origin ไม่ผ่าน |
| 404 | ไม่พบบริการ/ข้อมูล/ไฟล์ |
| 409 | ข้อมูลขัดแย้ง เช่น สต็อก/ประวัติ |
| 413 | body ใหญ่เกินกำหนด |
| 422 | ข้อมูลผิดใน flow ที่ส่งเส้นทางหรือ draft กลับให้แก้ |
| 500 | ข้อผิดพลาดภายใน |

ข้อผิดพลาดใน checkout/review/profile หลายกรณีใช้ 422 ผ่าน flow แจ้งเตือน แม้กฎภายในจะตรวจพบเหตุที่เดิมเป็น 400/409 ให้ยึดผลของ endpoint ภายนอกตาม coverage

## บริการทั้งหมด

นับตามความสามารถและ method/URL หลัก 69 รายการ รวม public rate และ media ที่ใช้งานจริง เส้นทางหน้าเว็บและ read-only aliases ตรวจแยกใน coverage เดียวกัน URL ที่ไม่รองรับไม่ถือเป็นบริการใหม่

### ตรวจ MySQL — health

`GET /api/health` · สิทธิ์: Public

โค้ด: `sec2_gr8_ws_src/src/server.js` (ค้น SERVICE-EXAMPLES-BEGIN health)

ตัวอย่าง 1: `GET {{baseUrl}}/api/health`

ตัวอย่าง 2: `GET {{baseUrl}}/api/health`


### อ่าน session และ CSRF — session

`GET /api/session` · สิทธิ์: Public

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN session)

ตัวอย่าง 1: `GET {{baseUrl}}/api/session`

ตัวอย่าง 2: `GET {{baseUrl}}/api/session`


### ข้อมูลผ่าน URL เดิม (รองรับความเข้ากันได้; หน้า HTML ใหม่ไม่เรียก) — page

`GET /api/page` · สิทธิ์: ตามหน้า

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN page)

ตัวอย่าง 1: `GET {{baseUrl}}/api/page?path=%2Fshop`

ตัวอย่าง 2: `GET {{baseUrl}}/api/page?path=%2Fadmin%2Fproducts`


### เข้าสู่ระบบ — admin-login

`POST /api/auth/admin/login` · สิทธิ์: Public

โค้ด: `sec2_gr8_ws_src/src/server.js` (ค้น SERVICE-EXAMPLES-BEGIN admin-login)

ตัวอย่าง 1: `POST {{baseUrl}}/api/auth/admin/login`

```json
{
  "_csrf": "{{csrf}}",
  "email": "owner@example.test",
  "password": "{{demoPassword}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/auth/admin/login`

```json
{
  "_csrf": "{{csrf}}",
  "email": "owner@example.test",
  "password": "wrong-password"
}
```


### เข้าสู่ระบบ — customer-login

`POST /api/auth/login` · สิทธิ์: Public

โค้ด: `sec2_gr8_ws_src/src/server.js` (ค้น SERVICE-EXAMPLES-BEGIN customer-login)

ตัวอย่าง 1: `POST {{baseUrl}}/api/auth/login`

```json
{
  "_csrf": "{{csrf}}",
  "email": "buyer@example.test",
  "password": "{{demoPassword}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/auth/login`

```json
{
  "_csrf": "{{csrf}}",
  "email": "buyer@example.test",
  "password": "wrong-password"
}
```


### สมัครลูกค้า — register

`POST /api/auth/register` · สิทธิ์: Public

โค้ด: `sec2_gr8_ws_src/src/server.js` (ค้น SERVICE-EXAMPLES-BEGIN register)

ตัวอย่าง 1: `POST {{baseUrl}}/api/auth/register`

```json
{
  "_csrf": "{{csrf}}",
  "first_name": "Gift",
  "last_name": "Buyer",
  "email": "buyer-a@example.test",
  "password": "{{demoPassword}}",
  "password_confirm": "{{demoPassword}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/auth/register`

```json
{
  "_csrf": "{{csrf}}",
  "first_name": "Buddy",
  "last_name": "Buyer",
  "email": "buyer-b@example.test",
  "password": "{{demoPassword}}",
  "password_confirm": "{{demoPassword}}"
}
```


### ออกจากระบบ — logout

`POST /api/logout` · สิทธิ์: Session

โค้ด: `sec2_gr8_ws_src/src/server.js` (ค้น SERVICE-EXAMPLES-BEGIN logout)

ตัวอย่าง 1: `POST {{baseUrl}}/api/logout`

```json
{
  "_csrf": "{{csrf}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/logout`

```json
{
  "_csrf": "invalid-token"
}
```


### ออกจากระบบ — admin-logout

`POST /api/admin/logout` · สิทธิ์: Session

โค้ด: `sec2_gr8_ws_src/src/server.js` (ค้น SERVICE-EXAMPLES-BEGIN admin-logout)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/logout`

```json
{
  "_csrf": "{{csrf}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/logout`

```json
{
  "_csrf": "invalid-token"
}
```


### ค้นหาทั้งหมด/รวม 3 เกณฑ์ — product-list

`GET /api/admin/products` · สิทธิ์: Owner/Manager/Editor

โค้ด: `sec2_gr8_ws_src/src/admin-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN product-list)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/products`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/products?q=Gift&category=ตุ๊กตา&status=Available`


### อ่านข้อมูลหนึ่งรายการ — product-detail

`GET /api/admin/products/:id` · สิทธิ์: Owner/Manager/Editor

โค้ด: `sec2_gr8_ws_src/src/admin-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN product-detail)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/products/{{productId}}`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/products/99999999`


### เพิ่มข้อมูล — product-insert

`POST /api/admin/products` · สิทธิ์: Owner/Manager/Editor

โค้ด: `sec2_gr8_ws_src/src/admin-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN product-insert)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/products`

```json
{
  "_csrf": "{{csrf}}",
  "name": "Gift A",
  "category": "ตุ๊กตา",
  "description": "ของขวัญสาธิต",
  "price": "250.50",
  "stock_quantity": "5",
  "image_url": "/images/product-placeholder.svg",
  "status": "Available"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/products`

```json
{
  "_csrf": "{{csrf}}",
  "name": "Gift B",
  "category": "ตุ๊กตา",
  "description": "ของขวัญสาธิต",
  "price": "250.50",
  "stock_quantity": "5",
  "image_url": "/images/product-placeholder.svg",
  "status": "Available"
}
```


### แก้ไขข้อมูล — product-update

`PUT /api/admin/products/:id` · สิทธิ์: Owner/Manager/Editor

โค้ด: `sec2_gr8_ws_src/src/admin-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN product-update)

ตัวอย่าง 1: `PUT {{baseUrl}}/api/admin/products/{{id}}`

```json
{
  "_csrf": "{{csrf}}",
  "name": "Gift A",
  "category": "ตุ๊กตา",
  "description": "ของขวัญสาธิต",
  "price": "399.25",
  "stock_quantity": "5",
  "image_url": "/images/product-placeholder.svg",
  "status": "Available"
}
```

ตัวอย่าง 2: `PUT {{baseUrl}}/api/admin/products/{{id}}`

```json
{
  "_csrf": "{{csrf}}",
  "name": "Gift A",
  "category": "ตุ๊กตา",
  "description": "ของขวัญสาธิต",
  "price": "399.25",
  "stock_quantity": "8",
  "image_url": "/images/product-placeholder.svg",
  "status": "Available"
}
```


### ลบข้อมูลพร้อมคำยืนยัน — product-delete

`DELETE /api/admin/products/:id` · สิทธิ์: Owner/Manager/Editor

โค้ด: `sec2_gr8_ws_src/src/admin-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN product-delete)

ตัวอย่าง 1: `DELETE {{baseUrl}}/api/admin/products/{{id}}`

```json
{
  "_csrf": "{{csrf}}",
  "confirm_sku": "{{productSku}}"
}
```

ตัวอย่าง 2: `DELETE {{baseUrl}}/api/admin/products/{{id}}`

```json
{
  "_csrf": "{{csrf}}",
  "confirm_sku": "wrong"
}
```


### ค้นหาทั้งหมด/รวม 3 เกณฑ์ — admin-list

`GET /api/admin/accounts` · สิทธิ์: Owner

โค้ด: `sec2_gr8_ws_src/src/admin-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN admin-list)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/accounts`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/accounts?q=Demo&role=Editor&status=Active`


### อ่านข้อมูลหนึ่งรายการ — admin-detail

`GET /api/admin/accounts/:id` · สิทธิ์: Owner

โค้ด: `sec2_gr8_ws_src/src/admin-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN admin-detail)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/accounts/{{adminId}}`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/accounts/99999999`


### เพิ่มข้อมูล — admin-insert

`POST /api/admin/accounts` · สิทธิ์: Owner

โค้ด: `sec2_gr8_ws_src/src/admin-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN admin-insert)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/accounts`

```json
{
  "_csrf": "{{csrf}}",
  "first_name": "Demo",
  "last_name": "Editor",
  "email": "editor-a@example.test",
  "role": "Editor",
  "age": "22",
  "address": "ที่อยู่สาธิต กรุงเทพฯ",
  "preferences": "ดูแลสินค้า",
  "password": "{{demoPassword}}",
  "password_confirm": "{{demoPassword}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/accounts`

```json
{
  "_csrf": "{{csrf}}",
  "first_name": "Demo",
  "last_name": "Editor",
  "email": "editor-b@example.test",
  "role": "Editor",
  "age": "22",
  "address": "ที่อยู่สาธิต กรุงเทพฯ",
  "preferences": "ดูแลสินค้า",
  "password": "{{demoPassword}}",
  "password_confirm": "{{demoPassword}}"
}
```


### แก้ไขข้อมูล — admin-update

`PUT /api/admin/accounts/:id` · สิทธิ์: Owner

โค้ด: `sec2_gr8_ws_src/src/admin-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN admin-update)

ตัวอย่าง 1: `PUT {{baseUrl}}/api/admin/accounts/{{id}}`

```json
{
  "_csrf": "{{csrf}}",
  "first_name": "Demo",
  "last_name": "Editor",
  "email": "editor-a@example.test",
  "role": "Manager",
  "age": "22",
  "address": "ที่อยู่สาธิต กรุงเทพฯ",
  "preferences": "ดูแลสินค้า",
  "status": "Active"
}
```

ตัวอย่าง 2: `PUT {{baseUrl}}/api/admin/accounts/{{id}}`

```json
{
  "_csrf": "{{csrf}}",
  "first_name": "Demo",
  "last_name": "Editor",
  "email": "editor-a@example.test",
  "role": "Manager",
  "age": "23",
  "address": "ที่อยู่สาธิต กรุงเทพฯ",
  "preferences": "ดูแลสินค้า",
  "status": "Active"
}
```


### ลบข้อมูลพร้อมคำยืนยัน — admin-delete

`DELETE /api/admin/accounts/:id` · สิทธิ์: Owner

โค้ด: `sec2_gr8_ws_src/src/admin-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN admin-delete)

ตัวอย่าง 1: `DELETE {{baseUrl}}/api/admin/accounts/{{id}}`

```json
{
  "_csrf": "{{csrf}}",
  "confirm_email": "{{adminEmail}}"
}
```

ตัวอย่าง 2: `DELETE {{baseUrl}}/api/admin/accounts/{{id}}`

```json
{
  "_csrf": "{{csrf}}",
  "confirm_email": "wrong@example.test"
}
```


### ซ่อนสินค้า — product-hide

`POST /api/admin/products/:id/hide` · สิทธิ์: Owner/Manager/Editor

โค้ด: `sec2_gr8_ws_src/src/admin-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN product-hide)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/products/{{id}}/hide`

```json
{
  "_csrf": "{{csrf}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/products/{{id}}/hide`

```json
{
  "_csrf": "{{csrf}}"
}
```


### อัปโหลดรูปสินค้า — product-image

`POST /api/admin/product-image` · สิทธิ์: Owner/Manager/Editor

โค้ด: `sec2_gr8_ws_src/src/admin-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN product-image)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/product-image`

```json
{
  "_csrf": "{{csrf}}",
  "image": "{{imageDataUrl}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/product-image`

```json
{
  "_csrf": "{{csrf}}",
  "image": "not-an-image"
}
```


### อ่านหมวดหมู่ — category-list

`GET /api/admin/categories` · สิทธิ์: Owner/Manager

โค้ด: `sec2_gr8_ws_src/src/category-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN category-list)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/categories`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/categories`


### เพิ่มหมวดหมู่ — category-insert

`POST /api/admin/categories/new` · สิทธิ์: Owner/Manager

โค้ด: `sec2_gr8_ws_src/src/category-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN category-insert)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/categories/new`

```json
{
  "_csrf": "{{csrf}}",
  "name": "Birthday",
  "sort_order": "1",
  "is_custom": "0"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/categories/new`

```json
{
  "_csrf": "{{csrf}}",
  "name": "Anniversary",
  "sort_order": "2",
  "is_custom": "1"
}
```


### แก้ไขหมวดหมู่ — category-update

`POST /api/admin/categories/:id/edit` · สิทธิ์: Owner/Manager

โค้ด: `sec2_gr8_ws_src/src/category-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN category-update)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/categories/{{id}}/edit`

```json
{
  "_csrf": "{{csrf}}",
  "name": "Birthday gifts",
  "sort_order": "3",
  "is_custom": "0"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/categories/{{id}}/edit`

```json
{
  "_csrf": "{{csrf}}",
  "name": "Custom gifts",
  "sort_order": "4",
  "is_custom": "1"
}
```


### ลบ/ย้ายหมวดหมู่ — category-delete

`POST /api/admin/categories/:id/delete` · สิทธิ์: Owner/Manager

โค้ด: `sec2_gr8_ws_src/src/category-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN category-delete)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/categories/{{id}}/delete`

```json
{
  "_csrf": "{{csrf}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/categories/{{id}}/delete`

```json
{
  "_csrf": "{{csrf}}",
  "destination_id": "{{destinationCategoryId}}"
}
```


### เพิ่มสินค้าเข้าตะกร้า — cart-add

`POST /api/cart/add` · สิทธิ์: Session

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN cart-add)

ตัวอย่าง 1: `POST {{baseUrl}}/api/cart/add`

```json
{
  "_csrf": "{{csrf}}",
  "product_id": "{{productId}}",
  "quantity": "1"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/cart/add`

```json
{
  "_csrf": "{{csrf}}",
  "product_id": "{{productId}}",
  "quantity": "2",
  "custom_note": "Buddy",
  "gift_wrap": "1"
}
```


### เปลี่ยนจำนวนในตะกร้า — cart-update

`POST /api/cart/update` · สิทธิ์: Session

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN cart-update)

ตัวอย่าง 1: `POST {{baseUrl}}/api/cart/update`

```json
{
  "_csrf": "{{csrf}}",
  "product_id": "{{productId}}",
  "quantity": "2"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/cart/update`

```json
{
  "_csrf": "{{csrf}}",
  "product_id": "{{productId}}",
  "step": "-1"
}
```


### นำสินค้าออกจากตะกร้า — cart-remove

`POST /api/cart/remove` · สิทธิ์: Session

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN cart-remove)

ตัวอย่าง 1: `POST {{baseUrl}}/api/cart/remove`

```json
{
  "_csrf": "{{csrf}}",
  "product_id": "{{productId}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/cart/remove`

```json
{
  "_csrf": "{{csrf}}",
  "product_id": "{{otherProductId}}"
}
```


### บันทึก/นำสินค้าที่ชอบออก — favorite

`POST /api/favorites/toggle` · สิทธิ์: Session

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN favorite)

ตัวอย่าง 1: `POST {{baseUrl}}/api/favorites/toggle`

```json
{
  "_csrf": "{{csrf}}",
  "product_id": "{{productId}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/favorites/toggle`

```json
{
  "_csrf": "{{csrf}}",
  "product_id": "{{otherProductId}}"
}
```


### สร้างออเดอร์และสำรองสต็อก — checkout

`POST /api/checkout` · สิทธิ์: Customer

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN checkout)

ตัวอย่าง 1: `POST {{baseUrl}}/api/checkout`

```json
{
  "_csrf": "{{csrf}}",
  "checkout_token": "{{checkoutToken}}",
  "shipping_name": "Gift Buyer",
  "shipping_phone": "0812345678",
  "shipping_address": "99 Bangkok Thailand",
  "gift_wrap": "1"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/checkout`

```json
{
  "_csrf": "{{csrf}}",
  "checkout_token": "{{checkoutToken}}",
  "shipping_name": "Buddy Buyer",
  "shipping_phone": "0812345678",
  "shipping_address": "99 Bangkok Thailand",
  "gift_wrap": "0"
}
```


### แก้ไขข้อมูลตนเอง — customer-profile

`POST /api/account/profile` · สิทธิ์: Customer

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN customer-profile)

ตัวอย่าง 1: `POST {{baseUrl}}/api/account/profile`

```json
{
  "_csrf": "{{csrf}}",
  "first_name": "Happy",
  "last_name": "Buyer",
  "phone": "0812345678",
  "address": "99 Bangkok Thailand"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/account/profile`

```json
{
  "_csrf": "{{csrf}}",
  "first_name": "Buddy",
  "last_name": "Gift",
  "phone": "0899999999",
  "address": "88 Chiang Mai Thailand"
}
```


### เปลี่ยนรหัสผ่านตนเอง — customer-password

`POST /api/account/password` · สิทธิ์: Customer

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN customer-password)

ตัวอย่าง 1: `POST {{baseUrl}}/api/account/password`

```json
{
  "_csrf": "{{csrf}}",
  "current_password": "{{demoPassword}}",
  "password": "{{newPassword}}",
  "password_confirm": "{{newPassword}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/account/password`

```json
{
  "_csrf": "{{csrf}}",
  "current_password": "wrong-password",
  "password": "{{newPassword}}",
  "password_confirm": "{{newPassword}}"
}
```


### แก้ไขข้อมูลตนเอง — admin-self-profile

`POST /api/admin/profile` · สิทธิ์: Admin

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN admin-self-profile)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/profile`

```json
{
  "_csrf": "{{csrf}}",
  "first_name": "Happy",
  "last_name": "Buyer",
  "phone": "0812345678",
  "address": "99 Bangkok Thailand"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/profile`

```json
{
  "_csrf": "{{csrf}}",
  "first_name": "Buddy",
  "last_name": "Gift",
  "phone": "0899999999",
  "address": "88 Chiang Mai Thailand"
}
```


### เปลี่ยนรหัสผ่านตนเอง — admin-self-password

`POST /api/admin/profile/password` · สิทธิ์: Admin

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN admin-self-password)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/profile/password`

```json
{
  "_csrf": "{{csrf}}",
  "current_password": "{{demoPassword}}",
  "password": "{{newPassword}}",
  "password_confirm": "{{newPassword}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/profile/password`

```json
{
  "_csrf": "{{csrf}}",
  "current_password": "wrong-password",
  "password": "{{newPassword}}",
  "password_confirm": "{{newPassword}}"
}
```


### ส่งสลิป — order-proof

`POST /api/order/:number/proof` · สิทธิ์: Customer

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN order-proof)

ตัวอย่าง 1: `POST {{baseUrl}}/api/order/{{orderNumber}}/proof`

```json
{
  "_csrf": "{{csrf}}",
  "image": "{{imageDataUrl}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/order/{{orderNumber}}/proof`

```json
{
  "_csrf": "{{csrf}}",
  "image": "invalid-image"
}
```


### ลูกค้ายกเลิกออเดอร์ค้างชำระ — order-cancel

`POST /api/order/:number/cancel` · สิทธิ์: Customer

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN order-cancel)

ตัวอย่าง 1: `POST {{baseUrl}}/api/order/{{orderNumber}}/cancel`

```json
{
  "_csrf": "{{csrf}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/order/{{orderNumber}}/cancel`

```json
{
  "_csrf": "{{csrf}}"
}
```


### อ่านสลิปส่วนตัว — payment-proof

`GET /api/payment-proof/:id` · สิทธิ์: เจ้าของออเดอร์/Owner/Manager

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN payment-proof)

ตัวอย่าง 1: `GET {{baseUrl}}/api/payment-proof/{{paymentId}}`

ตัวอย่าง 2: `GET {{baseUrl}}/api/payment-proof/99999999`


### ตั้งค่าร้าน — settings

`POST /api/admin/settings` · สิทธิ์: Owner

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN settings)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/settings`

```json
{
  "_csrf": "{{csrf}}",
  "store_name": "Demo Gift Shop",
  "support_email": "demo@example.test",
  "bank_name": "Demo Bank (test only)",
  "bank_account_name": "Demo Only",
  "bank_account_number": "0000000000",
  "shipping_fee": "50",
  "free_shipping_threshold": "1000",
  "gift_wrap_fee": "49",
  "payment_window_hours": "24",
  "announcement": "ร้านสาธิต"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/settings`

```json
{
  "_csrf": "{{csrf}}",
  "store_name": "Demo Gift Shop",
  "shipping_fee": "-1"
}
```


### ตรวจสลิป — order-review

`POST /api/admin/orders/:id/review` · สิทธิ์: Owner/Manager

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN order-review)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/orders/{{id}}/review`

```json
{
  "_csrf": "{{csrf}}",
  "decision": "approve",
  "review_note": "ตรวจยอดแล้ว"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/orders/{{id}}/review`

```json
{
  "_csrf": "{{csrf}}",
  "decision": "reject",
  "review_note": "ยอดไม่ตรง กรุณาส่งหลักฐานใหม่"
}
```


### เปลี่ยนสถานะจัดส่ง — order-status

`POST /api/admin/orders/:id/status` · สิทธิ์: Owner/Manager

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN order-status)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/orders/{{id}}/status`

```json
{
  "_csrf": "{{csrf}}",
  "status": "Preparing"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/orders/{{id}}/status`

```json
{
  "_csrf": "{{csrf}}",
  "status": "Shipped",
  "carrier": "Demo Carrier",
  "tracking": "DEMO123456"
}
```


### ผู้ดูแลยกเลิกออเดอร์ค้างชำระ — admin-order-cancel

`POST /api/admin/orders/:id/cancel` · สิทธิ์: Owner/Manager

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN admin-order-cancel)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/orders/{{id}}/cancel`

```json
{
  "_csrf": "{{csrf}}"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/orders/{{id}}/cancel`

```json
{
  "_csrf": "{{csrf}}"
}
```


### เปลี่ยนสถานะข้อความ — message-status

`POST /api/admin/messages/:id/status` · สิทธิ์: Owner/Manager

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN message-status)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/messages/{{id}}/status`

```json
{
  "_csrf": "{{csrf}}",
  "status": "Read"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/messages/{{id}}/status`

```json
{
  "_csrf": "{{csrf}}",
  "status": "Resolved"
}
```


### ส่งข้อความถึงร้าน — contact

`POST /api/contact` · สิทธิ์: Public

โค้ด: `sec2_gr8_ws_src/src/server.js` (ค้น SERVICE-EXAMPLES-BEGIN contact)

ตัวอย่าง 1: `POST {{baseUrl}}/api/contact`

```json
{
  "_csrf": "{{csrf}}",
  "first_name": "Gift",
  "last_name": "Buyer",
  "email": "gift@example.test",
  "message": "สอบถามของขวัญและการจัดส่ง"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/contact`

```json
{
  "_csrf": "{{csrf}}",
  "first_name": "Buddy",
  "last_name": "Buyer",
  "email": "buddy@example.test",
  "message": "ต้องการสอบถามงานสั่งทำ"
}
```


### ปฏิเสธการข้ามขั้นตอนตรวจสลิป — legacy-payment-status

`POST /api/admin/payments/:id/status` · สิทธิ์: Owner/Manager

โค้ด: `sec2_gr8_ws_src/src/shop-routes.js` (ค้น SERVICE-EXAMPLES-BEGIN legacy-payment-status)

ตัวอย่าง 1: `POST {{baseUrl}}/api/admin/payments/{{id}}/status`

```json
{
  "_csrf": "{{csrf}}",
  "status": "Completed"
}
```

ตัวอย่าง 2: `POST {{baseUrl}}/api/admin/payments/{{id}}/status`

```json
{
  "_csrf": "{{csrf}}",
  "status": "Failed"
}
```


### อ่านภาพสินค้าที่อัปโหลด — uploaded-image

`GET /api/images/uploads/:filename` · สิทธิ์: Public

โค้ด: `sec2_gr8_ws_src/src/server.js` (ค้น SERVICE-EXAMPLES-BEGIN uploaded-image)

ตัวอย่าง 1: `GET {{baseUrl}}/api/images/uploads/{{imageFilename}}`

ตัวอย่าง 2: `GET {{baseUrl}}/api/images/uploads/missing.webp`


### อัตราอ้างอิงงบของขวัญ — public-rate

`GET https://api.frankfurter.dev/v2/rate/thb/:quote` · สิทธิ์: Public

โค้ด: `sec2_gr8_fe_src/public/js/shared/public-service.js` (ค้น SERVICE-EXAMPLES-BEGIN public-rate)

ตัวอย่าง 1: `GET https://api.frankfurter.dev/v2/rate/thb/usd`

ตัวอย่าง 2: `GET https://api.frankfurter.dev/v2/rate/thb/eur`


### อ่านข้อมูลหน้า ของขวัญที่เลือกด้วยใจ — view-home

`GET /api/store/home` · สิทธิ์: public

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-home)

ตัวอย่าง 1: `GET {{baseUrl}}/api/store/home`

ตัวอย่าง 2: `GET {{baseUrl}}/api/store/home?q=Buddy`


### อ่านข้อมูลหน้า เลือกของขวัญ — view-shop

`GET /api/store/products` · สิทธิ์: public

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-shop)

ตัวอย่าง 1: `GET {{baseUrl}}/api/store/products`

ตัวอย่าง 2: `GET {{baseUrl}}/api/store/products?q=Buddy`


### อ่านข้อมูลหน้า รายละเอียดของขวัญ — view-product

`GET /api/store/products/:slug` · สิทธิ์: public

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-product)

ตัวอย่าง 1: `GET {{baseUrl}}/api/store/products/buddy-bear`

ตัวอย่าง 2: `GET {{baseUrl}}/api/store/products/custom-face-pillow`


### อ่านข้อมูลหน้า ของขวัญที่ชอบ — view-favorites

`GET /api/customer/favorites` · สิทธิ์: public

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-favorites)

ตัวอย่าง 1: `GET {{baseUrl}}/api/customer/favorites`

ตัวอย่าง 2: `GET {{baseUrl}}/api/customer/favorites?q=Buddy`


### อ่านข้อมูลหน้า ตะกร้าของขวัญ — view-cart

`GET /api/customer/cart` · สิทธิ์: public

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-cart)

ตัวอย่าง 1: `GET {{baseUrl}}/api/customer/cart`

ตัวอย่าง 2: `GET {{baseUrl}}/api/customer/cart?q=Buddy`


### อ่านข้อมูลหน้า จัดส่งของขวัญ — view-checkout

`GET /api/customer/checkout` · สิทธิ์: customer

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-checkout)

ตัวอย่าง 1: `GET {{baseUrl}}/api/customer/checkout`

ตัวอย่าง 2: `GET {{baseUrl}}/api/customer/checkout?q=Buddy`


### อ่านข้อมูลหน้า บัญชีของฉัน — view-account

`GET /api/customer/account` · สิทธิ์: customer

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-account)

ตัวอย่าง 1: `GET {{baseUrl}}/api/customer/account`

ตัวอย่าง 2: `GET {{baseUrl}}/api/customer/account?q=Buddy`


### อ่านข้อมูลหน้า ข้อมูลของฉัน — view-profile

`GET /api/customer/profile` · สิทธิ์: customer

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-profile)

ตัวอย่าง 1: `GET {{baseUrl}}/api/customer/profile`

ตัวอย่าง 2: `GET {{baseUrl}}/api/customer/profile?q=Buddy`


### อ่านข้อมูลหน้า คำสั่งซื้อ — view-order

`GET /api/customer/orders/:number` · สิทธิ์: customer

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-order)

ตัวอย่าง 1: `GET {{baseUrl}}/api/customer/orders/{{orderNumber}}`

ตัวอย่าง 2: `GET {{baseUrl}}/api/customer/orders/{{otherOrderNumber}}`


### อ่านข้อมูลหน้า ภาพรวมร้าน — view-dashboard

`GET /api/admin/overview` · สิทธิ์: operations

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-dashboard)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/overview`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/overview?q=Buddy`


### อ่านข้อมูลหน้า เพิ่มสินค้า — view-product-new

`GET /api/admin/product-options` · สิทธิ์: admin

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-product-new)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/product-options`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/product-options?q=Buddy`


### อ่านข้อมูลหน้า ลบสินค้า — view-product-delete

`GET /api/admin/products/:id/deletion` · สิทธิ์: admin

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-product-delete)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/products/1/deletion`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/products/2/deletion`


### อ่านข้อมูลหน้า เพิ่มผู้ดูแล — view-account-new

`GET /api/admin/account-options` · สิทธิ์: owner

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-account-new)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/account-options`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/account-options?q=Buddy`


### อ่านข้อมูลหน้า ลบผู้ดูแล — view-account-delete

`GET /api/admin/accounts/:id/deletion` · สิทธิ์: owner

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-account-delete)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/accounts/1/deletion`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/accounts/2/deletion`


### อ่านข้อมูลหน้า เพิ่มหมวดหมู่ — view-category-new

`GET /api/admin/category-options` · สิทธิ์: operations

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-category-new)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/category-options`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/category-options?q=Buddy`


### อ่านข้อมูลหน้า แก้ไขหมวดหมู่ — view-category-edit

`GET /api/admin/categories/:id` · สิทธิ์: operations

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-category-edit)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/categories/1`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/categories/2`


### อ่านข้อมูลหน้า ลบหมวดหมู่ — view-category-delete

`GET /api/admin/categories/:id/deletion` · สิทธิ์: operations

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-category-delete)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/categories/1/deletion`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/categories/2/deletion`


### อ่านข้อมูลหน้า คำสั่งซื้อ — view-admin-orders

`GET /api/admin/orders` · สิทธิ์: operations

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-admin-orders)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/orders`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/orders?q=Buddy`


### อ่านข้อมูลหน้า รายละเอียดคำสั่งซื้อ — view-admin-order

`GET /api/admin/orders/:id` · สิทธิ์: operations

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-admin-order)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/orders/1`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/orders/2`


### อ่านข้อมูลหน้า ตรวจสอบการชำระเงิน — view-payments

`GET /api/admin/payments` · สิทธิ์: operations

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-payments)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/payments`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/payments?q=Buddy`


### อ่านข้อมูลหน้า ลูกค้า — view-customers

`GET /api/admin/customers` · สิทธิ์: operations

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-customers)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/customers`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/customers?q=Buddy`


### อ่านข้อมูลหน้า ข้อความจากลูกค้า — view-messages

`GET /api/admin/messages` · สิทธิ์: operations

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-messages)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/messages`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/messages?q=Buddy`


### อ่านข้อมูลหน้า ตั้งค่าร้าน — view-settings

`GET /api/admin/settings` · สิทธิ์: owner

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-settings)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/settings`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/settings?q=Buddy`


### อ่านข้อมูลหน้า ข้อมูลของฉัน — view-admin-profile

`GET /api/admin/profile` · สิทธิ์: admin

โค้ด: `sec2_gr8_ws_src/src/service-contract.js` (ค้น SERVICE-EXAMPLES-BEGIN view-admin-profile)

ตัวอย่าง 1: `GET {{baseUrl}}/api/admin/profile`

ตัวอย่าง 2: `GET {{baseUrl}}/api/admin/profile?q=Buddy`


## ความสัมพันธ์กับฐานข้อมูลและไฟล์

คำสั่งซื้อใช้ transaction/row locks และคำนวณหน่วยสตางค์; checkout_key ป้องกันออเดอร์ซ้ำ การลบสินค้าที่มีประวัติคืนข้อขัดแย้งและมีซ่อนแยก หมวดที่มีสินค้าต้องเลือกปลายทาง สลิปเป็นไฟล์ส่วนตัวต้องตรวจเจ้าของ/บทบาท ภาพอัปโหลดเก็บที่ backend; SQL ตัวอย่างไม่รวมไฟล์เหล่านี้ ดู INSTALLATION.md

ผลครบแยกรายบริการอยู่ใน SERVICE-COVERAGE.md
