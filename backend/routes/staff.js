const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const router = express.Router();

// GET /api/staff/:id/assignments
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

// PUT /api/staff/assignment/:id
router.put('/assignment/:id', requireAuth('staff'), async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { status, completion_date } = req.body;
    const staffId = req.session.user.id;

    // Validate status
    if (!['Assigned', 'Accepted', 'Completed'].includes(status)) {
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
