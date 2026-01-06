const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');

// Helper function to map badge row
function mapBadgeRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    studentId: row.studentId,
    courseId: row.courseId,
    enrollmentId: row.enrollmentId,
    badgeType: row.badgeType,
    badgeName: row.badgeName,
    badgeDescription: row.badgeDescription,
    earnedAt: row.earnedAt,
  };
}

// Get all badges for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const rows = await all(
      `SELECT b.*, c.name as courseName, c.description as courseDescription
       FROM badges b
       LEFT JOIN courses c ON b.courseId = c.id
       WHERE b.studentId = ?
       ORDER BY b.earnedAt DESC`,
      [req.params.studentId]
    );

    const badges = rows.map(row => {
      const badge = mapBadgeRow(row);
      if (row.courseName) {
        badge.course = {
          name: row.courseName,
          description: row.courseDescription
        };
      }
      return badge;
    });

    res.json(badges);
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges', details: error.message });
  }
});

// Get badge by ID
router.get('/:badgeId', async (req, res) => {
  try {
    const badge = await get('SELECT * FROM badges WHERE id = ?', [req.params.badgeId]);
    if (!badge) {
      return res.status(404).json({ error: 'Badge not found' });
    }
    res.json(mapBadgeRow(badge));
  } catch (error) {
    console.error('Error fetching badge:', error);
    res.status(500).json({ error: 'Failed to fetch badge' });
  }
});

// Get all badges (admin)
router.get('/', async (_req, res) => {
  try {
    const rows = await all('SELECT * FROM badges ORDER BY earnedAt DESC');
    res.json(rows.map(mapBadgeRow));
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// Award a badge (internal use, typically called from exam submission)
router.post('/', async (req, res) => {
  try {
    const { studentId, courseId, enrollmentId, badgeType, badgeName, badgeDescription } = req.body;

    if (!studentId || !courseId || !enrollmentId || !badgeName) {
      return res.status(400).json({ error: 'studentId, courseId, enrollmentId, and badgeName are required' });
    }

    // Check if badge already exists for this enrollment
    const existing = await get(
      'SELECT * FROM badges WHERE studentId = ? AND courseId = ? AND enrollmentId = ? AND badgeType = ?',
      [studentId, courseId, enrollmentId, badgeType || 'certificate']
    );

    if (existing) {
      return res.json({
        message: 'Badge already exists',
        badge: mapBadgeRow(existing)
      });
    }

    const result = await run(
      `INSERT INTO badges (studentId, courseId, enrollmentId, badgeType, badgeName, badgeDescription)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        courseId,
        enrollmentId,
        badgeType || 'certificate',
        badgeName,
        badgeDescription || null
      ]
    );

    const badge = await get('SELECT * FROM badges WHERE id = ?', [result.id]);
    res.status(201).json(mapBadgeRow(badge));
  } catch (error) {
    console.error('Error awarding badge:', error);
    res.status(500).json({ error: 'Failed to award badge', details: error.message });
  }
});

module.exports = router;

