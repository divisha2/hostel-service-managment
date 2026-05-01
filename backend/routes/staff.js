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
    const staffId = req.session.user.id;
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

// POST /api/staff/accept/:request_id - Accept a request
router.post('/accept/:request_id', requireAuth('staff'), async (req, res) => {
  try {
    const requestId = req.params.request_id;
    const staffId = req.session.user.id;

    // Check if request is still pending
    const [requests] = await db.query(
      'SELECT status FROM Service_Request WHERE request_id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (requests[0].status !== 'Pending') {
      return res.status(400).json({ error: 'Request is no longer available' });
    }

    // Create assignment
    await db.query(
      'INSERT INTO Assignment (request_id, staff_id, assigned_date) VALUES (?, ?, NOW())',
      [requestId, staffId]
    );

    // Update request status
    await db.query(
      "UPDATE Service_Request SET status = 'Accepted' WHERE request_id = ?",
      [requestId]
    );

    res.json({ message: 'Request accepted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// GET /api/staff/:id/available - Get available pending requests matching staff category
router.get('/:id/available', requireAuth('staff'), async (req, res) => {
  try {
    const staffId = req.session.user.id;
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

    // Check if request is still pending and not assigned
    const [requests] = await db.query(
      'SELECT status FROM Service_Request WHERE request_id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (requests[0].status !== 'Pending') {
      return res.status(400).json({ error: 'Request is no longer available' });
    }

    // Check if already assigned
    const [existing] = await db.query(
      'SELECT assignment_id FROM Assignment WHERE request_id = ?',
      [requestId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Request already assigned' });
    }

    // Create assignment
    await db.query(
      'INSERT INTO Assignment (request_id, staff_id, assigned_date) VALUES (?, ?, NOW())',
      [requestId, staffId]
    );

    // Update request status to Accepted
    await db.query(
      "UPDATE Service_Request SET status = 'Accepted' WHERE request_id = ?",
      [requestId]
    );

    res.json({ message: 'Request accepted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// PUT /api/staff/assignment/:id - Update assignment status
router.put('/assignment/:id', requireAuth('staff'), async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { status } = req.body;
    const staffId = req.session.user.id;

    // Validate status
    if (!['Accepted', 'Completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify ownership
    const [assignments] = await db.query(
      `SELECT sr.request_id 
       FROM Assignment a
       JOIN Service_Request sr ON a.request_id = sr.request_id
       WHERE a.assignment_id = ? AND a.staff_id = ?`,
      [assignmentId, staffId]
    );

    if (assignments.length === 0) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const requestId = assignments[0].request_id;

    // Update request status
    await db.query(
      'UPDATE Service_Request SET status = ? WHERE request_id = ?',
      [status, requestId]
    );

    // If completed, update completion_date
    if (status === 'Completed') {
      await db.query(
        'UPDATE Assignment SET completion_date = NOW() WHERE assignment_id = ?',
        [assignmentId]
      );
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
