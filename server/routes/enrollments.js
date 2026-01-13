const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');
const TeachableService = require('../services/teachableService');
const { ensureExam2Course } = require('../utils/exam2Course');
const membershipService = require('../services/membershipService');

// Helper function to map enrollment row
function mapEnrollmentRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    studentId: row.studentId,
    courseId: row.courseId,
    teachableEnrollmentId: row.teachableEnrollmentId,
    status: row.status,
    progress: row.progress,
    examScore: row.examScore,
    examAttempts: row.examAttempts,
    examPassed: !!row.examPassed,
    certificateIssued: !!row.certificateIssued,
    paymentStatus: row.paymentStatus,
    paymentId: row.paymentId,
    membershipId: row.membershipId,
    discountApplied: row.discountApplied || 0,
    enrolledAt: row.enrolledAt,
    completedAt: row.completedAt,
  };
}

// Helper function to find or create enrollment
async function findOrCreateEnrollment(studentId, courseId, skipAccessCheck = false) {
  // Try to find existing enrollment
  let enrollment = await get(
    'SELECT * FROM enrollments WHERE studentId = ? AND courseId = ?',
    [studentId, courseId]
  );

  // Create enrollment if it doesn't exist
  if (!enrollment) {
    const student = await get('SELECT * FROM users WHERE id = ?', [studentId]);
    let course = await get('SELECT * FROM courses WHERE id = ?', [courseId]);

    // If course not found and it's ID 1, ensure exam2 exists
    if (!course && courseId === 1) {
      const exam2Id = await ensureExam2Course();
      if (exam2Id) {
        course = await get('SELECT * FROM courses WHERE courseNumber = ?', ['exam2']);
        // Update courseId to the actual exam2 course ID
        if (course) {
          courseId = course.id;
        }
      }
    }

    if (!student || !course) {
      throw new Error('Student or course not found');
    }

    // Check membership access before creating enrollment (unless explicitly skipped)
    if (!skipAccessCheck) {
      const membershipCheck = await membershipService.checkMembershipAccess(studentId, courseId);
      if (!membershipCheck.hasAccess) {
        throw new Error('You do not have access to this course. Please upgrade your membership plan.');
      }
    }

    const enrollmentResult = await run(
      `INSERT INTO enrollments (studentId, courseId, paymentStatus) VALUES (?, ?, ?)`,
      [studentId, courseId, 'paid']
    );

    enrollment = await get('SELECT * FROM enrollments WHERE id = ?', [enrollmentResult.id]);
  } else {
    // Even if enrollment exists, verify current membership access
    if (!skipAccessCheck) {
      const membershipCheck = await membershipService.checkMembershipAccess(studentId, enrollment.courseId);
      if (!membershipCheck.hasAccess) {
        throw new Error('You do not have access to this course. Please upgrade your membership plan.');
      }
    }
  }

  return enrollment;
}

// Helper function to validate and parse exam
function validateExam(course) {
  if (!course || !course.examJson) {
    throw new Error('Course does not have an exam');
  }

  const exam = JSON.parse(course.examJson);
  const questions = exam.questions || [];

  if (!questions.length) {
    throw new Error('Course does not have an exam');
  }

  return { exam, questions };
}

// Helper function to calculate exam score
function calculateExamScore(answers, questions) {
  let score = 0;
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

  answers.forEach((answer, index) => {
    if (answer >= 0 && index < questions.length && questions[index].correctAnswer === answer) {
      score += questions[index].points || 1;
    }
  });

  const percentage = (score / totalPoints) * 100;
  return { score, percentage, totalPoints };
}

// Helper function to process exam submission
async function processExamSubmission(enrollment, answers) {
  const course = await get('SELECT * FROM courses WHERE id = ?', [enrollment.courseId]);
  const { exam, questions } = validateExam(course);

  // Validate answers array length
  if (answers.length !== questions.length) {
    throw new Error(`Expected ${questions.length} answers, but received ${answers.length}`);
  }

  // Calculate score
  const { percentage } = calculateExamScore(answers, questions);
  const passingScore = exam.passingScore || 70;
  const passed = percentage >= passingScore;

  // Update enrollment
  const examAttempts = (enrollment.examAttempts || 0) + 1;
  const status = passed ? 'completed' : 'failed';
  const completedAt = passed ? new Date().toISOString() : enrollment.completedAt;

  await run(
    `UPDATE enrollments
     SET examAttempts = ?, examScore = ?, examPassed = ?, status = ?, completedAt = ?
     WHERE id = ?`,
    [examAttempts, percentage, passed ? 1 : 0, status, completedAt, enrollment.id]
  );

  const updated = await get('SELECT * FROM enrollments WHERE id = ?', [enrollment.id]);

  return {
    score: percentage,
    passed,
    enrollment: mapEnrollmentRow(updated)
  };
}

// Create enrollment
router.post('/', async (req, res) => {
  try {
    const { studentId, courseId, paymentId, paymentStatus } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({ error: 'Student ID and Course ID are required' });
    }

    const studentIdNum = parseInt(studentId);
    const courseIdNum = parseInt(courseId);
    if (isNaN(studentIdNum) || isNaN(courseIdNum)) {
      return res.status(400).json({ error: 'Invalid student ID or course ID' });
    }

    const student = await get('SELECT * FROM users WHERE id = ?', [studentIdNum]);
    let course = await get('SELECT * FROM courses WHERE id = ?', [courseIdNum]);

    // If course not found and it's ID 1, ensure exam2 exists
    if (!course && courseIdNum === 1) {
      const exam2Id = await ensureExam2Course();
      if (exam2Id) {
        course = await get('SELECT * FROM courses WHERE courseNumber = ?', ['exam2']);
        if (course) {
          courseIdNum = course.id;
        }
      }
    }

    if (!student || !course) {
      return res.status(404).json({ error: 'Student or course not found' });
    }

    // Check membership access and get discount
    let membershipId = null;
    let discountApplied = 0;
    const membershipCheck = await membershipService.checkMembershipAccess(studentIdNum, courseIdNum);
    
    if (membershipCheck.hasAccess) {
      // Student has access through membership - enrollment is free
      membershipId = membershipCheck.membership.id;
      discountApplied = course.price; // Full discount
    } else if (membershipCheck.membership) {
      // Student has membership but course not included - apply discount
      membershipId = membershipCheck.membership.id;
      const discountPercent = await membershipService.getMembershipDiscount(studentIdNum);
      if (discountPercent > 0) {
        discountApplied = (course.price * discountPercent) / 100;
      }
    }
    
    // If student doesn't have membership access, require payment
    if (!membershipCheck.hasAccess && (!paymentId || paymentStatus !== 'paid')) {
      // Check if this is a free course (price = 0)
      if (course.price > 0) {
        return res.status(403).json({ 
          error: 'You do not have access to this course. Please upgrade your membership plan or complete payment.' 
        });
      }
    }

    let teachableEnrollmentId = null;

    // Handle Teachable integration if applicable
    if (course.teachableCourseId) {
      const school = await get('SELECT * FROM schools LIMIT 1');
      if (school && school.teachableApiKey) {
        try {
          const teachableService = new TeachableService(
            school.teachableApiKey,
            school.teachableSchoolId
          );

          let teachableUserId = student.teachableUserId;
          if (!teachableUserId) {
            const teachableUser = await teachableService.createUser({
              firstName: student.firstName,
              lastName: student.lastName,
              email: student.email,
            });
            teachableUserId = teachableUser.id;
            await run('UPDATE users SET teachableUserId = ? WHERE id = ?', [
              teachableUserId,
              studentId,
            ]);
          }

          const teachableEnrollment = await teachableService.enrollUser(
            teachableUserId,
            course.teachableCourseId
          );
          teachableEnrollmentId = teachableEnrollment.id;
        } catch (error) {
          console.error('Teachable enrollment error:', error);
        }
      }
    }

    // Determine payment status based on membership access
    let finalPaymentStatus = paymentStatus || (paymentId ? 'paid' : 'pending');
    if (membershipCheck.hasAccess) {
      // Free enrollment through membership
      finalPaymentStatus = 'paid';
    } else if (membershipId && discountApplied > 0) {
      // Discounted enrollment - still requires payment for remaining amount
      finalPaymentStatus = paymentStatus || (paymentId ? 'paid' : 'pending');
    }

    const result = await run(
      `INSERT INTO enrollments
       (studentId, courseId, teachableEnrollmentId, paymentId, paymentStatus, membershipId, discountApplied)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        studentIdNum,
        courseIdNum,
        teachableEnrollmentId,
        paymentId || null,
        finalPaymentStatus,
        membershipId,
        discountApplied
      ]
    );

    const enrollment = await get('SELECT * FROM enrollments WHERE id = ?', [result.id]);
    res.status(201).json(mapEnrollmentRow(enrollment));
  } catch (error) {
    console.error('Error creating enrollment:', error);
    res.status(500).json({ error: 'Failed to create enrollment', details: error.message });
  }
});

// Get enrollment by ID
router.get('/:enrollmentId', async (req, res) => {
  try {
    const enrollment = await get('SELECT * FROM enrollments WHERE id = ?', [
      req.params.enrollmentId,
    ]);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    res.json(mapEnrollmentRow(enrollment));
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment' });
  }
});

// Update enrollment progress
router.patch('/:enrollmentId/progress', async (req, res) => {
  try {
    const { progress } = req.body;
    const enrollment = await get('SELECT * FROM enrollments WHERE id = ?', [
      req.params.enrollmentId,
    ]);

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    const clamped = Math.min(100, Math.max(0, Number(progress) || 0));
    const completedAt =
      clamped === 100 && !enrollment.completedAt ? new Date().toISOString() : enrollment.completedAt;

    await run(
      `UPDATE enrollments SET progress = ?, completedAt = ? WHERE id = ?`,
      [clamped, completedAt, req.params.enrollmentId]
    );

    const updated = await get('SELECT * FROM enrollments WHERE id = ?', [
      req.params.enrollmentId,
    ]);
    res.json(mapEnrollmentRow(updated));
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Submit exam (auto-creates enrollment if needed)
router.post('/:enrollmentId/exam', async (req, res) => {
  try {
    const { answers, studentId, courseId } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    let enrollment = await get('SELECT * FROM enrollments WHERE id = ?', [
      req.params.enrollmentId,
    ]);

    // If enrollment doesn't exist, try to find or create one
    if (!enrollment) {
      if (!studentId || !courseId) {
        return res.status(400).json({ 
          error: 'Enrollment not found and studentId/courseId not provided' 
        });
      }

      try {
        enrollment = await findOrCreateEnrollment(studentId, courseId);
      } catch (error) {
        const statusCode = error.message.includes('access') ? 403 : 404;
        return res.status(statusCode).json({ error: error.message });
      }
    } else {
      // Verify membership access for existing enrollment
      const membershipCheck = await membershipService.checkMembershipAccess(
        enrollment.studentId, 
        enrollment.courseId
      );
      if (!membershipCheck.hasAccess) {
        return res.status(403).json({ 
          error: 'You do not have access to this course. Please upgrade your membership plan.' 
        });
      }
    }

    const result = await processExamSubmission(enrollment, answers);
    res.json(result);
  } catch (error) {
    console.error('Error submitting exam:', error);
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('access') ? 403 :
                       error.message.includes('Expected') ? 400 : 500;
    res.status(statusCode).json({ 
      error: error.message || 'Failed to submit exam',
      details: error.message 
    });
  }
});

// Submit exam directly (without enrollmentId - auto-creates enrollment)
router.post('/exam/submit', async (req, res) => {
  try {
    const { answers, studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({ error: 'studentId and courseId are required' });
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    let enrollment;
    try {
      enrollment = await findOrCreateEnrollment(studentId, courseId);
    } catch (error) {
      const statusCode = error.message.includes('access') ? 403 : 404;
      return res.status(statusCode).json({ error: error.message });
    }

    const result = await processExamSubmission(enrollment, answers);
    res.json(result);
  } catch (error) {
    console.error('Error submitting exam:', error);
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('access') ? 403 :
                       error.message.includes('Expected') ? 400 : 500;
    res.status(statusCode).json({ 
      error: error.message || 'Failed to submit exam',
      details: error.message 
    });
  }
});

// Get all enrollments (admin)
router.get('/', async (_req, res) => {
  try {
    const rows = await all(
      `SELECT e.*,
              u.firstName as studentFirstName, u.lastName as studentLastName,
              c.name as courseName
       FROM enrollments e
       LEFT JOIN users u ON e.studentId = u.id
       LEFT JOIN courses c ON e.courseId = c.id
       ORDER BY e.enrolledAt DESC`
    );

    const enrollments = rows.map(row => {
      const enrollment = mapEnrollmentRow(row);
      if (row.studentFirstName || row.studentLastName) {
        enrollment.student = {
          firstName: row.studentFirstName,
          lastName: row.studentLastName
        };
      }
      if (row.courseName) {
        enrollment.course = {
          name: row.courseName
        };
      }
      return enrollment;
    });

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Get student enrollments
router.get('/student/:studentId', async (req, res) => {
  try {
    // Ensure exam2 enrollment exists for this student
    try {
      const studentId = parseInt(req.params.studentId);
      if (!isNaN(studentId)) {
        // Check if student exists
        const student = await get('SELECT id FROM users WHERE id = ?', [studentId]);
        if (student) {
          // Ensure exam2 course exists
          let exam2Course = await get('SELECT id FROM courses WHERE courseNumber = ?', ['exam2']);
          if (!exam2Course) {
            await ensureExam2Course();
            exam2Course = await get('SELECT id FROM courses WHERE courseNumber = ?', ['exam2']);
          }

          // Auto-create exam2 enrollment if it doesn't exist
          if (exam2Course) {
            const existingExam2Enrollment = await get(
              'SELECT id FROM enrollments WHERE studentId = ? AND courseId = ?',
              [studentId, exam2Course.id]
            );

            if (!existingExam2Enrollment) {
              await run(
                `INSERT INTO enrollments (studentId, courseId, paymentStatus) VALUES (?, ?, ?)`,
                [studentId, exam2Course.id, 'paid']
              );
            }
          }
        }
      }
    } catch (autoEnrollError) {
      // Don't fail the request if auto-enrollment fails, just log it
      console.error('Error auto-enrolling in exam2:', autoEnrollError);
    }

    const rows = await all(
      `SELECT e.*, 
              c.name as courseName, c.description as courseDescription, 
              c.examJson, c.examPaperUrl, c.certificateTemplate
       FROM enrollments e
       LEFT JOIN courses c ON e.courseId = c.id
       WHERE e.studentId = ? 
       ORDER BY e.enrolledAt DESC`,
      [req.params.studentId]
    );

    const enrollments = rows.map(row => {
      const enrollment = mapEnrollmentRow(row);
      if (row.courseName) {
        enrollment.course = {
          name: row.courseName,
          description: row.courseDescription,
          exam: row.examJson ? JSON.parse(row.examJson) : null,
          examPaperUrl: row.examPaperUrl || null,
          certificateTemplate: row.certificateTemplate
        };
      }
      return enrollment;
    });

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Ensure student is enrolled in exam2
router.post('/student/:studentId/exam2', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    // Check if student exists
    const student = await get('SELECT * FROM users WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Ensure exam2 course exists
    let exam2Course = await get('SELECT id FROM courses WHERE courseNumber = ?', ['exam2']);
    if (!exam2Course) {
      const exam2Id = await ensureExam2Course();
      if (exam2Id) {
        exam2Course = await get('SELECT id FROM courses WHERE courseNumber = ?', ['exam2']);
      }
    }

    if (!exam2Course) {
      return res.status(500).json({ error: 'Failed to create or find exam2 course' });
    }

    // Check if enrollment already exists
    let enrollment = await get(
      'SELECT * FROM enrollments WHERE studentId = ? AND courseId = ?',
      [studentId, exam2Course.id]
    );

    if (enrollment) {
      return res.json({
        message: 'Student already enrolled in exam2',
        enrollment: mapEnrollmentRow(enrollment)
      });
    }

    // Create enrollment
    const enrollmentResult = await run(
      `INSERT INTO enrollments (studentId, courseId, paymentStatus) VALUES (?, ?, ?)`,
      [studentId, exam2Course.id, 'paid']
    );

    enrollment = await get('SELECT * FROM enrollments WHERE id = ?', [enrollmentResult.id]);

    res.status(201).json({
      message: 'Student enrolled in exam2 successfully',
      enrollment: mapEnrollmentRow(enrollment)
    });
  } catch (error) {
    console.error('Error enrolling student in exam2:', error);
    res.status(500).json({ error: 'Failed to enroll student in exam2', details: error.message });
  }
});

module.exports = router;
