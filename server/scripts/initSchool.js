const { get, run } = require('../db');
require('dotenv').config();

async function initSchool() {
  try {
    const existingSchool = await get('SELECT * FROM schools LIMIT 1');
    if (existingSchool) {
      console.log('School configuration already exists:');
      console.log(existingSchool);
      process.exit(0);
    }

    const name = process.env.SCHOOL_NAME || 'Stay Ready Training Academy';
    const licenseNumber = process.env.SCHOOL_LICENSE_NUMBER || 'YOUR_LICENSE_NUMBER';
    const instructorName = process.env.INSTRUCTOR_NAME || 'Your Name';
    const instructorSignature =
      process.env.INSTRUCTOR_SIGNATURE_PATH || './uploads/signature.png';

    await run(
      `INSERT INTO schools
       (name, licenseNumber, instructorName, instructorSignature,
        addressStreet, addressCity, addressState, addressZipCode,
        phone, email, website,
        teachableSchoolId, teachableApiKey,
        stripeSecretKey, stripePublishableKey)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        licenseNumber,
        instructorName,
        instructorSignature,
        process.env.SCHOOL_STREET || '',
        process.env.SCHOOL_CITY || '',
        process.env.SCHOOL_STATE || 'TX',
        process.env.SCHOOL_ZIP || '',
        process.env.SCHOOL_PHONE || '',
        process.env.SCHOOL_EMAIL || '',
        process.env.SCHOOL_WEBSITE || 'https://stayreadyinstitutes.com',
        process.env.TEACHABLE_SCHOOL_ID || '',
        process.env.TEACHABLE_API_KEY || '',
        process.env.STRIPE_SECRET_KEY || '',
        process.env.STRIPE_PUBLISHABLE_KEY || '',
      ]
    );

    console.log('School configuration created successfully!');
    console.log('Please update the configuration with your actual details.');

    process.exit(0);
  } catch (error) {
    console.error('Error initializing school:', error);
    process.exit(1);
  }
}

initSchool();

