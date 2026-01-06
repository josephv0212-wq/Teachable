const { get, all } = require('../db');

/**
 * Check if a student has access to a course through their membership
 * @param {number} studentId - Student ID
 * @param {number} courseId - Course ID
 * @returns {Promise<{hasAccess: boolean, membership: object|null}>}
 */
async function checkMembershipAccess(studentId, courseId) {
  try {
    // Get active membership for student
    const membership = await get(
      `SELECT m.*, mp.type, mp.billingInterval, mp.discountPercent
       FROM memberships m
       JOIN membership_plans mp ON m.membershipPlanId = mp.id
       WHERE m.studentId = ? 
       AND m.status = 'active'
       AND (m.expiresAt IS NULL OR m.expiresAt > datetime('now'))
       AND (m.currentPeriodEnd IS NULL OR m.currentPeriodEnd > datetime('now'))
       ORDER BY m.startedAt DESC
       LIMIT 1`,
      [studentId]
    );

    if (!membership) {
      return { hasAccess: false, membership: null };
    }

    // Check if course is included in membership tier
    const tierCourse = await get(
      `SELECT * FROM membership_tier_courses
       WHERE membershipPlanId = ? AND courseId = ?`,
      [membership.membershipPlanId, courseId]
    );

    return {
      hasAccess: !!tierCourse,
      membership: membership
    };
  } catch (error) {
    console.error('Error checking membership access:', error);
    return { hasAccess: false, membership: null };
  }
}

/**
 * Get discount percentage for a student's active membership
 * @param {number} studentId - Student ID
 * @returns {Promise<number>} Discount percentage (0-100)
 */
async function getMembershipDiscount(studentId) {
  try {
    const membership = await get(
      `SELECT mp.discountPercent
       FROM memberships m
       JOIN membership_plans mp ON m.membershipPlanId = mp.id
       WHERE m.studentId = ? 
       AND m.status = 'active'
       AND (m.expiresAt IS NULL OR m.expiresAt > datetime('now'))
       AND (m.currentPeriodEnd IS NULL OR m.currentPeriodEnd > datetime('now'))
       ORDER BY m.startedAt DESC
       LIMIT 1`,
      [studentId]
    );

    return membership ? (membership.discountPercent || 0) : 0;
  } catch (error) {
    console.error('Error getting membership discount:', error);
    return 0;
  }
}

/**
 * Check if a membership is still active
 * @param {number} membershipId - Membership ID
 * @returns {Promise<boolean>}
 */
async function isMembershipActive(membershipId) {
  try {
    const membership = await get(
      `SELECT * FROM memberships
       WHERE id = ? 
       AND status = 'active'
       AND (expiresAt IS NULL OR expiresAt > datetime('now'))
       AND (currentPeriodEnd IS NULL OR currentPeriodEnd > datetime('now'))`,
      [membershipId]
    );

    return !!membership;
  } catch (error) {
    console.error('Error checking membership active status:', error);
    return false;
  }
}

/**
 * Get active membership for a student
 * @param {number} studentId - Student ID
 * @returns {Promise<object|null>}
 */
async function getStudentMembership(studentId) {
  try {
    const membership = await get(
      `SELECT m.*, mp.name as planName, mp.description as planDescription,
              mp.type, mp.billingInterval, mp.discountPercent
       FROM memberships m
       JOIN membership_plans mp ON m.membershipPlanId = mp.id
       WHERE m.studentId = ? 
       AND m.status = 'active'
       AND (m.expiresAt IS NULL OR m.expiresAt > datetime('now'))
       AND (m.currentPeriodEnd IS NULL OR m.currentPeriodEnd > datetime('now'))
       ORDER BY m.startedAt DESC
       LIMIT 1`,
      [studentId]
    );

    if (!membership) {
      return null;
    }

    // Get courses included in this membership tier
    const courses = await all(
      `SELECT c.* FROM courses c
       JOIN membership_tier_courses mtc ON c.id = mtc.courseId
       WHERE mtc.membershipPlanId = ?`,
      [membership.membershipPlanId]
    );

    return {
      ...membership,
      courses: courses
    };
  } catch (error) {
    console.error('Error getting student membership:', error);
    return null;
  }
}

/**
 * Get all courses accessible to a student through their membership
 * @param {number} studentId - Student ID
 * @returns {Promise<Array>}
 */
async function getMembershipCourses(studentId) {
  try {
    const membership = await get(
      `SELECT membershipPlanId FROM memberships
       WHERE studentId = ? 
       AND status = 'active'
       AND (expiresAt IS NULL OR expiresAt > datetime('now'))
       AND (currentPeriodEnd IS NULL OR currentPeriodEnd > datetime('now'))
       ORDER BY startedAt DESC
       LIMIT 1`,
      [studentId]
    );

    if (!membership) {
      return [];
    }

    const courses = await all(
      `SELECT c.* FROM courses c
       JOIN membership_tier_courses mtc ON c.id = mtc.courseId
       WHERE mtc.membershipPlanId = ? AND c.isActive = 1`,
      [membership.membershipPlanId]
    );

    return courses;
  } catch (error) {
    console.error('Error getting membership courses:', error);
    return [];
  }
}

module.exports = {
  checkMembershipAccess,
  getMembershipDiscount,
  isMembershipActive,
  getStudentMembership,
  getMembershipCourses
};
