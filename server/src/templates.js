import { Router } from "express";
import db from "./db.js";
import { authenticateUser } from "./auth.js";

const router = Router();

// GET /api/templates
router.get("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    let query, params;

    if (role === 'admin') {
      query = `SELECT t.*, u.name as creator_name, u.surname as creator_surname
               FROM meeting_templates t
               LEFT JOIN users u ON t.created_by = u.id
               ORDER BY t.created_at DESC`;
      params = [];
    } else {
      query = `SELECT t.*, u.name as creator_name, u.surname as creator_surname
               FROM meeting_templates t
               LEFT JOIN users u ON t.created_by = u.id
               WHERE t.created_by = $1
               ORDER BY t.created_at DESC`;
      params = [userId];
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/templates
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { name, title, description, location, meeting_chair, duration_minutes, participant_ids } = req.body;
    const created_by = req.user.id;

    if (!name) return res.status(400).json({ error: "Template name is required" });

    const result = await db.query(
      `INSERT INTO meeting_templates (name, title, description, location, meeting_chair, duration_minutes, participant_ids, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, title || null, description || null, location || null, meeting_chair || null, duration_minutes || 60, participant_ids || [], created_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
});

// DELETE /api/templates/:id
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const existing = await db.query("SELECT created_by FROM meeting_templates WHERE id = $1", [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: "Template not found" });
    if (role !== 'admin' && existing.rows[0].created_by !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await db.query("DELETE FROM meeting_templates WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ error: "Failed to delete template" });
  }
});

export default router;
