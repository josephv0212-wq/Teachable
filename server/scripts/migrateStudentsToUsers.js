const { db, get } = require('../db');
require('dotenv').config();

async function migrateStudentsToUsers() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Check if students table exists
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='students'", (err, row) => {
        if (err) {
          console.error('Error checking for students table:', err);
          return reject(err);
        }

        if (row) {
          // Students table exists, rename it to users
          console.log('Found students table, renaming to users...');
          db.run(`ALTER TABLE students RENAME TO users`, (renameErr) => {
            if (renameErr) {
              console.error('Error renaming table:', renameErr);
              return reject(renameErr);
            }
            console.log('✓ Successfully renamed students table to users');
            resolve();
          });
        } else {
          // Check if users table already exists
          db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (checkErr, usersRow) => {
            if (checkErr) {
              console.error('Error checking for users table:', checkErr);
              return reject(checkErr);
            }

            if (usersRow) {
              console.log('✓ Users table already exists');
              resolve();
            } else {
              console.log('Neither students nor users table exists. Table will be created on next server start.');
              resolve();
            }
          });
        }
      });
    });
  });
}

// Run migration
migrateStudentsToUsers()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
