const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'data.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    ssn TEXT NOT NULL,
    addressStreet TEXT,
    addressCity TEXT,
    addressState TEXT,
    addressZipCode TEXT,
    teachableUserId TEXT,
    isAdmin INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add isAdmin column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0`, () => {
    // Column added or already exists - ignore errors
  });

  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    courseNumber TEXT NOT NULL UNIQUE,
    teachableCourseId TEXT UNIQUE,
    price REAL NOT NULL,
    duration TEXT,
    curriculumJson TEXT,
    examJson TEXT,
    examPaperUrl TEXT,
    certificateTemplate TEXT NOT NULL,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Add examPaperUrl column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE courses ADD COLUMN examPaperUrl TEXT`, () => {
    // Column added or already exists - ignore errors
  });

  db.run(`CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    courseId INTEGER NOT NULL,
    teachableEnrollmentId TEXT,
    status TEXT DEFAULT 'pending',
    progress REAL DEFAULT 0,
    examScore REAL,
    examAttempts INTEGER DEFAULT 0,
    examPassed INTEGER DEFAULT 0,
    certificateIssued INTEGER DEFAULT 0,
    paymentStatus TEXT DEFAULT 'pending',
    paymentId TEXT,
    enrolledAt TEXT DEFAULT CURRENT_TIMESTAMP,
    completedAt TEXT,
    FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    courseId INTEGER NOT NULL,
    enrollmentId INTEGER NOT NULL,
    certificateNumber TEXT NOT NULL UNIQUE,
    studentName TEXT NOT NULL,
    ssnLastFour TEXT NOT NULL,
    completionDate TEXT NOT NULL,
    schoolName TEXT NOT NULL,
    instructorName TEXT NOT NULL,
    schoolLicenseNumber TEXT NOT NULL,
    pdfUrl TEXT NOT NULL,
    issuedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES users(id),
    FOREIGN KEY (courseId) REFERENCES courses(id),
    FOREIGN KEY (enrollmentId) REFERENCES enrollments(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    licenseNumber TEXT NOT NULL,
    instructorName TEXT NOT NULL,
    instructorSignature TEXT NOT NULL,
    businessRepresentative TEXT,
    businessRepresentativeSignature TEXT,
    logo TEXT,
    addressStreet TEXT,
    addressCity TEXT,
    addressState TEXT,
    addressZipCode TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    teachableSchoolId TEXT,
    teachableApiKey TEXT,
    stripeSecretKey TEXT,
    stripePublishableKey TEXT
  )`);

  // Add logo and businessRepresentative columns if they don't exist (for existing databases)
  db.run(`ALTER TABLE schools ADD COLUMN logo TEXT`, () => {
    // Column added or already exists - ignore errors
  });
  db.run(`ALTER TABLE schools ADD COLUMN businessRepresentative TEXT`, () => {
    // Column added or already exists - ignore errors
  });
  db.run(`ALTER TABLE schools ADD COLUMN businessRepresentativeSignature TEXT`, () => {
    // Column added or already exists - ignore errors
  });

  db.run(`CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    courseId INTEGER NOT NULL,
    enrollmentId INTEGER NOT NULL,
    badgeType TEXT NOT NULL DEFAULT 'certificate',
    badgeName TEXT NOT NULL,
    badgeDescription TEXT,
    earnedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (enrollmentId) REFERENCES enrollments(id) ON DELETE CASCADE
  )`);

  // Membership tables
  db.run(`CREATE TABLE IF NOT EXISTS membership_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK(type IN ('recurring', 'lifetime')),
    billingInterval TEXT CHECK(billingInterval IN ('monthly', 'yearly')),
    price REAL NOT NULL,
    stripePriceId TEXT,
    stripeProductId TEXT,
    discountPercent REAL DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS membership_tier_courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membershipPlanId INTEGER NOT NULL,
    courseId INTEGER NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (membershipPlanId) REFERENCES membership_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(membershipPlanId, courseId)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    membershipPlanId INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'canceled', 'expired', 'past_due')),
    stripeSubscriptionId TEXT,
    stripeCustomerId TEXT,
    currentPeriodStart TEXT,
    currentPeriodEnd TEXT,
    canceledAt TEXT,
    expiresAt TEXT,
    startedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (membershipPlanId) REFERENCES membership_plans(id)
  )`);

  // Add columns to existing tables if they don't exist
  db.run(`ALTER TABLE users ADD COLUMN stripeCustomerId TEXT`, () => {
    // Column added or already exists - ignore errors
  });

  db.run(`ALTER TABLE enrollments ADD COLUMN membershipId INTEGER`, () => {
    // Column added or already exists - ignore errors
  });

  db.run(`ALTER TABLE enrollments ADD COLUMN discountApplied REAL DEFAULT 0`, () => {
    // Column added or already exists - ignore errors
  });
});

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

module.exports = { db, run, get, all };


