# Learning Management System (LMS)

A RESTful API for a Learning Management System built with Node.js, Express, Prisma, and MySQL.

## Database Seeding

The application comes with seed data for testing purposes. Running the seed will create:

### Test Users

1. Admin User

   - Email: admin@lms.com
   - Password: admin123
   - Role: ADMIN

2. Instructor

   - Email: instructor@lms.com
   - Password: instructor123
   - Role: INSTRUCTOR

3. Students

   - Email: student1@lms.com
   - Password: student123
   - Role: STUDENT

   - Email: student2@lms.com
   - Password: student123
   - Role: STUDENT

### Test OTP

- Email: test@lms.com
- OTP: 123456

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Set up your environment variables in `.env`:

```env
PORT=3000
DATABASE_URL="mysql://username:password@localhost:3306/lms"
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

3. Run database migrations:

```bash
npx prisma migrate dev
```

4. Seed the database:

```bash
npm run seed
# or
npx prisma db seed
```

5. Start the development server:

```bash
npm run dev
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot-reload
- `npm run seed` - Seed the database with test data
- `npm test` - Run tests

## API Documentation

### Authentication Endpoints

- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/otp` - Send OTP
- POST `/api/auth/verify-otp` - Verify OTP
- POST `/api/auth/reset-password` - Reset password

## License

ISC
