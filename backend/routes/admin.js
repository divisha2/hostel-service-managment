const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const router = express.Router();

// GET /api/admin/all-requests
router.get('/all-requests', requireAuth('admin'), async (req, res) => {
  try {
    const [requests] = await db.query(
      `SELECT 
        sr.request_id,
        st.name AS student_name,
        r.room_number,
        h.hostel_name,
        sc.name AS category_name,
        sc.category_id,
        sr.status,
        sr.description,
        sr.date_raised,
        s.name AS staff_name,
        a.assigned_date,
        a.completion_date
      FROM Service_Request sr
      JOIN Student st ON sr.student_id = st.student_id
      JOIN Room r ON st.room_id = r.room_id
      JOIN Hostel h ON r.hostel_id = h.hostel_id
      JOIN Service_Category sc ON sr.category_id = sc.category_id
      LEFT JOIN Assignment a ON sr.request_id = a.request_id
      LEFT JOIN Staff s ON a.staff_id = s.staff_id
      ORDER BY sr.date_raised DESC`
    );
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /api/admin/staff-performance
router.get('/staff-performance', requireAuth('admin'), async (req, res) => {
  try {
    const [performance] = await db.query(
      `SELECT 
        s.staff_id,
        s.name,
        s.specialization,
        s.phone,
        s.email,
        COUNT(a.assignment_id) AS total_assignments,
        SUM(CASE WHEN sr.status = 'Accepted' THEN 1 ELSE 0 END) AS accepted_count,
        SUM(CASE WHEN sr.status = 'Completed' THEN 1 ELSE 0 END) AS completed_count,
        GetStaffCompletionRate(s.staff_id) AS completion_rate
      FROM Staff s
      LEFT JOIN Assignment a ON s.staff_id = a.staff_id
      LEFT JOIN Service_Request sr ON a.request_id = sr.request_id
      GROUP BY s.staff_id
      ORDER BY total_assignments DESC`
    );
    res.json(performance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch staff performance' });
  }
});

// GET /api/admin/stats
router.get('/stats', requireAuth('admin'), async (req, res) => {
  try {
    const [stats] = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM Service_Request) AS total_requests,
        (SELECT COUNT(*) FROM Service_Request WHERE status = 'Pending') AS pending,
        (SELECT COUNT(*) FROM Service_Request WHERE status = 'Assigned') AS assigned,
        (SELECT COUNT(*) FROM Service_Request WHERE status = 'Accepted') AS accepted,
        (SELECT COUNT(*) FROM Service_Request WHERE status = 'Completed') AS completed,
        (SELECT COUNT(*) FROM Staff) AS total_staff,
        (SELECT COUNT(*) FROM Student) AS total_students`
    );
    res.json(stats[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// POST /api/admin/staff - Add new staff
router.post('/staff', requireAuth('admin'), async (req, res) => {
  try {
    const { name, phone, email, password, specialization } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO Staff (name, phone, email, password, specialization) VALUES (?, ?, ?, ?, ?)',
      [name, phone, email, password, specialization]
    );
    
    res.status(201).json({ staff_id: result.insertId, message: 'Staff added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add staff' });
  }
});

// DELETE /api/admin/staff/:id - Delete staff
router.delete('/staff/:id', requireAuth('admin'), async (req, res) => {
  try {
    const staffId = req.params.id;
    
    await db.query('DELETE FROM Staff WHERE staff_id = ?', [staffId]);
    
    res.json({ message: 'Staff deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});

// GET /api/admin/staff-by-category/:category_id - Get staff for a category
router.get('/staff-by-category/:category_id', requireAuth('admin'), async (req, res) => {
  try {
    const categoryId = req.params.category_id;

    const [staff] = await db.query(
      `SELECT s.staff_id, s.name, s.specialization
       FROM Staff s
       JOIN Service_Category sc ON s.specialization = sc.name
       WHERE sc.category_id = ?
       ORDER BY s.name ASC`,
      [categoryId]
    );

    res.json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// POST /api/admin/assign - Assign request to staff
router.post('/assign', requireAuth('admin'), async (req, res) => {
  try {
    const { request_id, staff_id } = req.body;

    // Validate input
    if (!request_id || !staff_id || !Number.isInteger(Number(request_id)) || !Number.isInteger(Number(staff_id))) {
      return res.status(400).json({ error: 'Invalid request or staff ID' });
    }

    // Check for duplicate assignment
    const [existing] = await db.query(
      'SELECT assignment_id FROM Assignment WHERE request_id = ?',
      [request_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Request already assigned' });
    }

    // Insert assignment
    const [result] = await db.query(
      'INSERT INTO Assignment (request_id, staff_id, assigned_date) VALUES (?, ?, NOW())',
      [request_id, staff_id]
    );

    // Update request status to Assigned
    await db.query(
      "UPDATE Service_Request SET status = 'Assigned' WHERE request_id = ?",
      [request_id]
    );

    res.status(201).json({
      assignment_id: result.insertId,
      message: 'Staff assigned successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign staff' });
  }
});

module.exports = router;
