const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');
const membershipService = require('../services/membershipService');

// Helper function to map membership plan row
function mapMembershipPlanRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    billingInterval: row.billingInterval,
    price: row.price,
    stripePriceId: row.stripePriceId,
    stripeProductId: row.stripeProductId,
    discountPercent: row.discountPercent || 0,
    isActive: row.isActive === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

// Helper function to map membership row
function mapMembershipRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    studentId: row.studentId,
    membershipPlanId: row.membershipPlanId,
    status: row.status,
    stripeSubscriptionId: row.stripeSubscriptionId,
    stripeCustomerId: row.stripeCustomerId,
    currentPeriodStart: row.currentPeriodStart,
    currentPeriodEnd: row.currentPeriodEnd,
    canceledAt: row.canceledAt,
    expiresAt: row.expiresAt,
    startedAt: row.startedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    planName: row.planName,
    planDescription: row.planDescription,
    type: row.type,
    billingInterval: row.billingInterval,
    discountPercent: row.discountPercent
  };
}

// Get all active membership plans
router.get('/plans', async (req, res) => {
  try {
    const rows = await all(
      'SELECT * FROM membership_plans WHERE isActive = 1 ORDER BY price ASC'
    );
    const plans = rows.map(mapMembershipPlanRow);
    
    // Get courses for each plan
    for (const plan of plans) {
      const courses = await all(
        `SELECT c.* FROM courses c
         JOIN membership_tier_courses mtc ON c.id = mtc.courseId
         WHERE mtc.membershipPlanId = ?`,
        [plan.id]
      );
      plan.courses = courses;
    }
    
    res.json(plans);
  } catch (error) {
    console.error('Error fetching membership plans:', error);
    res.status(500).json({ error: 'Failed to fetch membership plans' });
  }
});

// Get specific membership plan
router.get('/plans/:id', async (req, res) => {
  try {
    const plan = await get('SELECT * FROM membership_plans WHERE id = ?', [req.params.id]);
    if (!plan) {
      return res.status(404).json({ error: 'Membership plan not found' });
    }
    
    const mappedPlan = mapMembershipPlanRow(plan);
    
    // Get courses for this plan
    const courses = await all(
      `SELECT c.* FROM courses c
       JOIN membership_tier_courses mtc ON c.id = mtc.courseId
       WHERE mtc.membershipPlanId = ?`,
      [plan.id]
    );
    mappedPlan.courses = courses;
    
    res.json(mappedPlan);
  } catch (error) {
    console.error('Error fetching membership plan:', error);
    res.status(500).json({ error: 'Failed to fetch membership plan' });
  }
});

// Get courses available for a plan
router.get('/plans/:planId/courses', async (req, res) => {
  try {
    const courses = await all(
      `SELECT c.* FROM courses c
       JOIN membership_tier_courses mtc ON c.id = mtc.courseId
       WHERE mtc.membershipPlanId = ?`,
      [req.params.planId]
    );
    res.json(courses);
  } catch (error) {
    console.error('Error fetching plan courses:', error);
    res.status(500).json({ error: 'Failed to fetch plan courses' });
  }
});

// Create membership plan (admin)
router.post('/plans', async (req, res) => {
  try {
    const { name, description, type, billingInterval, price, discountPercent, courseIds } = req.body;

    if (!name || !type || !price) {
      return res.status(400).json({ error: 'Name, type, and price are required' });
    }

    if (type === 'recurring' && !billingInterval) {
      return res.status(400).json({ error: 'Billing interval is required for recurring plans' });
    }

    const result = await run(
      `INSERT INTO membership_plans 
       (name, description, type, billingInterval, price, discountPercent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description || null, type, billingInterval || null, price, discountPercent || 0]
    );

    const planId = result.id;

    // Add courses to plan if provided
    if (courseIds && Array.isArray(courseIds)) {
      for (const courseId of courseIds) {
        await run(
          'INSERT INTO membership_tier_courses (membershipPlanId, courseId) VALUES (?, ?)',
          [planId, courseId]
        );
      }
    }

    const plan = await get('SELECT * FROM membership_plans WHERE id = ?', [planId]);
    res.status(201).json(mapMembershipPlanRow(plan));
  } catch (error) {
    console.error('Error creating membership plan:', error);
    res.status(500).json({ error: 'Failed to create membership plan', details: error.message });
  }
});

// Update membership plan (admin)
router.put('/plans/:id', async (req, res) => {
  try {
    const { name, description, type, billingInterval, price, discountPercent, courseIds } = req.body;

    const existing = await get('SELECT * FROM membership_plans WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Membership plan not found' });
    }

    await run(
      `UPDATE membership_plans 
       SET name = ?, description = ?, type = ?, billingInterval = ?, price = ?, 
           discountPercent = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name || existing.name,
        description !== undefined ? description : existing.description,
        type || existing.type,
        billingInterval !== undefined ? billingInterval : existing.billingInterval,
        price !== undefined ? price : existing.price,
        discountPercent !== undefined ? discountPercent : existing.discountPercent,
        req.params.id
      ]
    );

    // Update courses if provided
    if (courseIds && Array.isArray(courseIds)) {
      // Remove existing course associations
      await run('DELETE FROM membership_tier_courses WHERE membershipPlanId = ?', [req.params.id]);
      
      // Add new course associations
      for (const courseId of courseIds) {
        await run(
          'INSERT INTO membership_tier_courses (membershipPlanId, courseId) VALUES (?, ?)',
          [req.params.id, courseId]
        );
      }
    }

    const updated = await get('SELECT * FROM membership_plans WHERE id = ?', [req.params.id]);
    res.json(mapMembershipPlanRow(updated));
  } catch (error) {
    console.error('Error updating membership plan:', error);
    res.status(500).json({ error: 'Failed to update membership plan', details: error.message });
  }
});

// Deactivate membership plan (admin)
router.delete('/plans/:id', async (req, res) => {
  try {
    await run(
      'UPDATE membership_plans SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [req.params.id]
    );
    res.json({ message: 'Membership plan deactivated' });
  } catch (error) {
    console.error('Error deactivating membership plan:', error);
    res.status(500).json({ error: 'Failed to deactivate membership plan' });
  }
});

// Get student's active membership
router.get('/student/:studentId', async (req, res) => {
  try {
    const membership = await membershipService.getStudentMembership(parseInt(req.params.studentId));
    if (!membership) {
      return res.json(null);
    }
    res.json(membership);
  } catch (error) {
    console.error('Error fetching student membership:', error);
    res.status(500).json({ error: 'Failed to fetch student membership' });
  }
});

// Admin: Assign membership to student
router.post('/assign', async (req, res) => {
  try {
    const { studentId, membershipPlanId, expiresAt } = req.body;

    if (!studentId || !membershipPlanId) {
      return res.status(400).json({ error: 'Student ID and membership plan ID are required' });
    }

    const student = await get('SELECT * FROM users WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const plan = await get('SELECT * FROM membership_plans WHERE id = ?', [membershipPlanId]);
    if (!plan || plan.isActive !== 1) {
      return res.status(404).json({ error: 'Membership plan not found or inactive' });
    }

    // Check if student already has an active membership
    const existingMembership = await get(
      `SELECT * FROM memberships 
       WHERE studentId = ? AND status = 'active'
       AND (expiresAt IS NULL OR expiresAt > datetime('now'))
       AND (currentPeriodEnd IS NULL OR currentPeriodEnd > datetime('now'))`,
      [studentId]
    );

    if (existingMembership) {
      return res.status(400).json({ error: 'Student already has an active membership' });
    }

    // Calculate expiration dates
    let finalExpiresAt = null;
    let currentPeriodStart = null;
    let currentPeriodEnd = null;

    if (plan.type === 'lifetime') {
      // Lifetime membership - expires in 100 years
      finalExpiresAt = expiresAt || new Date();
      finalExpiresAt.setFullYear(finalExpiresAt.getFullYear() + 100);
    } else if (plan.billingInterval === 'monthly') {
      // Monthly subscription
      currentPeriodStart = new Date();
      currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      finalExpiresAt = expiresAt || currentPeriodEnd;
    } else if (plan.billingInterval === 'yearly') {
      // Yearly subscription
      currentPeriodStart = new Date();
      currentPeriodEnd = new Date();
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      finalExpiresAt = expiresAt || currentPeriodEnd;
    }

    const result = await run(
      `INSERT INTO memberships 
       (studentId, membershipPlanId, status, currentPeriodStart, currentPeriodEnd, expiresAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        membershipPlanId,
        'active',
        currentPeriodStart ? currentPeriodStart.toISOString() : null,
        currentPeriodEnd ? currentPeriodEnd.toISOString() : null,
        finalExpiresAt ? finalExpiresAt.toISOString() : null
      ]
    );

    const membership = await get(
      `SELECT m.*, mp.name as planName, mp.description as planDescription,
              mp.type, mp.billingInterval, mp.discountPercent
       FROM memberships m
       JOIN membership_plans mp ON m.membershipPlanId = mp.id
       WHERE m.id = ?`,
      [result.id]
    );

    res.status(201).json(mapMembershipRow(membership));
  } catch (error) {
    console.error('Error assigning membership:', error);
    res.status(500).json({ error: 'Failed to assign membership', details: error.message });
  }
});

// Admin: Remove/Cancel membership
router.post('/remove/:membershipId', async (req, res) => {
  try {
    const membership = await get('SELECT * FROM memberships WHERE id = ?', [req.params.membershipId]);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    if (membership.status === 'canceled') {
      return res.json({ message: 'Membership already canceled', membership: mapMembershipRow(membership) });
    }

    await run(
      `UPDATE memberships 
       SET status = 'canceled', canceledAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.params.membershipId]
    );

    const updated = await get(
      `SELECT m.*, mp.name as planName, mp.description as planDescription,
              mp.type, mp.billingInterval, mp.discountPercent
       FROM memberships m
       JOIN membership_plans mp ON m.membershipPlanId = mp.id
       WHERE m.id = ?`,
      [req.params.membershipId]
    );

    res.json({ message: 'Membership removed', membership: mapMembershipRow(updated) });
  } catch (error) {
    console.error('Error removing membership:', error);
    res.status(500).json({ error: 'Failed to remove membership', details: error.message });
  }
});

// Get all memberships (admin)
router.get('/all', async (req, res) => {
  try {
    const rows = await all(
      `SELECT m.*, mp.name as planName, mp.description as planDescription,
              mp.type, mp.billingInterval, mp.discountPercent,
              s.firstName, s.lastName, s.email
       FROM memberships m
       JOIN membership_plans mp ON m.membershipPlanId = mp.id
       JOIN users s ON m.studentId = s.id
       ORDER BY m.startedAt DESC`
    );
    res.json(rows.map(row => ({
      ...mapMembershipRow(row),
      studentName: `${row.firstName} ${row.lastName}`,
      studentEmail: row.email
    })));
  } catch (error) {
    console.error('Error fetching all memberships:', error);
    res.status(500).json({ error: 'Failed to fetch memberships' });
  }
});

module.exports = router;
