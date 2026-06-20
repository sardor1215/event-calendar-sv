// import { Client } from "pg";
// import db, { query as _query } from "./db";

// const createUserTable = async () => {
//   const query = `
//     CREATE TABLE IF NOT EXISTS users (
//       id SERIAL PRIMARY KEY,
//       name VARCHAR(100) NOT NULL,
//       surname VARCHAR(100) NOT NULL,
//       role VARCHAR(50) NOT NULL,
//       department VARCHAR(100) NOT NULL,
//       email VARCHAR(255) UNIQUE NOT NULL,
//       password VARCHAR(255) NOT NULL,
//       registered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     );
//   `;
//   // CREATE TABLE departments (
//   //   id SERIAL PRIMARY KEY,
//   //   name VARCHAR(100) NOT NULL,
//   //   description TEXT,
//   //   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//   // )

//   try {
//     await _query(query);
//     console.log("Users table created successfully");
//   } catch (error) {
//     console.error("Error creating users table", error);
//   }
// };

// createUserTable();

// export default db;
// app.put("/api/tickets/:ticketId/hasOpened", async (req, res) => {
