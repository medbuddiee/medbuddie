import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import Sidebar from '../Dashboard/Sidebar';
import TopNav from '../Dashboard/TopNav';
import './PhysicianVerification.css';

const SPECIALTIES = [
  'Cardiology','Dermatology','Endocrinology','Gastroenterology',
  'General Practice','Geriatrics','Hematology','Infectious Disease',
  'Internal Medicine','Nephrology','Neurology','Obstetrics & Gynecology',
  'Oncology','Ophthalmology','Orthopedics','Otolaryngology',
  'Pediatrics','Psychiatry','Pulmonology','Radiology',
  'Rheumatology','Surgery','Urology','Vascular Surgery',
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

const STEPS = ['NPI Registry lookup','Identity verification','OIG exclusion check','FSMB license check','MedBuddie review'];

export default function ApplyPage() {
  const { user } = useUser();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    fullLegalName: '', dateOfBirth: '', medicalSchool: '',
    graduationYear: '', npiNumber: '', primarySpecialty: '',
    licensureStates: [], attestation: false,
  });
  const [npiStatus, setNpiStatus]     = useState(null); // null | 'checking' | 'verified' | 'error'
  const [npiMsg, setNpiMsg]           = useState('');
  const [idFile, setIdFile]           = useState(null);
  const [idDragging, setIdDragging]   = useState(false);
  const [stateQuery, setStateQuery]   = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const fileInputRef = useRef(null);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const toggleState = (s) => setForm(f => ({
    ...f,
    licensureStates: f.licensureStates.includes(s)
      ? f.licensureStates.filter(x => x !== s)
      : [...f.licensureStates, s],
  }));

  const verifyNpi = async () => {
    const npi = form.npiNumber.trim().replace(/\D/g, '');
    if (npi.length !== 10) { setNpiStatus('error'); setNpiMsg('NPI must be exactly 10 digits'); return; }
    setNpiStatus('checking'); setNpiMsg('');
    try {
      const res  = await fetch(`/api/npi/verify?npi=${npi}`);
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setNpiStatus('error'); setNpiMsg(data.error || 'NPI not found');
      } else {
        setNpiStatus('verified');
        setNpiMsg(`✓ Verified: ${data.name}${data.state ? ' · ' + data.state : ''}`);
        // Auto-fill specialty if blank
        if (!form.primarySpecialty && data.specialties?.length) {
          setForm(f => ({ ...f, primarySpecialty: data.specialties[0] }));
        }
      }
    } catch { setNpiStatus('error'); setNpiMsg('Could not reach NPI registry. Try again.'); }
  };

  const handleFileDrop = useCallback((e) => {
    e.preventDefault(); setIdDragging(false);
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (file) setIdFile(file);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.attestation)    return setError('Please check the attestation box to continue.');
    if (!idFile)              return setError('Government-issued ID is required.');
    if (!form.licensureStates.length) return setError('Select at least one state of licensure.');

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'licensureStates') fd.append(k, JSON.stringify(v));
        else fd.append(k, v);
      });
      fd.append('governmentId', idFile);

      const token = localStorage.getItem('token');
      const res   = await fetch('/api/physician-applications', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/physician-verification/status');
      } else {
        setError(data.error || 'Submission failed. Please try again.');
      }
    } catch { setError('Cannot reach server. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const filteredStates = US_STATES.filter(s => s.includes(stateQuery.toUpperCase()));

  return (
    <div className="dashboard-shell">
      <TopNav searchQuery="" onSearch={() => {}} />
      <div className="dashboard-body">
        <Sidebar />
        <div className="pv-apply-shell">

          <div className="pv-apply-main">
            <h1 className="pv-apply-title">Apply for physician verification</h1>
            <p className="pv-apply-sub">Get your Verified MD badge. All decisions are made within 48 hours.</p>

            <form onSubmit={handleSubmit} encType="multipart/form-data">

              {/* ── Section 1: Personal info ── */}
              <div className="pv-section">
                <h2 className="pv-section-title">1. Personal information</h2>
                <p className="pv-section-sub">Must match your government-issued ID exactly.</p>
                <div className="pv-grid-2">
                  <div className="pv-field">
                    <label>Full legal name</label>
                    <input type="text" placeholder="Dr. Jane A. Doe"
                      value={form.fullLegalName} onChange={set('fullLegalName')} required />
                  </div>
                  <div className="pv-field">
                    <label>Date of birth</label>
                    <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} required />
                  </div>
                  <div className="pv-field">
                    <label>Medical school</label>
                    <input type="text" placeholder="Harvard Medical School"
                      value={form.medicalSchool} onChange={set('medicalSchool')} />
                  </div>
                  <div className="pv-field">
                    <label>Graduation year</label>
                    <input type="number" placeholder="2014" min="1950" max={new Date().getFullYear()}
                      value={form.graduationYear} onChange={set('graduationYear')} />
                  </div>
                </div>
              </div>

              {/* ── Section 2: NPI & licensure ── */}
              <div className="pv-section">
                <h2 className="pv-section-title">2. NPI & licensure</h2>
                <p className="pv-section-sub">We verify these in real time against the CMS NPI Registry.</p>
                <div className="pv-grid-2">
                  <div className="pv-field">
                    <label>NPI number (10 digits)</label>
                    <div className="pv-npi-row">
                      <input type="text" placeholder="1234567890" maxLength={10}
                        value={form.npiNumber} onChange={set('npiNumber')}
                        className={npiStatus === 'verified' ? 'pv-input-verified' : npiStatus === 'error' ? 'pv-input-error' : ''}
                        required />
                      <button type="button" className="pv-verify-btn" onClick={verifyNpi}
                        disabled={npiStatus === 'checking'}>
                        {npiStatus === 'checking' ? 'Checking…' : 'Verify'}
                      </button>
                    </div>
                    {npiMsg && (
                      <p className={`pv-npi-msg ${npiStatus === 'verified' ? 'pv-msg-ok' : 'pv-msg-err'}`}>
                        {npiMsg}
                      </p>
                    )}
                  </div>
                  <div className="pv-field">
                    <label>Primary specialty</label>
                    <select value={form.primarySpecialty} onChange={set('primarySpecialty')} required>
                      <option value="">Select specialty…</option>
                      {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pv-field pv-field-full">
                  <label>State(s) of licensure</label>
                  <input type="text" placeholder="Type to search · e.g. NY, MA, CA"
                    value={stateQuery} onChange={e => setStateQuery(e.target.value)} />
                  <div className="pv-state-chips">
                    {filteredStates.map(s => (
                      <button key={s} type="button"
                        className={`pv-state-chip ${form.licensureStates.includes(s) ? 'pv-state-chip-active' : ''}`}
                        onClick={() => toggleState(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {form.licensureStates.length > 0 && (
                    <p className="pv-selected-states">Selected: {form.licensureStates.join(', ')}</p>
                  )}
                </div>

                <div className="pv-info-note">
                  <span className="pv-info-icon">ⓘ</span>
                  We'll cross-reference your NPI on submit (npiregistry.cms.hhs.gov · free, no auth)
                </div>
              </div>

              {/* ── Section 3: Government ID ── */}
              <div className="pv-section">
                <h2 className="pv-section-title">3. Government-issued photo ID</h2>
                <p className="pv-section-sub">Driver's license or passport. Verified via Stripe Identity (HIPAA-compatible).</p>
                <div
                  className={`pv-dropzone ${idDragging ? 'pv-dropzone-active' : ''} ${idFile ? 'pv-dropzone-filled' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIdDragging(true); }}
                  onDragLeave={() => setIdDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }}
                    accept=".png,.jpg,.jpeg,.pdf" onChange={handleFileDrop} />
                  {idFile ? (
                    <div className="pv-dropzone-file">
                      <span className="pv-dropzone-icon">📄</span>
                      <span>{idFile.name}</span>
                      <button type="button" className="pv-dropzone-remove"
                        onClick={(e) => { e.stopPropagation(); setIdFile(null); }}>✕</button>
                    </div>
                  ) : (
                    <>
                      <div className="pv-dropzone-icon">⬆</div>
                      <p className="pv-dropzone-label">Drag your ID here, or click to browse</p>
                      <p className="pv-dropzone-hint">PNG, JPG, or PDF · max 10 MB · encrypted at rest</p>
                    </>
                  )}
                </div>
              </div>

              {/* ── Section 4: Attestation ── */}
              <div className="pv-section">
                <h2 className="pv-section-title">4. Attestation</h2>
                <p className="pv-section-sub">Required by HIPAA and OIG compliance.</p>
                <label className="pv-attestation-label">
                  <input type="checkbox" checked={form.attestation}
                    onChange={e => setForm(f => ({ ...f, attestation: e.target.checked }))} />
                  <span>
                    I confirm that all information submitted is accurate and complete, that I am the individual
                    described, and that I authorize MedBuddie to verify my credentials against the NPI Registry,
                    OIG LEIE, and FSMB DocInfo. I understand that providing false information may result in
                    permanent removal from the platform.
                  </span>
                </label>
              </div>

              {error && <p className="pv-error">{error}</p>}

              <button type="submit" className="pv-submit-btn" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit application'}
              </button>
            </form>
          </div>

          {/* ── Right sidebar: What happens next ── */}
          <aside className="pv-sidebar">
            <div className="pv-sidebar-card">
              <h3 className="pv-sidebar-title">What happens next</h3>
              <p className="pv-sidebar-sub">
                Your application flows through 4 automated checks. Most decisions are made within 48 hours.
              </p>
              <ol className="pv-steps-list">
                {STEPS.map((step, i) => (
                  <li key={i} className="pv-step-item">
                    <div className="pv-step-num">{i + 1}</div>
                    <div className="pv-step-text">
                      <strong>{step}</strong>
                      <span>{[
                        'Real time · checks name, state & specialty match',
                        'Stripe Identity · selfie + ID, seconds to complete',
                        'Federal LEIE list · legal requirement',
                        'Disciplinary actions, license status',
                        '48h SLA · final human check on automated results',
                      ][i]}</span>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="pv-privacy-note">
                <strong>Your data is encrypted at rest</strong>
                <p>PII is only accessible to admins during review. We never share your ID with third parties beyond Stripe.</p>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
