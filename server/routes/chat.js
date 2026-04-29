const express   = require('express');
const Anthropic  = require('@anthropic-ai/sdk');
const pool       = require('../config/db');
const { softAuthenticate } = require('../middleware/auth');

const router = express.Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── Shared helpers ──────────────────────────────────────────────────────── */

async function buildSystemPrompt(userId) {
    let userContext = 'The user is not logged in.';
    if (userId) {
        try {
            const { rows } = await pool.query(
                `SELECT name, bio, weight, height, blood_pressure, hba1c,
                        medications, is_verified_doctor, doctor_specialties, doctor_bio
                 FROM users WHERE id = $1`,
                [userId]
            );
            if (rows.length) {
                const p = rows[0];
                const meds = (p.medications || []).filter(m => m.name).map(m => m.name).join(', ') || 'none listed';
                userContext = [
                    `Name: ${p.name || 'Unknown'}`,
                    p.weight         ? `Weight: ${p.weight} lbs`              : null,
                    p.height         ? `Height: ${p.height}`                  : null,
                    p.blood_pressure ? `Blood pressure: ${p.blood_pressure}`  : null,
                    p.hba1c          ? `HbA1c: ${p.hba1c}%`                   : null,
                    `Current medications: ${meds}`,
                    p.is_verified_doctor
                        ? `Role: Verified physician (${(p.doctor_specialties || []).join(', ')})`
                        : 'Role: Patient',
                    p.bio ? `Bio: ${p.bio}` : null,
                ].filter(Boolean).join('\n');
            }
        } catch { /* fall back to no context */ }
    }

    return `You are MedBuddie AI, a knowledgeable and empathetic health assistant embedded in the MedBuddie platform — a community for patients, caregivers, and physicians.

## User profile
${userContext}

## Your role
- Answer health and medical questions clearly and accurately, tailored to this user's profile when relevant.
- Reference the user's medications, metrics, or conditions when helpful (e.g. "Given your HbA1c of 7.2%, you may want to discuss...").
- Explain medical terms in plain language unless the user is a physician.
- For physicians, you can use clinical terminology freely.
- Suggest when the user should consult a doctor or seek emergency care.
- You may cite medical guidelines (ACC/AHA, ADA, ESC, etc.) when relevant.

## Hard limits
- Never diagnose a condition definitively — say "this could suggest..." or "common causes include...".
- Always end responses that involve symptoms or treatment decisions with a reminder to consult a healthcare professional.
- If the user describes an emergency (chest pain, stroke symptoms, severe breathing difficulty), tell them to call emergency services immediately.
- Do not prescribe specific drug doses. Discuss classes of medications and general approaches only.

## Tone
Warm, concise, and evidence-based. Avoid being overly cautious to the point of being unhelpful.`;
}

function sanitiseHistory(messages) {
    return messages.slice(-20).map(m => ({
        role:    m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content).slice(0, 4000),
    }));
}

/* ── POST /api/chat  (SSE streaming — web) ───────────────────────────────── */
router.post('/', softAuthenticate, async (req, res) => {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0)
        return res.status(400).json({ error: 'messages array is required' });

    const history      = sanitiseHistory(messages);
    const systemPrompt = await buildSystemPrompt(req.user?.id);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
        const stream = client.messages.stream({
            model: 'claude-opus-4-7', max_tokens: 1024,
            system: systemPrompt, messages: history,
        });
        stream.on('text', (text) => res.write(`data: ${JSON.stringify({ text })}\n\n`));
        await stream.finalMessage();
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (err) {
        console.error('Chat stream error:', err.message);
        res.write(`data: ${JSON.stringify({ error: 'AI service error — please try again.' })}\n\n`);
        res.end();
    }
});

/* ── POST /api/chat/sync  (JSON — mobile) ────────────────────────────────── */
router.post('/sync', softAuthenticate, async (req, res) => {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0)
        return res.status(400).json({ error: 'messages array is required' });

    const history      = sanitiseHistory(messages);
    const systemPrompt = await buildSystemPrompt(req.user?.id);

    try {
        const response = await client.messages.create({
            model: 'claude-opus-4-7', max_tokens: 1024,
            system: systemPrompt, messages: history,
        });
        res.json({ content: response.content[0].text });
    } catch (err) {
        console.error('Chat sync error:', err.message);
        res.status(500).json({ error: 'AI service error — please try again.' });
    }
});

module.exports = router;
