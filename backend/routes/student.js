const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const router = express.Router();

// Validation helper
function validateRaiseRequest(body) {
  const { category_id, description, priority } = body;
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

  if (!['Low', 'Medium', 'High'].includes(priority)) {
    errors.push('Priority must be Low, Medium, or High');
  }

  return errors;
}

// GET /api/student/:id/requests
router.get('/:id/requests', requireAuth('student'), async (req, res) => {
  try {
    const studentId = req.session.user.id;

    const [requests] = await db.query(
      `SELECT 
        sr.request_id,
        sc.name AS category_name,
        sr.description,
        sr.priority,
        sr.status,
        sr.date_raised,
        sr.last_updated,
        s.name AS staff_name,
        a.assigned_date
      FROM Service_Request sr
      JOIN Service_Category sc ON sr.category_id = sc.category_id
      LEFT JOIN Assignment a ON sr.request_id = a.request_id
      LEFT JOIN Staff s ON a.staff_id = s.staff_id
      WHERE sr.student_id = ?
      ORDER BY sr.date_raised DESC`,
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
    const errors = validateRaiseRequest(req.body);
    if (errors.length) {
      return res.status(400).json({ error: errors[0] });
    }

    const { category_id, description, priority } = req.body;
    const studentId = req.session.user.id;

    // Call stored procedure
    const [result] = await db.query(
      'CALL RaiseRequest(?, ?, ?, ?)',
      [studentId, category_id, description.trim(), priority]
    );

    // The procedure returns the new request_id in the first result set
    const requestId = result[0][0].request_id;

    res.status(201).json({
      request_id: requestId,
      message: 'Request raised successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to raise request' });
  }
});

module.exports = router;
