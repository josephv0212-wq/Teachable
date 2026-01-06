# Setup Guide - Stay Ready Training Academy Platform

This guide will walk you through setting up the Stay Ready Training Academy platform from scratch.

## Step 1: Prerequisites

Install the following on your system:
- **Node.js** (version 18 or higher) - [Download](https://nodejs.org/)
- **Git** (optional, for version control)

## Step 2: Install Dependencies

1. Open a terminal in the project root directory
2. Run the installation command:
   ```bash
   npm run install:all
   ```
   This will install dependencies for both the backend and frontend.

## Step 3: Configure Environment Variables

1. Create a `.env` file in the root directory
2. Add the following configuration:

```env
# Server
PORT=5000
NODE_ENV=development

# Teachable API (get from Teachable settings)
TEACHABLE_API_KEY=your_teachable_api_key_here
TEACHABLE_SCHOOL_ID=your_teachable_school_id_here

# Stripe (get from Stripe dashboard)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# School Information
SCHOOL_NAME=Stay Ready Training Academy
SCHOOL_LICENSE_NUMBER=YOUR_DPS_LICENSE_NUMBER
INSTRUCTOR_NAME=Your Full Name
INSTRUCTOR_SIGNATURE_PATH=./uploads/signatures/signature.png

# Frontend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## Step 4: Initialize School Configuration

Run the initialization script to create the school record in the database:

```bash
node server/scripts/initSchool.js
```

This creates the initial school configuration. You can update it later through the admin interface or directly in the database.

## Step 5: Add Your Signature Image

1. Create a signature image (PNG format recommended)
2. Save it to `server/uploads/signatures/signature.png`
3. Update the `INSTRUCTOR_SIGNATURE_PATH` in `.env` if you use a different path

## Step 6: Start the Application

### Development Mode (Recommended)

Run both backend and frontend together:
```bash
npm run dev
```

This starts:
- Backend server on `http://localhost:5000`
- Frontend on `http://localhost:3000`

### Or Run Separately

**Backend only:**
```bash
npm run dev:server
```

**Frontend only (in a new terminal):**
```bash
cd client
npm run dev
```

## Step 8: Create Your First Course

### Option 1: Using the API

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Level II Security Officer",
    "description": "State-approved Level II Security Officer training course required by the Texas Department of Public Safety.",
    "courseNumber": "DPS-LEVEL-II",
    "price": 150.00,
    "duration": "40 hours",
    "exam": {
      "questions": [
        {
          "question": "What is the primary duty of a security officer?",
          "options": [
            "To make arrests",
            "To observe and report",
            "To carry a weapon",
            "To investigate crimes"
          ],
          "correctAnswer": 1,
          "points": 10
        }
      ],
      "passingScore": 70
    }
  }'
```

## Step 9: Sync Course to Teachable (Optional)

If you have a Teachable account set up:

1. Get your Teachable API key from Teachable settings
2. Add it to your `.env` file
3. Sync a course:
   ```bash
   curl -X POST http://localhost:5000/api/teachable/sync-course/YOUR_COURSE_ID
   ```

## Step 10: Test the Enrollment Flow

1. Visit `http://localhost:3000`
2. Browse courses
3. Click "Enroll Now" on a course
4. Fill out the enrollment form
5. Complete payment (use Stripe test cards: `4242 4242 4242 4242`)
6. Access the student dashboard
7. Complete the course and take the exam
8. Download the certificate

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check your connection string in `.env`
- For MongoDB Atlas, ensure your IP is whitelisted

### Port Already in Use
- Change the `PORT` in `.env` for backend
- Change the port in `client/package.json` scripts for frontend

### Missing Dependencies
- Run `npm install` in both root and `client` directories
- Delete `node_modules` and reinstall if issues persist

### Certificate Generation Fails
- Ensure the `uploads/certificates` directory exists
- Check that school configuration is set up correctly
- Verify signature image path is correct

## Next Steps

1. **Customize the Website**
   - Update branding in `client/components/Header.js` and `Footer.js`
   - Modify colors in `client/tailwind.config.js`
   - Add your logo and images

2. **Add More Courses**
   - Create courses via API or admin interface
   - Upload course materials (PDFs)
   - Set up exams for each course

3. **Configure Payments**
   - Set up Stripe webhook endpoint
   - Test payment flow with test cards
   - Switch to live keys when ready

4. **Deploy**
   - Deploy backend to Heroku, Railway, or AWS
   - Deploy frontend to Vercel or Netlify
   - Update environment variables in hosting platform

## Support

For issues or questions:
- Check the README.md for API documentation
- Review server logs for error messages
- Ensure all environment variables are set correctly

