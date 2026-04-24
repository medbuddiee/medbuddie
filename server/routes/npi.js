/**
 * NPI verification via NPPES (National Plan & Provider Enumeration System)
 * Free public API — no key required.
 * Docs: https://npiregistry.cms.hhs.gov/search
 */
const express = require('express');
const router  = express.Router();

// NPPES taxonomy description → MedBuddie specialty label
const TAXONOMY_MAP = {
    'Cardiovascular Disease':               'Cardiology',
    'Cardiac Electrophysiology':            'Cardiology',
    'Cardiology':                           'Cardiology',
    'Interventional Cardiology':            'Cardiology',
    'Dermatology':                          'Dermatology',
    'Dermatologic Surgery':                 'Dermatology',
    'Endocrinology, Diabetes & Metabolism': 'Endocrinology',
    'Endocrinology':                        'Endocrinology',
    'Gastroenterology':                     'Gastroenterology',
    'Colon & Rectal Surgery':              'Gastroenterology',
    'General Practice':                     'General Practice',
    'Family Medicine':                      'General Practice',
    'Family Practice':                      'General Practice',
    'Internal Medicine':                    'Internal Medicine',
    'Geriatric Medicine':                   'Geriatrics',
    'Geriatrics':                           'Geriatrics',
    'Hematology':                           'Hematology',
    'Hematology & Oncology':               'Hematology',
    'Infectious Disease':                   'Infectious Disease',
    'Nephrology':                           'Nephrology',
    'Neurology':                            'Neurology',
    'Neurological Surgery':                 'Neurology',
    'Child Neurology':                      'Neurology',
    'Clinical Neurophysiology':             'Neurology',
    'Obstetrics & Gynecology':             'Obstetrics & Gynecology',
    'Gynecology':                           'Obstetrics & Gynecology',
    'Obstetrics':                           'Obstetrics & Gynecology',
    'Gynecologic Oncology':                'Obstetrics & Gynecology',
    'Medical Oncology':                     'Oncology',
    'Oncology':                             'Oncology',
    'Radiation Oncology':                   'Oncology',
    'Surgical Oncology':                    'Oncology',
    'Ophthalmology':                        'Ophthalmology',
    'Orthopaedic Surgery':                  'Orthopedics',
    'Orthopaedic Surgery of the Spine':    'Orthopedics',
    'Orthopedic Surgery':                   'Orthopedics',
    'Otolaryngology':                       'Otolaryngology',
    'Pediatrics':                           'Pediatrics',
    'Pediatric Medicine':                   'Pediatrics',
    'Psychiatry':                           'Psychiatry',
    'Addiction Psychiatry':                 'Psychiatry',
    'Child & Adolescent Psychiatry':       'Psychiatry',
    'Pulmonary Disease':                    'Pulmonology',
    'Critical Care Medicine':               'Pulmonology',
    'Pulmonology':                          'Pulmonology',
    'Diagnostic Radiology':                 'Radiology',
    'Radiology':                            'Radiology',
    'Interventional Radiology':             'Radiology',
    'Rheumatology':                         'Rheumatology',
    'Surgery':                              'Surgery',
    'General Surgery':                      'Surgery',
    'Thoracic Surgery':                     'Surgery',
    'Urology':                              'Urology',
    'Vascular Surgery':                     'Vascular Surgery',
};

function taxonomyToSpecialty(desc) {
    if (!desc) return null;
    if (TAXONOMY_MAP[desc]) return TAXONOMY_MAP[desc];
    // Partial match fallback
    const lower = desc.toLowerCase();
    for (const [key, val] of Object.entries(TAXONOMY_MAP)) {
        if (lower.includes(key.toLowerCase())) return val;
    }
    return null;
}

/* ── GET /api/npi/verify?npi=XXXXXXXXXX ─────────────────────────────────── */
router.get('/verify', async (req, res) => {
    const { npi } = req.query;

    if (!npi || !/^\d{10}$/.test(npi.trim())) {
        return res.status(400).json({ error: 'NPI must be exactly 10 digits (numbers only)' });
    }

    try {
        const params = new URLSearchParams({ number: npi.trim(), version: '2.1' });
        const apiRes = await fetch(
            `https://npiregistry.cms.hhs.gov/api/?${params.toString()}`,
            { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) }
        );

        if (!apiRes.ok) {
            return res.status(502).json({ error: 'NPPES registry is temporarily unavailable. Please try again.' });
        }

        const data = await apiRes.json();

        if (!data.result_count || !data.results?.length) {
            return res.status(404).json({
                error: 'NPI not found. Please check the number and try again.',
                verified: false,
            });
        }

        const provider = data.results[0];
        const basic    = provider.basic || {};

        // Only accept individual providers (NPI-1), not organisations (NPI-2)
        if (provider.enumeration_type !== 'NPI-1') {
            return res.status(400).json({
                error: 'This NPI belongs to an organisation, not an individual provider.',
                verified: false,
            });
        }

        // Inactive providers
        if (basic.status && basic.status !== 'A') {
            return res.status(400).json({
                error: 'This NPI is deactivated or inactive in the NPPES registry.',
                verified: false,
            });
        }

        // Build name
        const firstName  = (basic.first_name  || '').trim();
        const lastName   = (basic.last_name   || '').trim();
        const middleName = (basic.middle_name || '').trim();
        const credential = (basic.credential  || '').trim();
        const fullName   = [firstName, middleName, lastName].filter(Boolean).join(' ');

        // Map taxonomies → specialties
        const specialties = [];
        const taxonomies  = provider.taxonomies || [];

        // Primary first, then non-primary
        const ordered = [
            ...taxonomies.filter(t => t.primary),
            ...taxonomies.filter(t => !t.primary),
        ];
        for (const tax of ordered) {
            const sp = taxonomyToSpecialty(tax.desc);
            if (sp && !specialties.includes(sp)) specialties.push(sp);
        }

        // Location state from primary practice address
        const locationAddr = (provider.addresses || [])
            .find(a => a.address_purpose === 'LOCATION') || provider.addresses?.[0];
        const state = locationAddr?.state || '';
        const city  = locationAddr?.city  || '';

        return res.json({
            verified:        true,
            npi:             provider.number,
            name:            fullName,
            credential,
            specialties,
            state,
            city,
            enumerationDate: basic.enumeration_date || null,
            taxonomies: ordered.slice(0, 3).map(t => t.desc).filter(Boolean),
        });
    } catch (err) {
        if (err.name === 'TimeoutError') {
            return res.status(504).json({ error: 'NPPES registry timed out. Please try again.' });
        }
        console.error('NPI verify error:', err);
        return res.status(502).json({ error: 'Could not reach NPPES registry. Please try again.' });
    }
});

module.exports = router;
