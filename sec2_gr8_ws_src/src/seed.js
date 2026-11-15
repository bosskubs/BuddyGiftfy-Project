// Create demo records and password hashes for an initialized database.
import { pool, query } from "./db.js";
import { hashPassword } from "./security.js";
import { demoProducts, seedDemoCatalog } from "./demo-catalog.js";

const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "";
if (!adminEmail || !adminPassword || adminPassword.length < 14) {
  console.error(
    "Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 14 characters) in .env before seeding.",
  );
  process.exitCode = 1;
} else {
  try {
    const existing = await query(
      "SELECT admin_id FROM admin_accounts WHERE email = :email",
      { email: adminEmail },
    );
    if (!existing.length) {
      await query(
        "INSERT INTO admin_accounts (email,password_hash,first_name,last_name,role,status) VALUES (:email,:hash,:first,:last,'Owner','Active')",
        {
          email: adminEmail,
          hash: await hashPassword(adminPassword),
          first: process.env.ADMIN_FIRST_NAME || "Buddy",
          last: process.env.ADMIN_LAST_NAME || "Admin",
        },
      );
      console.log(`Created administrator: ${adminEmail}`);
    } else console.log(`Administrator already exists: ${adminEmail}`);

    const added = await seedDemoCatalog();
    console.log(
      `Added ${added} demo products from a catalog of ${demoProducts.length}.`,
    );
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
