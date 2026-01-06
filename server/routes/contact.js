const express = require('express');
const router = express.Router();
const { run } = require('../db');
const nodemailer = require('nodemailer');

// Create contact message
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message, subject, membershipPlanId } = req.body;

    // Validate required fields
    if (!name || !email || (!message && !membershipPlanId)) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Store contact message in database (optional - you can create a contacts table)
    // For now, we'll just log it and optionally send email
    
    // Log contact message
    console.log('Contact form submission:', { name, email, phone, message });

    // Optionally send email notification (if configured)
    if (process.env.CONTACT_EMAIL && process.env.SMTP_HOST) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const emailSubject = subject || `Contact Form Submission from ${name}`;
        const emailMessage = membershipPlanId 
          ? `Membership Plan Request\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\nRequested Plan ID: ${membershipPlanId}\n\nMessage:\n${message || 'Requesting membership plan subscription'}`
          : `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\nMessage:\n${message}`;

        await transporter.sendMail({
          from: process.env.SMTP_FROM || email,
          to: process.env.CONTACT_EMAIL,
          subject: emailSubject,
          text: emailMessage,
          replyTo: email,
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({ 
      message: 'Thank you for your message. We will get back to you soon.',
      success: true 
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

module.exports = router;

