const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');

// Helper function to normalize email
function normalizeEmail(email) {
  return (email || '').toLowerCase().trim();
}

// Helper function to validate student data
function validateStudent(student, isUpdate = false) {
  if (!isUpdate) {
    if (!student.firstName || !student.lastName || !student.email || !student.ssn) {
      throw new Error('First name, last name, email, and SSN are required');
    }
  }

  // Validate email format if provided
  if (student.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = normalizeEmail(student.email);
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  // Validate SSN if provided
  if (student.ssn && !/^\d{4,}$/.test(student.ssn)) {
    throw new Error('SSN must be at least 4 digits');
  }
}

// Helper function to prepare student data for database
function prepareStudentData(student, existing = null) {
  const email = student.email ? normalizeEmail(student.email) : (existing?.email || '');
  
  return {
    firstName: student.firstName || existing?.firstName || '',
    lastName: student.lastName || existing?.lastName || '',
    email,
    phone: student.phone || existing?.phone || null,
    ssn: student.ssn || existing?.ssn || '',
    addressStreet: student.address?.street ?? existing?.addressStreet ?? null,
    addressCity: student.address?.city ?? existing?.addressCity ?? null,
    addressState: student.address?.state ?? existing?.addressState ?? null,
    addressZipCode: student.address?.zipCode ?? existing?.addressZipCode ?? null,
    teachableUserId: student.teachableUserId || existing?.teachableUserId || null,
  };
}

// Create student
router.post('/', async (req, res) => {
  try {
    const student = req.body;

    validateStudent(student);

    const email = normalizeEmail(student.email);
    const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const studentData = prepareStudentData(student);
    // Check if email is admin email
    const isAdminEmail = normalizeEmail(studentData.email) === 'info@stayreadyinstitutes.com';
    
    const result = await run(
      `INSERT INTO users
       (firstName, lastName, email, phone, ssn,
        addressStreet, addressCity, addressState, addressZipCode, teachableUserId, isAdmin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentData.firstName,
        studentData.lastName,
        studentData.email,
        studentData.phone,
        studentData.ssn,
        studentData.addressStreet,
        studentData.addressCity,
        studentData.addressState,
        studentData.addressZipCode,
        studentData.teachableUserId,
        isAdminEmail ? 1 : 0,
      ]
    );

    const createdStudent = await get('SELECT * FROM users WHERE id = ?', [result.id]);
    res.status(201).json(createdStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    const statusCode = error.message.includes('required') || 
                      error.message.includes('Invalid') || 
                      error.message.includes('must be') ? 400 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to create student', details: error.message });
  }
});

// Get all students
router.get('/', async (_req, res) => {
  try {
    const students = await all('SELECT * FROM users ORDER BY createdAt DESC');
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get student by ID
router.get('/:studentId', async (req, res) => {
  try {
    const student = await get('SELECT * FROM users WHERE id = ?', [req.params.studentId]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Update student
router.patch('/:studentId', async (req, res) => {
  try {
    const existing = await get('SELECT * FROM users WHERE id = ?', [req.params.studentId]);
    if (!existing) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = req.body;
    const updated = { ...existing, ...student };

    // Validate if email or SSN are being updated
    if (student.email || student.ssn) {
      validateStudent(updated, true);
    }

    // Check email uniqueness if email is being updated
    if (student.email) {
      const email = normalizeEmail(student.email);
      if (email !== normalizeEmail(existing.email)) {
        const emailExists = await get('SELECT id FROM users WHERE email = ?', [email]);
        if (emailExists) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }
    }

    const studentData = prepareStudentData(student, existing);
    // Check if email is admin email
    const isAdminEmail = normalizeEmail(studentData.email) === 'info@stayreadyinstitutes.com';

    await run(
      `UPDATE users SET
        firstName = ?, lastName = ?, email = ?, phone = ?, ssn = ?,
        addressStreet = ?, addressCity = ?, addressState = ?, addressZipCode = ?,
        teachableUserId = ?, isAdmin = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        studentData.firstName,
        studentData.lastName,
        studentData.email,
        studentData.phone,
        studentData.ssn,
        studentData.addressStreet,
        studentData.addressCity,
        studentData.addressState,
        studentData.addressZipCode,
        studentData.teachableUserId,
        isAdminEmail ? 1 : (existing.isAdmin || 0),
        req.params.studentId,
      ]
    );

    const updatedStudent = await get('SELECT * FROM users WHERE id = ?', [req.params.studentId]);
    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    const statusCode = error.message.includes('required') || 
                      error.message.includes('Invalid') || 
                      error.message.includes('must be') ? 400 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to update student' });
  }
});

// Get student by email
router.get('/email/:email', async (req, res) => {
  try {
    const email = normalizeEmail(req.params.email);
    const student = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

module.exports = router;
