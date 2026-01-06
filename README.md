# Stay Ready Training Academy - Private Security Training Platform

A full-stack web application for managing state-approved Private Security Training courses in Texas. This platform integrates with Teachable for course delivery and provides automated certificate generation.

## Features

- **Course Management**: Create and manage state-approved security training courses
- **Student Enrollment**: Online enrollment with payment processing via Stripe
- **Teachable Integration**: Sync courses with Teachable platform
- **Certificate Generation**: Automated PDF certificate generation matching state requirements
- **Student Dashboard**: Track progress, view certificates, and access course materials
- **Payment Processing**: Secure payment handling with Stripe
- **Exam System**: Graded assessments with automatic certificate issuance upon passing

## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- PDF generation with pdf-lib
- Stripe for payments
- Teachable API integration

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Stripe Elements for payment

## Project Structure

```
├── server/
│   ├── models/          # MongoDB models (Student, Course, Enrollment, Certificate, School)
│   ├── routes/          # API routes
│   ├── services/        # Business logic (CertificateGenerator, TeachableService)
│   └── index.js         # Express server entry point
├── client/
│   ├── components/      # React components
│   ├── pages/           # Next.js pages
│   └── styles/          # Global styles
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or cloud instance)
- Teachable account with API access
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Teachable
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your MongoDB connection string
   - Add your Teachable API key and School ID
   - Add your Stripe keys
   - Configure school information

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode (runs both server and client)
   npm run dev

   # Or run separately:
   npm run dev:server  # Backend on port 5000
   npm run dev:client  # Frontend on port 3000
   ```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stayready
TEACHABLE_API_KEY=your_api_key
TEACHABLE_SCHOOL_ID=your_school_id
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## API Endpoints

### Students
- `POST /api/students` - Create student
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/email/:email` - Get student by email

### Courses
- `POST /api/courses` - Create course
- `GET /api/courses` - Get all active courses
- `GET /api/courses/:id` - Get course by ID

### Enrollments
- `POST /api/enrollments` - Create enrollment
- `GET /api/enrollments/:id` - Get enrollment
- `PATCH /api/enrollments/:id/progress` - Update progress
- `POST /api/enrollments/:id/exam` - Submit exam

### Certificates
- `POST /api/certificates/generate/:enrollmentId` - Generate certificate
- `GET /api/certificates/:id` - Get certificate
- `GET /api/certificates/download/:id` - Download certificate PDF
- `GET /api/certificates/student/:studentId` - Get student certificates

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/webhook` - Stripe webhook handler

## Certificate Requirements

Certificates include:
- Student name
- Last 4 digits of SSN
- Completion date
- Course name
- Certificate number
- School name and license number
- Instructor name and signature

## Teachable Integration

1. **Set up Teachable API**
   - Get your API key from Teachable settings
   - Add API key to `.env` file

2. **Sync Courses**
   - Courses can be synced to Teachable via `/api/teachable/sync-course/:courseId`
   - Students are automatically enrolled in Teachable when they enroll on your site

3. **Course Links**
   - Each course can link to its Teachable version
   - Students can access courses through both platforms

## Deployment

### Backend
- Deploy to services like Heroku, Railway, or AWS
- Set environment variables in your hosting platform
- Ensure MongoDB is accessible

### Frontend
- Build: `cd client && npm run build`
- Deploy to Vercel, Netlify, or similar
- Set `NEXT_PUBLIC_API_URL` to your backend URL

## Testing

1. **Create a test course**
   ```bash
   curl -X POST http://localhost:5000/api/courses \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Level II Security Officer",
       "description": "State-approved security training",
       "courseNumber": "DPS-001",
       "price": 150,
       "duration": "40 hours"
     }'
   ```

2. **Test enrollment flow**
   - Visit `http://localhost:3000`
   - Browse courses
   - Complete enrollment form
   - Process payment (use Stripe test cards)

## Support

For issues or questions, please contact the development team.

## License

Proprietary - Stay Ready Training Academy

