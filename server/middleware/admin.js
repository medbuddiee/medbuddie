const pool = require('../config/db');

// Must be used after authenticate() middleware
async function requireAdmin(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length || !rows[0].is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { requireAdmin };
