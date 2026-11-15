# รายการหน้า HTML และสัญญาข้อมูล

หน้าแรกใช้ URL `/` โดยส่งไฟล์ `index.html` หน้าอื่นใช้ URL แบบไม่มีนามสกุลตามตาราง เซิร์ฟเวอร์จับคู่กับไฟล์ HTML จริง ลิงก์เก่า เช่น `/shop.html` และ `/index.html` จะ redirect ไป URL ปัจจุบันโดยเก็บ query string รวมถึง `next` ไว้

รายการหน้าและสัญญาข้อมูลปัจจุบันของ branch refactor/html-pages สร้างตรงกับ html-pages.json; ผลทดสอบและขอบเขตอยู่ใน HTML-MIGRATION-STATUS-TH.md

response ของบริการอ่านหน้ามีส่วนหลัก `{ok,data,session,flash}` และอาจมี `message` เพิ่มตามผลการทำงาน โดย data เป็น object ชื่อช่องชัดเจน ไม่มี template/args สำหรับสร้างหน้า ทั้งนี้ทุกหน้าจะอ่าน session สำหรับเมนูและ CSRF แม้ไม่มี endpoint เฉพาะหน้า

| URL ปัจจุบัน | ไฟล์ HTML | Controller | ข้อมูลอ่านจาก API | ช่องข้อมูลหลัก | สิทธิ์ |
|---|---|---|---|---|---|
| / | index.html | js/pages/home.js | /api/store/home | products, categories | public |
| /shop | shop.html | js/pages/shop.js | /api/store/products | products, categories, filters, pagination | public |
| /product | product.html | js/pages/product.js | /api/store/products/:slug | product, related | public |
| /about | about.html | js/pages/about.js | GET /api/session (เนื้อหาคงที่ใน HTML) | session/settings | public |
| /team | team.html | js/pages/team.js | GET /api/session (เนื้อหาคงที่ใน HTML) | session/settings | public |
| /login | login.html | js/pages/login.js | GET /api/session (เนื้อหาคงที่ใน HTML) | session/settings | public |
| /register | register.html | js/pages/register.js | GET /api/session (เนื้อหาคงที่ใน HTML) | session/settings | public |
| /favorites | favorites.html | js/pages/favorites.js | /api/customer/favorites | products | public |
| /cart | cart.html | js/pages/cart.js | /api/customer/cart | items, totals | public |
| /checkout | checkout.html | js/pages/checkout.js | /api/customer/checkout | items, customer, totals | customer |
| /account | account.html | js/pages/account.js | /api/customer/account | customer, orders | customer |
| /profile | profile.html | js/pages/profile.js | /api/customer/profile | customer | customer |
| /order | order.html | js/pages/order.js | /api/customer/orders/:number | order, items, payment | customer |
| /contact | contact.html | js/pages/contact.js | GET /api/session (เนื้อหาคงที่ใน HTML) | session/settings | public |
| /help | help.html | js/pages/help.js | GET /api/session (เนื้อหาคงที่ใน HTML) | session/settings | public |
| /references | references.html | js/pages/references.js | GET /api/session (เนื้อหาคงที่ใน HTML) | session/settings | public |
| /gift-budget | gift-budget.html | js/pages/gift-budget.js | GET /api/session (เนื้อหาคงที่ใน HTML) | session/settings | public |
| /404 | 404.html | js/pages/not-found.js | GET /api/session (เนื้อหาคงที่ใน HTML) | session/settings | public |
| /admin | admin/index.html | js/pages/dashboard.js | /api/admin/overview | metrics, orders, lowStock | operations |
| /admin/login | admin/login.html | js/pages/admin-login.js | GET /api/session (เนื้อหาคงที่ใน HTML) | session/settings | public |
| /admin/products | admin/products.html | js/pages/admin-products.js | /api/admin/products | products, categories, filters | admin |
| /admin/product-new | admin/product-new.html | js/pages/product-new.js | /api/admin/product-options | product, categories | admin |
| /admin/product-edit | admin/product-edit.html | js/pages/product-edit.js | /api/admin/products/:id | product, categories | admin |
| /admin/product-delete | admin/product-delete.html | js/pages/product-delete.js | /api/admin/products/:id/deletion | product, history | admin |
| /admin/accounts | admin/accounts.html | js/pages/admin-accounts.js | /api/admin/accounts | accounts, filters | owner |
| /admin/account-new | admin/account-new.html | js/pages/account-new.js | /api/admin/account-options | account | owner |
| /admin/account-edit | admin/account-edit.html | js/pages/account-edit.js | /api/admin/accounts/:id | account | owner |
| /admin/account-delete | admin/account-delete.html | js/pages/account-delete.js | /api/admin/accounts/:id/deletion | account | owner |
| /admin/categories | admin/categories.html | js/pages/admin-categories.js | /api/admin/categories | categories | operations |
| /admin/category-new | admin/category-new.html | js/pages/category-new.js | /api/admin/category-options | category, error | operations |
| /admin/category-edit | admin/category-edit.html | js/pages/category-edit.js | /api/admin/categories/:id | category, error | operations |
| /admin/category-delete | admin/category-delete.html | js/pages/category-delete.js | /api/admin/categories/:id/deletion | category, categories, error, destination | operations |
| /admin/orders | admin/orders.html | js/pages/admin-orders.js | /api/admin/orders | orders, filters | operations |
| /admin/order | admin/order.html | js/pages/admin-order.js | /api/admin/orders/:id | order, items, payment | operations |
| /admin/payments | admin/payments.html | js/pages/payments.js | /api/admin/payments | orders, filters | operations |
| /admin/customers | admin/customers.html | js/pages/customers.js | /api/admin/customers | customers, filters | operations |
| /admin/messages | admin/messages.html | js/pages/messages.js | /api/admin/messages | messages | operations |
| /admin/settings | admin/settings.html | js/pages/settings.js | /api/admin/settings | settings | owner |
| /admin/profile | admin/profile.html | js/pages/admin-profile.js | /api/admin/profile | account | admin |

ฟอร์มใช้ endpoints mutation เดิมโดยกำหนด URL/method ชัดเจนใน HTML ไม่คำนวณจากชื่อไฟล์ หน้าแอดมินตรวจสิทธิ์ที่ API เสมอ; หน้าใหม่ใช้ query id/slug/number ส่วน old URL redirects รักษาตัวกรองและ next

## พารามิเตอร์ที่ต้องใส่เมื่อเปิดรายละเอียด

| หน้า | ตัวอย่าง URL |
|---|---|
| สินค้า | `/product?slug=buddy-bear` |
| ออเดอร์ลูกค้า | `/order?number=หมายเลขออเดอร์จริง` |
| แก้/ลบสินค้า | `/admin/product-edit?id=1`, `/admin/product-delete?id=1` |
| แก้/ลบบัญชี | `/admin/account-edit?id=2`, `/admin/account-delete?id=2` |
| แก้/ลบหมวด | `/admin/category-edit?id=1`, `/admin/category-delete?id=1` |
| ออเดอร์แอดมิน | `/admin/order?id=1` |

ID และหมายเลขต้องเป็นรายการที่มีจริงและบัญชีนั้นมีสิทธิ์ดู ตัวอย่างเป็นรูปแบบ URL ไม่รับรองว่ารายการนั้นมีในทุกฐานข้อมูล แนะนำเปิดจากลิงก์ในหน้ารายการ

สิทธิ์ `public` คือผู้เข้าชม, `customer` คือลูกค้าที่เข้าสู่ระบบ, `admin` คือ Owner/Manager/Editor, `operations` คือ Owner/Manager และ `owner` คือ Owner เท่านั้น API บังคับสิทธิ์อีกครั้งเสมอ
