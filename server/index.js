const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
require('./db'); // initialize SQLite and tables

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/courses', require('./routes/courses'));
app.use('/enrollments', require('./routes/enrollments'));
app.use('/certificates', require('./routes/certificates'));
app.use('/teachable', require('./routes/teachable'));
app.use('/payments', require('./routes/payments'));
app.use('/memberships', require('./routes/memberships'));
app.use('/contact', require('./routes/contact'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Stay Ready Training Academy API is running' });
});

// Error handler middleware (must be last)
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces to accept connections from public IP
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

