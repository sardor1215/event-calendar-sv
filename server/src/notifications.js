import { Router } from "express";
import db from "./db.js";
import { authenticateUser } from "./auth.js";

const router = Router();

// GET /api/notifications — current user's last 30 notifications
router.get("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT n.id, n.type, n.message, n.event_id, n.is_read, n.created_at,
              m.title as event_title
       FROM notifications n
       LEFT JOIN events m ON m.id = n.event_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 30`,
      [userId]
    );
    const unreadCount = result.rows.filter(n => !n.is_read).length;
    res.json({ notifications: result.rows, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/notifications/read-all — mark all as read for current user
router.put("/read-all", authenticateUser, async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/notifications/:id/read — mark one notification as read
router.put("/:id/read", authenticateUser, async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
