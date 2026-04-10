const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// ── Seed data ─────────────────────────────────────────────────────────────────
// Inserted once on first startup when the table is empty.
// published_at uses PostgreSQL interval arithmetic so ages are always relative.
const SEEDS = [
    // Cardiovascular
    ['Cardiovascular Diet Tips for Hypertension', 'Cardiovascular', 'AHA/ACC 2024', 'Low-sodium DASH diet reduces systolic BP by 8–14 mmHg in hypertensive adults', ['Hypertension','Diet','Prevention'], 124, 89, "NOW() - INTERVAL '7 days'"],
    ['LDL Cholesterol Management Updates', 'Cardiovascular', 'ACC/AHA 2024', 'Statin initiation thresholds revised for intermediate-risk patients aged 40–75', ['Lipids','Statins','Prevention'], 98, 67, "NOW() - INTERVAL '1 month'"],
    ['Coronary Artery Disease Treatment Strategies', 'Cardiovascular', 'ESC 2023', 'Dual antiplatelet therapy duration re-evaluated based on bleeding risk scoring', ['CAD','Antiplatelet','PCI'], 76, 54, "NOW() - INTERVAL '3 months'"],
    ['Heart Failure with Preserved Ejection Fraction', 'Cardiovascular', 'AHA 2024', 'SGLT2 inhibitors now recommended for HFpEF regardless of diabetes status', ['HFpEF','SGLT2','Heart Failure'], 112, 78, "NOW() - INTERVAL '2 weeks'"],

    // Respiratory
    ['COPD Management Updates', 'Respiratory', 'GOLD 2024', 'Triple inhaler therapy (LABA/LAMA/ICS) shown to reduce exacerbations by 25%', ['COPD','Inhaler','Exacerbations'], 91, 63, "NOW() - INTERVAL '1 week'"],
    ['Asthma Control and Treatment', 'Respiratory', 'GINA 2024', 'Low-dose ICS-formoterol as reliever preferred over SABA for Step 1 and 2', ['Asthma','ICS','GINA'], 84, 58, "NOW() - INTERVAL '5 weeks'"],
    ['Pneumonia Treatment and Antibiotic Use', 'Respiratory', 'IDSA 2024', 'Amoxicillin remains first-line for CAP; fluoroquinolones reserved for high-risk', ['Pneumonia','Antibiotics','CAP'], 67, 45, "NOW() - INTERVAL '6 months'"],
    ['Pulmonary Embolism Diagnosis and Management', 'Respiratory', 'ESC 2024', 'CTPA remains gold standard; risk stratification guides anticoagulation duration', ['PE','Anticoagulation','DVT'], 88, 61, "NOW() - INTERVAL '2 months'"],

    // Endocrine
    ['Type 2 Diabetes HbA1c Targets', 'Endocrine', 'ADA 2024', 'Individualised targets: <7% for most adults, <8% for elderly/high-risk patients', ['Diabetes','HbA1c','Glycaemia'], 103, 74, "NOW() - INTERVAL '3 days'"],
    ['Thyroid Disorder Management Guidelines', 'Endocrine', 'ATA 2024', 'Subclinical hypothyroidism treatment now stratified by TSH level and symptoms', ['Thyroid','Hypothyroidism','TSH'], 79, 52, "NOW() - INTERVAL '6 weeks'"],
    ['Insulin Therapy Optimisation Protocols', 'Endocrine', 'EASD 2024', 'Basal-bolus initiation criteria and titration algorithms updated for T2DM', ['Insulin','T2DM','Titration'], 65, 43, "NOW() - INTERVAL '4 months'"],
    ['Obesity Pharmacotherapy Guidelines', 'Endocrine', 'AACE 2024', 'GLP-1 agonists recommended as first-line pharmacotherapy for BMI ≥30', ['Obesity','GLP-1','BMI'], 134, 96, "NOW() - INTERVAL '10 days'"],

    // Gastrointestinal
    ['GERD and Acid Reflux Management', 'Gastrointestinal', 'ACG 2024', 'PPI step-down therapy recommended after 8 weeks; on-demand dosing for mild GERD', ['GERD','PPI','Reflux'], 87, 60, "NOW() - INTERVAL '2 weeks'"],
    ['Ulcerative Colitis Treatment Updates', 'Gastrointestinal', 'ACG/CCF 2024', 'Upadacitinib approved for moderate-to-severe UC after biologic failure', ['IBD','Ulcerative Colitis','Biologics'], 73, 50, "NOW() - INTERVAL '1 month'"],
    ['GI Bleeding Diagnosis and Treatment', 'Gastrointestinal', 'BSG 2024', 'Pre-endoscopic risk scoring (Glasgow-Blatchford) guides outpatient vs inpatient triage', ['GI Bleed','Endoscopy','Risk Score'], 59, 40, "NOW() - INTERVAL '5 months'"],
    ['Colorectal Cancer Screening Protocols', 'Gastrointestinal', 'USPSTF 2024', 'Screening initiation lowered to age 45 for average-risk adults', ['CRC Screening','Colonoscopy','Prevention'], 118, 82, "NOW() - INTERVAL '4 days'"],

    // Neurology
    ['Stroke Treatment Guidelines', 'Neurology', 'AHA/ASA 2024', 'IV alteplase window extended to 4.5 h; tenecteplase now an alternative thrombolytic', ['Stroke','Thrombolysis','tPA'], 96, 68, "NOW() - INTERVAL '1 week'"],
    ['Migraine Management Strategies', 'Neurology', 'AHS 2024', 'CGRP monoclonal antibodies recommended for episodic migraine prevention', ['Migraine','CGRP','Prevention'], 82, 57, "NOW() - INTERVAL '3 weeks'"],
    ['Updated Epilepsy Treatment Protocols', 'Neurology', 'ILAE 2024', 'Brivaracetam added as first-line option for focal seizures in adults', ['Epilepsy','Seizures','AED'], 61, 42, "NOW() - INTERVAL '2 months'"],
    ['Parkinson Disease Management 2024', 'Neurology', 'MDS 2024', 'Levodopa remains gold standard; MAO-B inhibitors for neuroprotection in early disease', ['Parkinson','Levodopa','Neuroprotection'], 74, 51, "NOW() - INTERVAL '5 months'"],

    // Musculoskeletal
    ['Osteoporosis Prevention and Treatment', 'Musculoskeletal', 'NOF 2024', 'FRAX score ≥20% for major fracture: pharmacotherapy recommended regardless of BMD', ['Osteoporosis','FRAX','Bisphosphonates'], 88, 61, "NOW() - INTERVAL '5 days'"],
    ['Rheumatoid Arthritis Management', 'Musculoskeletal', 'ACR 2024', 'Treat-to-target with DAS28 <2.6; JAK inhibitors after inadequate DMARD response', ['RA','DMARDs','JAK Inhibitors'], 75, 52, "NOW() - INTERVAL '3 weeks'"],
    ['Lower Back Pain Clinical Guidelines', 'Musculoskeletal', 'ACP 2024', 'Non-pharmacological therapy (exercise, CBT) preferred for chronic LBP first-line', ['Back Pain','Physiotherapy','CBT'], 67, 46, "NOW() - INTERVAL '4 months'"],

    // Renal & Urinary
    ['Chronic Kidney Disease Management', 'Renal & Urinary', 'KDIGO 2024', 'SGLT2 inhibitors now recommended for CKD with or without diabetes', ['CKD','SGLT2','Nephroprotection'], 109, 76, "NOW() - INTERVAL '6 days'"],
    ['Urinary Tract Infection Treatment Guidelines', 'Renal & Urinary', 'IDSA 2024', 'Nitrofurantoin and trimethoprim remain first-line for uncomplicated UTI', ['UTI','Antibiotics','Resistance'], 78, 54, "NOW() - INTERVAL '2 months'"],
    ['Acute Kidney Injury Recognition and Care', 'Renal & Urinary', 'KDIGO 2024', 'Serum creatinine rise ≥0.3 mg/dL within 48 h diagnostic; avoid nephrotoxins', ['AKI','Creatinine','Critical Care'], 64, 44, "NOW() - INTERVAL '6 months'"],

    // Oncology
    ['Colorectal Cancer Screening Updates', 'Oncology', 'ASCO 2024', 'Multi-target stool DNA test now approved as an alternative CRC screening modality', ['CRC','Stool DNA','Screening'], 97, 68, "NOW() - INTERVAL '1 week'"],
    ['Lung Cancer Treatment Guidelines', 'Oncology', 'NCCN 2024', 'Osimertinib adjuvant therapy for resected EGFR-mutant NSCLC shows 5-year benefit', ['Lung Cancer','EGFR','Osimertinib'], 83, 58, "NOW() - INTERVAL '1 month'"],
    ['Breast Cancer Treatment Strategies', 'Oncology', 'ASCO/NCCN 2024', 'CDK4/6 inhibitors + endocrine therapy: standard of care for HR+/HER2- metastatic BC', ['Breast Cancer','CDK4/6','Endocrine'], 91, 64, "NOW() - INTERVAL '3 months'"],

    // Infectious Disease
    ['COVID-19 Treatment Protocol Updates', 'Infectious Disease', 'WHO/NIH 2024', 'Nirmatrelvir-ritonavir remains first-line for high-risk non-hospitalised patients', ['COVID-19','Antivirals','Nirmatrelvir'], 116, 81, "NOW() - INTERVAL '4 days'"],
    ['Antibiotic Stewardship Guidelines', 'Infectious Disease', 'IDSA 2024', 'Duration optimisation: most community infections respond to 5-day courses', ['Antibiotics','Stewardship','Resistance'], 89, 62, "NOW() - INTERVAL '5 weeks'"],
    ['Updated STD Management Strategies', 'Infectious Disease', 'CDC 2024', 'Doxycycline post-exposure prophylaxis recommended for MSM with frequent STI risk', ['STD','PEP','Syphilis'], 72, 50, "NOW() - INTERVAL '3 months'"],

    // Geriatrics
    ['Dementia Care and Management', 'Geriatrics', 'AGS 2024', 'Lecanemab approved for early Alzheimer\'s; routine cognitive screening at 65+', ['Dementia','Alzheimer\'s','Screening'], 94, 66, "NOW() - INTERVAL '8 days'"],
    ['Fall Prevention in Elderly Patients', 'Geriatrics', 'AGS/BGS 2024', 'Multifactorial interventions (balance training, medication review) reduce falls by 24%', ['Falls','Elderly','Prevention'], 81, 56, "NOW() - INTERVAL '6 weeks'"],
    ['Polypharmacy Management Guidelines', 'Geriatrics', 'AGS 2024', 'Beers Criteria 2024 updated; deprescribing tools recommended for patients on ≥5 meds', ['Polypharmacy','Deprescribing','Beers'], 69, 48, "NOW() - INTERVAL '4 months'"],
];

// ── Auto-seed on first startup ────────────────────────────────────────────────
(async () => {
    try {
        // Create table if not yet run via schema.sql
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
                created_at       TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        const { rows } = await pool.query('SELECT COUNT(*) FROM guidelines');
        if (parseInt(rows[0].count) > 0) return; // already seeded

        // Build a single multi-row INSERT using interval expressions for dates
        const values = SEEDS.map(
            ([title, specialty, source, summary, tags, bk, cr, pub]) =>
                `('${title.replace(/'/g, "''")}', '${specialty}', '${source}', '${summary.replace(/'/g, "''")}', ARRAY[${tags.map(t => `'${t}'`).join(',')}], ${bk}, ${cr}, ${pub})`
        ).join(',\n');

        await pool.query(
            `INSERT INTO guidelines (title, specialty, source, summary, tags, bookmark_count, community_recs, published_at)
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

module.exports = router;
