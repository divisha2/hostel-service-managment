const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT category_id, name, description FROM Service_Category ORDER BY name ASC'
    );
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
