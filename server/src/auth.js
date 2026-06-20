import bcrypt from "bcryptjs";
import db from "./db.js";
import jwt from "jsonwebtoken";
const IS_PROD = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (!IS_PROD ? 'dev-insecure-secret' : null);
// Middleware to authenticate and get the user's ID
const authenticateUser = (req, res, next) => {
  const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true';
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!JWT_SECRET) {
    return res.status(500).json({ message: "Server misconfiguration: JWT secret not set" });
  }
  if (DEBUG_AUTH) {
    console.log('🔐 authenticateUser called with:', {
      hasAuthHeader: !!req.headers["authorization"],
      tokenLength: token?.length || 0,
      tokenStart: token?.substring(0, 20) + '...' || 'None'
    });
  }
  
  if (!token) return res.status(403).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('❌ JWT verification failed:', err.message);
      return res.status(401).json({ message: "Failed to authenticate token" });
    }
    if (DEBUG_AUTH) {
      console.log('✅ JWT verified successfully:', { 
        decoded,
        userId: decoded.id || decoded.userId,
        hasId: !!(decoded.id || decoded.userId)
      });
    }
    
    // Normalize the user object to always have 'id' field
    req.user = {
      ...decoded,
      id: decoded.id || decoded.userId
    };
    if (DEBUG_AUTH) {
      console.log('🔧 Normalized user object:', req.user);
    }
    next();
  });
};

// Update a user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, name, surname, role, department, email, password } =
    req.body;

  try {
    let query = `
      UPDATE users
      SET username = $1, name = $2, surname = $3, role = $4, department = $5, email = $6
    `;
    const values = [username, name, surname, role, department, email];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `, password = $7`;
      values.push(hashedPassword);
    }

    query += ` WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// add user
const addUser = async (req, res) => {
  const { username, name, surname, role, department, email, password } =
    req.body;

  try {
    // Check if the user already exists
    const userExists = await db.query(
      "SELECT * FROM users WHERE username = $1 ",
      [username]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const newUser = await db.query(
      "INSERT INTO users (username, name, surname, role, department, email, password, registered_date) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *",
      [username, name, surname, role, department, email, hashedPassword]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    console.error("Error adding user", error);
    res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const userResult = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Login failed. Username not found." });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Login failed. Incorrect password." });
    }

    // Track last login time
    await db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    if (!JWT_SECRET) {
      return res.status(500).json({ message: "Server misconfiguration: JWT secret not set" });
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        surname: user.surname,
        department: user.department,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error logging in user", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing your request." });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.name, u.surname, u.role, u.department AS department_id, d.name AS department, u.email, u.registered_date, u.last_login
       FROM users u
       LEFT JOIN departments d ON u.department = d.id
       ORDER BY u.id`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const changePassword = async (req, res) => {
  const { id } = req.params;
  const { current_password, new_password } = req.body;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;

  if (requesterRole !== 'admin' && requesterId !== parseInt(id)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  try {
    const result = await db.query("SELECT password FROM users WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (requesterRole !== 'admin') {
      if (!current_password) {
        return res.status(400).json({ message: "Current password is required" });
      }
      const isMatch = await bcrypt.compare(current_password, result.rows[0].password);
      if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, id]);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export {
  addUser,
  loginUser,
  updateUser,
  deleteUser,
  getAllUsers,
  changePassword,
  authenticateUser,
};
