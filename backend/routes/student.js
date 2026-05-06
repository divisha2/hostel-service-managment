const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const router = express.Router();

// Validation helper
function validateRaiseRequest(body) {
  const { category_id, description } = body;
  const errors = [];

  if (!category_id || !Number.isInteger(Number(category_id)) || Number(category_id) < 1) {
    errors.push('Invalid category');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    errors.push('Description must be at least 10 characters');
  }

  if (description && description.trim().length > 500) {
    errors.push('Description must be under 500 characters');
  }

  return errors;
}

// GET /api/student/:id/requests
router.get('/:id/requests', requireAuth('student'), async (req, res) => {
  try {
    const studentId = req.session.user.id;

    // Use StudentRequestView with additional room/hostel info
    const [requests] = await db.query(
      `SELECT 
        srv.request_id,
        srv.category AS category_name,
        srv.description,
        srv.status,
        srv.date_raised,
        h.hostel_name,
        r.room_number,
        srv.staff_name,
        st.phone AS staff_phone,
        st.email AS staff_email,
        srv.assigned_date
      FROM StudentRequestView srv
      JOIN Student s ON srv.student_id = s.student_id
      JOIN Room r ON s.room_id = r.room_id
      JOIN Hostel h ON r.hostel_id = h.hostel_id
      LEFT JOIN Staff st ON srv.staff_name = st.name
      WHERE srv.student_id = ?
      ORDER BY srv.date_raised DESC`,
      [studentId]
    );

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// POST /api/student/request
router.post('/request', requireAuth('student'), async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Session user:', req.session.user);
    
    const errors = validateRaiseRequest(req.body);
    if (errors.length) {
      console.log('Validation errors:', errors);
      return res.status(400).json({ error: errors[0] });
    }

    const { category_id, description } = req.body;
    const studentId = req.session.user.id;
    
    console.log('Calling RaiseRequest with:', { studentId, category_id, description: description.trim() });

    // Call stored procedure with OUT parameter
    const [result] = await db.query(
      'CALL RaiseRequest(?, ?, ?, @request_id)',
      [studentId, category_id, description.trim()]
    );

    // Get the OUT parameter value
    const [rows] = await db.query('SELECT @request_id as request_id');
    const requestId = rows[0].request_id;
    
    console.log('Request created with ID:', requestId);

    res.status(201).json({
      request_id: requestId,
      message: 'Request raised successfully'
    });
  } catch (err) {
    console.error('Error in POST /student/request:', err);
    res.status(500).json({ error: 'Failed to raise request' });
  }
});

module.exports = router;
