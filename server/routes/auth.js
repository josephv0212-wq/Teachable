const express = require('express');
const router = express.Router();
// Basic auth routes - can be expanded for admin authentication
// For now, students are created through enrollment

router.get('/test', (req, res) => {
  res.json({ message: 'Auth endpoint working' });
});

module.exports = router;

