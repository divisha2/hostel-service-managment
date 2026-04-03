# HSRMS — Hostel Service Request Management System

A full-stack service request management system for hostel maintenance operations.

## Stack

- **Frontend**: HTML + CSS + Vanilla JavaScript
- **Backend**: Node.js + Express + MySQL2
- **Database**: MySQL 8.0+

## Project Structure

```
├── frontend/
│   ├── shared/          # Design system & utilities
│   ├── student/         # Student login & dashboard
│   ├── staff/           # Staff login & dashboard
│   └── warden/          # Warden login, dashboard & audit log
└── backend/
    ├── server.js        # Express app entry point
    ├── db.js            # MySQL connection pool
    ├── middleware/      # Auth middleware
    └── routes/          # API endpoints
```

## Setup Instructions

### 1. Database Setup

Ensure MySQL is running and create the database:

```sql
CREATE DATABASE hsrms;
```

Run your database schema SQL file to create tables, views, procedures, and triggers.

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hsrms
SESSION_SECRET=generate_a_random_string_here
PORT=3000
```

Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### 3. Access the Application

Open your browser and navigate to:

- Student: `http://localhost:3000/student/login.html`
- Staff: `http://localhost:3000/staff/login.html`
- Warden: `http://localhost:3000/warden/login.html`

## API Endpoints

### Authentication
- `POST /api/auth/student` - Student login
- `POST /api/auth/staff` - Staff login
- `POST /api/auth/warden` - Warden login
- `POST /api/auth/logout` - Logout

### Student
- `GET /api/student/:id/requests` - Get student's requests
- `POST /api/student/request` - Raise new request

### Staff
- `GET /api/staff/:id/assignments` - Get staff assignments
- `PUT /api/staff/assignment/:id` - Update assignment status

### Warden
- `GET /api/warden/:id/requests` - Get all hostel requests
- `GET /api/warden/:id/stats` - Get dashboard statistics
- `GET /api/staff/by-category/:category_id` - Get staff by specialization
- `POST /api/warden/assign` - Assign staff to request
- `GET /api/warden/:id/audit-log` - Get status change log

### Shared
- `GET /api/categories` - Get all service categories

## Design System

The UI follows an "Institutional Brutalism" aesthetic:

- **Typography**: IBM Plex Mono (data) + IBM Plex Sans (body)
- **Colors**: Warm neutrals with brick red accent
- **Layout**: Sharp corners, no shadows, minimal animation
- **Philosophy**: Functional, no-nonsense, like a digitized maintenance logbook

## Notes

- All business logic resides in the database (stored procedures, triggers, views)
- Backend is a thin API layer with no business logic
- Session-based authentication with 4-hour timeout
- All passwords hashed with bcryptjs
- Parameterized queries prevent SQL injection
