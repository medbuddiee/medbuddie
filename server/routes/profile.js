// server/routes/profile.js
// const express = require('express');
// const router = express.Router();
// const pool = require('../config/db'); // PostgreSQL pool

// GET: fetch current user profile
// router.get('/profile', async (req, res) => {
//     const userId = req.user?.id || 1; // demo user
//     try {
//         const { rows } = await pool.query(
//             `SELECT id, name, username, bio, weight, height, bmi,
//                     blood_pressure AS "bloodPressure",
//                     lipid_panel AS "lipidPanel",
//                     medications
//              FROM users
//              WHERE id = $1`,
//             [userId]
//         );
//
//         if (!rows[0]) return res.status(404).json({ error: 'Not found' });
//
//         const profile = rows[0];
//         profile.medications = profile.medications || []; // ✅ no JSON.parse()
//
//         res.json(profile);
//     } catch (err) {
//         console.error('GET /profile error:', err);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// // PUT: update profile
// router.put('/profile', async (req, res) => {
//     const {
//         name,
//         bio,
//         weight,
//         height,
//         bmi,
//         bloodPressure,
//         lipidPanel,
//         medications = [],
//     } = req.body;
//     debugger
//     const userId = req.user?.id || 1;
//
//     try {
//         const { rows } = await pool.query(
//             `UPDATE users SET
//                               name = $1,
//                               bio = $2,
//                               weight = $3,
//                               height = $4,
//                               bmi = $5,
//                               blood_pressure = $6,
//                               lipid_panel = $7,
//                               medications = $8::jsonb
//              WHERE id = $9
//                  RETURNING id, name, bio, weight, height, bmi,
//                  blood_pressure AS "bloodPressure",
//                  lipid_panel AS "lipidPanel",
//                  medications`,
//             [
//                 name,
//                 bio,
//                 weight,
//                 height,
//                 bmi,
//                 bloodPressure,
//                 lipidPanel,
//                 JSON.stringify(medications),
//                 userId,
//             ]
//         );
//
//         if (!rows.length) {
//             return res.status(404).json({ error: 'Profile not found' });
//         }
//         res.status(200).json(rows[0]);
//     } catch (err) {
//         console.error('PUT /profile error:', err);
//         return res.status(500).json({
//             error: 'Server error',
//             details: err.message,
//         });
//     }
// });

module.exports = router;
