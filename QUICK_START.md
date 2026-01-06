# Quick Start Guide

Get up and running in 5 minutes!

## 1. Install Dependencies

```bash
npm run install:all
```

## 2. Set Up Environment

Create a `.env` file in the root:

```env
MONGODB_URI=mongodb://localhost:27017/stayready
PORT=5000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 3. Start MongoDB

```bash
# Windows
mongod

# Mac/Linux  
sudo mongod
```

## 4. Initialize School

```bash
node server/scripts/initSchool.js
```

## 5. Run the App

```bash
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 6. Create Your First Course

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

## Next Steps

- See `SETUP.md` for detailed configuration
- See `README.md` for full documentation
- See `DEPLOYMENT.md` for production deployment

