// Create department

import db from "./db.js";

export const GetDepartments = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM departments");
    res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch departments", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const PostDepartment = async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create department" });
  }
};

export const UpdateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const result = await db.query(
      "UPDATE departments SET name = $1, description = $2 WHERE id = $3 RETURNING *",
      [name, description, id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Department not found" });
    } else {
      res.status(200).json(result.rows[0]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update department" });
  }
};

export const DeleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      "DELETE FROM departments WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Department not found" });
    } else {
      res.status(200).json({ message: "Department deleted" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete department" });
  }
};

export const GetUsersByDepartment = async (req, res) => {
  const { department } = req.query;
  try {
    let query = "SELECT * FROM users";
    const params = [];

    if (department) {
      query += " WHERE department = $1";
      params.push(department);
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch users", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
