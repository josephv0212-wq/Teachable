const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { run, get } = require('../db');

// Create payment intent
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', courseId, studentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: {
        courseId: courseId,
        studentId: studentId
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent', details: error.message });
  }
});

// Webhook handler for Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Update enrollment payment status if enrollment exists
      if (paymentIntent.metadata?.courseId && paymentIntent.metadata?.studentId) {
        try {
          // Find enrollment by paymentId or create new one
          const existingEnrollment = await get(
            'SELECT * FROM enrollments WHERE paymentId = ?',
            [paymentIntent.id]
          );

          if (existingEnrollment) {
            // Update existing enrollment
            await run(
              'UPDATE enrollments SET paymentStatus = ? WHERE id = ?',
              ['paid', existingEnrollment.id]
            );
            console.log('Updated enrollment payment status:', existingEnrollment.id);
          } else {
            // Create new enrollment if it doesn't exist
            await run(
              `INSERT INTO enrollments (studentId, courseId, paymentId, paymentStatus)
               VALUES (?, ?, ?, ?)`,
              [
                paymentIntent.metadata.studentId,
                paymentIntent.metadata.courseId,
                paymentIntent.id,
                'paid'
              ]
            );
            console.log('Created new enrollment from payment');
          }
        } catch (error) {
          console.error('Error updating enrollment from payment:', error);
          // Don't fail webhook if enrollment update fails
        }
      }
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      // Update enrollment payment status to failed
      if (failedPayment.metadata?.courseId && failedPayment.metadata?.studentId) {
        try {
          await run(
            'UPDATE enrollments SET paymentStatus = ? WHERE paymentId = ?',
            ['failed', failedPayment.id]
          );
        } catch (error) {
          console.error('Error updating failed payment:', error);
        }
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;

