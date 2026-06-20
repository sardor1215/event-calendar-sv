import { Router } from "express";
import db from "./db.js";
import { authenticateUser } from "./auth.js";

const router = Router();

// GET /api/locations - Get all locations
router.get("/", authenticateUser, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM locations ORDER BY name ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: "Error fetching locations" });
  }
});

// POST /api/locations - Create a new location
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can manage locations" });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Location name is required" });
    }

    // Check if location already exists
    const existingLocation = await db.query(
      "SELECT id FROM locations WHERE LOWER(name) = LOWER($1)",
      [name.trim()]
    );

    if (existingLocation.rows.length > 0) {
      return res.status(400).json({ message: "Location with this name already exists" });
    }

    const result = await db.query(
      `INSERT INTO locations (name, created_by, created_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [name.trim(), userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ message: "Error creating location" });
  }
});

// PUT /api/locations/:id - Update a location
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can manage locations" });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Location name is required" });
    }

    // Check if location exists
    const existingLocation = await db.query("SELECT id FROM locations WHERE id = $1", [id]);
    if (existingLocation.rows.length === 0) {
      return res.status(404).json({ message: "Location not found" });
    }

    // Check if another location with the same name exists
    const duplicateLocation = await db.query(
      "SELECT id FROM locations WHERE LOWER(name) = LOWER($1) AND id != $2",
      [name.trim(), id]
    );

    if (duplicateLocation.rows.length > 0) {
      return res.status(400).json({ message: "Location with this name already exists" });
    }

    const result = await db.query(
      `UPDATE locations 
       SET name = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [name.trim(), id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ message: "Error updating location" });
  }
});

// DELETE /api/locations/:id - Delete a location
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can manage locations" });
    }

    // Check if location exists
    const existingLocation = await db.query("SELECT id FROM locations WHERE id = $1", [id]);
    if (existingLocation.rows.length === 0) {
      return res.status(404).json({ message: "Location not found" });
    }

    // Check if location is being used in any events
    const eventsUsingLocation = await db.query(
      "SELECT id FROM events WHERE location = (SELECT name FROM locations WHERE id = $1)",
      [id]
    );

    if (eventsUsingLocation.rows.length > 0) {
      return res.status(400).json({
        message: "Cannot delete location. It is being used in existing events."
      });
    }

    await db.query("DELETE FROM locations WHERE id = $1", [id]);

    res.json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({ message: "Error deleting location" });
  }
});

export default router;
