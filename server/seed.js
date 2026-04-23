/**
 * seed.js — populate MedBuddie with demo patients and doctors
 *
 * Run locally:  node server/seed.js
 * Run on Railway: railway run --service medbuddie node server/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const pool   = require('./config/db');

/* ── Ensure the consultation_messages table exists before seeding ─────────── */
async function runMigrations() {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_doctor BOOLEAN DEFAULT FALSE`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS doctor_specialties TEXT[] DEFAULT '{}'`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number VARCHAR(100)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified_doctor BOOLEAN DEFAULT FALSE`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS doctor_bio TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS years_experience INTEGER`);
    await pool.query(`CREATE TABLE IF NOT EXISTS consultations (
        id SERIAL PRIMARY KEY, second_opinion_id INTEGER,
        patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doctor_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(30) DEFAULT 'pending', meeting_url TEXT,
        scheduled_at TIMESTAMPTZ, notes TEXT,
        concern TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS consultation_messages (
        id SERIAL PRIMARY KEY,
        consultation_id INTEGER NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
}

/* ── Seed data ────────────────────────────────────────────────────────────── */

const PATIENTS = [
    {
        name: 'Sarah Mitchell', email: 'sarah@demo.medbuddie.com', password: 'Patient@123',
        username: 'sarah_m', bio: 'Living with Type 2 Diabetes. Health advocate.',
        weight: '158', height: "5'5\"", bmi: '26.3',
        bloodPressure: '128/82', hba1c: '7.1', lipidPanel: 'Borderline',
        medications: [
            { name: 'Metformin 500mg', frequency: 'Twice daily' },
            { name: 'Lisinopril 10mg', frequency: 'Once daily' },
        ],
    },
    {
        name: 'James Okafor', email: 'james@demo.medbuddie.com', password: 'Patient@123',
        username: 'james_o', bio: 'Recovering from cardiac surgery. Staying active.',
        weight: '185', height: "5'11\"", bmi: '25.8',
        bloodPressure: '135/88', hba1c: '5.9', lipidPanel: 'Elevated LDL',
        medications: [
            { name: 'Atorvastatin 40mg', frequency: 'Once daily' },
            { name: 'Aspirin 81mg', frequency: 'Once daily' },
            { name: 'Carvedilol 6.25mg', frequency: 'Twice daily' },
        ],
    },
    {
        name: 'Priya Sharma', email: 'priya@demo.medbuddie.com', password: 'Patient@123',
        username: 'priya_s', bio: 'Managing hypothyroidism and anxiety. Yoga helps.',
        weight: '132', height: "5'3\"", bmi: '23.4',
        bloodPressure: '118/74', hba1c: '5.4', lipidPanel: 'Normal',
        medications: [
            { name: 'Levothyroxine 75mcg', frequency: 'Once daily' },
        ],
    },
    {
        name: 'Carlos Rivera', email: 'carlos@demo.medbuddie.com', password: 'Patient@123',
        username: 'carlos_r', bio: 'Asthma warrior. Love hiking despite the challenges.',
        weight: '172', height: "5'9\"", bmi: '25.4',
        bloodPressure: '122/78', hba1c: '5.6', lipidPanel: 'Normal',
        medications: [
            { name: 'Albuterol inhaler', frequency: 'As needed' },
            { name: 'Fluticasone inhaler', frequency: 'Twice daily' },
        ],
    },
    {
        name: 'Emma Thornton', email: 'emma@demo.medbuddie.com', password: 'Patient@123',
        username: 'emma_t', bio: 'Rheumatoid arthritis since 28. Advocating for early diagnosis.',
        weight: '145', height: "5'6\"", bmi: '23.4',
        bloodPressure: '115/72', hba1c: '5.2', lipidPanel: 'Normal',
        medications: [
            { name: 'Methotrexate 15mg', frequency: 'Weekly' },
            { name: 'Folic acid 1mg', frequency: 'Once daily' },
        ],
    },
];

const DOCTORS = [
    {
        name: 'Dr. Ananya Krishnan', email: 'dr.krishnan@demo.medbuddie.com', password: 'Doctor@123',
        username: 'dr_krishnan', licenseNumber: 'MD-CA-2019-004421',
        specialties: ['Cardiology', 'Internal Medicine'],
        bio: 'Board-certified cardiologist with 12 years at Stanford Health. Specialising in preventive cardiology and heart failure management.',
        yearsExperience: 12,
    },
    {
        name: 'Dr. Marcus Webb', email: 'dr.webb@demo.medbuddie.com', password: 'Doctor@123',
        username: 'dr_webb', licenseNumber: 'MD-NY-2015-007893',
        specialties: ['Neurology', 'Psychiatry'],
        bio: 'Neurologist focusing on migraine, epilepsy, and cognitive decline. 16 years clinical practice at NYU Langone.',
        yearsExperience: 16,
    },
    {
        name: 'Dr. Fatima Al-Hassan', email: 'dr.alhassan@demo.medbuddie.com', password: 'Doctor@123',
        username: 'dr_alhassan', licenseNumber: 'MD-TX-2020-002215',
        specialties: ['Endocrinology', 'General Practice'],
        bio: 'Endocrinologist specialising in diabetes management, thyroid disorders, and metabolic syndrome. 8 years experience.',
        yearsExperience: 8,
    },
    {
        name: 'Dr. Samuel Park', email: 'dr.park@demo.medbuddie.com', password: 'Doctor@123',
        username: 'dr_park', licenseNumber: 'MD-WA-2017-009034',
        specialties: ['Pulmonology', 'Infectious Disease'],
        bio: 'Pulmonologist at UW Medicine. Expert in asthma, COPD, and post-COVID respiratory conditions. 10 years practice.',
        yearsExperience: 10,
    },
    {
        name: 'Dr. Olivia Chen', email: 'dr.chen@demo.medbuddie.com', password: 'Doctor@123',
        username: 'dr_chen', licenseNumber: 'MD-MA-2018-003371',
        specialties: ['Rheumatology', 'Musculoskeletal'],
        bio: 'Rheumatologist at Mass General focusing on RA, lupus, and osteoporosis. Strong believer in patient-centred care.',
        yearsExperience: 9,
    },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

async function upsertPatient(p) {
    const hash = await bcrypt.hash(p.password, 10);
    const { rows } = await pool.query(
        `INSERT INTO users
            (name, email, password, username, bio, weight, height, bmi,
             blood_pressure, hba1c, lipid_panel, medications)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
         ON CONFLICT (email) DO UPDATE SET
             name = EXCLUDED.name, bio = EXCLUDED.bio,
             weight = EXCLUDED.weight, height = EXCLUDED.height,
             bmi = EXCLUDED.bmi, blood_pressure = EXCLUDED.blood_pressure,
             hba1c = EXCLUDED.hba1c, lipid_panel = EXCLUDED.lipid_panel,
             medications = EXCLUDED.medications
         RETURNING id, name, email`,
        [p.name, p.email, hash, p.username, p.bio,
         p.weight, p.height, p.bmi, p.bloodPressure,
         p.hba1c, p.lipidPanel, JSON.stringify(p.medications)]
    );
    return rows[0];
}

async function upsertDoctor(d) {
    const hash = await bcrypt.hash(d.password, 10);
    const { rows } = await pool.query(
        `INSERT INTO users
            (name, email, password, username,
             is_doctor, is_verified_doctor,
             license_number, doctor_specialties, doctor_bio, years_experience)
         VALUES ($1,$2,$3,$4, true, true, $5,$6,$7,$8)
         ON CONFLICT (email) DO UPDATE SET
             name = EXCLUDED.name,
             is_doctor = true, is_verified_doctor = true,
             license_number = EXCLUDED.license_number,
             doctor_specialties = EXCLUDED.doctor_specialties,
             doctor_bio = EXCLUDED.doctor_bio,
             years_experience = EXCLUDED.years_experience
         RETURNING id, name, email`,
        [d.name, d.email, hash, d.username,
         d.licenseNumber, d.specialties, d.bio, d.yearsExperience]
    );
    return rows[0];
}

async function seedConsultation(patientId, doctorId, concern, status, notes) {
    // Skip if one already exists between this pair
    const exists = await pool.query(
        'SELECT id FROM consultations WHERE patient_id=$1 AND doctor_id=$2 LIMIT 1',
        [patientId, doctorId]
    );
    if (exists.rows.length) return exists.rows[0];

    let meetingUrl = null;
    if (status === 'accepted') {
        meetingUrl = `https://meet.jit.si/medbuddie-demo-${patientId}-${doctorId}`;
    }
    const { rows } = await pool.query(
        `INSERT INTO consultations (patient_id, doctor_id, concern, status, meeting_url, notes)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [patientId, doctorId, concern, status, meetingUrl, notes]
    );
    return rows[0];
}

async function seedMessage(consultationId, senderId, content) {
    await pool.query(
        `INSERT INTO consultation_messages (consultation_id, sender_id, content)
         VALUES ($1,$2,$3)`,
        [consultationId, senderId, content]
    );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */

async function main() {
    console.log('Running migrations…');
    await runMigrations();

    console.log('\nSeeding patients…');
    const patients = [];
    for (const p of PATIENTS) {
        const row = await upsertPatient(p);
        patients.push(row);
        console.log(`  ✓ ${row.name} (${row.email})`);
    }

    console.log('\nSeeding doctors…');
    const doctors = [];
    for (const d of DOCTORS) {
        const row = await upsertDoctor(d);
        doctors.push(row);
        console.log(`  ✓ ${row.name} (${row.email})`);
    }

    console.log('\nSeeding consultations…');

    // Sarah → Dr. Krishnan (cardiology concern) — accepted with messages
    const c1 = await seedConsultation(
        patients[0].id, doctors[0].id,
        'I was recently told my blood pressure is consistently high (128/82) despite being on Lisinopril for 6 months. My GP suggested adding a second medication but I wanted a cardiology opinion before changing my regimen.',
        'accepted',
        'Recommend adding Amlodipine 5mg. Schedule follow-up in 4 weeks.'
    );
    await seedMessage(c1.id, patients[0].id, 'Hello Dr. Krishnan, thank you for accepting my request. I\'ve been quite worried about this.');
    await seedMessage(c1.id, doctors[0].id, 'Hi Sarah, I\'ve reviewed your details. Your concern is valid — Lisinopril alone sometimes isn\'t enough for stage 2 hypertension. I\'d recommend we discuss adding Amlodipine.');
    await seedMessage(c1.id, patients[0].id, 'Would that interact with my Metformin at all?');
    await seedMessage(c1.id, doctors[0].id, 'No significant interaction — Amlodipine is safe alongside Metformin. Let\'s do a video call to go through the dosing plan. Use the call link above when ready.');

    // James → Dr. Krishnan (post-cardiac) — pending
    await seedConsultation(
        patients[1].id, doctors[0].id,
        'Six months post-bypass surgery. My LDL is still elevated at 142 despite taking Atorvastatin 40mg. Should I increase the dose or switch to a different statin?',
        'pending', null
    );

    // Priya → Dr. Al-Hassan (thyroid) — accepted
    const c3 = await seedConsultation(
        patients[2].id, doctors[2].id,
        'My TSH has been fluctuating between 0.8 and 4.2 over the last year on the same Levothyroxine dose. I feel exhausted some weeks and jittery others. Is this normal?',
        'accepted',
        'TSH variability at this level is worth investigating. Consider timing of medication and food interactions.'
    );
    await seedMessage(c3.id, doctors[2].id, 'Hi Priya, TSH fluctuations on a stable dose often come down to when you take the medication relative to food and coffee. Do you take it first thing in the morning?');
    await seedMessage(c3.id, patients[2].id, 'Usually yes, but sometimes I have coffee first and then take it 20-30 minutes later.');
    await seedMessage(c3.id, doctors[2].id, 'That\'s likely the culprit. Coffee can reduce Levothyroxine absorption by up to 30%. Try taking it on an empty stomach, then wait at least 60 minutes before coffee.');

    // Carlos → Dr. Park (asthma) — pending
    await seedConsultation(
        patients[3].id, doctors[3].id,
        'My asthma has been harder to control since moving to a new city. I\'m using my rescue inhaler 4-5 times a week which I know isn\'t ideal. Should I step up to a higher dose controller inhaler?',
        'pending', null
    );

    // Emma → Dr. Chen (RA) — completed
    const c5 = await seedConsultation(
        patients[4].id, doctors[4].id,
        'I\'ve been on Methotrexate for 18 months for RA. Recent bloodwork shows slightly elevated liver enzymes (ALT 52, AST 48). My rheumatologist said to watch and wait but I\'m concerned.',
        'completed',
        'Mild elevation at this level is common with MTX. Recommend hepatology consultation if enzymes exceed 3x ULN. Continue current dose with monthly monitoring.'
    );
    await seedMessage(c5.id, patients[4].id, 'Thank you Dr. Chen, I really appreciate the second opinion. My rheumatologist seemed dismissive of my concerns.');
    await seedMessage(c5.id, doctors[4].id, 'Your concern is completely understandable. ALT of 52 is only mildly elevated and within acceptable range for MTX therapy, but monthly monitoring is essential. I\'ve added my full notes above.');

    console.log('  ✓ Consultations and messages seeded\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  DEMO CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n  PATIENTS  (login at /signin)');
    console.log('  ─────────────────────────────────────────────────────────');
    for (const p of PATIENTS) {
        console.log(`  ${p.name.padEnd(20)} ${p.email.padEnd(38)} Password: ${p.password}`);
    }
    console.log('\n  DOCTORS   (login at /physician)');
    console.log('  ─────────────────────────────────────────────────────────');
    for (const d of DOCTORS) {
        console.log(`  ${d.name.padEnd(25)} ${d.email.padEnd(42)} Password: ${d.password}`);
    }
    console.log('\n═══════════════════════════════════════════════════════════\n');

    await pool.end();
    process.exit(0);
}

main().catch(err => {
    console.error('Seed failed:', err);
    pool.end();
    process.exit(1);
});
