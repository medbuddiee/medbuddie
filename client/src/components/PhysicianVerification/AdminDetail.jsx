import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PhysicianVerification.css';

export default function AdminDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [app, setApp]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes]   = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting]     = useState(null);
  const [showReject, setShowReject]     = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/physician-applications/admin/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setApp(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const action = async (act) => {
    if (act === 'reject' && !rejectReason.trim()) return alert('Rejection reason is required.');
    setSubmitting(act);
    const token = localStorage.getItem('token');
    const res   = await fetch(`/api/physician-applications/admin/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ action: act, notes, rejectionReason: rejectReason }),
    });
    if (res.ok) navigate('/admin/verification');
    else { alert('Action failed. Please try again.'); setSubmitting(null); }
  };

  const parseJSON = (v) => {
    if (!v) return null;
    try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return null; }
  };

  if (loading) return <div className="pv-admin-loading">Loading…</div>;
  if (!app)    return <div className="pv-admin-loading">Application not found.</div>;

  const npiRecord    = parseJSON(app.npi_check_result);
  const oigResult    = parseJSON(app.oig_check_result);
  const fsmbResult   = parseJSON(app.fsmb_check_result);
  const idDocUrl     = `/api/physician-applications/admin/${id}/id-document`;
  const states       = parseJSON(app.licensure_states) || [];

  const passIcon = (v) => v === true ? '✓' : v === false ? '✕' : '—';
  const passClass= (v) => v === true ? 'pv-detail-ok' : v === false ? 'pv-detail-fail' : 'pv-detail-pending';

  return (
    <div className="pv-admin-shell">
      <aside className="pv-admin-nav">
        <div className="pv-admin-brand">MedBuddie Admin</div>
        <div className="pv-admin-nav-item" onClick={() => navigate('/admin/verification')}>
          ← Verification queue
        </div>
      </aside>

      <main className="pv-admin-main pv-detail-main">
        <div className="pv-detail-header">
          <div>
            <h1 className="pv-admin-title">{app.full_legal_name}</h1>
            <p className="pv-admin-sub">{app.primary_specialty} · NPI {app.npi_number} · {states.join(', ')}</p>
          </div>
          <span className={`pv-admin-status-badge ${app.status === 'approved' ? 'pv-status-approved' : app.status === 'rejected' ? 'pv-status-rejected' : 'pv-status-ready'}`}>
            {app.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="pv-detail-grid">

          {/* ── Personal info ── */}
          <div className="pv-detail-card">
            <h3>Personal information</h3>
            <div className="pv-detail-rows">
              <div><span>Full name</span><strong>{app.full_legal_name}</strong></div>
              <div><span>Date of birth</span><strong>{app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString() : '—'}</strong></div>
              <div><span>Medical school</span><strong>{app.medical_school || '—'}</strong></div>
              <div><span>Graduation year</span><strong>{app.graduation_year || '—'}</strong></div>
              <div><span>Specialty</span><strong>{app.primary_specialty}</strong></div>
              <div><span>States</span><strong>{states.join(', ') || '—'}</strong></div>
              <div><span>Applied</span><strong>{new Date(app.created_at).toLocaleString()}</strong></div>
            </div>
          </div>

          {/* ── Check results ── */}
          <div className="pv-detail-card">
            <h3>Automated checks</h3>
            <div className="pv-detail-checks">
              <div className={`pv-detail-check ${passClass(app.npi_check_passed)}`}>
                <div className="pv-detail-check-icon">{passIcon(app.npi_check_passed)}</div>
                <div>
                  <strong>NPI Registry</strong>
                  {npiRecord?.npiRecord?.basic && (
                    <p>Name: {[npiRecord.npiRecord.basic.first_name, npiRecord.npiRecord.basic.last_name].filter(Boolean).join(' ')}</p>
                  )}
                  {app.npi_check_passed === false && <p className="pv-detail-fail-reason">{npiRecord?.reason}</p>}
                </div>
              </div>

              <div className={`pv-detail-check ${passClass(app.identity_check_status === 'passed' ? true : app.identity_check_status === 'failed' ? false : null)}`}>
                <div className="pv-detail-check-icon">
                  {app.identity_check_status === 'passed' ? '✓' : app.identity_check_status === 'failed' ? '✕' : '…'}
                </div>
                <div>
                  <strong>Identity verification</strong>
                  <p>{app.identity_check_status === 'passed' ? 'Document authentic, liveness matched' : app.identity_check_status || 'Pending'}</p>
                  {app.identity_verification_id && <p className="pv-detail-id">Stripe ID: {app.identity_verification_id}</p>}
                </div>
              </div>

              <div className={`pv-detail-check ${passClass(app.oig_check_passed)}`}>
                <div className="pv-detail-check-icon">{passIcon(app.oig_check_passed)}</div>
                <div>
                  <strong>OIG exclusion (LEIE)</strong>
                  {oigResult?.passed && <p>Not on exclusion list · {oigResult.snapshotDate} snapshot</p>}
                  {app.oig_check_passed === false && <p className="pv-detail-fail-reason">{oigResult?.reason}</p>}
                </div>
              </div>

              <div className={`pv-detail-check ${passClass(app.fsmb_check_passed)}`}>
                <div className="pv-detail-check-icon">{passIcon(app.fsmb_check_passed)}</div>
                <div>
                  <strong>FSMB license</strong>
                  {fsmbResult?.note && <p>{fsmbResult.note}</p>}
                  {fsmbResult?.licenses && <p>{fsmbResult.licenses.map(l => `${l.state}-${l.number} expires ${l.expires}`).join(' · ')}</p>}
                  {app.fsmb_check_status === 'pending_account' && (
                    <p className="pv-detail-warn">⚠ FSMB institutional account pending — verify manually</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Government ID viewer ── */}
          <div className="pv-detail-card pv-detail-id-card">
            <h3>Government-issued ID <span className="pv-detail-secure-note">🔒 Secure · admins only</span></h3>
            {app.government_id_path ? (
              <div className="pv-id-viewer">
                <img src={idDocUrl} alt="Government ID"
                  onError={(e) => { e.target.style.display='none'; }}
                  className="pv-id-img" />
                <p className="pv-id-hint">ID is encrypted at rest and never shared with third parties.</p>
              </div>
            ) : (
              <p className="pv-detail-pending">No ID document uploaded.</p>
            )}
          </div>

          {/* ── Reviewer actions ── */}
          {!['approved', 'rejected'].includes(app.status) && (
            <div className="pv-detail-card pv-detail-actions-card">
              <h3>Reviewer decision</h3>
              <label className="pv-detail-notes-label">Notes (required if rejecting or flagging)</label>
              <textarea className="pv-detail-notes" rows={3} value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add internal notes visible to all reviewers…" />

              <div className="pv-detail-action-btns">
                <button className="pv-action-approve" disabled={!!submitting}
                  onClick={() => action('approve')}>
                  {submitting === 'approve' ? 'Approving…' : '✓ Approve — grant Verified MD badge'}
                </button>
                <button className="pv-action-info" disabled={!!submitting}
                  onClick={() => action('request_info')}>
                  {submitting === 'request_info' ? '…' : '? Request more information'}
                </button>
                <button className="pv-action-reject-toggle" onClick={() => setShowReject(s => !s)}>
                  ✕ Reject
                </button>
              </div>

              {showReject && (
                <div className="pv-reject-panel">
                  <label>Rejection reason (sent to applicant)</label>
                  <select value={rejectReason} onChange={e => setRejectReason(e.target.value)}>
                    <option value="">Select reason…</option>
                    <option value="NPI not found or does not match application details">NPI mismatch</option>
                    <option value="Identity verification failed">Identity verification failed</option>
                    <option value="Physician appears on OIG exclusion list">OIG exclusion</option>
                    <option value="Medical license is currently suspended or revoked">License suspended/revoked</option>
                    <option value="Medical school not accredited">Medical school not accredited</option>
                    <option value="Incomplete or inconsistent information">Incomplete information</option>
                  </select>
                  <button className="pv-action-reject" disabled={!!submitting || !rejectReason}
                    onClick={() => action('reject')}>
                    {submitting === 'reject' ? 'Rejecting…' : 'Confirm rejection'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
