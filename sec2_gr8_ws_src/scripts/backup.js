// Export the configured database to a local backup file.
import mysql from "mysql2";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "../src/db.js";
const directory = path.resolve(
  process.env.BACKUP_DIR || "work/runtime/backups",
);
const connection = await pool.getConnection();
try {
  await connection.query("START TRANSACTION WITH CONSISTENT SNAPSHOT");
  const [tables] = await connection.query("SHOW TABLES"),
    statements = [
      "-- BuddyGiftfy backup. Restore into an empty database.",
      "SET FOREIGN_KEY_CHECKS=0;",
    ];
  for (const row of tables) {
    const name = Object.values(row)[0];
    if (name === "sessions") continue;
    const id = mysql.escapeId(name),
      [schema] = await connection.query("SHOW CREATE TABLE " + id);
    statements.push(
      schema[0]["Create Table"].replace(
        "CREATE TABLE ",
        "CREATE TABLE IF NOT EXISTS ",
      ) + ";",
    );
    const [rows] = await connection.query("SELECT * FROM " + id);
    for (const record of rows) {
      const columns = Object.keys(record);
      statements.push(
        "INSERT INTO " +
          id +
          " (" +
          columns.map(mysql.escapeId).join(",") +
          ") VALUES (" +
          columns.map((k) => mysql.escape(record[k])).join(",") +
          ");",
      );
    }
  }
  statements.push("SET FOREIGN_KEY_CHECKS=1;");
  await connection.commit();
  await mkdir(directory, { recursive: true });
  const file = path.join(
    directory,
    "buddygiftfy-" + new Date().toISOString().replaceAll(/[:.]/g, "-") + ".sql",
  );
  await writeFile(file, statements.join("\n"), { mode: 0o600, flag: "wx" });
  console.log("Backup saved: " + file);
} catch (error) {
  await connection.rollback();
  console.error("Backup failed:", error.message);
  process.exitCode = 1;
} finally {
  connection.release();
  await pool.end();
}
