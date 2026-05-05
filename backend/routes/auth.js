const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

// POST /api/auth/student
router.post('/student', async (req, res) => {
  try {
    const { student_id, password } = req.body;

    if (!student_id || !password) {
      return res.status(400).json({ error: 'Student ID and password required' });
    }

    const [students] = await db.query(
      'SELECT student_id, name, email, room_id, password FROM Student WHERE student_id = ?',
      [student_id]
    );

    if (students.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const student = students[0];
    // Direct password comparison for development (passwords are plain text in DB)
    const validPassword = password === student.password;

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Fetch room and hostel details
    const [rooms] = await db.query(
      `SELECT r.room_number, h.hostel_name 
       FROM Room r 
       JOIN Hostel h ON r.hostel_id = h.hostel_id 
       WHERE r.room_id = ?`,
      [student.room_id]
    );

    if (rooms.length === 0) {
      return res.status(500).json({ error: 'Room information not found' });
    }

    req.session.user = {
      role: 'student',
      id: student.student_id,
      name: student.name,
      room_number: rooms[0].room_number,
      hostel_name: rooms[0].hostel_name
    };

    res.json({
      student_id: student.student_id,
      name: student.name,
      room_number: rooms[0].room_number,
      hostel_name: rooms[0].hostel_name,
      redirect: '/student/dashboard.html'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/staff
router.post('/staff', async (req, res) => {
  try {
    const { staff_id, password } = req.body;

    if (!staff_id || !password) {
      return res.status(400).json({ error: 'Staff ID and password required' });
    }

    const [staff] = await db.query(
      'SELECT staff_id, name, specialization, password FROM Staff WHERE staff_id = ?',
      [staff_id]
    );

    if (staff.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const staffMember = staff[0];
    // Direct password comparison for development (passwords are plain text in DB)
    const validPassword = password === staffMember.password;

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.user = {
      role: 'staff',
      id: staffMember.staff_id,
      name: staffMember.name,
      specialization: staffMember.specialization
    };

    res.json({
      staff_id: staffMember.staff_id,
      name: staffMember.name,
      specialization: staffMember.specialization,
      redirect: '/staff/dashboard.html'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/warden
router.post('/warden', async (req, res) => {
  try {
    const { warden_id, password } = req.body;

    if (!warden_id || !password) {
      return res.status(400).json({ error: 'Warden ID and password required' });
    }

    const [wardens] = await db.query(
      `SELECT w.warden_id, w.name, h.hostel_name, w.hostel_id, w.password
       FROM Warden w
       JOIN Hostel h ON w.hostel_id = h.hostel_id
       WHERE w.warden_id = ?`,
      [warden_id]
    );

    if (wardens.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const warden = wardens[0];
    // Direct password comparison for development (passwords are plain text in DB)
    const validPassword = password === warden.password;

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.user = {
      role: 'warden',
      id: warden.warden_id,
      name: warden.name,
      hostel_name: warden.hostel_name,
      hostel_id: warden.hostel_id
    };

    res.json({
      warden_id: warden.warden_id,
      name: warden.name,
      hostel_name: warden.hostel_name,
      hostel_id: warden.hostel_id,
      redirect: '/warden/dashboard.html'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ redirect: '/' });
});

// POST /api/auth/admin
router.post('/admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Admin login attempt:', { email, password: '***' });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const [admins] = await db.query(
      'SELECT admin_id, name, email, password FROM Admin WHERE email = ?',
      [email]
    );

    console.log('Admin query result:', admins.length > 0 ? 'Found' : 'Not found');

    if (admins.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = admins[0];
    console.log('Admin found:', { id: admin.admin_id, name: admin.name, email: admin.email });
    console.log('Password match:', password === admin.password);
    
    // Direct password comparison for development
    const validPassword = password === admin.password;

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.user = {
      role: 'admin',
      id: admin.admin_id,
      name: admin.name
    };

    console.log('Admin login successful');

    res.json({
      admin_id: admin.admin_id,
      name: admin.name,
      redirect: '/admin/dashboard.html'
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
