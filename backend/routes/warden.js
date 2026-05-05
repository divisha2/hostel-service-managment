const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const router = express.Router();

// GET /api/warden/:id/requests
router.get('/:id/requests', requireAuth('warden'), async (req, res) => {
  try {
    const hostelId = req.session.user.hostel_id;

    let sql = `
      SELECT 
        sr.request_id,
        st.name AS student_name,
        st.email AS student_email,
        st.phone AS student_phone,
        r.room_number,
        h.hostel_name,
        sc.name AS category_name,
        sc.category_id,
        sr.status,
        sr.description,
        s.name AS staff_name,
        a.assigned_date,
        a.completion_date,
        sr.date_raised
      FROM Service_Request sr
      JOIN Student st ON sr.student_id = st.student_id
      JOIN Room r ON st.room_id = r.room_id
      JOIN Hostel h ON r.hostel_id = h.hostel_id
      JOIN Service_Category sc ON sr.category_id = sc.category_id
      LEFT JOIN Assignment a ON sr.request_id = a.request_id
      LEFT JOIN Staff s ON a.staff_id = s.staff_id
      WHERE h.hostel_id = ?
    `;

    const params = [hostelId];

    // Apply filters
    if (req.query.status) {
      sql += ' AND sr.status = ?';
      params.push(req.query.status);
    }

    if (req.query.category_id) {
      sql += ' AND sr.category_id = ?';
      params.push(req.query.category_id);
    }

    sql += ' ORDER BY sr.date_raised DESC';

    const [requests] = await db.query(sql, params);
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /api/warden/:id/stats
router.get('/:id/stats', requireAuth('warden'), async (req, res) => {
  try {
    const hostelId = req.session.user.hostel_id;

    const [stats] = await db.query(
      `SELECT 
        COUNT(*) AS total,
        SUM(sr.status = 'Pending') AS pending,
        SUM(sr.status = 'Assigned') AS assigned,
        SUM(sr.status = 'Accepted') AS accepted,
        SUM(sr.status = 'Completed') AS completed,
        GetPendingCount(?) AS pending_count_func,
        GetCompletionRate(?) AS completion_rate
      FROM Service_Request sr
      JOIN Student st ON sr.student_id = st.student_id
      JOIN Room r ON st.room_id = r.room_id
      WHERE r.hostel_id = ?`,
      [hostelId, hostelId, hostelId]
    );

    res.json(stats[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/staff/by-category/:category_id
router.get('/staff/by-category/:category_id', requireAuth('warden'), async (req, res) => {
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

// POST /api/warden/assign
router.post('/assign', requireAuth('warden'), async (req, res) => {
  try {
    const { request_id, staff_id } = req.body;
    const hostelId = req.session.user.hostel_id;

    // Validate input
    if (!request_id || !staff_id || !Number.isInteger(Number(request_id)) || !Number.isInteger(Number(staff_id))) {
      return res.status(400).json({ error: 'Invalid request or staff ID' });
    }

    // Verify request belongs to warden's hostel
    const [requests] = await db.query(
      `SELECT sr.request_id
       FROM Service_Request sr
       JOIN Student st ON sr.student_id = st.student_id
       JOIN Room r ON st.room_id = r.room_id
       WHERE sr.request_id = ? AND r.hostel_id = ?`,
      [request_id, hostelId]
    );

    if (requests.length === 0) {
      return res.status(403).json({ error: 'Forbidden' });
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
      message: 'Staff assigned'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign staff' });
  }
});

// GET /api/warden/:id/audit-log
router.get('/:id/audit-log', requireAuth('warden'), async (req, res) => {
  try {
    const [logs] = await db.query(
      `SELECT 
        log_id,
        request_id,
        old_status,
        new_status,
        changed_at
      FROM Audit_Log
      ORDER BY changed_at DESC
      LIMIT 100`
    );

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

module.exports = router;
