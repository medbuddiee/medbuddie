const express  = require('express');
const pool     = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { emit } = require('../socket');

const router = express.Router();

// Allowed numeric fields and their column names
const NUMERIC_FIELDS = {
  steps:           'steps',
  heartRate:       'heart_rate',
  restingHeartRate:'resting_heart_rate',
  hrv:             'hrv',
  spo2:            'spo2',
  calories:        'calories',
  sleepHours:      'sleep_hours',
  sleepScore:      'sleep_score',
  recoveryScore:   'recovery_score',
  strain:          'strain',
};

const STRING_FIELDS = {
  weight:        'weight',
  height:        'height',
  bloodPressure: 'blood_pressure',
};

/* ── POST /api/health/sync ───────────────────────────────────────────────
   Body: { data: { steps, heartRate, weight, ... }, sources: ['Apple Health', 'Whoop'] }
   Merges incoming values — only overwrites a field if the new value is non-null.
   ─────────────────────────────────────────────────────────────────────── */
router.post('/sync', authenticate, async (req, res) => {
  const { data = {}, sources = [] } = req.body;
  if (typeof data !== 'object') return res.status(400).json({ error: 'data object required' });

  const updates = [];
  const values  = [];

  // Numeric fields
  for (const [jsKey, col] of Object.entries(NUMERIC_FIELDS)) {
    const val = data[jsKey];
    if (val != null && !isNaN(Number(val))) {
      values.push(Number(val));
      updates.push(`${col} = $${values.length}`);
    }
  }

  // String fields (weight, height, blood_pressure)
  for (const [jsKey, col] of Object.entries(STRING_FIELDS)) {
    const val = data[jsKey];
    if (val != null && String(val).trim()) {
      values.push(String(val).trim());
      updates.push(`${col} = $${values.length}`);
    }
  }

  if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

  // Merge sources array
  values.push(sources.filter(Boolean));
  updates.push(`health_sources = (
    SELECT ARRAY(SELECT DISTINCT unnest(health_sources || $${values.length}::text[]))
    FROM users WHERE id = $${values.length + 1}
  )`);

  values.push(new Date().toISOString());
  updates.push(`health_synced_at = $${values.length}`);

  values.push(req.user.id);

  try {
    const { rows } = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    emit(`user:${req.user.id}`, 'health:synced', rows[0]);
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('Health sync error:', err.message);
    res.status(500).json({ error: 'Failed to save health data' });
  }
});

/* ── GET /api/health/summary ─────────────────────────────────────────────
   Returns the user's current wearable health metrics
   ─────────────────────────────────────────────────────────────────────── */
router.get('/summary', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT steps, heart_rate, resting_heart_rate, hrv, spo2, calories,
              sleep_hours, sleep_score, recovery_score, strain,
              weight, height, blood_pressure, hba1c,
              health_synced_at, health_sources
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Health summary error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
