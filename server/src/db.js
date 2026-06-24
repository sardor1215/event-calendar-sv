import bcrypt from "bcryptjs";
import pg from "pg";
const { Pool } = pg;
import pkg from "pg";
const { Client } = pkg;
import dotenv from "dotenv";
dotenv.config();

const db = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
});
// const db = new Client({
//   user: "postgres",
//   host: "localhost",
//   database: "postgres",
//   password: "7659",
//   port: 5432,
// });

const connectDB = async () => {
  try {
    await db.connect();
    console.log("Database connected successfully");
    await createTables();
    // await addUser({
    //   username: "admin",
    //   name: "admin",
    //   surname: "admin",
    //   role: "admin",
    //   department: "admin",
    //   email: "sardor@mail.ru",
    //   password: "123",
    // });
  } catch (error) {
    console.error("Error connecting to the database", error);
  }
};

const createTables = async () => {
  const EVENTS_ONLY = process.env.EVENTS_ONLY === 'true';

  const tables = [
    `CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      surname VARCHAR NOT NULL,
      username VARCHAR NOT NULL UNIQUE,
      role VARCHAR NOT NULL,
      department INTEGER,
      email VARCHAR,
      password VARCHAR NOT NULL,
      registered_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department) REFERENCES departments(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      organizer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
      location VARCHAR(255),
      event_number VARCHAR(50),
      event_chair VARCHAR(255),
      start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
      end_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
      duration_minutes INTEGER GENERATED ALWAYS AS (GREATEST(0, EXTRACT(EPOCH FROM (end_time - start_time))::int / 60)) STORED,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS event_participants (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      invited_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS event_files (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      file_path TEXT NOT NULL,
      file_name TEXT,
      file_size INTEGER,
      file_type TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS locations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITHOUT TIME ZONE
    )`,
    `CREATE TABLE IF NOT EXISTS event_templates (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      title VARCHAR(255),
      description TEXT,
      location VARCHAR(255),
      event_chair VARCHAR(255),
      duration_minutes INTEGER DEFAULT 60,
      participant_ids INTEGER[] DEFAULT '{}',
      created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const query of tables) {
    const tableName = query.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
    try {
      await db.query(query);
      console.log(`Table '${tableName}' created or already exists`);
    } catch (error) {
      console.error(`Error creating table ${tableName}:`, error);
    }
  }

  // Safe column migrations — add new columns to existing tables without recreating them
  const migrations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITHOUT TIME ZONE`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'scheduled'`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS recurring_group_id VARCHAR(36)`,
    `ALTER TABLE event_participants ADD COLUMN IF NOT EXISTS rsvp_status VARCHAR(20) DEFAULT 'pending'`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS notes TEXT`,
    `ALTER TABLE event_participants ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT NULL`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS color VARCHAR(7)`,
  ];
  for (const migration of migrations) {
    try {
      await db.query(migration);
    } catch (error) {
      console.error('Migration error:', error.message);
    }
  }

  if (EVENTS_ONLY) {
    try {
      const legacyTables = [
        'email_notifications_sent',
        'push_settings',
        'email_settings',
        'push_subscriptions',
        'message_seen',
        'message_files',
        'messages',
        'ticket_files',
        'ticket_recipients',
        'ticket_subjects',
        'ticket'
      ];
      for (const t of legacyTables) {
        await db.query(`DROP TABLE IF EXISTS ${t} CASCADE`);
      }
      console.log('🧹 Dropped legacy ticket tables (events-only mode)');
    } catch (error) {
      console.error('Error dropping legacy tables:', error);
    }
  }
};

// Function to migrate email_notifications_sent table to fix constraints
const migrateEmailNotificationsTable = async () => {
  try {
    // Check if the table exists and has the old constraints
    const checkResult = await db.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'email_notifications_sent' 
      AND constraint_type = 'UNIQUE'
    `);
    
    const hasOldConstraints = checkResult.rows.some(row => 
      row.constraint_name === 'unique_notification' || 
      row.constraint_name === 'unique_message_notification'
    );
    
    if (hasOldConstraints) {
      console.log('🔄 Migrating email_notifications_sent table constraints...');
      
      // Drop old constraints
      await db.query('ALTER TABLE email_notifications_sent DROP CONSTRAINT IF EXISTS unique_notification');
      await db.query('ALTER TABLE email_notifications_sent DROP CONSTRAINT IF EXISTS unique_message_notification');
      
      // Add new constraints (PostgreSQL doesn't support WHERE in UNIQUE constraints)
      await db.query(`
        ALTER TABLE email_notifications_sent 
        ADD CONSTRAINT unique_ticket_notification 
        UNIQUE (ticket_id, notification_type)
      `);
      
      await db.query(`
        ALTER TABLE email_notifications_sent 
        ADD CONSTRAINT unique_message_notification 
        UNIQUE (message_id, notification_type)
      `);
      
      await db.query(`
        ALTER TABLE email_notifications_sent 
        ADD CONSTRAINT check_one_id_not_null 
        CHECK (
          (ticket_id IS NOT NULL AND message_id IS NULL) OR 
          (ticket_id IS NULL AND message_id IS NOT NULL)
        )
      `);
      
      console.log('✅ Email notifications table constraints migrated successfully');
    } else {
      console.log('✅ Email notifications table already has correct constraints');
    }
  } catch (error) {
    console.error('❌ Error migrating email notifications table:', error);
  }
};

connectDB();
// addAdmin();

const addUser = async (user) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(user.password, saltRounds);

  const query = `
    INSERT INTO users (username, password, department, role, name, surname)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;

  const values = [
    user.username,
    hashedPassword,
    user.department,
    user.role,
    user.name,
    user.surname,
  ];

  try {
    await db.query(query, values);
    console.log("User added successfully");
  } catch (err) {
    console.error("Error adding user:", err);
  }
};

// Example usage
// const run = async () => {
//   await connectDB();
//   await addUser({
//     username: "admin",
//     name: "admin",
//     surname: "admin",
//     role: "admin",
//     department: "1",
//     email: "sardor@mail.ru",
//     password: "123",
//   });
// };

// run();

export default db;
