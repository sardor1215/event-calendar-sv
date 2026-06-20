import "./polyfills.js";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const EVENTS_ONLY = process.env.EVENTS_ONLY === 'true';

import fs from "fs";
import {
  addUser,
  loginUser,
  updateUser,
  deleteUser,
  getAllUsers,
  changePassword,
  authenticateUser,
} from "./auth.js";
import { DeleteDepartment, GetDepartments, GetUsersByDepartment, PostDepartment, UpdateDepartment } from "./departments.js";
import db from "./db.js";
// Legacy ticketing, reporting, messaging, notifications modules are disabled in events-only mode
import eventsRouter from "./events.js";
import locationsRouter from "./locations.js";
import templatesRouter from "./templates.js";
import notificationsRouter from "./notifications.js";
import { sendEmail } from "./emailService.js";

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS restriction
const FRONTEND_URL = process.env.FRONTEND_URL || '';
const allowedOrigins = [FRONTEND_URL].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow non-browser clients
    if (allowedOrigins.length === 0) return callback(null, true); // If not set, allow all (dev)
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + "-" + Math.floor(Math.random() * 10000000000);
    const ext = path.extname(file.originalname);
    const newFileName = `file_${uniqueSuffix}${ext}`;

    fs.access(path.join(uploadsDir, newFileName), fs.constants.F_OK, (err) => {
      if (!err) {
        return cb(
          null,
          `file_${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 12)}${ext}`
        );
      }
      cb(null, newFileName);
    });
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

app.post("/api/addUser", authenticateUser, addUser);
app.post("/api/login", loginUser);
app.get("/api/users", authenticateUser, getAllUsers);
app.put("/api/users/:id", authenticateUser, updateUser);
app.put("/api/users/:id/password", authenticateUser, changePassword);
app.delete("/api/users/:id", authenticateUser, deleteUser);

// Departments
app.get("/api/departments", authenticateUser, GetDepartments);
app.post("/api/departments", authenticateUser, PostDepartment);
app.put("/api/departments/:id", authenticateUser, UpdateDepartment);
app.delete("/api/departments/:id", authenticateUser, DeleteDepartment);
app.get("/api/departments/users", authenticateUser, GetUsersByDepartment);
// Legacy ticketing, messaging, reporting, and push/email settings routes removed in events-only deployment

// Events API
app.use("/api/events", eventsRouter);

// Locations API
app.use("/api/locations", locationsRouter);

// Templates API
app.use("/api/templates", templatesRouter);

// Notifications API
app.use("/api/notifications", notificationsRouter);

// Health endpoint
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

// Test endpoint for file serving
app.get('/api/test-uploads', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    res.json({ 
      message: 'Upload directory accessible',
      uploadPath: uploadsDir,
      fileCount: files.length,
      files: files.slice(0, 5) // Show first 5 files
    });
  } catch (error) {
    res.status(500).json({ error: 'Cannot access uploads directory', details: error.message });
  }
});

import { createHttpsServer } from './https-server.js';

// Event reminder job — runs every 5 minutes, emails participants 1 hour before events
const runReminderJob = async () => {
  if (process.env.SEND_CREATION_EMAIL !== 'true') return;
  try {
    const result = await db.query(`
      SELECT m.id, m.title, m.start_time, m.location,
             COALESCE(json_agg(jsonb_build_object('email', u.email, 'name', u.name))
               FILTER (WHERE u.email IS NOT NULL AND u.email != ''), '[]') AS participants
      FROM events m
      LEFT JOIN event_participants ep ON ep.event_id = m.id
      LEFT JOIN users u ON u.id = ep.user_id
      WHERE m.start_time BETWEEN NOW() + INTERVAL '55 minutes' AND NOW() + INTERVAL '65 minutes'
        AND (m.status IS NULL OR m.status != 'cancelled')
        AND (m.reminder_sent IS NULL OR m.reminder_sent = FALSE)
      GROUP BY m.id
    `);

    for (const event of result.rows) {
      const emails = (event.participants || []).filter(p => p.email).map(p => p.email);
      if (emails.length === 0) continue;

      const subject = `[Sun Valley Event Hub] Reminder: "${event.title}" starts in 1 hour`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border: 1px solid #fde68a;">
            <h2 style="margin: 0 0 8px; color: #92400e;">Reminder: Event in 1 hour</h2>
            <h3>${event.title}</h3>
            <p><strong>When:</strong> ${new Date(event.start_time).toLocaleString()}</p>
            ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
          </div>
        </div>`;

      await Promise.all(emails.map(email =>
        sendEmail(email, subject, '', html).catch(err =>
          console.error(`Reminder email failed for ${email}:`, err.message)
        )
      ));

      await db.query(`UPDATE events SET reminder_sent = TRUE WHERE id = $1`, [event.id]);
      console.log(`📧 Reminder sent for event "${event.title}" to ${emails.length} participants`);
    }
  } catch (err) {
    console.error('Reminder job error:', err.message);
  }
};

setInterval(runReminderJob, 5 * 60 * 1000);

const PORT = process.env.PORT || 5000;

// Check if HTTPS mode is requested
if (process.env.HTTPS === 'true') {
  console.log('🔐 Starting in HTTPS mode for PWA support...');
  const httpsServer = createHttpsServer(app, PORT);
  if (!httpsServer) {
    console.log('⚠️ HTTPS server creation failed, falling back to HTTP...');
    const httpServer = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Static files served from: ${uploadsDir}`);
      console.log(`File access URL: http://localhost:${PORT}/uploads/`);
    });
  }
} else {
  console.log('🌐 Starting in HTTP mode...');
  const httpServer = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Static files served from: ${uploadsDir}`);
    console.log(`File access URL: http://localhost:${PORT}/uploads/`);
  });
}
