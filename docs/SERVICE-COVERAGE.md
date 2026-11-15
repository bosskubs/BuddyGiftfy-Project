# หลักฐานทดสอบครบทุกบริการ

ทดสอบวันที่ 9 พฤศจิกายน 2569 บน MySQL 8.4.13 แบบฐานข้อมูลแยกจากร้านจริง ผลจากคำขอจริง ไม่ใช่การเช็กว่ามีชื่อ endpoint อย่างเดียว

ตรวจ 69 บริการ / 316 เคส API และ 72 เคสหน้า/alias; เครดิตสินค้า 20 รายการผ่าน browser ข้อเรียกร้องคือทุกบริการที่ระบบประกาศ ไม่ใช่การรับรองทุกชุดข้อมูลที่เป็นไปได้

| บริการ | Method / URL | เคสที่ผ่าน | สถานะ HTTP ที่ตรวจ |
|---|---|---|---|
| health | GET `/api/health` | 3 | 200 |
| session | GET `/api/session` | 80 | 200 |
| page | GET `/api/page` | 45 | 200 |
| admin-login | POST `/api/auth/admin/login` | 8 | 200, 401, 403 |
| customer-login | POST `/api/auth/login` | 4 | 200, 401 |
| register | POST `/api/auth/register` | 3 | 200, 422 |
| logout | POST `/api/logout` | 2 | 200, 403 |
| admin-logout | POST `/api/admin/logout` | 2 | 200, 403 |
| product-list | GET `/api/admin/products` | 5 | 200, 401 |
| product-detail | GET `/api/admin/products/:id` | 9 | 200, 404 |
| product-insert | POST `/api/admin/products` | 2 | 200 |
| product-update | PUT `/api/admin/products/:id` | 2 | 200 |
| product-delete | DELETE `/api/admin/products/:id` | 4 | 200, 400 |
| admin-list | GET `/api/admin/accounts` | 4 | 200 |
| admin-detail | GET `/api/admin/accounts/:id` | 6 | 200, 404 |
| admin-insert | POST `/api/admin/accounts` | 2 | 200 |
| admin-update | PUT `/api/admin/accounts/:id` | 2 | 200 |
| admin-delete | DELETE `/api/admin/accounts/:id` | 5 | 200, 400 |
| product-hide | POST `/api/admin/products/:id/hide` | 2 | 200 |
| product-image | POST `/api/admin/product-image` | 2 | 201, 400 |
| category-list | GET `/api/admin/categories` | 4 | 200 |
| category-insert | POST `/api/admin/categories/new` | 3 | 200 |
| category-update | POST `/api/admin/categories/:id/edit` | 4 | 200 |
| category-delete | POST `/api/admin/categories/:id/delete` | 5 | 200, 409 |
| cart-add | POST `/api/cart/add` | 7 | 200 |
| cart-update | POST `/api/cart/update` | 2 | 200 |
| cart-remove | POST `/api/cart/remove` | 3 | 200 |
| favorite | POST `/api/favorites/toggle` | 2 | 200 |
| checkout | POST `/api/checkout` | 4 | 200, 422 |
| customer-profile | POST `/api/account/profile` | 2 | 200, 422 |
| customer-password | POST `/api/account/password` | 2 | 200, 422 |
| admin-self-profile | POST `/api/admin/profile` | 2 | 200, 422 |
| admin-self-password | POST `/api/admin/profile/password` | 2 | 200, 422 |
| order-proof | POST `/api/order/:number/proof` | 3 | 200, 400 |
| order-cancel | POST `/api/order/:number/cancel` | 3 | 200, 404 |
| payment-proof | GET `/api/payment-proof/:id` | 5 | 200, 403 |
| settings | POST `/api/admin/settings` | 3 | 200, 403, 422 |
| order-review | POST `/api/admin/orders/:id/review` | 3 | 200, 422 |
| order-status | POST `/api/admin/orders/:id/status` | 4 | 200, 422 |
| admin-order-cancel | POST `/api/admin/orders/:id/cancel` | 2 | 200, 422 |
| message-status | POST `/api/admin/messages/:id/status` | 3 | 200, 403 |
| contact | POST `/api/contact` | 2 | 200, 400 |
| legacy-payment-status | POST `/api/admin/payments/:id/status` | 2 | 400 |
| uploaded-image | GET `/api/images/uploads/:filename` | 2 | 200, 404 |
| public-rate | GET `https://api.frankfurter.dev/v2/rate/thb/:quote` | 2 | 200 |
| view-home | GET `/api/store/home` | 2 | 200 |
| view-shop | GET `/api/store/products` | 2 | 200 |
| view-product | GET `/api/store/products/:slug` | 2 | 200 |
| view-favorites | GET `/api/customer/favorites` | 2 | 200 |
| view-cart | GET `/api/customer/cart` | 2 | 200 |
| view-checkout | GET `/api/customer/checkout` | 2 | 200 |
| view-account | GET `/api/customer/account` | 2 | 200 |
| view-profile | GET `/api/customer/profile` | 2 | 200 |
| view-order | GET `/api/customer/orders/:number` | 2 | 200 |
| view-dashboard | GET `/api/admin/overview` | 2 | 200 |
| view-product-new | GET `/api/admin/product-options` | 2 | 200 |
| view-product-delete | GET `/api/admin/products/:id/deletion` | 2 | 200 |
| view-account-new | GET `/api/admin/account-options` | 2 | 200 |
| view-account-delete | GET `/api/admin/accounts/:id/deletion` | 2 | 200 |
| view-category-new | GET `/api/admin/category-options` | 2 | 200 |
| view-category-edit | GET `/api/admin/categories/:id` | 2 | 200 |
| view-category-delete | GET `/api/admin/categories/:id/deletion` | 2 | 200 |
| view-admin-orders | GET `/api/admin/orders` | 2 | 200 |
| view-admin-order | GET `/api/admin/orders/:id` | 2 | 200 |
| view-payments | GET `/api/admin/payments` | 2 | 200 |
| view-customers | GET `/api/admin/customers` | 2 | 200 |
| view-messages | GET `/api/admin/messages` | 2 | 200 |
| view-settings | GET `/api/admin/settings` | 2 | 200 |
| view-admin-profile | GET `/api/admin/profile` | 2 | 200 |

## รายละเอียดแต่ละเคส

### health

- MySQL health: HTTP 200; HTTP 200; Native MySQL
- Database health as visitor: HTTP 200; Expected status; Response/state assertions
- Database health after login: HTTP 200; Expected status; Response/state assertions

### session

- Session / CSRF example 1: HTTP 200; HTTP 200; No session id or password hash exposed
- Session / CSRF example 2: HTTP 200; HTTP 200; No session id or password hash exposed
- Refresh rotated CSRF: HTTP 200; HTTP 200; No session id or password hash exposed
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld
- Read current session without disclosing its id: HTTP 200; CSRF exists; session id withheld

### page

- Checkout view model: HTTP 200; Expected status; Response/state assertions
- Fresh checkout token for validation: HTTP 200; Expected status; check
- Checkout view model: HTTP 200; Expected status; Response/state assertions
- Checkout view model: HTTP 200; Expected status; Response/state assertions
- View /: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /shop: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /search: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /shop/advanced: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /product/buddy-bear: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /favorites: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /cart: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /login: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /register: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/login: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /contact: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /about: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /team: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /help: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /references: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /gift-budget: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /account: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /account/profile: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /account/password: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /order/BGMW8YUYRR74A4: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/profile: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/profile/password: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/settings: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/orders: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/payments: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/orders/1: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/messages: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/customers: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/products: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/products/new: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/products/1/edit: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/products/1/delete: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/accounts: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/accounts/new: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/accounts/2/edit: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/accounts/2/delete: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/categories: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/categories/new: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/categories/2/edit: HTTP 200; Named data exists; Sensitive identifiers withheld
- View /admin/categories/2/delete: HTTP 200; Named data exists; Sensitive identifiers withheld

### admin-login

- Missing CSRF denied: HTTP 403; HTTP 403
- Authentication example 2: wrong password: HTTP 401; HTTP 401
- Authentication example 1: valid owner: HTTP 200; HTTP 200
- Valid login owner@example.test: HTTP 200; Expected status; Response/state assertions
- Valid login manager@example.test: HTTP 200; Expected status; Response/state assertions
- Valid login editor@example.test: HTTP 200; Expected status; Response/state assertions
- Valid login owner@example.test: HTTP 200; Expected status; Response/state assertions
- Valid login owner@example.test: HTTP 200; Expected status; Response/state assertions

### customer-login

- Wrong customer password: HTTP 401; Expected status; Response/state assertions
- Valid login buyer@example.test: HTTP 200; Expected status; Response/state assertions
- Valid login buyer@example.test: HTTP 200; Expected status; Response/state assertions
- Valid login buyer@example.test: HTTP 200; Expected status; Response/state assertions

### register

- Register buyer@example.test: HTTP 200; Expected status; Response/state assertions
- Register other@example.test: HTTP 200; Expected status; Response/state assertions
- Invalid registration rejected: HTTP 422; Expected status; Response/state assertions

### logout

- Bad CSRF cannot log out: HTTP 403; Expected status; check
- Logout removes identity: HTTP 200; Expected status; check

### admin-logout

- Bad CSRF cannot log out: HTTP 403; Expected status; check
- Logout removes identity: HTTP 200; Expected status; check

### product-list

- Unauthenticated product search denied: HTTP 401; HTTP 401
- Products search example 1: select all: HTTP 200; HTTP 200; Product array
- Products search example 2: combine 3 criteria: HTTP 200; HTTP 200; Combined filters
- Find inserted product A: HTTP 200; HTTP 200; Inserted product exists
- Find inserted product B: HTTP 200; HTTP 200; Inserted product exists

### product-detail

- Product view example A: HTTP 200; HTTP 200; Correct gift
- Verify product update A: HTTP 200; HTTP 200; Persisted values
- Verify product actually deleted A: HTTP 404; HTTP 404
- Product view example B: HTTP 200; HTTP 200; Correct gift
- Verify product update B: HTTP 200; HTTP 200; Persisted values
- Verify product actually deleted B: HTTP 404; HTTP 404
- Product category follows rename: HTTP 200; HTTP 200; Renamed category persisted
- Verify moved product retains price and stock: HTTP 200; HTTP 200; Gift preserved
- Verify restored category: HTTP 200; HTTP 200; Original category restored

### product-insert

- Product insert example A: HTTP 200; HTTP 200
- Product insert example B: HTTP 200; HTTP 200

### product-update

- Product update example A: HTTP 200; HTTP 200
- Product update example B: HTTP 200; HTTP 200

### product-delete

- Product delete confirmation rejected A: HTTP 400; HTTP 400
- Product delete example A: HTTP 200; HTTP 200
- Product delete confirmation rejected B: HTTP 400; HTTP 400
- Product delete example B: HTTP 200; HTTP 200

### admin-list

- Admin search example 1: select all: HTTP 200; HTTP 200; Admin array
- Admin search example 2: combine 3 criteria: HTTP 200; HTTP 200; Combined admin filters
- Find inserted admin A: HTTP 200; HTTP 200; Admin exists
- Find inserted admin B: HTTP 200; HTTP 200; Admin exists

### admin-detail

- Admin view example A: HTTP 200; HTTP 200; Meaningful profile
- Verify admin update A: HTTP 200; HTTP 200; Persisted role and age
- Verify admin actually deleted A: HTTP 404; HTTP 404
- Admin view example B: HTTP 200; HTTP 200; Meaningful profile
- Verify admin update B: HTTP 200; HTTP 200; Persisted role and age
- Verify admin actually deleted B: HTTP 404; HTTP 404

### admin-insert

- Admin insert example A: HTTP 200; HTTP 200
- Admin insert example B: HTTP 200; HTTP 200

### admin-update

- Admin update example A: HTTP 200; HTTP 200
- Admin update example B: HTTP 200; HTTP 200

### admin-delete

- Admin delete confirmation rejected A: HTTP 400; HTTP 400
- Admin delete example A: HTTP 200; HTTP 200
- Admin delete confirmation rejected B: HTTP 400; HTTP 400
- Admin delete example B: HTTP 200; HTTP 200
- Protect current/last owner: HTTP 400; HTTP 400

### product-hide

- Hide unused gift 6: HTTP 200; Expected status; Response/state assertions
- Hide unused gift 7: HTTP 200; Expected status; Response/state assertions

### product-image

- Upload is normalized: HTTP 201; Expected status; Response/state assertions
- Invalid image rejected: HTTP 400; Expected status; Response/state assertions

### category-list

- Category list A: HTTP 200; HTTP 200; Category exists
- Category list B: HTTP 200; HTTP 200; Category exists
- Find populated source category: HTTP 200; HTTP 200
- Find category destination: HTTP 200; HTTP 200

### category-insert

- Category insert A: HTTP 200; HTTP 200
- Category insert B: HTTP 200; HTTP 200
- Create category destination: HTTP 200; HTTP 200

### category-update

- Category update A: HTTP 200; HTTP 200
- Category update B: HTTP 200; HTTP 200
- Rename populated category: HTTP 200; HTTP 200
- Restore original category after tests: HTTP 200; HTTP 200

### category-delete

- Category delete A: HTTP 200; HTTP 200
- Category delete B: HTTP 200; HTTP 200
- Populated category cannot be deleted without destination: HTTP 409; HTTP 409
- Move gifts and delete source category: HTTP 200; HTTP 200
- Populated destination remains protected: HTTP 409; HTTP 409

### cart-add

- Add product 1: HTTP 200; Expected status; Response/state assertions
- Add product 2: HTTP 200; Expected status; Response/state assertions
- Order setup cart: HTTP 200; Expected status; check
- Prepare invalid shipping attempt: HTTP 200; Expected status; check
- Order setup cart: HTTP 200; Expected status; check
- Order setup cart: HTTP 200; Expected status; check
- Prepare canonical checkout data: HTTP 200; Expected status; check

### cart-update

- Set quantity: HTTP 200; Expected status; Response/state assertions
- Decrease by step: HTTP 200; Expected status; Response/state assertions

### cart-remove

- Remove 1: HTTP 200; Expected status; Response/state assertions
- Remove 2: HTTP 200; Expected status; Response/state assertions
- Clear invalid checkout draft cart: HTTP 200; Expected status; check

### favorite

- Favorite true: HTTP 200; Expected status; Response/state assertions
- Favorite false: HTTP 200; Expected status; Response/state assertions

### checkout

- Create reserved order: HTTP 200; Expected status; Response/state assertions
- Invalid shipping does not create order: HTTP 422; Expected status; Response/state assertions
- Create reserved order: HTTP 200; Expected status; Response/state assertions
- Create reserved order: HTTP 200; Expected status; Response/state assertions

### customer-profile

- Customer profile persists: HTTP 200; Expected status; Response/state assertions
- Invalid customer phone rejected: HTTP 422; Expected status; Response/state assertions

### customer-password

- Wrong current password rejected: HTTP 422; Expected status; check
- New password persists and revokes other devices: HTTP 200; Expected status; check

### admin-self-profile

- Owner profile persists: HTTP 200; Expected status; Response/state assertions
- Empty owner name rejected: HTTP 422; Expected status; Response/state assertions

### admin-self-password

- Wrong current password rejected: HTTP 422; Expected status; check
- New password persists and revokes other devices: HTTP 200; Expected status; check

### order-proof

- Malformed proof rejected: HTTP 400; Expected status; check
- Valid private proof stored: HTTP 200; Expected status; Response/state assertions
- Replacement proof accepted: HTTP 200; Expected status; check

### order-cancel

- Other customer cannot cancel: HTTP 404; Expected status; check
- Owner cancels unpaid order: HTTP 200; Expected status; Response/state assertions
- Repeated cancellation never adds stock twice: HTTP 200; Expected status; Response/state assertions

### payment-proof

- Owning customer proof access: HTTP 200; Expected status; Response/state assertions
- Manager proof access: HTTP 200; Expected status; Response/state assertions
- Other customer proof access: HTTP 403; Expected status; Response/state assertions
- Editor proof access: HTTP 403; Expected status; Response/state assertions
- Visitor proof access: HTTP 403; Expected status; Response/state assertions

### settings

- Manager cannot configure bank: HTTP 403; Expected status; Response/state assertions
- Negative shipping rejected: HTTP 422; Expected status; Response/state assertions
- Complete bank settings persist: HTTP 200; Expected status; Response/state assertions

### order-review

- Reject without reason denied: HTTP 422; Expected status; Response/state assertions
- Reject with reason persists: HTTP 200; Expected status; Response/state assertions
- Approval confirms order: HTTP 200; Expected status; Response/state assertions

### order-status

- Cannot skip preparing: HTTP 422; Expected status; check
- Order to Preparing: HTTP 200; Expected status; Response/state assertions
- Order to Shipped: HTTP 200; Expected status; Response/state assertions
- Order to Completed: HTTP 200; Expected status; Response/state assertions

### admin-order-cancel

- Manager cancels unpaid order: HTTP 200; Expected status; Response/state assertions
- Paid order cannot be cancelled: HTTP 422; Expected status; check

### message-status

- Message Read: HTTP 200; Expected status; Response/state assertions
- Message Resolved: HTTP 200; Expected status; Response/state assertions
- Editor cannot access inbox: HTTP 403; Expected status; check

### contact

- Short message rejected: HTTP 400; Expected status; check
- Contact is stored: HTTP 200; Expected status; Response/state assertions

### legacy-payment-status

- Reject legacy payment Completed: HTTP 400; Expected status; Response/state assertions
- Reject legacy payment Failed: HTTP 400; Expected status; Response/state assertions

### uploaded-image

- Uploaded media can be loaded: HTTP 200; Expected status; Response/state assertions
- Missing media returns 404: HTTP 404; Expected status; check

### public-rate

- Public service example 1: THB/USD: HTTP 200; HTTP 200; Live public rate
- Public service example 2: THB/EUR: HTTP 200; HTTP 200; Live public rate

### view-home

- Canonical read home: HTTP 200; Expected status; Response/state assertions
- Canonical read home with query: HTTP 200; Expected status; Response/state assertions

### view-shop

- Canonical read shop: HTTP 200; Expected status; Response/state assertions
- Canonical read shop with query: HTTP 200; Expected status; Response/state assertions

### view-product

- Canonical read product: HTTP 200; Expected status; Response/state assertions
- Canonical read product with query: HTTP 200; Expected status; Response/state assertions

### view-favorites

- Canonical read favorites: HTTP 200; Expected status; Response/state assertions
- Canonical read favorites with query: HTTP 200; Expected status; Response/state assertions

### view-cart

- Canonical read cart: HTTP 200; Expected status; Response/state assertions
- Canonical read cart with query: HTTP 200; Expected status; Response/state assertions

### view-checkout

- Canonical read checkout: HTTP 200; Expected status; Response/state assertions
- Canonical read checkout with query: HTTP 200; Expected status; Response/state assertions

### view-account

- Canonical read account: HTTP 200; Expected status; Response/state assertions
- Canonical read account with query: HTTP 200; Expected status; Response/state assertions

### view-profile

- Canonical read profile: HTTP 200; Expected status; Response/state assertions
- Canonical read profile with query: HTTP 200; Expected status; Response/state assertions

### view-order

- Canonical read order: HTTP 200; Expected status; Response/state assertions
- Canonical read order with query: HTTP 200; Expected status; Response/state assertions

### view-dashboard

- Canonical read dashboard: HTTP 200; Expected status; Response/state assertions
- Canonical read dashboard with query: HTTP 200; Expected status; Response/state assertions

### view-product-new

- Canonical read product-new: HTTP 200; Expected status; Response/state assertions
- Canonical read product-new with query: HTTP 200; Expected status; Response/state assertions

### view-product-delete

- Canonical read product-delete: HTTP 200; Expected status; Response/state assertions
- Canonical read product-delete with query: HTTP 200; Expected status; Response/state assertions

### view-account-new

- Canonical read account-new: HTTP 200; Expected status; Response/state assertions
- Canonical read account-new with query: HTTP 200; Expected status; Response/state assertions

### view-account-delete

- Canonical read account-delete: HTTP 200; Expected status; Response/state assertions
- Canonical read account-delete with query: HTTP 200; Expected status; Response/state assertions

### view-category-new

- Canonical read category-new: HTTP 200; Expected status; Response/state assertions
- Canonical read category-new with query: HTTP 200; Expected status; Response/state assertions

### view-category-edit

- Canonical read category-edit: HTTP 200; Expected status; Response/state assertions
- Canonical read category-edit with query: HTTP 200; Expected status; Response/state assertions

### view-category-delete

- Canonical read category-delete: HTTP 200; Expected status; Response/state assertions
- Canonical read category-delete with query: HTTP 200; Expected status; Response/state assertions

### view-admin-orders

- Canonical read admin-orders: HTTP 200; Expected status; Response/state assertions
- Canonical read admin-orders with query: HTTP 200; Expected status; Response/state assertions

### view-admin-order

- Canonical read admin-order: HTTP 200; Expected status; Response/state assertions
- Canonical read admin-order with query: HTTP 200; Expected status; Response/state assertions

### view-payments

- Canonical read payments: HTTP 200; Expected status; Response/state assertions
- Canonical read payments with query: HTTP 200; Expected status; Response/state assertions

### view-customers

- Canonical read customers: HTTP 200; Expected status; Response/state assertions
- Canonical read customers with query: HTTP 200; Expected status; Response/state assertions

### view-messages

- Canonical read messages: HTTP 200; Expected status; Response/state assertions
- Canonical read messages with query: HTTP 200; Expected status; Response/state assertions

### view-settings

- Canonical read settings: HTTP 200; Expected status; Response/state assertions
- Canonical read settings with query: HTTP 200; Expected status; Response/state assertions

### view-admin-profile

- Canonical read admin-profile: HTTP 200; Expected status; Response/state assertions
- Canonical read admin-profile with query: HTTP 200; Expected status; Response/state assertions

## หน้าและ read-only aliases

| หน้าเดิมที่ยังรองรับ | URL ที่ทดสอบ | ช่องข้อมูล |
|---|---|---|
| / | `/api/page?path=%2F` | products, categories |
| /shop | `/api/page?path=%2Fshop` | products, categories, filters, pagination |
| /search | `/api/page?path=%2Fsearch` | products, categories, filters, pagination |
| /shop/advanced | `/api/page?path=%2Fshop%2Fadvanced` | products, categories, filters, pagination |
| /product/buddy-bear | `/api/page?path=%2Fproduct%2Fbuddy-bear` | product, related |
| /favorites | `/api/page?path=%2Ffavorites` | products |
| /favorites | `/api/favorites` | products |
| /cart | `/api/page?path=%2Fcart` | items, totals |
| /cart | `/api/cart` | items, totals |
| /login | `/api/page?path=%2Flogin` | mode, next, draft |
| /login | `/api/login` | mode, next, draft |
| /register | `/api/page?path=%2Fregister` | mode, next, draft |
| /register | `/api/register` | mode, next, draft |
| /admin/login | `/api/page?path=%2Fadmin%2Flogin` | mode, next, draft |
| /admin/login | `/api/admin/login` | mode, next, draft |
| /contact | `/api/page?path=%2Fcontact` | orderNumber |
| /contact | `/api/contact` | orderNumber |
| /about | `/api/page?path=%2Fabout` |  |
| /team | `/api/page?path=%2Fteam` |  |
| /help | `/api/page?path=%2Fhelp` |  |
| /references | `/api/page?path=%2Freferences` |  |
| /gift-budget | `/api/page?path=%2Fgift-budget` |  |
| /account | `/api/page?path=%2Faccount` | customer, orders |
| /account | `/api/account` | customer, orders |
| /account/profile | `/api/page?path=%2Faccount%2Fprofile` | customer |
| /account/profile | `/api/account/profile` | customer |
| /account/password | `/api/page?path=%2Faccount%2Fpassword` | customer |
| /account/password | `/api/account/password` | customer |
| /order/BGMW8YUYRR74A4 | `/api/page?path=%2Forder%2FBGMW8YUYRR74A4` | order, items, payment |
| /order/BGMW8YUYRR74A4 | `/api/order/BGMW8YUYRR74A4` | order, items, payment |
| /admin | `/api/page?path=%2Fadmin` | metrics, orders, lowStock |
| /admin | `/api/admin` | metrics, orders, lowStock |
| /admin/profile | `/api/page?path=%2Fadmin%2Fprofile` | account |
| /admin/profile | `/api/admin/profile` | account |
| /admin/profile/password | `/api/page?path=%2Fadmin%2Fprofile%2Fpassword` | account |
| /admin/profile/password | `/api/admin/profile/password` | account |
| /admin/settings | `/api/page?path=%2Fadmin%2Fsettings` | settings |
| /admin/settings | `/api/admin/settings` | settings |
| /admin/orders | `/api/page?path=%2Fadmin%2Forders` | orders, filters, payments |
| /admin/orders | `/api/admin/orders` | orders, filters, payments |
| /admin/payments | `/api/page?path=%2Fadmin%2Fpayments` | orders, filters, payments |
| /admin/payments | `/api/admin/payments` | orders, filters, payments |
| /admin/orders/1 | `/api/page?path=%2Fadmin%2Forders%2F1` | order, items, payment |
| /admin/orders/1 | `/api/admin/orders/1` | order, items, payment |
| /admin/messages | `/api/page?path=%2Fadmin%2Fmessages` | messages |
| /admin/messages | `/api/admin/messages` | messages |
| /admin/customers | `/api/page?path=%2Fadmin%2Fcustomers` | customers, filters |
| /admin/customers | `/api/admin/customers` | customers, filters |
| /admin/products | `/api/page?path=%2Fadmin%2Fproducts` | products, categories, filters |
| /admin/products | `/api/admin/products` | products, categories, filters |
| /admin/products/new | `/api/page?path=%2Fadmin%2Fproducts%2Fnew` | product, categories |
| /admin/products/new | `/api/admin/products/new` | product, categories |
| /admin/products/1/edit | `/api/page?path=%2Fadmin%2Fproducts%2F1%2Fedit` | product, categories |
| /admin/products/1/edit | `/api/admin/products/1/edit` | product, categories |
| /admin/products/1/delete | `/api/page?path=%2Fadmin%2Fproducts%2F1%2Fdelete` | product, history |
| /admin/products/1/delete | `/api/admin/products/1/delete` | product, history |
| /admin/accounts | `/api/page?path=%2Fadmin%2Faccounts` | accounts, filters |
| /admin/accounts | `/api/admin/accounts` | accounts, filters |
| /admin/accounts/new | `/api/page?path=%2Fadmin%2Faccounts%2Fnew` | account |
| /admin/accounts/new | `/api/admin/accounts/new` | account |
| /admin/accounts/2/edit | `/api/page?path=%2Fadmin%2Faccounts%2F2%2Fedit` | account |
| /admin/accounts/2/edit | `/api/admin/accounts/2/edit` | account |
| /admin/accounts/2/delete | `/api/page?path=%2Fadmin%2Faccounts%2F2%2Fdelete` | account |
| /admin/accounts/2/delete | `/api/admin/accounts/2/delete` | account |
| /admin/categories | `/api/page?path=%2Fadmin%2Fcategories` | categories |
| /admin/categories | `/api/admin/categories` | categories |
| /admin/categories/new | `/api/page?path=%2Fadmin%2Fcategories%2Fnew` | category, error |
| /admin/categories/new | `/api/admin/categories/new` | category, error |
| /admin/categories/2/edit | `/api/page?path=%2Fadmin%2Fcategories%2F2%2Fedit` | category, error |
| /admin/categories/2/edit | `/api/admin/categories/2/edit` | category, error |
| /admin/categories/2/delete | `/api/page?path=%2Fadmin%2Fcategories%2F2%2Fdelete` | category, categories, error, destination |
| /admin/categories/2/delete | `/api/admin/categories/2/delete` | category, categories, error, destination |

## การทดสอบซ้ำ

นำเข้า collection และ environment จาก `docs/postman/` แล้วรันกับฐานข้อมูลสาธิตตาม [คู่มือติดตั้ง](INSTALLATION.md) ตัวอย่างของบริการทั้งหมดอยู่ใน [คู่มือ API](API.md) และคอมเมนต์เหนือโค้ดบริการ เครื่องมือทดสอบอัตโนมัติและหลักฐาน JSON เก็บใน branch พัฒนา
