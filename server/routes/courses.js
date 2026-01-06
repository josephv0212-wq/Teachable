const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');
const { ensureExam2Course } = require('../utils/exam2Course');

// Helper function to map DB row to API shape
function mapCourseRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    description: row.description,
    courseNumber: row.courseNumber,
    teachableCourseId: row.teachableCourseId,
    price: row.price,
    duration: row.duration,
    curriculum: row.curriculumJson ? JSON.parse(row.curriculumJson) : null,
    exam: row.examJson ? JSON.parse(row.examJson) : null,
    examPaperUrl: row.examPaperUrl || null,
    certificateTemplate: row.certificateTemplate,
    isActive: !!row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// Helper function to validate course data
function validateCourse(course) {
  if (!course.name || !course.description || !course.courseNumber || course.price === undefined) {
    throw new Error('Name, description, courseNumber, and price are required');
  }

  if (isNaN(course.price) || course.price < 0) {
    throw new Error('Price must be a valid positive number');
  }
}

// Helper function to prepare course data for database
function prepareCourseData(course, existing = null) {
  const curriculumJson = course.curriculum !== undefined
    ? JSON.stringify(course.curriculum)
    : (existing?.curriculumJson || null);
  
  const examJson = course.exam !== undefined
    ? JSON.stringify(course.exam)
    : (existing?.examJson || null);

  return {
    name: course.name,
    description: course.description,
    courseNumber: course.courseNumber,
    teachableCourseId: course.teachableCourseId || null,
    price: course.price,
    duration: course.duration || null,
    curriculumJson,
    examJson,
    examPaperUrl: course.examPaperUrl !== undefined ? course.examPaperUrl : (existing?.examPaperUrl || null),
    certificateTemplate: course.certificateTemplate || '',
    isActive: course.isActive === false ? 0 : 1,
  };
}

// Create course
router.post('/', async (req, res) => {
  try {
    const course = req.body;

    validateCourse(course);

    // Check courseNumber uniqueness
    const existing = await get('SELECT id FROM courses WHERE courseNumber = ?', [course.courseNumber]);
    if (existing) {
      return res.status(400).json({ error: 'Course number already exists' });
    }

    const courseData = prepareCourseData(course);
    const result = await run(
      `INSERT INTO courses
       (name, description, courseNumber, teachableCourseId, price, duration,
        curriculumJson, examJson, examPaperUrl, certificateTemplate, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        courseData.name,
        courseData.description,
        courseData.courseNumber,
        courseData.teachableCourseId,
        courseData.price,
        courseData.duration,
        courseData.curriculumJson,
        courseData.examJson,
        courseData.examPaperUrl,
        courseData.certificateTemplate,
        courseData.isActive,
      ]
    );

    const row = await get('SELECT * FROM courses WHERE id = ?', [result.id]);
    res.status(201).json(mapCourseRow(row));
  } catch (error) {
    console.error('Error creating course:', error);
    const statusCode = error.message.includes('required') || error.message.includes('must be') ? 400 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to create course', details: error.message });
  }
});

// Get all courses
router.get('/', async (_req, res) => {
  try {
    const rows = await all('SELECT * FROM courses WHERE isActive = 1 ORDER BY createdAt DESC');
    res.json(rows.map(mapCourseRow));
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get course by ID
router.get('/:courseId', async (req, res) => {
  try {
    let row = await get('SELECT * FROM courses WHERE id = ?', [req.params.courseId]);
    
    // If course not found and it's ID 1, try to ensure exam2 exists
    if (!row && req.params.courseId === '1') {
      const exam2Id = await ensureExam2Course();
      if (exam2Id) {
        // Check if the created exam2 has ID 1, or fetch it
        row = await get('SELECT * FROM courses WHERE courseNumber = ?', ['exam2']);
      }
    }
    
    // If still not found, check if requesting by courseNumber 'exam2'
    if (!row && req.params.courseId === 'exam2') {
      const exam2Id = await ensureExam2Course();
      if (exam2Id) {
        row = await get('SELECT * FROM courses WHERE courseNumber = ?', ['exam2']);
      }
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(mapCourseRow(row));
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Update course
router.patch('/:courseId', async (req, res) => {
  try {
    const existing = await get('SELECT * FROM courses WHERE id = ?', [req.params.courseId]);
    if (!existing) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = req.body;
    const updated = { ...existing, ...course };

    // Validate if required fields are being updated
    if (course.name || course.description || course.courseNumber !== undefined || course.price !== undefined) {
      validateCourse(updated);
    }

    const courseData = prepareCourseData(course, existing);

    await run(
      `UPDATE courses SET
        name = ?, description = ?, courseNumber = ?, teachableCourseId = ?,
        price = ?, duration = ?, curriculumJson = ?, examJson = ?,
        examPaperUrl = ?, certificateTemplate = ?, isActive = ?,
        updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        courseData.name,
        courseData.description,
        courseData.courseNumber,
        courseData.teachableCourseId,
        courseData.price,
        courseData.duration,
        courseData.curriculumJson,
        courseData.examJson,
        courseData.examPaperUrl,
        courseData.certificateTemplate,
        courseData.isActive,
        req.params.courseId,
      ]
    );

    const row = await get('SELECT * FROM courses WHERE id = ?', [req.params.courseId]);
    res.json(mapCourseRow(row));
  } catch (error) {
    console.error('Error updating course:', error);
    const statusCode = error.message.includes('required') || error.message.includes('must be') ? 400 : 500;
    res.status(statusCode).json({ error: error.message || 'Failed to update course' });
  }
});

module.exports = router;
