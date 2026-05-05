const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const router = express.Router();

// GET /api/staff/:id/assignments - Get staff's accepted jobs
router.get('/:id/assignments', requireAuth('staff'), async (req, res) => {
  try {
    const staffId = req.session.user.id;

    const [assignments] = await db.query(
      `SELECT 
        a.assignment_id,
        sr.request_id,
        st.name AS student_name,
        r.room_number,
        h.hostel_name,
        sc.name AS category_name,
        sr.description,
        sr.status,
        a.assigned_date,
        a.completion_date
      FROM Assignment a
      JOIN Service_Request sr ON a.request_id = sr.request_id
      JOIN Student st ON sr.student_id = st.student_id
      JOIN Room r ON st.room_id = r.room_id
      JOIN Hostel h ON r.hostel_id = h.hostel_id
      JOIN Service_Category sc ON sr.category_id = sc.category_id
      WHERE a.staff_id = ?
      ORDER BY a.assigned_date DESC`,
      [staffId]
    );

    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// GET /api/staff/:id/available - Get available requests for staff to accept
router.get('/:id/available', requireAuth('staff'), async (req, res) => {
  try {
    const specialization = req.session.user.specialization;

    const [available] = await db.query(
      `SELECT 
        sr.request_id,
        st.name AS student_name,
        r.room_number,
        h.hostel_name,
        sc.name AS category_name,
        sr.description,
        sr.status,
        sr.date_raised
      FROM Service_Request sr
      JOIN Student st ON sr.student_id = st.student_id
      JOIN Room r ON st.room_id = r.room_id
      JOIN Hostel h ON r.hostel_id = h.hostel_id
      JOIN Service_Category sc ON sr.category_id = sc.category_id
      WHERE sr.status = 'Pending'
        AND sc.name = ?
        AND NOT EXISTS (
          SELECT 1 FROM Assignment a WHERE a.request_id = sr.request_id
        )
      ORDER BY sr.date_raised ASC`,
      [specialization]
    );

    res.json(available);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch available requests' });
  }
});

// POST /api/staff/accept/:request_id - Staff accepts a pending request
router.post('/accept/:request_id', requireAuth('staff'), async (req, res) => {
  try {
    const requestId = req.params.request_id;
    const staffId = req.session.user.id;

    // Call stored procedure with OUT parameter
    await db.query(
      'CALL AcceptRequest(?, ?, @assignment_id)',
      [requestId, staffId]
    );

    // Get the OUT parameter value
    const [rows] = await db.query('SELECT @assignment_id as assignment_id');
    const assignmentId = rows[0].assignment_id;

    res.json({ 
      assignment_id: assignmentId,
      message: 'Request accepted successfully' 
    });
  } catch (err) {
    console.error(err);
    // Handle specific error messages from stored procedure
    if (err.sqlMessage) {
      return res.status(400).json({ error: err.sqlMessage });
    }
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// PUT /api/staff/assignment/:id - Mark assignment as completed
router.put('/assignment/:id', requireAuth('staff'), async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { status } = req.body;
    const staffId = req.session.user.id;

    // Validate status
    if (status !== 'Completed') {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Call stored procedure
    await db.query(
      'CALL CompleteAssignment(?, ?)',
      [assignmentId, staffId]
    );

    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    // Handle specific error messages from stored procedure
    if (err.sqlMessage) {
      return res.status(403).json({ error: err.sqlMessage });
    }
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
