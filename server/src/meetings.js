import { Router } from "express";
import db from "./db.js";
import { authenticateUser } from "./auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendEmail } from "./emailService.js";

const router = Router();

// Create upload directory for meeting files
const uploadDir = path.join(process.cwd(), "uploads", "meetings");
fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  }
});

// Helper function to convert absolute path to relative path for serving
const convertToRelativePath = (absolutePath) => {
  const relativePath = path.relative(process.cwd(), absolutePath);
  return relativePath.replace(/\\/g, '/'); // Convert backslashes to forward slashes
};

// Helper: insert an in-app notification (fire-and-forget safe)
const createNotification = async (userId, type, message, meetingId = null) => {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, message, meeting_id) VALUES ($1, $2, $3, $4)`,
      [userId, type, message, meetingId]
    );
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

// Helper: generate a UUID v4
const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

// Helper: generate recurring meeting dates
const generateRecurringDates = (startDate, endDate, options) => {
  const { frequency = 'weekly', interval = 1, endType = 'count', endDate: recEndDate, count = 5 } = options;
  const duration = endDate.getTime() - startDate.getTime();
  const dates = [{ start: new Date(startDate), end: new Date(endDate) }];
  let current = new Date(startDate);
  const maxExtra = endType === 'count' ? Math.min(parseInt(count) - 1, 52) : 52;
  const endLimit = endType === 'date' && recEndDate ? new Date(recEndDate) : null;

  for (let i = 0; i < maxExtra; i++) {
    if (frequency === 'daily') {
      current = new Date(current.getTime() + parseInt(interval) * 86400000);
    } else if (frequency === 'weekly') {
      current = new Date(current.getTime() + parseInt(interval) * 7 * 86400000);
    } else if (frequency === 'monthly') {
      const d = new Date(current);
      d.setMonth(d.getMonth() + parseInt(interval));
      current = d;
    }
    if (endLimit && current > endLimit) break;
    dates.push({ start: new Date(current), end: new Date(current.getTime() + duration) });
  }
  return dates;
};

// GET /api/meetings/conflicts - Check for scheduling conflicts
router.get("/conflicts", authenticateUser, async (req, res) => {
  try {
    const { location, start, end, exclude_id } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: "start and end are required" });
    }
    let query = `
      SELECT id, title, start_time, end_time, location
      FROM meetings
      WHERE (status IS NULL OR status != 'cancelled')
        AND start_time < $1 AND end_time > $2
    `;
    const params = [end, start];
    let paramIndex = 3;
    if (location) {
      query += ` AND LOWER(location) = LOWER($${paramIndex})`;
      params.push(location);
      paramIndex++;
    }
    if (exclude_id) {
      query += ` AND id != $${paramIndex}`;
      params.push(parseInt(exclude_id));
    }
    const result = await db.query(query, params);
    res.json({ conflicts: result.rows });
  } catch (error) {
    console.error("Error checking conflicts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/meetings - List meetings with optional filtering
router.get("/", authenticateUser, async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const { department_id, from, to, page = 1, limit = 20, search, location } = req.query;

    let conditions = [];
    let params = [];
    let paramIndex = 1;

    // Role-based access control
    if (role !== "admin") {
      conditions.push(`(m.organizer_id = $${paramIndex} OR EXISTS (SELECT 1 FROM meeting_participants mp WHERE mp.meeting_id = m.id AND mp.user_id = $${paramIndex}))`);
      params.push(userId);
      paramIndex++;
    }

    // Optional filters
    if (department_id) {
      conditions.push(`m.department_id = $${paramIndex}`);
      params.push(department_id);
      paramIndex++;
    }

    if (from) {
      conditions.push(`m.start_time >= $${paramIndex}`);
      params.push(from);
      paramIndex++;
    }

    if (to) {
      conditions.push(`m.end_time <= $${paramIndex}`);
      params.push(to);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(m.title ILIKE $${paramIndex} OR m.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (location) {
      conditions.push(`m.location ILIKE $${paramIndex}`);
      params.push(`%${location}%`);
      paramIndex++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    
    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const query = `
      SELECT 
        m.*,
        u.name as organizer_name,
        u.surname as organizer_surname,
        d.name as department_name,
        (SELECT COUNT(*) FROM meeting_participants mp2 WHERE mp2.meeting_id = m.id AND mp2.attended = TRUE) as attended_count,
        (SELECT COUNT(*) FROM meeting_participants mp2 WHERE mp2.meeting_id = m.id) as participant_count,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'surname', p.surname,
          'email', p.email,
          'department', pd.name
        )) FILTER (WHERE p.id IS NOT NULL), '[]') as participants,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', mf.id,
          'file_path', mf.file_path,
          'file_name', mf.file_name,
          'file_size', mf.file_size,
          'file_type', mf.file_type
        )) FILTER (WHERE mf.id IS NOT NULL), '[]') as files
      FROM meetings m
      LEFT JOIN users u ON m.organizer_id = u.id
      LEFT JOIN departments d ON m.department_id = d.id
      LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id
      LEFT JOIN users p ON mp.user_id = p.id
      LEFT JOIN departments pd ON p.department = pd.id
      LEFT JOIN meeting_files mf ON mf.meeting_id = m.id
      ${whereClause}
      GROUP BY m.id, u.name, u.surname, d.name
      ORDER BY m.start_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await db.query(query, params);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT m.id) as total
      FROM meetings m
      ${whereClause}
    `;
    const countParams = params.slice(0, -2); // Remove limit and offset
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      meetings: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/meetings - Create a new meeting
router.post("/", authenticateUser, upload.array("files"), async (req, res) => {
  try {
    const {
      title,
      description,
      department_id,
      location,
      meeting_number,
      meeting_chair,
      start_time,
      end_time,
      participants = "[]",
      recurring = "false",
      recurringOptions = "{}"
    } = req.body;

    const organizer_id = req.user.id;

    // Validate required fields
    if (!title || !start_time || !end_time) {
      return res.status(400).json({ error: "Title, start_time, and end_time are required" });
    }

    // Validate time logic
    const start = new Date(start_time);
    const end = new Date(end_time);
    if (start >= end) {
      return res.status(400).json({ error: "End time must be after start time" });
    }

    // Parse participants
    let participantIds = [];
    try {
      participantIds = JSON.parse(participants);
    } catch (e) {
      console.warn("Invalid participants JSON:", participants);
    }

    // Helper to add participants to a meeting
    const addParticipants = async (meetingId, ids) => {
      if (!Array.isArray(ids) || ids.length === 0) return;
      const values = ids.map((uid, idx) => `($1, $${idx + 2})`).join(", ");
      await db.query(
        `INSERT INTO meeting_participants (meeting_id, user_id) VALUES ${values}`,
        [meetingId, ...ids]
      );
    };

    // Handle recurring meetings
    const isRecurring = recurring === 'true' || recurring === true;
    let parsedRecurringOptions = {};
    try { parsedRecurringOptions = JSON.parse(recurringOptions); } catch (e) {}

    if (isRecurring && parsedRecurringOptions.frequency) {
      const recurringGroupId = generateUUID();
      const dates = generateRecurringDates(start, end, parsedRecurringOptions);
      const createdMeetings = [];

      for (const { start: s, end: e } of dates) {
        const mr = await db.query(
          `INSERT INTO meetings (title, description, organizer_id, department_id, location, meeting_number, meeting_chair, start_time, end_time, recurring_group_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [title, description, organizer_id, department_id || null, location, meeting_number || null, meeting_chair || null, s.toISOString(), e.toISOString(), recurringGroupId]
        );
        const m = mr.rows[0];
        await addParticipants(m.id, participantIds);
        createdMeetings.push(m);
      }

      return res.status(201).json({ meetings: createdMeetings, recurring_group_id: recurringGroupId });
    }

    // Create the meeting
    const meetingResult = await db.query(
      `INSERT INTO meetings (title, description, organizer_id, department_id, location, meeting_number, meeting_chair, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, description, organizer_id, department_id || null, location, meeting_number || null, meeting_chair || null, start_time, end_time]
    );

    const meeting = meetingResult.rows[0];

    await addParticipants(meeting.id, participantIds);

    // In-app notifications for invited participants
    for (const uid of participantIds) {
      if (uid !== organizer_id) {
        await createNotification(uid, 'meeting_invite', `You've been invited to "${title}"`, meeting.id);
      }
    }

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      const fileInserts = req.files.map((file) => {
        const relativePath = convertToRelativePath(file.path);
        return db.query(
          `INSERT INTO meeting_files (meeting_id, file_path, file_name, file_size, file_type) 
           VALUES ($1, $2, $3, $4, $5)`,
          [meeting.id, relativePath, file.originalname, file.size, file.mimetype]
        );
      });
      
      await Promise.all(fileInserts);
    }

    // Optionally send creation emails (disabled by default)
    if (process.env.SEND_CREATION_EMAIL === 'true' && Array.isArray(participantIds) && participantIds.length > 0) {
      try {
        const userResult = await db.query(
          `SELECT email, name, surname FROM users WHERE id = ANY($1::int[])`,
          [participantIds]
        );
        
        const users = userResult.rows.filter(user => user.email);
        
        if (users.length > 0) {
          const subject = `Meeting Invitation: ${title}`;
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">📅 Meeting Invitation</h2>
              <p>You have been invited to a meeting:</p>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e293b;">${title}</h3>
                <p><strong>When:</strong> ${new Date(start_time).toLocaleString()} - ${new Date(end_time).toLocaleString()}</p>
                <p><strong>Location:</strong> ${location || "TBD"}</p>
                ${description ? `<p><strong>Description:</strong> ${description}</p>` : ""}
              </div>
              
              <p>Please mark your calendar and prepare accordingly.</p>
            </div>
          `;
          
          // Send emails asynchronously
          Promise.all(
            users.map(user => 
              sendEmail(user.email, subject, "", html).catch(err => 
                console.error(`Failed to send email to ${user.email}:`, err)
              )
            )
          );
        }
      } catch (emailError) {
        console.error("Error sending meeting invitations:", emailError);
        // Don't fail the meeting creation if email fails
      }
    }

    res.status(201).json(meeting);
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ error: "Failed to create meeting" });
  }
});

// GET /api/meetings/:id - Get a specific meeting
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role;
    const userId = req.user.id;

    const query = `
      SELECT 
        m.*,
        u.name as organizer_name,
        u.surname as organizer_surname,
        d.name as department_name,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'surname', p.surname,
          'email', p.email,
          'department', pd.name,
          'rsvp_status', mp.rsvp_status,
          'attended', mp.attended
        )) FILTER (WHERE p.id IS NOT NULL), '[]') as participants,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', mf.id,
          'file_path', mf.file_path,
          'file_name', mf.file_name,
          'file_size', mf.file_size,
          'file_type', mf.file_type
        )) FILTER (WHERE mf.id IS NOT NULL), '[]') as files
      FROM meetings m
      LEFT JOIN users u ON m.organizer_id = u.id
      LEFT JOIN departments d ON m.department_id = d.id
      LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id
      LEFT JOIN users p ON mp.user_id = p.id
      LEFT JOIN departments pd ON p.department = pd.id
      LEFT JOIN meeting_files mf ON mf.meeting_id = m.id
      WHERE m.id = $1
      GROUP BY m.id, u.name, u.surname, d.name
    `;

    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const meeting = result.rows[0];

    // Check access permissions
    if (role !== "admin" && meeting.organizer_id !== userId) {
      // Check if user is a participant
      const isParticipant = meeting.participants.some(p => p.id === userId);
      if (!isParticipant) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    res.json(meeting);
  } catch (error) {
    console.error("Error fetching meeting:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/meetings/:id - Update a meeting
router.put("/:id", authenticateUser, upload.array("files"), async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role;
    const userId = req.user.id;
    
    const {
      title,
      description,
      department_id,
      location,
      start_time,
      end_time,
      participants = "[]",
      remove_file_ids = "[]"
    } = req.body;

    // Check if meeting exists and user has permission to edit
    const existingMeeting = await db.query(
      `SELECT organizer_id FROM meetings WHERE id = $1`,
      [id]
    );

    if (existingMeeting.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    if (role !== "admin" && existingMeeting.rows[0].organizer_id !== userId) {
      return res.status(403).json({ error: "Only the organizer or admin can edit this meeting" });
    }

    // Update meeting details
    const updateResult = await db.query(
      `UPDATE meetings SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        department_id = COALESCE($4, department_id),
        location = COALESCE($5, location),
        start_time = COALESCE($6, start_time),
        end_time = COALESCE($7, end_time)
       WHERE id = $1
       RETURNING *`,
      [id, title, description, department_id, location, start_time, end_time]
    );

    const updatedMeeting = updateResult.rows[0];

    // Update participants if provided
    let participantIds = [];
    try {
      participantIds = JSON.parse(participants);
    } catch (e) {
      console.warn("Invalid participants JSON:", participants);
    }

    if (Array.isArray(participantIds)) {
      // Remove existing participants
      await db.query(`DELETE FROM meeting_participants WHERE meeting_id = $1`, [id]);
      
      // Add new participants
      if (participantIds.length > 0) {
        const participantValues = participantIds.map((userId, index) => 
          `($1, $${index + 2})`
        ).join(", ");
        
        await db.query(
          `INSERT INTO meeting_participants (meeting_id, user_id) VALUES ${participantValues}`,
          [id, ...participantIds]
        );
      }
    }

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      const fileInserts = req.files.map((file) => {
        const relativePath = convertToRelativePath(file.path);
        return db.query(
          `INSERT INTO meeting_files (meeting_id, file_path, file_name, file_size, file_type) 
           VALUES ($1, $2, $3, $4, $5)`,
          [id, relativePath, file.originalname, file.size, file.mimetype]
        );
      });
      
      await Promise.all(fileInserts);
    }

    // Remove requested files
    try {
      let removeIds = [];
      try { removeIds = JSON.parse(remove_file_ids || "[]"); } catch {}
      if (Array.isArray(removeIds) && removeIds.length > 0) {
        await db.query(
          `DELETE FROM meeting_files WHERE meeting_id = $1 AND id = ANY($2::int[])`,
          [id, removeIds]
        );
      }
    } catch (e) {
      console.error("Error removing meeting files:", e);
    }

    // Send update notification emails asynchronously (don't block the response)
    if (process.env.SEND_CREATION_EMAIL === 'true') {
      (async () => {
        try {
          const participantResult = await db.query(
            `SELECT u.name, u.surname, u.email
             FROM meeting_participants mp
             JOIN users u ON u.id = mp.user_id
             WHERE mp.meeting_id = $1 AND u.email IS NOT NULL AND u.email != ''`,
            [id]
          );

          if (participantResult.rows.length > 0) {
            const subject = `[Sun Valley Meeting Point] Meeting Updated: ${updatedMeeting.title}`;
            const formatDT = (dt) => dt ? new Date(dt).toLocaleString('en-GB', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', hour12: false
            }) : 'TBD';

            const html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #2563eb; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h2 style="color: white; margin: 0;">📅 Meeting Updated</h2>
                </div>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
                  <p>A meeting you are attending has been updated:</p>
                  <div style="background-color: white; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <h3 style="margin-top: 0; color: #1e293b;">${updatedMeeting.title}</h3>
                    <p><strong>Start:</strong> ${formatDT(updatedMeeting.start_time)}</p>
                    <p><strong>End:</strong> ${formatDT(updatedMeeting.end_time)}</p>
                    <p><strong>Location:</strong> ${updatedMeeting.location || 'TBD'}</p>
                    ${updatedMeeting.description ? `<p><strong>Description:</strong> ${updatedMeeting.description}</p>` : ''}
                  </div>
                  <p style="color: #64748b; font-size: 13px; margin-top: 16px;">Please update your calendar accordingly.</p>
                </div>
              </div>
            `;

            let sent = 0, failed = 0;
            await Promise.all(
              participantResult.rows.map(user =>
                sendEmail(user.email, subject, '', html)
                  .then(() => sent++)
                  .catch(err => {
                    failed++;
                    console.error(`Failed to send update email to ${user.email}:`, err.message);
                  })
              )
            );
            console.log(`📧 Meeting update emails: ${sent} sent, ${failed} failed`);
          }
        } catch (emailErr) {
          console.error('Error sending meeting update emails:', emailErr.message);
        }
      })();
    }

    res.json(updatedMeeting);
  } catch (error) {
    console.error("Error updating meeting:", error);
    res.status(500).json({ error: "Failed to update meeting" });
  }
});

// DELETE /api/meetings/:id - Delete a meeting
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role;
    const userId = req.user.id;

    // Check if meeting exists and user has permission to delete
    const existingMeeting = await db.query(
      `SELECT organizer_id FROM meetings WHERE id = $1`,
      [id]
    );

    if (existingMeeting.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    if (role !== "admin" && existingMeeting.rows[0].organizer_id !== userId) {
      return res.status(403).json({ error: "Only the organizer or admin can delete this meeting" });
    }

    // Delete the meeting (cascade will handle related records)
    await db.query(`DELETE FROM meetings WHERE id = $1`, [id]);

    res.json({ success: true, message: "Meeting deleted successfully" });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    res.status(500).json({ error: "Failed to delete meeting" });
  }
});

// PUT /api/meetings/:id/cancel - Cancel a meeting
router.put("/:id/cancel", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role;
    const userId = req.user.id;

    const existing = await db.query(
      `SELECT organizer_id, title, start_time, location FROM meetings WHERE id = $1`,
      [id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ error: "Meeting not found" });
    if (role !== "admin" && existing.rows[0].organizer_id !== userId) {
      return res.status(403).json({ error: "Only the organizer or admin can cancel this meeting" });
    }

    const meeting = existing.rows[0];
    const result = await db.query(
      `UPDATE meetings SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [id]
    );

    // In-app notifications for all participants
    const participantRows = await db.query(
      `SELECT user_id FROM meeting_participants WHERE meeting_id = $1`,
      [id]
    );
    for (const row of participantRows.rows) {
      await createNotification(row.user_id, 'meeting_cancelled', `Meeting "${meeting.title}" has been cancelled`, parseInt(id));
    }

    if (process.env.SEND_CREATION_EMAIL === 'true') {
      (async () => {
        try {
          const pr = await db.query(
            `SELECT u.name, u.email FROM meeting_participants mp JOIN users u ON u.id = mp.user_id WHERE mp.meeting_id = $1 AND u.email IS NOT NULL AND u.email != ''`,
            [id]
          );
          if (pr.rows.length > 0) {
            const subject = `[Sun Valley Meeting Point] Meeting Cancelled: ${meeting.title}`;
            const html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca;">
                  <h2 style="margin: 0 0 8px; color: #991b1b;">Meeting Cancelled</h2>
                  <p>The following meeting has been cancelled:</p>
                  <h3>${meeting.title}</h3>
                  <p><strong>Was scheduled for:</strong> ${new Date(meeting.start_time).toLocaleString()}</p>
                  ${meeting.location ? `<p><strong>Location:</strong> ${meeting.location}</p>` : ''}
                </div>
              </div>`;
            await Promise.all(pr.rows.map(u =>
              sendEmail(u.email, subject, '', html).catch(err =>
                console.error(`Failed to send cancel email to ${u.email}:`, err.message)
              )
            ));
          }
        } catch (e) { console.error('Error sending cancellation emails:', e.message); }
      })();
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error cancelling meeting:", error);
    res.status(500).json({ error: "Failed to cancel meeting" });
  }
});

// PUT /api/meetings/:id/rsvp - Update participant RSVP status
router.put("/:id/rsvp", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['accepted', 'declined', 'pending'].includes(status)) {
      return res.status(400).json({ error: "Status must be accepted, declined, or pending" });
    }

    const result = await db.query(
      `UPDATE meeting_participants SET rsvp_status = $1 WHERE meeting_id = $2 AND user_id = $3 RETURNING *`,
      [status, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "You are not a participant of this meeting" });
    }

    // Notify the organizer about the RSVP decision
    const mtgRow = await db.query(`SELECT organizer_id, title FROM meetings WHERE id = $1`, [id]);
    if (mtgRow.rows.length > 0) {
      const { organizer_id, title: mtgTitle } = mtgRow.rows[0];
      if (organizer_id !== userId) {
        const userRow = await db.query(`SELECT name, surname FROM users WHERE id = $1`, [userId]);
        const name = userRow.rows[0] ? `${userRow.rows[0].name} ${userRow.rows[0].surname}` : 'Someone';
        const label = status === 'accepted' ? 'accepted' : status === 'declined' ? 'declined' : 'updated their RSVP for';
        await createNotification(organizer_id, 'rsvp_update', `${name} ${label} the invitation to "${mtgTitle}"`, parseInt(id));
      }
    }

    res.json({ success: true, rsvp_status: status });
  } catch (error) {
    console.error("Error updating RSVP:", error);
    res.status(500).json({ error: "Failed to update RSVP" });
  }
});

// PUT /api/meetings/:id/attendance - Mark who actually attended (organizer or admin only)
router.put("/:id/attendance", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { attendance } = req.body; // [{ user_id, attended: true/false }]
    const role = req.user.role;
    const userId = req.user.id;

    if (!Array.isArray(attendance)) {
      return res.status(400).json({ error: "attendance must be an array" });
    }

    const existing = await db.query(`SELECT organizer_id, title, end_time FROM meetings WHERE id = $1`, [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: "Meeting not found" });

    const meeting = existing.rows[0];
    if (role !== "admin" && meeting.organizer_id !== userId) {
      return res.status(403).json({ error: "Only the organizer or admin can mark attendance" });
    }
    if (new Date(meeting.end_time) > new Date()) {
      return res.status(400).json({ error: "Cannot mark attendance before the meeting has ended" });
    }

    for (const { user_id, attended } of attendance) {
      await db.query(
        `UPDATE meeting_participants SET attended = $1 WHERE meeting_id = $2 AND user_id = $3`,
        [attended === true ? true : attended === false ? false : null, id, user_id]
      );
    }

    // Notify each participant of their recorded attendance
    for (const { user_id, attended } of attendance) {
      if (attended === true) {
        await createNotification(user_id, 'meeting_updated', `Your attendance was recorded for "${meeting.title}"`, parseInt(id));
      }
    }

    // Return updated participant list
    const result = await db.query(
      `SELECT mp.user_id, mp.rsvp_status, mp.attended, u.name, u.surname
       FROM meeting_participants mp JOIN users u ON u.id = mp.user_id
       WHERE mp.meeting_id = $1`,
      [id]
    );
    res.json({ success: true, participants: result.rows });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ error: "Failed to mark attendance" });
  }
});

// PUT /api/meetings/:id/notes - Update meeting notes (organizer or admin only)
router.put("/:id/notes", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const role = req.user.role;
    const userId = req.user.id;

    const existing = await db.query(`SELECT organizer_id FROM meetings WHERE id = $1`, [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: "Meeting not found" });
    if (role !== "admin" && existing.rows[0].organizer_id !== userId) {
      return res.status(403).json({ error: "Only the organizer or admin can edit meeting notes" });
    }

    const result = await db.query(
      `UPDATE meetings SET notes = $1 WHERE id = $2 RETURNING notes`,
      [notes || null, id]
    );
    res.json({ notes: result.rows[0].notes });
  } catch (error) {
    console.error("Error updating notes:", error);
    res.status(500).json({ error: "Failed to update notes" });
  }
});

// POST /api/meetings/send-notifications - Send email notifications to meeting participants
router.post("/send-notifications", authenticateUser, async (req, res) => {
  try {
    const {
      meetingId,
      participants,
      subject,
      message,
      meetingTitle,
      startTime,
      endTime,
      location,
      description
    } = req.body;

    // Validate required fields
    if (!meetingId || !participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ error: "Meeting ID and participants are required" });
    }

    if (!subject || !message) {
      return res.status(400).json({ error: "Subject and message are required" });
    }

    // Get participant details
    const participantIds = participants.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (participantIds.length === 0) {
      return res.status(400).json({ error: "No valid participant IDs provided" });
    }

    const participantQuery = `
      SELECT id, name, surname, email 
      FROM users 
      WHERE id = ANY($1) AND email IS NOT NULL AND email != ''
    `;
    
    const participantResult = await db.query(participantQuery, [participantIds]);
    const participantsWithEmail = participantResult.rows;

    if (participantsWithEmail.length === 0) {
      return res.status(400).json({ error: "No participants with valid email addresses found" });
    }

    // Format meeting details for email
    const meetingDetails = {
      title: meetingTitle || 'Meeting',
      startTime: startTime ? new Date(startTime).toLocaleString('en-GB', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
      }) : 'TBD',
      endTime: endTime ? new Date(endTime).toLocaleString('en-GB', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
      }) : 'TBD',
      location: location || 'TBD',
      description: description || 'No description provided'
    };

    // Prefix subject with brand if not already present
    const brandedSubject = subject && subject.startsWith('[Sun Valley Meeting Point]')
      ? subject
      : `[Sun Valley Meeting Point] ${subject}`;

    // Prepare HTML email content: only message from organizer; no end time
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fef3c7; padding: 18px; border-radius: 8px; border: 1px solid #fde68a;">
          <h3 style="margin: 0 0 8px 0; color: #92400e;">Message from Organizer</h3>
          <div style="color: #374151; white-space: pre-wrap; line-height: 1.5;">${message}</div>
        </div>
      </div>
    `;

    // Prepare plain text content: only organizer message, no end time
    const textContent = `Message from Organizer:\n\n${message}`;

    // Send emails to all participants
    const emailPromises = participantsWithEmail.map(async (participant) => {
      try {
        const info = await sendEmail(
          participant.email,
          brandedSubject,
          textContent,
          htmlContent
        );
        const accepted = Array.isArray(info.accepted) && info.accepted.includes(participant.email);
        const rejected = Array.isArray(info.rejected) && info.rejected.includes(participant.email);
        return { email: participant.email, accepted, rejected };
      } catch (error) {
        console.error(`Failed to send email to ${participant.email}:`, error);
        return { email: participant.email, accepted: false, rejected: true, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successfulEmails = results.filter(r => r.accepted && !r.rejected);
    const failedEmails = results.filter(r => r.rejected || !r.accepted);

    console.log(`📧 Meeting notification emails sent: ${successfulEmails.length} successful, ${failedEmails.length} failed`);

    res.json({
      success: true,
      message: `Email notifications sent successfully to ${successfulEmails.length} participants`,
      details: {
        totalParticipants: participantsWithEmail.length,
        successfulEmails: successfulEmails.length,
        failedEmails: failedEmails.length,
        failedRecipients: failedEmails.map(r => r.email)
      }
    });

  } catch (error) {
    console.error("Error sending meeting notifications:", error);
    res.status(500).json({ error: "Failed to send email notifications" });
  }
});

export default router;
