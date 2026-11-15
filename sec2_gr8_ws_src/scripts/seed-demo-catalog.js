// Add missing demo products and refresh original demo artwork.
import { pool } from "../src/db.js";
import { demoProducts, seedDemoCatalog } from "../src/demo-catalog.js";

try {
  const added = await seedDemoCatalog();
  console.log(
    `Added ${added} products from a catalog of ${demoProducts.length} demo products.`,
  );
} catch (error) {
  console.error("Demo catalog import failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
