const { get, run } = require('../db');
require('dotenv').config();

async function setAdminUser() {
  try {
    const adminEmail = 'info@stayreadyinstitutes.com';
    
    // Check if student with admin email exists
    const student = await get('SELECT * FROM users WHERE email = ?', [adminEmail]);
    
    if (!student) {
      console.log(`Student with email ${adminEmail} not found.`);
      console.log('Please create the student account first, then run this script again.');
      process.exit(1);
    }

    // Update student to be admin
    await run(
      'UPDATE users SET isAdmin = 1 WHERE email = ?',
      [adminEmail]
    );

    console.log(`✓ Successfully set ${adminEmail} as admin!`);
    console.log(`Student ID: ${student.id}`);
    console.log(`Name: ${student.firstName} ${student.lastName}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin user:', error);
    process.exit(1);
  }
}

setAdminUser();
