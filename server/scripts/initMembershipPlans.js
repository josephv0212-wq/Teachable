const { get, run, all } = require('../db');
require('dotenv').config();

async function initMembershipPlans() {
  try {
    // Check if plans already exist
    const existingPlans = await all('SELECT * FROM membership_plans');
    if (existingPlans.length > 0) {
      console.log(`${existingPlans.length} membership plan(s) already exist:`);
      existingPlans.forEach(plan => {
        console.log(`- ${plan.name} (ID: ${plan.id})`);
      });
      console.log('\nTo create new plans, use the admin panel or delete existing plans first.');
      process.exit(0);
    }

    // Get all active courses to assign to plans
    const courses = await all('SELECT id, name FROM courses WHERE isActive = 1');
    
    if (courses.length === 0) {
      console.log('No active courses found. Please create courses first.');
      process.exit(1);
    }

    console.log(`Found ${courses.length} active course(s)`);

    // Create Basic Plan (Monthly) - Access to some courses + discount
    const basicPlanResult = await run(
      `INSERT INTO membership_plans 
       (name, description, type, billingInterval, price, discountPercent, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'Basic',
        'Access to selected courses with a discount on all other courses',
        'recurring',
        'monthly',
        29.99,
        10, // 10% discount
        1
      ]
    );

    // Assign first 2 courses to Basic plan (or all if less than 2)
    const basicCourses = courses.slice(0, Math.min(2, courses.length));
    for (const course of basicCourses) {
      await run(
        'INSERT INTO membership_tier_courses (membershipPlanId, courseId) VALUES (?, ?)',
        [basicPlanResult.id, course.id]
      );
    }
    console.log(`✓ Created Basic Plan (Monthly - $29.99) with ${basicCourses.length} course(s)`);

    // Create Premium Plan (Monthly) - Access to all courses + higher discount
    const premiumPlanResult = await run(
      `INSERT INTO membership_plans 
       (name, description, type, billingInterval, price, discountPercent, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'Premium',
        'Full access to all courses plus maximum discount on additional purchases',
        'recurring',
        'monthly',
        49.99,
        25, // 25% discount
        1
      ]
    );

    // Assign all courses to Premium plan
    for (const course of courses) {
      await run(
        'INSERT INTO membership_tier_courses (membershipPlanId, courseId) VALUES (?, ?)',
        [premiumPlanResult.id, course.id]
      );
    }
    console.log(`✓ Created Premium Plan (Monthly - $49.99) with ${courses.length} course(s)`);

    // Create Premium Plan (Yearly) - Better value
    const premiumYearlyResult = await run(
      `INSERT INTO membership_plans 
       (name, description, type, billingInterval, price, discountPercent, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'Premium',
        'Full access to all courses plus maximum discount on additional purchases (Yearly - Save 20%)',
        'recurring',
        'yearly',
        479.99, // ~$40/month, 20% savings
        25, // 25% discount
        1
      ]
    );

    // Assign all courses to Premium Yearly plan
    for (const course of courses) {
      await run(
        'INSERT INTO membership_tier_courses (membershipPlanId, courseId) VALUES (?, ?)',
        [premiumYearlyResult.id, course.id]
      );
    }
    console.log(`✓ Created Premium Plan (Yearly - $479.99) with ${courses.length} course(s)`);

    // Create Lifetime Plan - One-time payment
    const lifetimePlanResult = await run(
      `INSERT INTO membership_plans 
       (name, description, type, billingInterval, price, discountPercent, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'Lifetime',
        'Lifetime access to all courses with maximum discount on future courses',
        'lifetime',
        null,
        999.99,
        30, // 30% discount
        1
      ]
    );

    // Assign all courses to Lifetime plan
    for (const course of courses) {
      await run(
        'INSERT INTO membership_tier_courses (membershipPlanId, courseId) VALUES (?, ?)',
        [lifetimePlanResult.id, course.id]
      );
    }
    console.log(`✓ Created Lifetime Plan ($999.99) with ${courses.length} course(s)`);

    console.log('\n✅ Successfully created 4 membership plans!');
    console.log('\nNote: You will need to configure Stripe Price IDs and Product IDs in the admin panel');
    console.log('for recurring subscriptions to work properly with Stripe.');

    process.exit(0);
  } catch (error) {
    console.error('Error initializing membership plans:', error);
    process.exit(1);
  }
}

initMembershipPlans();
