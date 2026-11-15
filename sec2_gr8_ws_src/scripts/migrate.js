// Apply pending SQL migrations and record completed migration versions.
import { readFile, readdir } from "node:fs/promises";
import { query, pool } from "../src/db.js";
try {
  await query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(180) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  );
  for (const name of (await readdir(new URL("../migrations/", import.meta.url)))
    .filter((n) => n.endsWith(".sql") && !n.startsWith("001_"))
    .sort()) {
    if (
      (
        await query("SELECT name FROM schema_migrations WHERE name=:name", {
          name,
        })
      ).length
    )
      continue;
    const source = await readFile(
      new URL("../migrations/" + name, import.meta.url),
      "utf8",
    );
    for (const sql of source
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)) {
      const constraint = /^ALTER TABLE (\w+) ADD CONSTRAINT (\w+)/i.exec(sql);
      if (
        constraint &&
        (
          await query(
            "SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME=:table AND CONSTRAINT_NAME=:constraint",
            { table: constraint[1], constraint: constraint[2] },
          )
        ).length
      )
        continue;
      const column = /^ALTER TABLE (\w+) ADD COLUMN (\w+)/i.exec(sql),
        index = /^ALTER TABLE (\w+) ADD UNIQUE KEY (\w+)/i.exec(sql);
      if (
        column &&
        (
          await query(
            "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=:table AND COLUMN_NAME=:column",
            { table: column[1], column: column[2] },
          )
        ).length
      )
        continue;
      if (
        index &&
        (
          await query(
            "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=:table AND INDEX_NAME=:index",
            { table: index[1], index: index[2] },
          )
        ).length
      )
        continue;
      await query(sql);
    }
    await query("INSERT INTO schema_migrations(name) VALUES(:name)", { name });
    console.log("Applied " + name);
  }
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
