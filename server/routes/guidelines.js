const express = require('express');
const pool    = require('../config/db');
const { getGuidelineContent } = require('../storage');
const { generateGuidelineContent } = require('../guidelineContent');

const router = express.Router();

// ── Seed data ─────────────────────────────────────────────────────────────────
// Each row: [title, specialty, source, summary, tags, bookmark_count, community_recs, published_at, file_key]
// file_key is the relative path inside guidelines-content/ for the full content file (null = no detail yet)
const SEEDS = [
    // Cardiovascular
    ['2023 ESH Guidelines for the Management of Arterial Hypertension', 'Cardiovascular', 'ESH 2023', 'Comprehensive update: SPC as first-line, BP targets, special populations, and resistant hypertension management', ['Hypertension','Blood Pressure','Antihypertensives'], 124, 89, "NOW() - INTERVAL '7 days'", 'cardiovascular/esh-hypertension-2023.json'],
    ['LDL Cholesterol Management Updates', 'Cardiovascular', 'ACC/AHA 2024', 'Statin initiation thresholds revised for intermediate-risk patients aged 40–75', ['Lipids','Statins','Prevention'], 98, 67, "NOW() - INTERVAL '1 month'", null],
    ['Coronary Artery Disease Treatment Strategies', 'Cardiovascular', 'ESC 2023', 'Dual antiplatelet therapy duration re-evaluated based on bleeding risk scoring', ['CAD','Antiplatelet','PCI'], 76, 54, "NOW() - INTERVAL '3 months'", null],
    ['Heart Failure with Preserved Ejection Fraction', 'Cardiovascular', 'AHA 2024', 'SGLT2 inhibitors now recommended for HFpEF regardless of diabetes status', ['HFpEF','SGLT2','Heart Failure'], 112, 78, "NOW() - INTERVAL '2 weeks'", null],

    // Respiratory
    ['COPD Management Updates', 'Respiratory', 'GOLD 2024', 'Triple inhaler therapy (LABA/LAMA/ICS) shown to reduce exacerbations by 25%', ['COPD','Inhaler','Exacerbations'], 91, 63, "NOW() - INTERVAL '1 week'", null],
    ['Asthma Control and Treatment', 'Respiratory', 'GINA 2024', 'Low-dose ICS-formoterol as reliever preferred over SABA for Step 1 and 2', ['Asthma','ICS','GINA'], 84, 58, "NOW() - INTERVAL '5 weeks'", null],
    ['Pneumonia Treatment and Antibiotic Use', 'Respiratory', 'IDSA 2024', 'Amoxicillin remains first-line for CAP; fluoroquinolones reserved for high-risk', ['Pneumonia','Antibiotics','CAP'], 67, 45, "NOW() - INTERVAL '6 months'", null],
    ['Pulmonary Embolism Diagnosis and Management', 'Respiratory', 'ESC 2024', 'CTPA remains gold standard; risk stratification guides anticoagulation duration', ['PE','Anticoagulation','DVT'], 88, 61, "NOW() - INTERVAL '2 months'", null],

    // Endocrine
    ['Type 2 Diabetes HbA1c Targets', 'Endocrine', 'ADA 2024', 'Individualised targets: <7% for most adults, <8% for elderly/high-risk patients', ['Diabetes','HbA1c','Glycaemia'], 103, 74, "NOW() - INTERVAL '3 days'", null],
    ['Thyroid Disorder Management Guidelines', 'Endocrine', 'ATA 2024', 'Subclinical hypothyroidism treatment now stratified by TSH level and symptoms', ['Thyroid','Hypothyroidism','TSH'], 79, 52, "NOW() - INTERVAL '6 weeks'", null],
    ['Insulin Therapy Optimisation Protocols', 'Endocrine', 'EASD 2024', 'Basal-bolus initiation criteria and titration algorithms updated for T2DM', ['Insulin','T2DM','Titration'], 65, 43, "NOW() - INTERVAL '4 months'", null],
    ['Obesity Pharmacotherapy Guidelines', 'Endocrine', 'AACE 2024', 'GLP-1 agonists recommended as first-line pharmacotherapy for BMI ≥30', ['Obesity','GLP-1','BMI'], 134, 96, "NOW() - INTERVAL '10 days'", null],

    // Gastrointestinal
    ['GERD and Acid Reflux Management', 'Gastrointestinal', 'ACG 2024', 'PPI step-down therapy recommended after 8 weeks; on-demand dosing for mild GERD', ['GERD','PPI','Reflux'], 87, 60, "NOW() - INTERVAL '2 weeks'", null],
    ['Ulcerative Colitis Treatment Updates', 'Gastrointestinal', 'ACG/CCF 2024', 'Upadacitinib approved for moderate-to-severe UC after biologic failure', ['IBD','Ulcerative Colitis','Biologics'], 73, 50, "NOW() - INTERVAL '1 month'", null],
    ['GI Bleeding Diagnosis and Treatment', 'Gastrointestinal', 'BSG 2024', 'Pre-endoscopic risk scoring (Glasgow-Blatchford) guides outpatient vs inpatient triage', ['GI Bleed','Endoscopy','Risk Score'], 59, 40, "NOW() - INTERVAL '5 months'", null],
    ['Colorectal Cancer Screening Protocols', 'Gastrointestinal', 'USPSTF 2024', 'Screening initiation lowered to age 45 for average-risk adults', ['CRC Screening','Colonoscopy','Prevention'], 118, 82, "NOW() - INTERVAL '4 days'", null],

    // Neurology
    ['Stroke Treatment Guidelines', 'Neurology', 'AHA/ASA 2024', 'IV alteplase window extended to 4.5 h; tenecteplase now an alternative thrombolytic', ['Stroke','Thrombolysis','tPA'], 96, 68, "NOW() - INTERVAL '1 week'", null],
    ['Migraine Management Strategies', 'Neurology', 'AHS 2024', 'CGRP monoclonal antibodies recommended for episodic migraine prevention', ['Migraine','CGRP','Prevention'], 82, 57, "NOW() - INTERVAL '3 weeks'", null],
    ['Updated Epilepsy Treatment Protocols', 'Neurology', 'ILAE 2024', 'Brivaracetam added as first-line option for focal seizures in adults', ['Epilepsy','Seizures','AED'], 61, 42, "NOW() - INTERVAL '2 months'", null],
    ['Parkinson Disease Management 2024', 'Neurology', 'MDS 2024', 'Levodopa remains gold standard; MAO-B inhibitors for neuroprotection in early disease', ['Parkinson','Levodopa','Neuroprotection'], 74, 51, "NOW() - INTERVAL '5 months'", null],

    // Musculoskeletal
    ['Osteoporosis Prevention and Treatment', 'Musculoskeletal', 'NOF 2024', 'FRAX score ≥20% for major fracture: pharmacotherapy recommended regardless of BMD', ['Osteoporosis','FRAX','Bisphosphonates'], 88, 61, "NOW() - INTERVAL '5 days'", null],
    ['Rheumatoid Arthritis Management', 'Musculoskeletal', 'ACR 2024', 'Treat-to-target with DAS28 <2.6; JAK inhibitors after inadequate DMARD response', ['RA','DMARDs','JAK Inhibitors'], 75, 52, "NOW() - INTERVAL '3 weeks'", null],
    ['Lower Back Pain Clinical Guidelines', 'Musculoskeletal', 'ACP 2024', 'Non-pharmacological therapy (exercise, CBT) preferred for chronic LBP first-line', ['Back Pain','Physiotherapy','CBT'], 67, 46, "NOW() - INTERVAL '4 months'", null],

    // Renal & Urinary
    ['Chronic Kidney Disease Management', 'Renal & Urinary', 'KDIGO 2024', 'SGLT2 inhibitors now recommended for CKD with or without diabetes', ['CKD','SGLT2','Nephroprotection'], 109, 76, "NOW() - INTERVAL '6 days'", null],
    ['Urinary Tract Infection Treatment Guidelines', 'Renal & Urinary', 'IDSA 2024', 'Nitrofurantoin and trimethoprim remain first-line for uncomplicated UTI', ['UTI','Antibiotics','Resistance'], 78, 54, "NOW() - INTERVAL '2 months'", null],
    ['Acute Kidney Injury Recognition and Care', 'Renal & Urinary', 'KDIGO 2024', 'Serum creatinine rise ≥0.3 mg/dL within 48 h diagnostic; avoid nephrotoxins', ['AKI','Creatinine','Critical Care'], 64, 44, "NOW() - INTERVAL '6 months'", null],

    // Oncology
    ['Colorectal Cancer Screening Updates', 'Oncology', 'ASCO 2024', 'Multi-target stool DNA test now approved as an alternative CRC screening modality', ['CRC','Stool DNA','Screening'], 97, 68, "NOW() - INTERVAL '1 week'", null],
    ['Lung Cancer Treatment Guidelines', 'Oncology', 'NCCN 2024', 'Osimertinib adjuvant therapy for resected EGFR-mutant NSCLC shows 5-year benefit', ['Lung Cancer','EGFR','Osimertinib'], 83, 58, "NOW() - INTERVAL '1 month'", null],
    ['Breast Cancer Treatment Strategies', 'Oncology', 'ASCO/NCCN 2024', 'CDK4/6 inhibitors + endocrine therapy: standard of care for HR+/HER2- metastatic BC', ['Breast Cancer','CDK4/6','Endocrine'], 91, 64, "NOW() - INTERVAL '3 months'", null],

    // Infectious Disease
    ['COVID-19 Treatment Protocol Updates', 'Infectious Disease', 'WHO/NIH 2024', 'Nirmatrelvir-ritonavir remains first-line for high-risk non-hospitalised patients', ['COVID-19','Antivirals','Nirmatrelvir'], 116, 81, "NOW() - INTERVAL '4 days'", null],
    ['Antibiotic Stewardship Guidelines', 'Infectious Disease', 'IDSA 2024', 'Duration optimisation: most community infections respond to 5-day courses', ['Antibiotics','Stewardship','Resistance'], 89, 62, "NOW() - INTERVAL '5 weeks'", null],
    ['Updated STD Management Strategies', 'Infectious Disease', 'CDC 2024', 'Doxycycline post-exposure prophylaxis recommended for MSM with frequent STI risk', ['STD','PEP','Syphilis'], 72, 50, "NOW() - INTERVAL '3 months'", null],

    // Geriatrics
    ['Dementia Care and Management', 'Geriatrics', 'AGS 2024', "Lecanemab approved for early Alzheimer's; routine cognitive screening at 65+", ['Dementia',"Alzheimer's",'Screening'], 94, 66, "NOW() - INTERVAL '8 days'", null],
    ['Fall Prevention in Elderly Patients', 'Geriatrics', 'AGS/BGS 2024', 'Multifactorial interventions (balance training, medication review) reduce falls by 24%', ['Falls','Elderly','Prevention'], 81, 56, "NOW() - INTERVAL '6 weeks'", null],
    ['Polypharmacy Management Guidelines', 'Geriatrics', 'AGS 2024', 'Beers Criteria 2024 updated; deprescribing tools recommended for patients on ≥5 meds', ['Polypharmacy','Deprescribing','Beers'], 69, 48, "NOW() - INTERVAL '4 months'", null],
];

// ── Auto-seed on first startup ────────────────────────────────────────────────
(async () => {
    try {
        // Create table if not yet run via schema.sql (adds file_key column)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS guidelines (
                id               SERIAL PRIMARY KEY,
                title            TEXT NOT NULL,
                specialty        VARCHAR(100) NOT NULL,
                source           VARCHAR(200) DEFAULT '',
                summary          TEXT DEFAULT '',
                tags             TEXT[] DEFAULT '{}',
                bookmark_count   INTEGER DEFAULT 0,
                community_recs   INTEGER DEFAULT 0,
                published_at     TIMESTAMPTZ DEFAULT NOW(),
                created_at       TIMESTAMPTZ DEFAULT NOW(),
                file_key         TEXT DEFAULT NULL
            )
        `);

        // Add file_key column to existing tables that were created before this column existed
        await pool.query(`
            ALTER TABLE guidelines ADD COLUMN IF NOT EXISTS file_key TEXT DEFAULT NULL
        `);

        const { rows } = await pool.query('SELECT COUNT(*) FROM guidelines');
        if (parseInt(rows[0].count) > 0) {
            // Table already seeded — just make sure the ESH guideline has its file_key set
            await pool.query(
                `UPDATE guidelines SET file_key = $1
                 WHERE title = $2 AND file_key IS NULL`,
                ['cardiovascular/esh-hypertension-2023.json',
                 '2023 ESH Guidelines for the Management of Arterial Hypertension']
            );
            return;
        }

        // Build a single multi-row INSERT using interval expressions for dates
        const values = SEEDS.map(
            ([title, specialty, source, summary, tags, bk, cr, pub, fk]) => {
                const fkVal = fk ? `'${fk}'` : 'NULL';
                return `('${title.replace(/'/g, "''")}', '${specialty}', '${source}', '${summary.replace(/'/g, "''")}', ARRAY[${tags.map(t => `'${t.replace(/'/g, "''")}'`).join(',')}], ${bk}, ${cr}, ${pub}, ${fkVal})`;
            }
        ).join(',\n');

        await pool.query(
            `INSERT INTO guidelines (title, specialty, source, summary, tags, bookmark_count, community_recs, published_at, file_key)
             VALUES ${values}`
        );
        console.log(`✓ Guidelines seeded (${SEEDS.length} rows)`);
    } catch (err) {
        console.error('Guidelines seed error:', err.message);
    }
})();

// ── GET /api/guidelines ───────────────────────────────────────────────────────
// Query params:
//   specialty — filter to a single organ-system (omit or 'ALL' for all)
//   q         — ILIKE search on title + summary
//   limit     — max rows (default 200)
router.get('/', async (req, res) => {
    const specialty = req.query.specialty || 'ALL';
    const raw       = (req.query.q || '').trim();
    const limit     = Math.min(parseInt(req.query.limit) || 200, 500);

    const params     = [];
    const conditions = [];

    if (specialty && specialty !== 'ALL') {
        params.push(specialty);
        conditions.push(`specialty = $${params.length}`);
    }

    if (raw) {
        const like = `%${raw.replace(/[%_\\]/g, '\\$&')}%`;
        params.push(like);
        const p = params.length;
        conditions.push(`(title ILIKE $${p} OR summary ILIKE $${p})`);
    }

    params.push(limit);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
        const { rows } = await pool.query(
            `SELECT * FROM guidelines ${where} ORDER BY published_at DESC LIMIT $${params.length}`,
            params
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/guidelines error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── GET /api/guidelines/:id/content ──────────────────────────────────────────
// Returns the full structured content for a single guideline from the file store.
// 404 if the guideline has no file_key; 502 if the file cannot be read.
router.get('/:id/content', async (req, res) => {
    const id = parseInt(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    try {
        const { rows } = await pool.query(
            'SELECT id, title, specialty, source, summary, tags, file_key FROM guidelines WHERE id = $1',
            [id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Guideline not found' });

        const guideline = rows[0];

        if (!guideline.file_key) {
            const generated = generateGuidelineContent(guideline);
            return res.json(generated);
        }

        const content = await getGuidelineContent(guideline.file_key);
        res.json({ ...content, _meta: { id: guideline.id, specialty: guideline.specialty } });
    } catch (err) {
        if (err.code === 'ENOENT') {
            return res.status(404).json({ error: 'Content file not found' });
        }
        console.error('GET /api/guidelines/:id/content error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
