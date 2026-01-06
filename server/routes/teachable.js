const express = require('express');
const router = express.Router();
const TeachableService = require('../services/teachableService');
const { get, run } = require('../db');

// Sync course to Teachable
router.post('/sync-course/:courseId', async (req, res) => {
  try {
    const course = await get('SELECT * FROM courses WHERE id = ?', [req.params.courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const school = await get('SELECT * FROM schools LIMIT 1');
    if (!school || !school.teachableApiKey) {
      return res.status(400).json({ error: 'Teachable API not configured' });
    }

    const teachableService = new TeachableService(
      school.teachableApiKey,
      school.teachableSchoolId
    );

    const teachableCourse = await teachableService.createCourse({
      name: course.name,
      headline: course.description.substring(0, 100),
      description: course.description,
      price: course.price,
      published: !!course.isActive,
    });

    await run('UPDATE courses SET teachableCourseId = ? WHERE id = ?', [
      teachableCourse.id,
      course.id,
    ]);

    const updatedCourse = await get('SELECT * FROM courses WHERE id = ?', [course.id]);

    res.json({
      message: 'Course synced to Teachable',
      course: updatedCourse,
      teachableCourse,
    });
  } catch (error) {
    console.error('Error syncing course:', error);
    res.status(500).json({ error: 'Failed to sync course', details: error.message });
  }
});

module.exports = router;

