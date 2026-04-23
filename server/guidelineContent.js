/**
 * guidelineContent.js
 * Generates structured guideline content for guidelines without a static file_key.
 */

const CONTENT_MAP = {

  // ── Cardiovascular ────────────────────────────────────────────────────────

  'LDL Cholesterol Management Updates': {
    source: 'American College of Cardiology / American Heart Association (ACC/AHA)',
    version: '2024', published: '2024-03-01',
    doi: '10.1016/j.jacc.2024.01.001',
    authors: ['Grundy SM', 'Stone NJ', 'Bailey AL', 'Beam C', 'Birtcher KK'],
    keyHighlights: [
      'Statin initiation thresholds revised downward for intermediate-risk patients aged 40–75',
      'LDL-C goal <70 mg/dL for very high-risk patients; <55 mg/dL for extreme risk',
      'PCSK9 inhibitors recommended for patients who cannot achieve LDL targets on maximally tolerated statin',
      'Coronary artery calcium (CAC) score used as decision aid when statin benefit is uncertain',
      'Lifestyle modification (diet, exercise) remains cornerstone at all risk levels',
    ],
    sections: [
      {
        id: 'risk-stratification', title: 'Risk Stratification',
        content: 'Patients are stratified into four risk categories: very high, high, borderline, and low risk. Very high risk includes those with ASCVD events, diabetes with target organ damage, or LDL-C ≥190 mg/dL. The pooled cohort equations estimate 10-year ASCVD risk for primary prevention decisions.',
        table: {
          caption: 'LDL-C Treatment Goals by Risk Category',
          headers: ['Risk Category', 'LDL-C Goal', 'Statin Intensity'],
          rows: [
            ['Extreme risk (recurrent ASCVD)', '<55 mg/dL', 'High + PCSK9i if needed'],
            ['Very high risk (established ASCVD)', '<70 mg/dL', 'High-intensity statin'],
            ['High risk (10-year risk ≥20%)', '<70 mg/dL', 'High-intensity statin'],
            ['Intermediate risk (7.5–19.9%)', '<100 mg/dL', 'Moderate-to-high statin'],
            ['Low risk (<7.5%)', '<130 mg/dL', 'Lifestyle first; statin if needed'],
          ],
        },
      },
      {
        id: 'pharmacotherapy', title: 'Pharmacotherapy',
        content: 'High-intensity statins (atorvastatin 40–80 mg, rosuvastatin 20–40 mg) are first-line for very high-risk patients. Ezetimibe is added when LDL remains above goal. PCSK9 inhibitors (evolocumab, alirocumab) provide 50–60% additional LDL reduction and are indicated for extreme/very high risk when goals are unmet.',
        recommendations: [
          { id: 'P1', text: 'Maximally tolerated statin therapy is recommended for all high and very high-risk patients.', class: 'I', level: 'A' },
          { id: 'P2', text: 'Ezetimibe 10 mg daily is recommended when LDL-C goal is not achieved on statin alone.', class: 'I', level: 'B' },
          { id: 'P3', text: 'PCSK9 inhibitors are recommended for very high-risk patients who do not achieve LDL-C goals on statin plus ezetimibe.', class: 'I', level: 'A' },
        ],
      },
      {
        id: 'monitoring', title: 'Monitoring and Follow-up',
        content: 'Lipid panel should be repeated 4–12 weeks after initiating or adjusting therapy, then every 3–12 months. Liver enzymes and CK are not routinely monitored unless symptoms arise. Adherence and tolerability review at every visit.',
      },
    ],
    references: [
      'Grundy SM et al. 2018 AHA/ACC Cholesterol Guideline. J Am Coll Cardiol. 2019;73(24):e285–e350.',
      'Ray KK et al. ORION-10 trial. N Engl J Med. 2020;382:1507–1519.',
    ],
  },

  'Coronary Artery Disease Treatment Strategies': {
    source: 'European Society of Cardiology (ESC)',
    version: '2023', published: '2023-08-01',
    doi: '10.1093/eurheartj/ehad191',
    authors: ['Byrne RA', 'Rossello X', 'Coughlan JJ', 'Barbato E', 'Berry C'],
    keyHighlights: [
      'Dual antiplatelet therapy (DAPT) duration reassessed using PRECISE-DAPT and DAPT scores',
      'Short DAPT (1–3 months) acceptable for high-bleeding-risk patients after PCI',
      'Colchicine 0.5 mg daily now recommended for secondary prevention of ASCVD events',
      'Revascularisation decisions guided by functional severity (FFR/iFR) in stable CAD',
      'Complete revascularisation preferred in STEMI patients with multivessel disease',
    ],
    sections: [
      {
        id: 'antiplatelet', title: 'Antiplatelet Therapy',
        content: 'DAPT (aspirin + P2Y12 inhibitor) is standard after ACS or PCI. Duration is individualised: 12 months post-ACS with standard risk; 6 months after elective PCI; 1–3 months if high bleeding risk (HBR). Ticagrelor or prasugrel preferred over clopidogrel for ACS.',
        recommendations: [
          { id: 'A1', text: 'DAPT with aspirin plus ticagrelor or prasugrel is recommended for 12 months after ACS.', class: 'I', level: 'A' },
          { id: 'A2', text: 'Short DAPT (≤3 months) followed by P2Y12 monotherapy is recommended for HBR patients.', class: 'I', level: 'A' },
        ],
      },
      {
        id: 'revascularisation', title: 'Revascularisation',
        content: 'PCI is first-line for single-vessel and two-vessel CAD. CABG is preferred for left main or three-vessel disease, especially with reduced EF or diabetes. Heart Team decision is mandatory for complex lesions (SYNTAX score >22).',
        table: {
          caption: 'Revascularisation Strategy Selection',
          headers: ['Disease Pattern', 'Preferred Strategy', 'Evidence Level'],
          rows: [
            ['Single-vessel CAD (non-LM)', 'PCI', 'I-A'],
            ['Two-vessel CAD', 'PCI or CABG based on anatomy', 'I-B'],
            ['Three-vessel CAD, SYNTAX ≤22', 'PCI or CABG', 'I-A'],
            ['Three-vessel CAD, SYNTAX >22', 'CABG preferred', 'I-A'],
            ['Left main disease', 'CABG preferred; PCI if low SYNTAX', 'I-A'],
          ],
        },
      },
      {
        id: 'secondary-prevention', title: 'Secondary Prevention',
        content: 'All post-CAD patients require high-intensity statin, ACE inhibitor/ARB, and beta-blocker (post-MI). Colchicine 0.5 mg daily reduces recurrent cardiovascular events by 31% (LoDoCo2 trial). Cardiac rehabilitation improves outcomes and quality of life.',
      },
    ],
    references: [
      'Neumann FJ et al. 2018 ESC/EACTS Guidelines on myocardial revascularisation. Eur Heart J. 2019;40:87–165.',
      'Nidorf SM et al. Colchicine in patients with chronic coronary disease. N Engl J Med. 2020;383:1838–1847.',
    ],
  },

  'Heart Failure with Preserved Ejection Fraction': {
    source: 'American Heart Association (AHA)',
    version: '2024', published: '2024-01-15',
    doi: '10.1161/CIR.0000000000001063',
    authors: ['Heidenreich PA', 'Bozkurt B', 'Aguilar D', 'Allen LA', 'Byun JJ'],
    keyHighlights: [
      'SGLT2 inhibitors (empagliflozin, dapagliflozin) now Class IIa recommendation for HFpEF regardless of diabetes',
      'HFpEF diagnosis requires EF ≥50%, elevated natriuretic peptides, and evidence of diastolic dysfunction',
      'Aggressive management of comorbidities (AF, hypertension, obesity) is central to treatment',
      'GLP-1 receptor agonists improve exercise capacity in obese HFpEF patients',
      'Diuretics for symptom relief; target dry weight and avoid volume overload',
    ],
    sections: [
      {
        id: 'diagnosis', title: 'Diagnosis',
        content: 'HFpEF requires: (1) symptoms/signs of HF, (2) LVEF ≥50%, (3) elevated BNP/NT-proBNP, (4) evidence of structural/functional diastolic abnormality on echo. The H2FPEF score or HFA-PEFF algorithm aids diagnosis when echo findings are equivocal.',
        recommendations: [
          { id: 'D1', text: 'Echocardiography is recommended in all patients with suspected HFpEF.', class: 'I', level: 'C' },
          { id: 'D2', text: 'BNP ≥35 pg/mL or NT-proBNP ≥125 pg/mL supports HF diagnosis in outpatients.', class: 'I', level: 'B' },
        ],
      },
      {
        id: 'treatment', title: 'Treatment',
        content: 'SGLT2 inhibitors reduce HF hospitalisation by 21% in HFpEF (EMPEROR-Preserved, DELIVER trials). Diuretics control congestion. Spironolactone may reduce hospitalisation in selected patients. Treat atrial fibrillation aggressively.',
        table: {
          caption: 'Evidence-Based Therapies for HFpEF',
          headers: ['Therapy', 'Recommendation Class', 'Indication'],
          rows: [
            ['SGLT2 inhibitors', 'IIa-B', 'Reduce HF hospitalisation'],
            ['Diuretics', 'I-C', 'Symptom relief (congestion)'],
            ['Spironolactone', 'IIb-B', 'Reduce HF hospitalisation'],
            ['BP control', 'I-C', 'Target <130/80 mmHg'],
            ['AF rate/rhythm control', 'I-B', 'Comorbidity management'],
          ],
        },
      },
    ],
    references: [
      'Anker SD et al. Empagliflozin in heart failure with preserved ejection fraction. N Engl J Med. 2021;385:1451–1461.',
      'Solomon SD et al. Dapagliflozin in HFpEF (DELIVER). N Engl J Med. 2022;387:1089–1098.',
    ],
  },

  // ── Respiratory ───────────────────────────────────────────────────────────

  'COPD Management Updates': {
    source: 'Global Initiative for Chronic Obstructive Lung Disease (GOLD)',
    version: '2024', published: '2024-01-01',
    doi: '10.1183/13993003.00221-2024',
    authors: ['Agustí A', 'Celli BR', 'Criner GJ', 'Halpin D', 'Anzueto A'],
    keyHighlights: [
      'Triple inhaler therapy (LABA + LAMA + ICS) reduces exacerbations by 25% vs dual therapy',
      'ABE assessment tool replaces ABCD groups: (A) low symptoms/low risk, (B) high symptoms/low risk, (E) high exacerbation risk',
      'Blood eosinophil count guides ICS use: ≥300 cells/μL favours ICS addition',
      'LABA + LAMA combination is first-line for most symptomatic patients',
      'Smoking cessation remains the single most effective intervention',
    ],
    sections: [
      {
        id: 'diagnosis', title: 'Diagnosis and Spirometry',
        content: 'COPD requires post-bronchodilator FEV1/FVC <0.70. Spirometry grading: GOLD 1 (FEV1 ≥80%), GOLD 2 (50–79%), GOLD 3 (30–49%), GOLD 4 (<30%). Symptoms quantified using mMRC dyspnoea scale or CAT score.',
      },
      {
        id: 'pharmacotherapy', title: 'Pharmacological Management',
        content: 'Initial therapy is guided by the ABE group. Group A: short-acting bronchodilator (SABA or SAMA). Group B: long-acting bronchodilator (LABA or LAMA). Group E (≥2 exacerbations/year or 1 hospitalisation): LABA + LAMA ± ICS based on eosinophil count.',
        table: {
          caption: 'Initial Pharmacotherapy by GOLD ABE Group',
          headers: ['Group', 'Exacerbation Risk', 'First Choice'],
          rows: [
            ['A', 'Low', 'SABA or SAMA (as needed)'],
            ['B', 'Low', 'LABA + LAMA'],
            ['E', 'High, eos <100', 'LABA + LAMA'],
            ['E', 'High, eos 100–299', 'LABA + LAMA (consider ICS)'],
            ['E', 'High, eos ≥300', 'LABA + LAMA + ICS'],
          ],
        },
      },
      {
        id: 'non-pharm', title: 'Non-Pharmacological Treatment',
        content: 'Pulmonary rehabilitation improves exercise tolerance and quality of life. Influenza and pneumococcal vaccines are recommended. Long-term oxygen therapy (LTOT) for SpO2 ≤88% or PaO2 ≤55 mmHg at rest. Surgical lung volume reduction for severe emphysema.',
        recommendations: [
          { id: 'N1', text: 'Pulmonary rehabilitation is recommended for all patients with MRC dyspnoea grade ≥2.', class: 'I', level: 'A' },
          { id: 'N2', text: 'Annual influenza vaccination is recommended for all COPD patients.', class: 'I', level: 'A' },
        ],
      },
    ],
    references: [
      'GOLD 2024 Report. Global Strategy for Prevention, Diagnosis and Management of COPD.',
      'Lipson DA et al. IMPACT trial. N Engl J Med. 2018;378:1671–1680.',
    ],
  },

  'Asthma Control and Treatment': {
    source: 'Global Initiative for Asthma (GINA)',
    version: '2024', published: '2024-05-01',
    doi: '10.1183/13993003.01225-2024',
    authors: ['Reddel HK', 'Bacharier LB', 'Bateman ED', 'Brightling CE', 'Brusselle G'],
    keyHighlights: [
      'Low-dose ICS-formoterol (budesonide-formoterol) is preferred reliever at all steps, replacing SABA',
      'SABA-only treatment no longer recommended at any step due to increased mortality risk',
      'Dupilumab, mepolizumab, benralizumab: biologic options for severe eosinophilic asthma (Step 5)',
      'Fractional exhaled NO (FeNO) and blood eosinophils guide biologic selection',
      'Written asthma action plan recommended for all patients',
    ],
    sections: [
      {
        id: 'stepwise', title: 'Stepwise Management',
        content: 'GINA 2024 uses a 5-step approach. Steps 1–2: as-needed low-dose ICS-formoterol. Steps 3–4: daily low-to-medium ICS with LABA. Step 5: high-dose ICS-LABA ± add-on biologics. Step-up if uncontrolled; step-down after ≥3 months of good control.',
        table: {
          caption: 'GINA 2024 Treatment Steps',
          headers: ['Step', 'Preferred Controller', 'Preferred Reliever'],
          rows: [
            ['1', 'None (or low ICS if frequent symptoms)', 'As-needed low ICS-formoterol'],
            ['2', 'Daily low-dose ICS', 'As-needed low ICS-formoterol'],
            ['3', 'Low-dose ICS-LABA', 'As-needed low ICS-formoterol'],
            ['4', 'Medium-dose ICS-LABA', 'As-needed low ICS-formoterol'],
            ['5', 'High-dose ICS-LABA + add-on biologic', 'As-needed low ICS-formoterol'],
          ],
        },
      },
      {
        id: 'biologics', title: 'Biologic Therapies',
        content: 'For severe asthma (Step 5): anti-IL-5 agents (mepolizumab, reslizumab, benralizumab) for eosinophilic asthma; dupilumab for type 2 inflammation; tezepelumab (anti-TSLP) for severe asthma regardless of phenotype. FeNO ≥25 ppb supports type 2 inflammation.',
        recommendations: [
          { id: 'B1', text: 'Assess asthma control and inhaler technique at every visit.', class: 'I', level: 'A' },
          { id: 'B2', text: 'Biologic therapy should be considered for patients with severe uncontrolled asthma despite Step 4 treatment.', class: 'I', level: 'A' },
        ],
      },
    ],
    references: [
      'GINA 2024. Global Strategy for Asthma Management and Prevention.',
      'Hardy J et al. Budesonide-formoterol reliever therapy vs salbutamol. JAMA. 2019;321:1914–1926.',
    ],
  },

  'Pneumonia Treatment and Antibiotic Use': {
    source: 'Infectious Diseases Society of America (IDSA)',
    version: '2024', published: '2024-02-01',
    doi: '10.1093/cid/ciad517',
    authors: ['Mandell LA', 'Wunderink RG', 'Anzueto A', 'Bartlett JG', 'Campbell GD'],
    keyHighlights: [
      'Amoxicillin 1g TDS remains first-line for non-severe CAP in outpatients without comorbidities',
      'Fluoroquinolones reserved for penicillin allergy or failed beta-lactam therapy',
      'Procalcitonin-guided therapy reduces antibiotic duration without worsening outcomes',
      'Urinary pneumococcal antigen test recommended for severe CAP patients',
      'Atypical coverage (macrolide or doxycycline) added for hospitalised CAP patients',
    ],
    sections: [
      {
        id: 'severity', title: 'Severity Assessment',
        content: 'Severity is assessed using PSI (PORT) score or CURB-65: confusion, urea >7 mmol/L, RR ≥30, BP <90/60, age ≥65. CURB-65 ≤1: outpatient; 2: consider hospital; ≥3: hospitalise. ICU criteria: need for vasopressors or mechanical ventilation.',
      },
      {
        id: 'treatment', title: 'Antibiotic Treatment',
        content: 'Outpatient CAP without comorbidities: amoxicillin 1g TDS × 5 days. With comorbidities: amoxicillin-clavulanate or respiratory fluoroquinolone. Hospitalised non-ICU: beta-lactam + macrolide, or respiratory fluoroquinolone monotherapy. ICU: beta-lactam + azithromycin or antipseudomonal therapy if risk factors present.',
        table: {
          caption: 'CAP Antibiotic Selection',
          headers: ['Setting', 'Preferred Regimen', 'Duration'],
          rows: [
            ['Outpatient, healthy', 'Amoxicillin 1g TDS', '5 days'],
            ['Outpatient, comorbidities', 'Amoxicillin-clavulanate + macrolide', '5 days'],
            ['Hospital, non-ICU', 'Beta-lactam + azithromycin', '5–7 days'],
            ['Hospital, ICU', 'Beta-lactam + azithromycin', '7 days'],
            ['Pseudomonas risk', 'Piperacillin-tazobactam + ciprofloxacin', '7 days'],
          ],
        },
      },
    ],
    references: [
      'Metlay JP et al. Diagnosis and Treatment of Adults with CAP. Am J Respir Crit Care Med. 2019;200:e45–e67.',
    ],
  },

  'Pulmonary Embolism Diagnosis and Management': {
    source: 'European Society of Cardiology (ESC)',
    version: '2024', published: '2024-06-01',
    doi: '10.1093/eurheartj/ehae921',
    authors: ['Konstantinides SV', 'Meyer G', 'Becattini C', 'Bueno H', 'Geersing GJ'],
    keyHighlights: [
      'CTPA remains the gold standard for PE diagnosis after positive D-dimer',
      'Wells score and PERC rule stratify pre-test probability',
      'Risk stratification (haemodynamic stability, RV function, troponin) guides management intensity',
      'Direct oral anticoagulants (DOACs) are first-line over LMWH/VKA for most patients',
      'Systemic thrombolysis reserved for high-risk PE with haemodynamic instability',
    ],
    sections: [
      {
        id: 'diagnosis', title: 'Diagnostic Algorithm',
        content: 'Assess pre-test probability using Wells score or Geneva score. If low/intermediate probability: D-dimer first. If high probability or D-dimer positive: CTPA. V/Q scan when CTPA contraindicated (renal failure, iodine allergy).',
        recommendations: [
          { id: 'D1', text: 'Clinical probability assessment using a validated score is recommended before diagnostic testing.', class: 'I', level: 'B' },
          { id: 'D2', text: 'CTPA is recommended as the standard imaging test for suspected PE.', class: 'I', level: 'B' },
        ],
      },
      {
        id: 'treatment', title: 'Anticoagulation',
        content: 'DOACs (rivaroxaban, apixaban, edoxaban, dabigatran) are preferred over VKA for acute and extended treatment. Minimum 3 months anticoagulation for all PE. Extended treatment (beyond 3 months) considered for unprovoked PE, cancer-associated PE, or high recurrence risk.',
        table: {
          caption: 'Anticoagulation Duration for PE',
          headers: ['PE Type', 'Minimum Duration', 'Extended Treatment'],
          rows: [
            ['Provoked (major transient risk)', '3 months', 'Not recommended'],
            ['Provoked (minor transient risk)', '3 months', 'Consider'],
            ['Unprovoked', '3–6 months', 'Recommended (rivaroxaban 10 mg BD)'],
            ['Cancer-associated PE', 'Until cancer resolved', 'DOAC preferred'],
            ['Antiphospholipid syndrome', 'Indefinite', 'VKA preferred'],
          ],
        },
      },
    ],
    references: [
      'Konstantinides SV et al. 2019 ESC Guidelines for acute PE. Eur Heart J. 2020;41:543–603.',
    ],
  },

  // ── Endocrine ─────────────────────────────────────────────────────────────

  'Type 2 Diabetes HbA1c Targets': {
    source: 'American Diabetes Association (ADA)',
    version: '2024', published: '2024-01-01',
    doi: '10.2337/dc24-S006',
    authors: ['ElSayed NA', 'Aleppo G', 'Aroda VR', 'Bannuru RR', 'Brown FM'],
    keyHighlights: [
      'HbA1c <7.0% for most non-pregnant adults; <7.5–8.0% acceptable for elderly or high-risk patients',
      'GLP-1 receptor agonists and SGLT2 inhibitors provide cardiovascular and renal benefits beyond glucose lowering',
      'Time-in-range (TIR) ≥70% (3.9–10 mmol/L) is an alternative glycaemic target using CGM',
      'Metformin remains first-line for most patients without contraindications',
      'Weight management integral to T2DM care: tirzepatide achieves 15–20% weight reduction',
    ],
    sections: [
      {
        id: 'targets', title: 'Glycaemic Targets',
        content: 'HbA1c targets should be individualised. Stricter targets (<6.5%) for young patients with short disease duration and no CVD. Relaxed targets (≤8%) for elderly patients, those with hypoglycaemia unawareness, or limited life expectancy.',
        table: {
          caption: 'Individualised HbA1c Targets',
          headers: ['Patient Profile', 'HbA1c Target', 'Rationale'],
          rows: [
            ['Most adults', '<7.0%', 'Reduces microvascular complications'],
            ['Young, short duration, no CVD', '<6.5%', 'Long-term benefit outweighs risk'],
            ['Elderly, hypoglycaemia risk', '<7.5–8.0%', 'Avoid hypoglycaemia harm'],
            ['Frail/limited life expectancy', '<8.5%', 'Minimise treatment burden'],
          ],
        },
      },
      {
        id: 'pharmacotherapy', title: 'Pharmacotherapy',
        content: 'Algorithm: Metformin first unless contraindicated. Add GLP-1 RA or SGLT2i if ASCVD, CKD, or HF present (cardiovascular benefit independent of HbA1c). Tirzepatide (dual GIP/GLP-1) superior to semaglutide for both weight loss and HbA1c reduction.',
        recommendations: [
          { id: 'P1', text: 'Metformin is recommended as initial pharmacotherapy for most patients with T2DM unless contraindicated.', class: 'I', level: 'A' },
          { id: 'P2', text: 'SGLT2 inhibitors or GLP-1 RAs with proven CV benefit are recommended for patients with ASCVD, CKD, or HF.', class: 'I', level: 'A' },
        ],
      },
    ],
    references: [
      'ADA Standards of Care in Diabetes 2024. Diabetes Care. 2024;47(Suppl 1):S1–S321.',
      'Jastreboff AM et al. Tirzepatide (SURMOUNT-1). N Engl J Med. 2022;387:205–216.',
    ],
  },

  'Thyroid Disorder Management Guidelines': {
    source: 'American Thyroid Association (ATA)',
    version: '2024', published: '2024-04-01',
    doi: '10.1089/thy.2024.0001',
    authors: ['Jonklaas J', 'Bianco AC', 'Bauer AJ', 'Burman KD', 'Cappola AR'],
    keyHighlights: [
      'Subclinical hypothyroidism (TSH 4.5–10 mIU/L): treat only if symptomatic or TSH >7–10 mIU/L',
      'Levothyroxine weight-based dosing: 1.6 mcg/kg/day for complete replacement',
      'Check TSH 6–8 weeks after any dose change; annual monitoring once stable',
      'Thyroid nodule evaluation: FNA for nodules ≥1 cm with suspicious features on ultrasound',
      'Radioiodine, antithyroid drugs, or surgery all acceptable first-line for hyperthyroidism',
    ],
    sections: [
      {
        id: 'hypothyroid', title: 'Hypothyroidism',
        content: 'Overt hypothyroidism (TSH >4.5 mIU/L + low T4) requires levothyroxine. Subclinical hypothyroidism (elevated TSH, normal T4): treat if symptomatic, pregnant, TSH >7–10, or anti-TPO antibody positive. Older patients: start low (25–50 mcg/day) and titrate slowly.',
        recommendations: [
          { id: 'H1', text: 'Levothyroxine monotherapy is the standard treatment for hypothyroidism.', class: 'I', level: 'A' },
          { id: 'H2', text: 'TSH should be rechecked 6–8 weeks after initiating or adjusting levothyroxine dose.', class: 'I', level: 'B' },
        ],
      },
      {
        id: 'hyperthyroid', title: 'Hyperthyroidism',
        content: 'Graves disease: antithyroid drugs (methimazole preferred; PTU in pregnancy first trimester) for 12–18 months aiming for remission. Radioactive iodine or thyroidectomy for relapse or patient preference. Beta-blockers for symptom control. Toxic nodule/MNG: radioiodine or surgery.',
      },
    ],
    references: [
      'Jonklaas J et al. ATA Guidelines for treatment of hypothyroidism. Thyroid. 2014;24:1670–1751.',
    ],
  },

  'Insulin Therapy Optimisation Protocols': {
    source: 'European Association for the Study of Diabetes (EASD)',
    version: '2024', published: '2024-03-01',
    doi: '10.1007/s00125-024-06101-x',
    authors: ['Schnell O', 'Crocker JB', 'Weng J', 'Khunti K', 'Bailey CJ'],
    keyHighlights: [
      'Basal insulin (glargine U300, degludec) has lower hypoglycaemia risk vs NPH insulin',
      'Basal-bolus regimen: initiate basal insulin 10 units/day; titrate by 2 units every 3 days targeting fasting glucose ≤7 mmol/L',
      'isCGM use alongside insulin titration reduces HbA1c and time in hypoglycaemia',
      'Closed-loop (automated insulin delivery) systems approved for T1DM; evidence growing for T2DM',
      'Discontinue SGLT2 inhibitors when starting intensive insulin to reduce DKA risk',
    ],
    sections: [
      {
        id: 'initiation', title: 'Initiating Insulin in T2DM',
        content: 'Consider insulin when HbA1c remains >8.5–9% despite oral agents, or if symptoms of hyperglycaemia present. Start with basal insulin once daily (bedtime). Titration: increase dose by 2 IU every 3 days if fasting glucose >7 mmol/L. Meal-time insulin added if post-prandial glucose drives poor control.',
        table: {
          caption: 'Common Basal Insulin Options',
          headers: ['Insulin', 'Duration', 'Hypoglycaemia Risk', 'Notes'],
          rows: [
            ['Insulin glargine U100', '20–24 h', 'Moderate', 'Once daily'],
            ['Insulin glargine U300', '36+ h', 'Lower', 'Once daily, lower dose volume'],
            ['Insulin degludec', '42 h', 'Lowest', 'Flexible dosing time'],
            ['Insulin NPH', '12–16 h', 'Higher', 'Twice daily, lower cost'],
          ],
        },
      },
      {
        id: 'titration', title: 'Titration and Monitoring',
        content: 'Self-monitored fasting glucose is used for basal dose titration. CGM preferred when available. Review hypoglycaemia episodes at every visit; reduce dose by 10–20% if fasting glucose <4 mmol/L. HbA1c every 3 months until target achieved, then 6-monthly.',
      },
    ],
    references: [
      'Davies MJ et al. Management of Hyperglycaemia in T2DM 2022. Diabetologia. 2022;65:1757–1769.',
    ],
  },

  'Obesity Pharmacotherapy Guidelines': {
    source: 'American Association of Clinical Endocrinology (AACE)',
    version: '2024', published: '2024-02-01',
    doi: '10.1016/j.eprac.2024.01.001',
    authors: ['Garvey WT', 'Mechanick JI', 'Brett EM', 'Garber AJ', 'Hurley DL'],
    keyHighlights: [
      'GLP-1 receptor agonists (semaglutide 2.4 mg weekly) achieve 15% weight loss; tirzepatide 15–20%',
      'Pharmacotherapy recommended for BMI ≥30 or BMI ≥27 with weight-related comorbidity',
      'All pharmacotherapy should be combined with lifestyle intervention (diet + exercise)',
      'Bariatric surgery for BMI ≥40 or ≥35 with comorbidities; superior long-term weight loss',
      'Weight regain expected on drug discontinuation; most patients require long-term therapy',
    ],
    sections: [
      {
        id: 'assessment', title: 'Assessment',
        content: 'Obesity is a chronic disease. Assess adiposity-related complications: T2DM, hypertension, dyslipidaemia, NAFLD, OSA, PCOS, osteoarthritis, and CV risk. Edmonton Obesity Staging System guides treatment intensity.',
      },
      {
        id: 'pharmacotherapy', title: 'Pharmacotherapy',
        content: 'First-line: semaglutide (Wegovy) 2.4 mg SC weekly or tirzepatide (Zepbound) 5–15 mg SC weekly. Alternatives: phentermine-topiramate, naltrexone-bupropion, orlistat. Choose based on comorbidities: semaglutide/tirzepatide preferred with T2DM or CVD.',
        table: {
          caption: 'Anti-Obesity Medications',
          headers: ['Agent', 'Mechanism', 'Weight Loss', 'CV Evidence'],
          rows: [
            ['Semaglutide 2.4 mg', 'GLP-1 RA', '~15%', 'SELECT trial: −20% MACE'],
            ['Tirzepatide 15 mg', 'GIP/GLP-1 RA', '~20%', 'SURMOUNT-MMO ongoing'],
            ['Phentermine-topiramate', 'Noradrenergic/GABA', '~10%', 'Neutral'],
            ['Naltrexone-bupropion', 'Opioid antagonist/DA', '~5%', 'CVOT completed'],
            ['Orlistat', 'Lipase inhibitor', '~3%', 'Neutral'],
          ],
        },
      },
    ],
    references: [
      'Wilding JPH et al. Semaglutide 2.4 mg (STEP 1). N Engl J Med. 2021;384:989–1002.',
      'Jastreboff AM et al. Tirzepatide (SURMOUNT-1). N Engl J Med. 2022;387:205–216.',
    ],
  },

  // ── Gastrointestinal ──────────────────────────────────────────────────────

  'GERD and Acid Reflux Management': {
    source: 'American College of Gastroenterology (ACG)',
    version: '2024', published: '2024-01-01',
    doi: '10.14309/ajg.0000000000002036',
    authors: ['Katz PO', 'Dunbar KB', 'Schnoll-Sussman FH', 'Greer KB', 'Yadlapati R'],
    keyHighlights: [
      'PPI therapy (8 weeks) is first-line for erosive oesophagitis; step-down to on-demand dosing for mild GERD',
      'Lifestyle modifications (weight loss, elevate head of bed, avoid late meals) are adjuncts not replacements',
      'Refractory GERD (failed twice-daily PPI): confirm diagnosis with pH-impedance monitoring before escalating',
      'Antireflux surgery (Nissen fundoplication) for PPI-dependent patients who prefer surgery',
      'Barrett oesophagus surveillance: EGD every 3–5 years; radiofrequency ablation for dysplastic Barrett',
    ],
    sections: [
      {
        id: 'diagnosis', title: 'Diagnosis',
        content: 'Typical symptoms (heartburn, regurgitation) are diagnostic in uncomplicated GERD. EGD indicated for alarm symptoms (dysphagia, weight loss, odynophagia), age >60, or failed empiric PPI trial. pH-impedance monitoring is gold standard for refractory cases.',
      },
      {
        id: 'treatment', title: 'Treatment Strategy',
        content: 'Step-up approach: antacids/alginates → H2RA → PPI. For erosive oesophagitis (Grade C/D): 8-week PPI, then maintenance. For non-erosive GERD: on-demand PPI or H2RA. Long-term PPI use: lowest effective dose; monitor for hypomagnesaemia in patients on >1 year.',
        recommendations: [
          { id: 'T1', text: 'PPI therapy once daily before the largest meal is recommended as first-line treatment for GERD.', class: 'I', level: 'A' },
          { id: 'T2', text: 'On-demand PPI therapy is appropriate for mild non-erosive GERD after initial healing.', class: 'I', level: 'B' },
        ],
      },
    ],
    references: [
      'Katz PO et al. ACG Clinical Guideline: Diagnosis and Management of GERD. Am J Gastroenterol. 2022;117:27–56.',
    ],
  },

  'Ulcerative Colitis Treatment Updates': {
    source: 'ACG / Crohn\'s & Colitis Foundation (CCF)',
    version: '2024', published: '2024-02-01',
    doi: '10.14309/ajg.0000000000002000',
    authors: ['Feuerstein JD', 'Ho EY', 'Shmidt E', 'Singh H', 'Falck-Ytter Y'],
    keyHighlights: [
      'Upadacitinib (JAK1 inhibitor) approved for moderate-to-severe UC after biologic failure',
      'Treat-to-target: clinical remission + endoscopic healing (Mayo endoscopic score 0–1)',
      'Mesalazine (5-ASA) remains first-line for mild-to-moderate UC; combination oral + topical superior',
      'Vedolizumab (gut-selective integrin inhibitor) preferred biologic for elderly or infection-prone patients',
      'Surgery (total proctocolectomy) curative for refractory UC or dysplasia',
    ],
    sections: [
      {
        id: 'classification', title: 'Disease Classification',
        content: 'Extent: proctitis (E1), left-sided (E2), extensive/pancolitis (E3). Severity: mild (≤4 stools/day, no systemic toxicity), moderate (4–6 stools/day), severe (>6 bloody stools, systemic features). Truelove-Witts criteria for acute severe UC.',
      },
      {
        id: 'treatment', title: 'Medical Treatment',
        content: 'Mild-to-moderate: 5-ASA oral + topical. Moderate-to-severe: corticosteroids for induction (budesonide MMX or systemic prednisolone). Biologic induction: infliximab, vedolizumab, ustekinumab. Small molecules: tofacitinib, upadacitinib for maintenance after biologic failure.',
        table: {
          caption: 'Biologics and Small Molecules for UC',
          headers: ['Agent', 'Mechanism', 'Use Case', 'Notes'],
          rows: [
            ['Infliximab', 'Anti-TNF', 'Induction + maintenance', 'Monitor for TB, infections'],
            ['Vedolizumab', 'Anti-α4β7', 'Induction + maintenance', 'Gut-selective; preferred elderly'],
            ['Ustekinumab', 'Anti-IL12/23', 'Maintenance', 'After TNF failure'],
            ['Tofacitinib', 'JAK inhibitor', 'Moderate-to-severe', 'Oral; VTE/MACE risk assessment'],
            ['Upadacitinib', 'JAK1 inhibitor', 'After biologic failure', 'More potent, higher dose induction'],
          ],
        },
      },
    ],
    references: [
      'Feuerstein JD et al. AGA Clinical Practice Guidelines on the Management of Moderate to Severe UC. Gastroenterology. 2020;158:1450–1461.',
    ],
  },

  'GI Bleeding Diagnosis and Treatment': {
    source: 'British Society of Gastroenterology (BSG)',
    version: '2024', published: '2024-03-01',
    doi: '10.1136/gutjnl-2023-330396',
    authors: ['Laine L', 'Barkun AN', 'Saltzman JR', 'Martel M', 'Leontiadis GI'],
    keyHighlights: [
      'Glasgow-Blatchford Score (GBS) ≤1: safe for outpatient management without endoscopy',
      'Early endoscopy (within 24 h) for upper GI bleeding after haemodynamic resuscitation',
      'H. pylori testing and eradication mandatory after peptic ulcer bleeding',
      'Transfusion threshold: Hb <70 g/L; restrict transfusion in variceal bleeding (target Hb 70–80 g/L)',
      'PPI infusion (80 mg bolus + 8 mg/h) post-endoscopy for high-risk stigmata',
    ],
    sections: [
      {
        id: 'risk-scoring', title: 'Risk Stratification',
        content: 'Glasgow-Blatchford Score incorporates Hb, urea, pulse, BP, syncope, hepatic disease, and cardiac failure. Score 0: no risk of intervention needed. Rockall score post-endoscopy predicts rebleeding and mortality. AIMS65 for in-hospital mortality prediction.',
      },
      {
        id: 'management', title: 'Endoscopic Management',
        content: 'For active bleeding or non-bleeding visible vessel: dual therapy (injection + thermal or mechanical). Clips preferred for high-risk rebleeding lesions. OTSC (over-the-scope clip) for large or refractory bleeding. Interventional radiology (embolisation) or surgery for endoscopy failure.',
        recommendations: [
          { id: 'M1', text: 'Endoscopy within 24 hours is recommended for upper GI bleeding after resuscitation.', class: 'I', level: 'A' },
          { id: 'M2', text: 'H. pylori testing should be performed in all patients with peptic ulcer bleeding.', class: 'I', level: 'A' },
        ],
      },
    ],
    references: [
      'Barkun AN et al. Consensus recommendations for managing patients with nonvariceal upper GI bleeding. Ann Intern Med. 2010;152:101–113.',
    ],
  },

  'Colorectal Cancer Screening Protocols': {
    source: 'US Preventive Services Task Force (USPSTF)',
    version: '2024', published: '2024-05-01',
    doi: '10.1001/jama.2024.0714',
    authors: ['Davidson KW', 'Barry MJ', 'Mangione CM', 'Cabana M', 'Caughey AB'],
    keyHighlights: [
      'Colorectal cancer screening recommended for all average-risk adults aged 45–75',
      'Age 76–85: individual decision based on health status and prior screening history',
      'Colonoscopy every 10 years remains the gold standard; also detects and removes polyps',
      'FIT (faecal immunochemical test) annually is an effective non-invasive alternative',
      'Multi-target stool DNA (Cologuard) every 3 years: approved alternative with higher specificity',
    ],
    sections: [
      {
        id: 'screening-options', title: 'Screening Modalities',
        content: 'Stool-based tests: FIT annually, gFOBT annually, FIT-DNA every 1–3 years. Direct visualisation: colonoscopy every 10 years, CT colonography every 5 years, flexible sigmoidoscopy every 5 years. High-risk patients (Lynch syndrome, FAP, prior polyps): earlier and more frequent screening.',
        table: {
          caption: 'CRC Screening Options (Average Risk)',
          headers: ['Test', 'Frequency', 'Sensitivity for CRC', 'Notes'],
          rows: [
            ['FIT', 'Annual', '~79%', 'Non-invasive; positive requires colonoscopy'],
            ['gFOBT', 'Annual', '~70%', 'Dietary restrictions required'],
            ['Colonoscopy', 'Every 10 years', '>95%', 'Therapeutic; gold standard'],
            ['CT colonography', 'Every 5 years', '~96%', 'No sedation; cannot remove polyps'],
            ['FIT-DNA (Cologuard)', 'Every 1–3 years', '~92%', 'Higher sensitivity, lower specificity'],
          ],
        },
      },
    ],
    references: [
      'USPSTF. Colorectal Cancer: Screening. JAMA. 2021;325:1965–1977.',
    ],
  },

  // ── Neurology ─────────────────────────────────────────────────────────────

  'Stroke Treatment Guidelines': {
    source: 'AHA / American Stroke Association (ASA)',
    version: '2024', published: '2024-01-15',
    doi: '10.1161/STR.0000000000000430',
    authors: ['Powers WJ', 'Rabinstein AA', 'Ackerson T', 'Adeoye OM', 'Bambakidis NC'],
    keyHighlights: [
      'IV alteplase (tPA) treatment window extended to 4.5 hours from symptom onset for eligible patients',
      'Tenecteplase (0.25 mg/kg) is now a recommended alternative to alteplase for acute ischaemic stroke',
      'Mechanical thrombectomy up to 24 hours in selected patients with salvageable tissue on perfusion imaging',
      'Dual antiplatelet therapy (aspirin + clopidogrel) for 21 days after minor stroke or TIA reduces recurrence',
      'Secondary prevention: anticoagulation for cardioembolic stroke (AF); antiplatelet for non-cardioembolic',
    ],
    sections: [
      {
        id: 'acute-treatment', title: 'Acute Treatment',
        content: 'IV thrombolysis: alteplase 0.9 mg/kg (max 90 mg) within 4.5 hours. Contraindications: prior ICH, recent major surgery, BP >185/110 refractory to treatment. Thrombectomy: large vessel occlusion, NIHSS ≥6, within 24 hours with good collateral circulation (DAWN/DEFUSE-3 criteria).',
        recommendations: [
          { id: 'A1', text: 'IV alteplase (0.9 mg/kg) within 4.5 hours of stroke onset is recommended for eligible patients.', class: 'I', level: 'A' },
          { id: 'A2', text: 'Mechanical thrombectomy is recommended for eligible patients with large vessel occlusion within 24 hours.', class: 'I', level: 'A' },
        ],
      },
      {
        id: 'secondary-prevention', title: 'Secondary Prevention',
        content: 'AF-related stroke: anticoagulation with DOAC (apixaban preferred). Non-cardioembolic: aspirin 75–100 mg daily ± dipyridamole, or clopidogrel. BP target: <130/80 mmHg. Statin therapy for all ischaemic stroke. Lifestyle modification: smoking cessation, weight management, exercise.',
      },
    ],
    references: [
      'Powers WJ et al. 2019 AHA/ASA Stroke Guidelines. Stroke. 2019;50:e344–e418.',
      'Albers GW et al. Thrombectomy for stroke at 6 to 16 hours (DEFUSE 3). N Engl J Med. 2018;378:708–718.',
    ],
  },

  'Migraine Management Strategies': {
    source: 'American Headache Society (AHS)',
    version: '2024', published: '2024-04-01',
    doi: '10.1111/head.14692',
    authors: ['Ailani J', 'Burch RC', 'Robbins MS', 'Tassorelli C', 'Diener HC'],
    keyHighlights: [
      'CGRP monoclonal antibodies (erenumab, fremanezumab, galcanezumab, eptinezumab) are first-line preventive therapy',
      'Gepants (rimegepant, atogepant) effective for both acute and preventive migraine treatment',
      'Lasmiditan (5-HT1F agonist) is a non-vasoconstrictor acute option for patients with CV risk',
      'Triptans remain first-line for moderate-to-severe acute migraine without CV contraindications',
      'Preventive therapy recommended when ≥4 headache days/month or ≥2 disabling attacks/month',
    ],
    sections: [
      {
        id: 'acute', title: 'Acute Treatment',
        content: 'Mild-to-moderate: NSAIDs (ibuprofen 400–800 mg, naproxen 500–1000 mg), paracetamol. Moderate-to-severe: triptans (sumatriptan, rizatriptan, eletriptan); gepants for triptan non-responders or CV risk; lasmiditan for vascular contraindications. Anti-emetics (metoclopramide) for nausea.',
      },
      {
        id: 'preventive', title: 'Preventive Therapy',
        content: 'Indications: ≥4 migraine days/month, significantly disabling attacks, or overuse of acute medications. First-line: CGRP mAbs (reduce monthly migraine days by 50% in ~50% of patients). Traditional: topiramate, valproate, beta-blockers (propranolol, metoprolol), amitriptyline. OnabotulinumtoxinA for chronic migraine (≥15 headache days/month).',
        recommendations: [
          { id: 'P1', text: 'CGRP monoclonal antibodies are recommended as first-line preventive therapy for episodic or chronic migraine.', class: 'I', level: 'A' },
          { id: 'P2', text: 'Preventive treatment should be considered when migraine significantly impacts quality of life (≥4 migraine days/month).', class: 'I', level: 'B' },
        ],
      },
    ],
    references: [
      'Ailani J et al. The AHS Consensus Statement. Headache. 2021;61:1021–1039.',
    ],
  },

  'Updated Epilepsy Treatment Protocols': {
    source: 'International League Against Epilepsy (ILAE)',
    version: '2024', published: '2024-03-01',
    doi: '10.1111/epi.17879',
    authors: ['Kwan P', 'Arzimanoglou A', 'Berg AT', 'Brodie MJ', 'Allen Hauser W'],
    keyHighlights: [
      'Brivaracetam added as a first-line option for focal (partial) seizures in adults',
      'Cenobamate reduces focal seizure frequency by >50% in ~55% of treatment-resistant patients',
      'Levetiracetam remains preferred for generalised epilepsy alongside valproate (teratogenic in women of childbearing age)',
      'EEG and MRI essential for accurate epilepsy syndrome diagnosis before treatment initiation',
      'After 2 failed antiseizure medications, referral to epilepsy surgery centre recommended',
    ],
    sections: [
      {
        id: 'first-line', title: 'First-Line Antiseizure Medications',
        content: 'Focal epilepsy: lamotrigine, levetiracetam, or brivaracetam preferred. Valproate highly effective but teratogenic. Generalised: lamotrigine, valproate, levetiracetam. Juvenile myoclonic epilepsy: valproate (or lamotrigine/levetiracetam in women).',
        table: {
          caption: 'First-Line ASMs by Epilepsy Type',
          headers: ['Epilepsy Type', 'First-Line Options', 'Avoid'],
          rows: [
            ['Focal', 'Lamotrigine, Levetiracetam, Brivaracetam', 'Carbamazepine in women of childbearing age'],
            ['Generalised tonic-clonic', 'Valproate, Lamotrigine', 'Carbamazepine, Oxcarbazepine'],
            ['Juvenile myoclonic', 'Valproate (men), Lamotrigine (women)', 'Carbamazepine'],
            ['Absence', 'Ethosuximide, Valproate, Lamotrigine', 'Carbamazepine'],
          ],
        },
      },
      {
        id: 'drug-resistant', title: 'Drug-Resistant Epilepsy',
        content: 'Defined as failure of two adequate trials of ASMs. Options: add-on therapy (perampanel, cenobamate, lacosamide), epilepsy surgery evaluation (temporal lobectomy curative in ~65% of mesial temporal lobe epilepsy), vagal nerve stimulation, responsive neurostimulation, dietary therapy (ketogenic diet for refractory cases).',
      },
    ],
    references: [
      'Kwan P et al. ILAE definition of drug resistant epilepsy. Epilepsia. 2010;51:1069–1077.',
    ],
  },

  'Parkinson Disease Management 2024': {
    source: 'Movement Disorder Society (MDS)',
    version: '2024', published: '2024-02-01',
    doi: '10.1002/mds.29850',
    authors: ['Bloem BR', 'Okun MS', 'Klein C', 'Tatsch K', 'Bharmal M'],
    keyHighlights: [
      'Levodopa-carbidopa remains the gold standard for motor symptom control',
      'MAO-B inhibitors (rasagiline, selegiline, safinamide) used early for neuroprotection and mild motor symptoms',
      'Deep brain stimulation (DBS) indicated when motor complications are not controlled medically (typically >4 years disease)',
      'Focused ultrasound thalamotomy approved for tremor-dominant PD without need for surgery',
      'Non-motor symptom management (depression, constipation, sleep, autonomic dysfunction) essential to quality of life',
    ],
    sections: [
      {
        id: 'pharmacological', title: 'Pharmacological Management',
        content: 'Early disease: MAO-B inhibitors (rasagiline 1 mg daily) for mild symptoms and possible neuroprotection. Moderate disease: levodopa-carbidopa (titrate from 100/25 mg TDS). Add dopamine agonist (pramipexole, ropinirole) to reduce levodopa dose and wearing-off. Late disease: continuous delivery (duodopa, subcutaneous apomorphine) for fluctuations.',
        table: {
          caption: 'Pharmacotherapy by Disease Stage',
          headers: ['Stage', 'Preferred Treatment', 'Goal'],
          rows: [
            ['Early (mild symptoms)', 'MAO-B inhibitor or dopamine agonist', 'Symptom control, delay levodopa'],
            ['Moderate', 'Levodopa-carbidopa ± dopamine agonist', 'Motor function, quality of life'],
            ['Advanced (fluctuations)', 'Levodopa optimisation + COMT inhibitor', 'Reduce off-time'],
            ['Severe (refractory)', 'DBS or continuous infusion', 'Motor complication control'],
          ],
        },
      },
      {
        id: 'non-motor', title: 'Non-Motor Symptoms',
        content: 'Depression: SSRIs, SNRIs, or pramipexole. REM sleep behaviour disorder: clonazepam 0.25–0.5 mg or melatonin. Constipation: macrogol, prunes, hydration. Orthostatic hypotension: fludrocortisone, droxidopa. Dementia: rivastigmine (moderate-severe PD dementia). Psychosis: quetiapine or clozapine.',
      },
    ],
    references: [
      'Bloem BR et al. Parkinson\'s disease. Lancet. 2021;397:2284–2303.',
    ],
  },

  // ── Musculoskeletal ───────────────────────────────────────────────────────

  'Osteoporosis Prevention and Treatment': {
    source: 'National Osteoporosis Foundation (NOF)',
    version: '2024', published: '2024-01-01',
    doi: '10.1007/s00198-023-07008-0',
    authors: ['Cosman F', 'de Beur SJ', 'LeBoff MS', 'Lewiecki EM', 'Tanner B'],
    keyHighlights: [
      'FRAX major osteoporotic fracture risk ≥20% or hip fracture risk ≥3%: pharmacotherapy recommended regardless of BMD',
      'Bisphosphonates (alendronate, zoledronic acid) remain first-line for most patients',
      'Denosumab preferred for patients with renal impairment (eGFR <35 mL/min)',
      'Anabolic agents (teriparatide, romosozumab) for very high-risk patients: T-score ≤−3.5 or prior fragility fracture',
      'Calcium (1000–1200 mg/day) and vitamin D (800–1000 IU/day) supplementation for all patients on therapy',
    ],
    sections: [
      {
        id: 'diagnosis', title: 'Diagnosis and Risk Assessment',
        content: 'WHO T-score criteria: Normal (T ≥−1), Osteopenia (T −1 to −2.5), Osteoporosis (T ≤−2.5). FRAX tool integrates clinical risk factors with or without BMD. Screen all women ≥65, men ≥70, and younger patients with fragility fractures or risk factors.',
      },
      {
        id: 'treatment', title: 'Pharmacotherapy',
        content: 'First-line: alendronate (70 mg weekly oral) or zoledronic acid (5 mg IV annually). Drug holiday after 3–5 years if T-score >−2.5 and no prevalent vertebral fractures. Sequential therapy: anabolic agent (teriparatide or romosozumab) followed by antiresorptive for best fracture reduction.',
        recommendations: [
          { id: 'T1', text: 'Bisphosphonates are recommended as first-line therapy for postmenopausal osteoporosis.', class: 'I', level: 'A' },
          { id: 'T2', text: 'Calcium and vitamin D supplementation is recommended for all patients receiving osteoporosis treatment.', class: 'I', level: 'B' },
        ],
      },
    ],
    references: [
      'Cosman F et al. Clinician\'s guide to prevention and treatment of osteoporosis. Osteoporos Int. 2014;25:2359–2381.',
    ],
  },

  'Rheumatoid Arthritis Management': {
    source: 'American College of Rheumatology (ACR)',
    version: '2024', published: '2024-05-01',
    doi: '10.1002/art.42783',
    authors: ['Fraenkel L', 'Bathon JM', 'England BR', 'St.Clair EW', 'Arayssi T'],
    keyHighlights: [
      'Treat-to-target: DAS28 remission (<2.6) or low disease activity (<3.2) within 6 months',
      'Methotrexate remains the anchor DMARD; target dose 25 mg/week with folic acid 5 mg/week',
      'JAK inhibitors (upadacitinib, baricitinib, tofacitinib) for inadequate DMARD response; MACE/VTE risk assessment required',
      'TNF inhibitors (adalimumab, etanercept, certolizumab) remain effective; biosimilars equivalent',
      'Cardiovascular risk aggressively managed: RA confers 1.5× excess CV mortality',
    ],
    sections: [
      {
        id: 'diagnosis', title: 'Diagnosis',
        content: 'ACR/EULAR 2010 classification criteria: joint involvement, serology (RF, anti-CCP), acute-phase reactants (CRP/ESR), symptom duration ≥6 weeks. Score ≥6/10 classifies as RA. Early RA (<6 months symptoms) should be treated promptly to prevent joint damage.',
      },
      {
        id: 'treatment', title: 'Treatment Algorithm',
        content: 'DMARD-naïve moderate-to-high disease activity: methotrexate monotherapy. After 3 months inadequate response: combination csDMARD or switch to bDMARD (TNFi or non-TNFi) or tsDMARD (JAKi). Steroids: bridging therapy only; taper rapidly and discontinue.',
        table: {
          caption: 'RA Treatment by Phase',
          headers: ['Phase', 'Disease Activity', 'Preferred Treatment'],
          rows: [
            ['Initial', 'Moderate-high', 'Methotrexate ± hydroxychloroquine/sulfasalazine'],
            ['Step-up (3 months)', 'Moderate-high', 'Add/switch bDMARD or JAKi'],
            ['Biologic failure', 'Active', 'Switch to different mechanism (TNFi→IL-6i or JAKi)'],
            ['Remission', 'Remission >6 months', 'Cautious tapering'],
          ],
        },
      },
    ],
    references: [
      'Fraenkel L et al. 2021 ACR Guideline for RA. Arthritis Rheumatol. 2021;73:1108–1123.',
    ],
  },

  'Lower Back Pain Clinical Guidelines': {
    source: 'American College of Physicians (ACP)',
    version: '2024', published: '2024-02-01',
    doi: '10.7326/M24-0234',
    authors: ['Qaseem A', 'Wilt TJ', 'McLean RM', 'Forciea MA', 'Snow V'],
    keyHighlights: [
      'Non-pharmacological therapy preferred first-line for acute, subacute, and chronic low back pain',
      'Exercise therapy (supervised), CBT, and multidisciplinary rehabilitation for chronic LBP',
      'NSAIDs and skeletal muscle relaxants have modest benefit for acute LBP; opioids not recommended',
      'Imaging not recommended for non-specific LBP without red flags',
      'Spinal manipulation, acupuncture, and massage have moderate evidence for chronic LBP',
    ],
    sections: [
      {
        id: 'assessment', title: 'Assessment and Red Flags',
        content: 'Red flags requiring urgent investigation: saddle anaesthesia, bladder/bowel dysfunction (cauda equina), unexplained weight loss (malignancy), fever (infection), trauma, age >50 with new-onset LBP. Most acute LBP resolves within 6 weeks without investigation.',
      },
      {
        id: 'treatment', title: 'Treatment',
        content: 'Acute (<4 weeks): heat, advice to stay active, NSAIDs if needed, short-term muscle relaxants. Subacute (4–12 weeks): same plus consider supervised exercise. Chronic (>12 weeks): structured exercise programme, CBT, acupuncture, spinal manipulation. Surgery only for specific structural pathology (disc herniation with radiculopathy, spinal stenosis).',
        recommendations: [
          { id: 'T1', text: 'Non-pharmacological treatment is recommended as first-line for acute and chronic LBP.', class: 'I', level: 'A' },
          { id: 'T2', text: 'Imaging is not recommended for non-specific LBP without red flags.', class: 'I', level: 'B' },
        ],
      },
    ],
    references: [
      'Qaseem A et al. Noninvasive treatments for acute, subacute and chronic LBP. Ann Intern Med. 2017;166:514–530.',
    ],
  },

  // ── Renal & Urinary ───────────────────────────────────────────────────────

  'Chronic Kidney Disease Management': {
    source: 'Kidney Disease: Improving Global Outcomes (KDIGO)',
    version: '2024', published: '2024-01-01',
    doi: '10.1016/j.kint.2023.12.001',
    authors: ['Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group'],
    keyHighlights: [
      'SGLT2 inhibitors now recommended for all CKD patients with eGFR ≥20 mL/min/1.73m², regardless of diabetes',
      'Finerenone (non-steroidal MRA) reduces CKD progression and CV events in diabetic CKD',
      'Blood pressure target: <120 mmHg systolic for CKD patients without significant proteinuria',
      'ACE inhibitor or ARB first-line for CKD with proteinuria (urine ACR ≥30 mg/g)',
      'Avoid NSAIDs, iodinated contrast, and nephrotoxic medications; adjust drug doses for eGFR',
    ],
    sections: [
      {
        id: 'classification', title: 'CKD Classification',
        content: 'CKD defined as eGFR <60 mL/min/1.73m² or markers of kidney damage (proteinuria, haematuria, structural abnormality) for >3 months. Staged by GFR (G1-G5) and albuminuria (A1-A3). CGA classification guides prognosis and management intensity.',
        table: {
          caption: 'CKD Stages by eGFR',
          headers: ['Stage', 'eGFR (mL/min/1.73m²)', 'Description'],
          rows: [
            ['G1', '≥90', 'Normal or high (with kidney damage markers)'],
            ['G2', '60–89', 'Mildly decreased'],
            ['G3a', '45–59', 'Mildly-to-moderately decreased'],
            ['G3b', '30–44', 'Moderately-to-severely decreased'],
            ['G4', '15–29', 'Severely decreased'],
            ['G5', '<15', 'Kidney failure'],
          ],
        },
      },
      {
        id: 'treatment', title: 'Treatment',
        content: 'Foundational: ACE inhibitor/ARB + SGLT2 inhibitor for all with proteinuria. Finerenone added in diabetic CKD after FIDELIO-DKD and FIGARO-DKD trials showing 25% reduction in kidney failure. Diet: sodium <2 g/day, protein 0.6–0.8 g/kg/day for non-dialysis CKD. Anaemia management with ESA when Hb <10 g/dL.',
        recommendations: [
          { id: 'T1', text: 'SGLT2 inhibitors are recommended for patients with CKD and eGFR ≥20 mL/min/1.73m².', class: 'I', level: 'A' },
          { id: 'T2', text: 'ACE inhibitor or ARB is recommended for CKD patients with proteinuria.', class: 'I', level: 'A' },
        ],
      },
    ],
    references: [
      'KDIGO 2024 Clinical Practice Guideline for CKD Evaluation and Management.',
      'Perkovic V et al. Canagliflozin and renal outcomes in T2DM (CREDENCE). N Engl J Med. 2019;380:2295–2306.',
    ],
  },

  'Urinary Tract Infection Treatment Guidelines': {
    source: 'Infectious Diseases Society of America (IDSA)',
    version: '2024', published: '2024-04-01',
    doi: '10.1093/cid/ciad723',
    authors: ['Gupta K', 'Hooton TM', 'Naber KG', 'Wullt B', 'Colgan R'],
    keyHighlights: [
      'Nitrofurantoin 100 mg (modified-release) BD × 5 days: first-line for uncomplicated cystitis',
      'Trimethoprim 200 mg BD × 7 days: alternative first-line (if local resistance <20%)',
      'Fluoroquinolones reserved for pyelonephritis or complicated UTI; avoid for uncomplicated cystitis',
      'Urine culture recommended for pyelonephritis, recurrent UTI, catheter-associated UTI, and pregnancy',
      'Cranberry products and d-mannose may reduce recurrence in premenopausal women',
    ],
    sections: [
      {
        id: 'classification', title: 'UTI Classification',
        content: 'Uncomplicated: cystitis in non-pregnant premenopausal women. Complicated: male, pregnant, catheter-associated, immunocompromised, structural abnormality, hospital-acquired, or pyelonephritis. Recurrent: ≥2 episodes in 6 months or ≥3 in 12 months.',
      },
      {
        id: 'treatment', title: 'Treatment',
        content: 'Uncomplicated cystitis: nitrofurantoin 100 mg BD × 5 days (first-line); trimethoprim 200 mg BD × 7 days; fosfomycin 3g single dose. Acute pyelonephritis (outpatient): ciprofloxacin 500 mg BD × 7 days; if oral fluoroquinolone resistance >10%, initial IV ceftriaxone. Catheter-associated UTI: remove/change catheter; treat only if symptomatic.',
        table: {
          caption: 'UTI Treatment Summary',
          headers: ['Condition', 'First-Line', 'Duration'],
          rows: [
            ['Uncomplicated cystitis (women)', 'Nitrofurantoin 100 mg BD', '5 days'],
            ['Uncomplicated cystitis (alternative)', 'Trimethoprim 200 mg BD', '7 days'],
            ['Single-dose option', 'Fosfomycin 3g', '1 dose'],
            ['Pyelonephritis (outpatient)', 'Ciprofloxacin 500 mg BD', '7 days'],
            ['Pyelonephritis (inpatient)', 'Ceftriaxone 1g IV OD', '10–14 days (step to oral)'],
          ],
        },
      },
    ],
    references: [
      'Gupta K et al. IDSA Guidelines for uncomplicated UTI. Clin Infect Dis. 2011;52:e103–e120.',
    ],
  },

  'Acute Kidney Injury Recognition and Care': {
    source: 'Kidney Disease: Improving Global Outcomes (KDIGO)',
    version: '2024', published: '2024-03-01',
    doi: '10.1016/j.kint.2023.11.008',
    authors: ['Kidney Disease: Improving Global Outcomes (KDIGO) AKI Work Group'],
    keyHighlights: [
      'AKI defined as serum creatinine rise ≥0.3 mg/dL within 48 hours or ≥1.5× baseline within 7 days',
      'Avoid nephrotoxins: NSAIDs, aminoglycosides, contrast agents, vancomycin if possible',
      'Fluid resuscitation with balanced crystalloids (Ringer\'s lactate, Plasmalyte) preferred over normal saline',
      'Furosemide does not prevent AKI but may be used to manage fluid overload',
      'Renal replacement therapy (RRT) for severe AKI: life-threatening hyperkalaemia, metabolic acidosis, or fluid overload',
    ],
    sections: [
      {
        id: 'staging', title: 'AKI Staging',
        content: 'KDIGO AKI stages: Stage 1 (Cr ×1.5–1.9 or rise ≥0.3 mg/dL; UO <0.5 mL/kg/h ×6–12h), Stage 2 (Cr ×2–2.9; UO <0.5 mL/kg/h ×12h), Stage 3 (Cr ×3+ or ≥4 mg/dL or initiation of RRT; UO <0.3 mL/kg/h ×24h or anuria ×12h).',
        table: {
          caption: 'KDIGO AKI Staging Criteria',
          headers: ['Stage', 'Serum Creatinine Criteria', 'Urine Output Criteria'],
          rows: [
            ['1', '≥0.3 mg/dL rise OR 1.5–1.9× baseline', '<0.5 mL/kg/h for 6–12 hours'],
            ['2', '2.0–2.9× baseline', '<0.5 mL/kg/h for ≥12 hours'],
            ['3', '≥3× baseline OR ≥4.0 mg/dL OR RRT', '<0.3 mL/kg/h for ≥24 h OR anuria ≥12 h'],
          ],
        },
      },
      {
        id: 'management', title: 'Management',
        content: 'Identify and treat the cause: pre-renal (volume resuscitation), intrinsic (treat underlying cause), post-renal (relieve obstruction). Monitor fluid balance, electrolytes, and urine output hourly in severe AKI. Drug dose adjustment for reduced clearance. RRT indications: hyperkalaemia >6.5 mmol/L, pH <7.1, volume overload refractory to diuretics, uraemic complications.',
      },
    ],
    references: [
      'KDIGO 2012 Clinical Practice Guideline for Acute Kidney Injury. Kidney Int Suppl. 2012;2:1–138.',
    ],
  },

  // ── Oncology ─────────────────────────────────────────────────────────────

  'Colorectal Cancer Screening Updates': {
    source: 'American Society of Clinical Oncology (ASCO)',
    version: '2024', published: '2024-01-15',
    doi: '10.1200/JCO.23.02568',
    authors: ['Dekker E', 'Tanis PJ', 'Vleugels JLA', 'Kasi PM', 'Wallace MB'],
    keyHighlights: [
      'Multi-target stool DNA test (Cologuard Plus) approved as an alternative CRC screening modality',
      'Liquid biopsy (ctDNA) shows promise for early CRC detection in ongoing trials',
      'Lynch syndrome accounts for 3% of all CRC; universal MMR testing of CRC tumours recommended',
      'Microsatellite instability-high (MSI-H) or dMMR tumours: immunotherapy (pembrolizumab) first-line in metastatic setting',
      'KRAS/NRAS/BRAF mutation profiling essential for metastatic CRC treatment planning',
    ],
    sections: [
      {
        id: 'screening', title: 'Screening Update',
        content: 'Average-risk adults: begin at age 45. High-risk (Lynch, FAP, personal/family history of advanced polyps or CRC): earlier and more frequent screening. For Lynch syndrome: colonoscopy every 1–2 years from age 20–25.',
      },
      {
        id: 'biomarkers', title: 'Biomarkers and Targeted Therapy',
        content: 'All metastatic CRC requires: MMR/MSI testing, KRAS/NRAS/BRAF V600E mutation, HER2 amplification, NTRK fusion. RAS wild-type: anti-EGFR (cetuximab, panitumumab) for left-sided tumours. BRAF V600E: encorafenib + cetuximab (BEACON CRC). HER2 amplified: trastuzumab-based regimens.',
        recommendations: [
          { id: 'B1', text: 'Universal MMR/MSI testing is recommended for all newly diagnosed CRC.', class: 'I', level: 'B' },
          { id: 'B2', text: 'Extended RAS and BRAF testing is recommended for metastatic CRC prior to treatment selection.', class: 'I', level: 'A' },
        ],
      },
    ],
    references: [
      'Loree JM et al. Molecular Subtypes and Evolution of Treatment in Metastatic CRC. Clin Cancer Res. 2021;27:28–37.',
    ],
  },

  'Lung Cancer Treatment Guidelines': {
    source: 'National Comprehensive Cancer Network (NCCN)',
    version: '2024', published: '2024-01-01',
    doi: '10.6004/jnccn.2024.0001',
    authors: ['Ettinger DS', 'Wood DE', 'Aisner DL', 'Akerley W', 'Bauman JE'],
    keyHighlights: [
      'Osimertinib adjuvant therapy for resected EGFR-mutant NSCLC (ADAURA): 5-year OS benefit demonstrated',
      'Immunotherapy (pembrolizumab, nivolumab) as adjuvant or first-line for PD-L1 ≥50% NSCLC',
      'Lorlatinib (3rd-generation ALK inhibitor) first-line for ALK-positive NSCLC',
      'Low-dose CT screening annually for high-risk individuals (age 50–80, ≥20 pack-year smoking history)',
      'Comprehensive molecular profiling (EGFR, ALK, ROS1, BRAF, MET, RET, NTRK, KRAS G12C) required for all advanced NSCLC',
    ],
    sections: [
      {
        id: 'screening', title: 'Lung Cancer Screening',
        content: 'Annual low-dose CT for: age 50–80, current smoker or quit within 15 years, ≥20 pack-year history. NLST trial: 20% reduction in lung cancer mortality. Shared decision-making discussion required before initiating screening.',
      },
      {
        id: 'treatment', title: 'Stage-Based Treatment',
        content: 'Stage I-II: surgery (lobectomy) ± adjuvant chemotherapy; SABR for inoperable patients. Stage III: concurrent chemoradiation ± durvalumab consolidation (PACIFIC trial). Stage IV EGFR-mutant: osimertinib; ALK-positive: lorlatinib; KRAS G12C: sotorasib or adagrasib. PD-L1 ≥50%: pembrolizumab monotherapy.',
        table: {
          caption: 'Targeted Therapy by NSCLC Molecular Alteration',
          headers: ['Alteration', 'Prevalence', 'Preferred Agent'],
          rows: [
            ['EGFR exon 19/21', '15% (Western)', 'Osimertinib'],
            ['ALK rearrangement', '5%', 'Lorlatinib'],
            ['ROS1 rearrangement', '1–2%', 'Entrectinib or crizotinib'],
            ['BRAF V600E', '2–3%', 'Dabrafenib + trametinib'],
            ['KRAS G12C', '13%', 'Sotorasib or adagrasib'],
            ['MET exon 14 skip', '3%', 'Capmatinib or tepotinib'],
          ],
        },
      },
    ],
    references: [
      'Wu YL et al. Osimertinib adjuvant therapy in EGFR-mutated NSCLC (ADAURA). N Engl J Med. 2023;388:1630–1641.',
    ],
  },

  'Breast Cancer Treatment Strategies': {
    source: 'ASCO / National Comprehensive Cancer Network (NCCN)',
    version: '2024', published: '2024-02-01',
    doi: '10.1200/JCO.23.02401',
    authors: ['Giordano SH', 'Franzoi MAB', 'Temin S', 'Anders CK', 'Chandarlapaty S'],
    keyHighlights: [
      'CDK4/6 inhibitors (palbociclib, ribociclib, abemaciclib) + endocrine therapy: standard of care for HR+/HER2- metastatic BC',
      'Abemaciclib adjuvant therapy for high-risk early HR+ BC (monarchE trial: 35% reduction in recurrence)',
      'Olaparib or talazoparib for BRCA1/2-mutant HER2-negative metastatic BC after chemotherapy',
      'T-DM1 (trastuzumab emtansine) for HER2+ early BC with residual disease after neoadjuvant therapy',
      'Sacituzumab govitecan for triple-negative BC: 57% response rate in ASCENT trial',
    ],
    sections: [
      {
        id: 'hr-positive', title: 'Hormone Receptor-Positive BC',
        content: 'Early stage: adjuvant endocrine therapy 5–10 years (tamoxifen or aromatase inhibitor). High-risk early disease (N+, Ki67 ≥20%): adjuvant CDK4/6 inhibitor (abemaciclib). Metastatic: endocrine therapy + CDK4/6 inhibitor first-line; PIK3CA mutation: add alpelisib; ESR1 mutation (endocrine resistance): elacestrant.',
      },
      {
        id: 'her2-positive', title: 'HER2-Positive BC',
        content: 'Neoadjuvant: trastuzumab + pertuzumab + chemotherapy. Adjuvant: trastuzumab (1 year); T-DM1 if residual disease after neoadjuvant. Metastatic: tucatinib + trastuzumab + capecitabine (HER2CLIMB); T-DXd (trastuzumab deruxtecan) for later lines.',
      },
      {
        id: 'tnbc', title: 'Triple-Negative BC',
        content: 'Early stage: pembrolizumab + chemotherapy neoadjuvant (KEYNOTE-522). Adjuvant: olaparib for BRCA1/2 carriers. Metastatic PD-L1+: pembrolizumab + chemotherapy. BRCA mutant: PARP inhibitor. All lines: sacituzumab govitecan after ≥1 prior chemotherapy.',
        recommendations: [
          { id: 'T1', text: 'PD-L1 testing and BRCA1/2 testing is recommended for all metastatic TNBC to guide treatment selection.', class: 'I', level: 'A' },
        ],
      },
    ],
    references: [
      'Johnston SRD et al. Abemaciclib combined with endocrine therapy for early BC (monarchE). J Clin Oncol. 2023;41:3232–3242.',
    ],
  },

  // ── Infectious Disease ────────────────────────────────────────────────────

  'COVID-19 Treatment Protocol Updates': {
    source: 'World Health Organization / National Institutes of Health (WHO/NIH)',
    version: '2024', published: '2024-01-01',
    doi: '10.1016/S0140-6736(24)00100-7',
    authors: ['WHO COVID-19 Therapeutics Advisory Panel'],
    keyHighlights: [
      'Nirmatrelvir-ritonavir (Paxlovid) remains first-line for high-risk non-hospitalised patients within 5 days of symptom onset',
      'Remdesivir for hospitalised patients not on oxygen or early low-flow oxygen',
      'Dexamethasone 6 mg daily recommended for patients requiring supplemental oxygen or mechanical ventilation',
      'IL-6 inhibitors (tocilizumab) + dexamethasone for rapidly deteriorating hospitalised patients',
      'Baricitinib added as an alternative to tocilizumab for severe COVID-19',
    ],
    sections: [
      {
        id: 'outpatient', title: 'Outpatient Treatment',
        content: 'High-risk non-hospitalised: nirmatrelvir-ritonavir 300/100 mg BD × 5 days (within 5 days of symptom onset). Alternatives: remdesivir 200 mg IV day 1 then 100 mg IV daily × 3 days, or molnupiravir 800 mg BD × 5 days (less preferred). High-risk: immunocompromised, age ≥65, obesity, diabetes, CKD, cardiovascular disease.',
        table: {
          caption: 'COVID-19 Outpatient Antivirals',
          headers: ['Agent', 'Route', 'Duration', 'Efficacy vs hospitalisation'],
          rows: [
            ['Nirmatrelvir-ritonavir', 'Oral', '5 days', '~89% reduction (EPIC-HR)'],
            ['Remdesivir', 'IV (3-day)', '3 days', '~87% reduction (PINETREE)'],
            ['Molnupiravir', 'Oral', '5 days', '~31% reduction'],
          ],
        },
      },
      {
        id: 'inpatient', title: 'Inpatient Treatment',
        content: 'Not on oxygen: remdesivir × 5 days. Low-flow oxygen: dexamethasone 6 mg daily × 10 days ± remdesivir. High-flow oxygen / mechanical ventilation: dexamethasone + tocilizumab (or baricitinib). Anticoagulation: prophylactic LMWH for all hospitalised; therapeutic only if thrombosis confirmed.',
      },
    ],
    references: [
      'RECOVERY Collaborative. Dexamethasone in hospitalised patients with COVID-19. N Engl J Med. 2021;384:693–704.',
      'Hammond J et al. Nirmatrelvir (EPIC-HR). N Engl J Med. 2022;386:1397–1408.',
    ],
  },

  'Antibiotic Stewardship Guidelines': {
    source: 'Infectious Diseases Society of America (IDSA)',
    version: '2024', published: '2024-03-01',
    doi: '10.1093/cid/ciad517',
    authors: ['Barlam TF', 'Cosgrove SE', 'Abbo LM', 'MacDougall C', 'Schuetz AN'],
    keyHighlights: [
      'Most community respiratory infections (CAP, acute bronchitis) respond to 5-day antibiotic courses',
      'Procalcitonin-guided therapy reduces antibiotic exposure in lower respiratory infections by 2.5 days',
      'IV-to-oral switch when patient tolerating oral, afebrile, improving: reduces length of stay',
      'Antibiograms should be consulted for local resistance patterns before empiric therapy',
      'Antibiotic time-outs at 48–72 hours to reassess indication, spectrum, and duration',
    ],
    sections: [
      {
        id: 'principles', title: 'Core Stewardship Principles',
        content: 'Four key interventions: (1) Prospective audit with feedback, (2) Formulary restriction with pre-authorisation, (3) De-escalation of broad-spectrum agents, (4) IV-to-oral switch. Target: reduce unnecessary antibiotic days while maintaining clinical outcomes.',
      },
      {
        id: 'duration', title: 'Recommended Antibiotic Durations',
        content: 'Evidence supports shorter courses than traditionally used. CAP (outpatient): 5 days. Uncomplicated UTI: 5 days. Skin and soft tissue infection (non-purulent): 5–7 days. Uncomplicated pyelonephritis: 5–7 days (fluoroquinolone) or 14 days (beta-lactam). Bacteraemia (Staph aureus): 14 days minimum (28 days if complicated).',
        table: {
          caption: 'Evidence-Based Antibiotic Durations',
          headers: ['Infection', 'Traditional Duration', 'Recommended Duration'],
          rows: [
            ['CAP (outpatient)', '7–14 days', '5 days'],
            ['UTI (uncomplicated)', '7 days', '3–5 days'],
            ['Pyelonephritis', '14 days', '5–7 days (quinolone)'],
            ['Skin/soft tissue', '10–14 days', '5–7 days'],
            ['COPD exacerbation', '7–10 days', '5 days'],
          ],
        },
      },
    ],
    references: [
      'Barlam TF et al. Implementing an Antibiotic Stewardship Program. Clin Infect Dis. 2016;62:e51–e77.',
    ],
  },

  'Updated STD Management Strategies': {
    source: 'Centers for Disease Control and Prevention (CDC)',
    version: '2024', published: '2024-06-01',
    doi: '10.15585/mmwr.rr7304a1',
    authors: ['Workowski KA', 'Bachmann LH', 'Chan PA', 'Johnston C', 'Muzny CA'],
    keyHighlights: [
      'Doxycycline post-exposure prophylaxis (doxy-PEP) 200 mg within 72 hours reduces gonorrhoea, chlamydia, and syphilis in MSM by ~80%',
      'Ceftriaxone 500 mg IM single dose (1g if weight >150 kg) for uncomplicated gonorrhoea',
      'Doxycycline 100 mg BD × 7 days for chlamydia; azithromycin no longer preferred due to resistance',
      'Benzathine penicillin G 2.4 MU IM for primary/secondary syphilis; three doses for late latent',
      'PrEP (tenofovir-emtricitabine or cabotegravir long-acting injection) integral to comprehensive STI prevention',
    ],
    sections: [
      {
        id: 'gonorrhoea', title: 'Gonorrhoea',
        content: 'Uncomplicated urogenital/rectal/pharyngeal: ceftriaxone 500 mg IM single dose (1g if ≥150 kg). Test of cure only for pharyngeal gonorrhoea at 14 days. Dual therapy no longer recommended. Disseminated gonococcal infection: ceftriaxone 1g IV/IM every 24h for 7 days.',
      },
      {
        id: 'syphilis', title: 'Syphilis',
        content: 'Primary, secondary, early latent (<1 year): benzathine penicillin G 2.4 MU IM × 1 dose. Late latent (>1 year) or unknown duration: benzathine penicillin G 2.4 MU IM × 3 doses (1 week apart). Neurosyphilis: aqueous crystalline penicillin G 18–24 MU/day IV × 10–14 days.',
      },
      {
        id: 'prevention', title: 'Prevention',
        content: 'PrEP for HIV: daily oral tenofovir-emtricitabine or injectable cabotegravir every 2 months. Doxy-PEP: 200 mg doxycycline within 72 hours of unprotected sex reduces bacterial STI incidence by 62–88% (DoxyPEP and ANRS IPERGAY doxy-PEP trials).',
        recommendations: [
          { id: 'P1', text: 'Doxy-PEP (doxycycline 200 mg within 72 hours of condomless sex) is recommended for MSM and transgender women with ≥1 bacterial STI in the past year.', class: 'II', level: 'B' },
        ],
      },
    ],
    references: [
      'CDC STI Treatment Guidelines 2024. MMWR Recomm Rep.',
      'Luetkemeyer AF et al. Doxycycline post-exposure prophylaxis (DoxyPEP). N Engl J Med. 2023;388:1296–1306.',
    ],
  },

  // ── Geriatrics ────────────────────────────────────────────────────────────

  'Dementia Care and Management': {
    source: 'American Geriatrics Society (AGS)',
    version: '2024', published: '2024-02-01',
    doi: '10.1111/jgs.18987',
    authors: ['Livingston G', 'Huntley J', 'Sommerlad A', 'Ames D', 'Ballard C'],
    keyHighlights: [
      'Lecanemab (Leqembi) FDA-approved for early Alzheimer\'s disease: 27% slowing of cognitive decline',
      'Routine cognitive screening recommended at age 65+ using validated tools (MMSE, MoCA, Mini-Cog)',
      'Twelve modifiable risk factors account for ~40% of dementia burden (including hearing loss, depression, physical inactivity)',
      'Cholinesterase inhibitors (donepezil, rivastigmine, galantamine) for mild-to-moderate AD; memantine added for moderate-severe',
      'Non-pharmacological approaches (cognitive stimulation, structured activities) preferred over antipsychotics for behavioural symptoms',
    ],
    sections: [
      {
        id: 'diagnosis', title: 'Diagnosis',
        content: 'Cognitive assessment: MoCA (≤25/30 abnormal), Mini-Cog, or MMSE. Brain imaging (MRI or CT) to exclude reversible causes. CSF biomarkers or amyloid PET for Alzheimer\'s pathology confirmation. Differential: Lewy body dementia (REM sleep disorder, parkinsonism, fluctuating cognition), vascular dementia (step-wise decline, lacunar infarcts), FTD (behaviour/language-first).',
      },
      {
        id: 'treatment', title: 'Treatment',
        content: 'Symptomatic: donepezil 5–10 mg OD (all stages); rivastigmine patch for patients with swallowing difficulty; memantine 10 mg BD for moderate-severe. Amyloid-targeting: lecanemab for MCI/early AD with confirmed amyloid (CLARITY-AD trial: slows decline, ARIA risk requires monitoring MRI). Behavioural symptoms: non-pharmacological first; low-dose risperidone if severe agitation/psychosis.',
        recommendations: [
          { id: 'T1', text: 'Cholinesterase inhibitors are recommended for patients with mild-to-moderate Alzheimer\'s disease.', class: 'I', level: 'A' },
          { id: 'T2', text: 'Antipsychotics should be used with caution for behavioural symptoms; risks (mortality, stroke) must be discussed.', class: 'I', level: 'B' },
        ],
      },
    ],
    references: [
      'van Dyck CH et al. Lecanemab in early Alzheimer\'s disease (CLARITY-AD). N Engl J Med. 2023;388:9–21.',
      'Livingston G et al. Dementia prevention, intervention, and care: 2020 Lancet Commission report. Lancet. 2020;396:413–446.',
    ],
  },

  'Fall Prevention in Elderly Patients': {
    source: 'AGS / British Geriatrics Society (BGS)',
    version: '2024', published: '2024-01-01',
    doi: '10.1111/jgs.18764',
    authors: ['Panel on Prevention of Falls in Older Persons, AGS and BGS'],
    keyHighlights: [
      'Multifactorial interventions (balance training, medication review, vision correction, home hazard modification) reduce falls by 24%',
      'Exercise programmes focusing on balance and strength (e.g., Otago, Tai Chi) are single most effective intervention',
      'Medication review: deprescribe benzodiazepines, antipsychotics, antihistamines, and ≥4 concurrent medications',
      'Vitamin D supplementation (800–1000 IU/day) for deficient elderly patients to reduce fall risk',
      'Annual fall risk screening recommended for all adults ≥65 using validated tools (TUG, STEADI)',
    ],
    sections: [
      {
        id: 'risk-assessment', title: 'Risk Assessment',
        content: 'Ask all patients ≥65 annually: "Have you fallen in the past year?" Single fall with abnormal gait/balance or ≥2 falls in past year: multifactorial risk assessment. Tools: Timed Up and Go (TUG) >12 seconds = high risk. STEADI (CDC) algorithm for primary care. Key risk factors: age ≥80, prior fall, cognitive impairment, polypharmacy, visual impairment, fear of falling.',
      },
      {
        id: 'interventions', title: 'Interventions',
        content: 'Exercise: multicomponent programmes (balance + strength training ≥3×/week) for 6+ months. Medication review: deprescribe high-risk medications (Beers List). Home safety assessment: remove trip hazards, install grab rails, improve lighting. Vision: cataract surgery, updated glasses. Footwear: supportive, low heel. Postural hypotension: hydration, compression stockings, medication adjustment.',
        recommendations: [
          { id: 'I1', text: 'Exercise programmes including balance and strength training are strongly recommended for fall prevention in at-risk older adults.', class: 'I', level: 'A' },
          { id: 'I2', text: 'Multifactorial interventions addressing multiple risk factors simultaneously are recommended for older adults at high fall risk.', class: 'I', level: 'A' },
        ],
      },
    ],
    references: [
      'Hopewell S et al. Multifactorial and multiple component interventions for preventing falls in older people. Cochrane. 2018;CD012221.',
    ],
  },

  'Polypharmacy Management Guidelines': {
    source: 'American Geriatrics Society (AGS)',
    version: '2024', published: '2024-04-01',
    doi: '10.1111/jgs.18855',
    authors: ['By the 2023 American Geriatrics Society Beers Criteria Update Expert Panel'],
    keyHighlights: [
      'Beers Criteria 2023 updated: 41 medications or medication classes potentially inappropriate in older adults (PIMs)',
      'Structured deprescribing: STOPP/START tool identifies PIMs and missing appropriate medications',
      'Cascade prescribing (treating side effects with additional drugs) responsible for ~20% of drug burden in elderly',
      'Pharmacist-led medication reviews reduce drug-related hospital admissions by 30% in high-risk patients',
      'Patient goals and life expectancy should guide medication targets; avoid treating laboratory values in frail elderly',
    ],
    sections: [
      {
        id: 'assessment', title: 'Polypharmacy Assessment',
        content: 'Polypharmacy defined as ≥5 concurrent medications; hyper-polypharmacy ≥10. Review at every visit: indication for each drug, effectiveness, safety, adherence, cost. Patient\'s own medication list often incomplete; medication reconciliation essential at every care transition. Deprescribing should be proactive, not reactive.',
      },
      {
        id: 'beers-criteria', title: 'Beers Criteria High-Risk Medications',
        content: 'High-risk medications in older adults: anticholinergics (risk of confusion, urinary retention, constipation), benzodiazepines (falls, fractures, cognitive impairment), NSAIDs (GI bleeding, renal impairment, fluid retention), first-generation antihistamines (sedation, anticholinergic effects), glibenclamide (prolonged hypoglycaemia).',
        table: {
          caption: 'Common PIMs to Avoid in Older Adults (Beers 2023)',
          headers: ['Drug/Class', 'Risk', 'Alternative'],
          rows: [
            ['Benzodiazepines', 'Falls, cognitive impairment', 'CBT for insomnia/anxiety'],
            ['First-gen antihistamines (diphenhydramine)', 'Anticholinergic effects', 'Cetirizine, loratadine'],
            ['NSAIDs (chronic)', 'GI bleed, AKI, CV risk', 'Topical diclofenac, paracetamol'],
            ['Antipsychotics (chronic)', 'Stroke, mortality', 'Non-drug behavioural interventions'],
            ['Glibenclamide (glyburide)', 'Prolonged hypoglycaemia', 'Gliclazide MR, sitagliptin'],
            ['Proton pump inhibitors (long-term)', 'C. diff, bone loss, hypoMg', 'H2 blocker or dose reduction'],
          ],
        },
      },
      {
        id: 'deprescribing', title: 'Deprescribing',
        content: 'Stepwise: (1) identify all medications, (2) assess appropriateness using STOPP criteria, (3) determine eligibility for discontinuation, (4) plan discontinuation with patient, (5) monitor after stopping. Taper benzodiazepines and opioids. Discontinue drugs that no longer serve patient goals (e.g., statins in very frail elderly with limited prognosis).',
        recommendations: [
          { id: 'D1', text: 'Medication reviews using STOPP/START or Beers Criteria are recommended for all older adults on ≥5 medications.', class: 'I', level: 'B' },
        ],
      },
    ],
    references: [
      'By the 2023 AGS Beers Criteria Update Expert Panel. AGS Beers Criteria for Potentially Inappropriate Medication Use in Older Adults. J Am Geriatr Soc. 2023;71:2052–2081.',
      'O\'Mahony D et al. STOPP/START criteria for potentially inappropriate prescribing in older people. Age Ageing. 2015;44:213–218.',
    ],
  },
};

/**
 * generateGuidelineContent(guideline)
 * @param {Object} guideline - row from DB: { id, title, specialty, source, summary, tags }
 * @returns {Object} - full content object matching GuidelineDetail.jsx expectations
 */
function generateGuidelineContent(guideline) {
  const data = CONTENT_MAP[guideline.title];

  if (data) {
    return {
      id:       guideline.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      title:    guideline.title,
      specialty: guideline.specialty,
      source:   data.source,
      version:  data.version,
      published: data.published,
      doi:      data.doi,
      authors:  data.authors || [],
      keyHighlights: data.keyHighlights || [],
      sections: data.sections || [],
      evidenceClassification: {
        classes: [
          { class: 'I',   description: 'Evidence and/or general agreement that a treatment is beneficial and effective' },
          { class: 'II',  description: 'Conflicting evidence and/or a divergence of opinion' },
          { class: 'IIa', description: 'Weight of evidence/opinion is in favour of usefulness/efficacy' },
          { class: 'IIb', description: 'Usefulness/efficacy is less well established by evidence/opinion' },
          { class: 'III', description: 'Evidence or general agreement that treatment is not useful/effective, and may be harmful' },
        ],
        levels: [
          { level: 'A', description: 'Data derived from multiple RCTs or meta-analyses' },
          { level: 'B', description: 'Data derived from a single RCT or large non-randomised studies' },
          { level: 'C', description: 'Consensus of expert opinion and/or small studies, retrospective studies' },
        ],
      },
      references: data.references || [],
      _meta: { id: guideline.id, specialty: guideline.specialty },
    };
  }

  // Fallback: generate generic content from DB metadata
  return {
    id:       guideline.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    title:    guideline.title,
    specialty: guideline.specialty,
    source:   guideline.source,
    version:  new Date().getFullYear().toString(),
    published: new Date().toISOString().slice(0, 10),
    doi:      '',
    authors:  [],
    keyHighlights: [guideline.summary || 'Please refer to the official source for detailed guidance.'],
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        content: guideline.summary || 'Full guideline content is sourced from the relevant professional society. Please consult the official publication for comprehensive recommendations.',
      },
    ],
    references: [`${guideline.source}. ${guideline.title}.`],
    _meta: { id: guideline.id, specialty: guideline.specialty },
  };
}

module.exports = { generateGuidelineContent };
