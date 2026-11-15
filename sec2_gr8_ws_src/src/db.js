// Share the MySQL pool, parameterized queries, and transaction lifecycle.
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  ...(process.env.DB_SOCKET_PATH
    ? { socketPath: process.env.DB_SOCKET_PATH }
    : {}),
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || "buddygiftfy",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "Z",
  decimalNumbers: true,
  dateStrings: true,
  supportBigNumbers: true,
  namedPlaceholders: true,
});

pool.on("connection", (connection) => {
  connection.query("SET time_zone = '+00:00'");
});

export async function query(sql, values = {}) {
  const [rows] = await pool.execute(sql, values);
  return rows;
}

// Commit all related changes together; roll back on failure and always release the connection.
export async function transaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
