import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Dashboard/Sidebar';
import TopNav from '../Dashboard/TopNav';
import './PhysicianVerification.css';

const CHECK_META = {
  npi: {
    label: 'NPI Registry lookup',
    sub:   'Real time · checks name, state & specialty match',
  },
  identity: {
    label: 'Identity verification',
    sub:   'Stripe Identity · document authentic, liveness matched',
  },
  oig: {
    label: 'OIG exclusion check',
    sub:   'Federal LEIE list · legal requirement',
  },
  fsmb: {
    label: 'FSMB license verification',
    sub:   'Disciplinary actions, license status',
  },
  manual: {
    label: 'MedBuddie manual review',
    sub:   '48h SLA · final human check on automated results',
  },
};

function CheckRow({ check, status, detail, subDetail }) {
  const icon = status === 'passed'  ? '✓'
             : status === 'failed'  ? '✕'
             : status === 'flagged' ? '⚠'
             : status === 'pending' ? '…'
             : '○';

  const cls  = status === 'passed'  ? 'pv-check-passed'
             : status === 'failed'  ? 'pv-check-failed'
             : status === 'flagged' ? 'pv-check-flagged'
             : 'pv-check-pending';

  const badge = status === 'passed'    ? 'Passed'
              : status === 'failed'    ? 'Failed'
              : status === 'flagged'   ? 'Flagged'
              : status === 'in_progress' ? 'In progress'
              : 'Pending';

  return (
    <div className={`pv-check-row ${cls}`}>
      <div className={`pv-check-icon ${cls}`}>{icon}</div>
      <div className="pv-check-body">
        <div className="pv-check-header">
          <span className="pv-check-label">{CHECK_META[check].label}</span>
          <span className={`pv-badge pv-badge-${status}`}>{badge}</span>
        </div>
        <p className="pv-check-detail">{detail || CHECK_META[check].sub}</p>
        {subDetail && <p className="pv-check-subdetail">{subDetail}</p>}
      </div>
    </div>
  );
}

export default function StatusPage() {
  const navigate  = useNavigate();
  const [app, setApp]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/physician-applications/status', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setApp(data);
      })
      .catch(() => setError('Could not load application status.'))
      .finally(() => setLoading(false));

    // Poll every 10s while checks are running
    const interval = setInterval(() => {
      fetch('/api/physician-applications/status', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
        .then(r => r.json())
        .then(data => { if (!data.error) setApp(data); })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="pv-loading">Loading your application status…</div>;
  if (error)   return <div className="pv-error-page">{error}<br /><button onClick={() => navigate('/apply-for-verification')}>Start a new application</button></div>;
  if (!app)    return null;

  // Derive check statuses from app data
  const npiStatus      = app.npi_check_passed === true  ? 'passed'
                       : app.npi_check_passed === false ? 'failed'
                       : app.status === 'checks_running' ? 'in_progress' : 'pending';

  const identityStatus = app.identity_check_status === 'passed'   ? 'passed'
                       : app.identity_check_status === 'failed'   ? 'failed'
                       : app.identity_check_status === 'pending'  ? 'pending'
                       : 'pending';

  const oigStatus      = app.oig_check_passed === true  ? 'passed'
                       : app.oig_check_passed === false ? 'failed'
                       : npiStatus === 'passed' ? 'pending' : 'pending';

  const fsmb = app.fsmb_check_result ? JSON.parse(
    typeof app.fsmb_check_result === 'string' ? app.fsmb_check_result : JSON.stringify(app.fsmb_check_result)
  ) : null;
  const fsmbStatus = app.fsmb_check_passed === true   ? 'passed'
                   : app.fsmb_check_passed === false  ? 'failed'
                   : app.fsmb_check_status === 'pending_account' ? 'pending'
                   : oigStatus === 'passed' ? 'pending' : 'pending';

  const manualStatus = app.status === 'approved'  ? 'passed'
                     : app.status === 'rejected'  ? 'failed'
                     : app.status === 'manual_review' ? 'in_progress'
                     : 'pending';

  const oigResult = app.oig_check_result
    ? (typeof app.oig_check_result === 'string' ? JSON.parse(app.oig_check_result) : app.oig_check_result)
    : null;

  return (
    <div className="dashboard-shell">
      <TopNav searchQuery="" onSearch={() => {}} />
      <div className="dashboard-body">
        <Sidebar />
        <div className="pv-status-shell">

          {/* Top banner */}
          {app.status !== 'rejected' && (
            <div className="pv-status-banner">
              <div>
                <p className="pv-status-banner-title">Need to update something?</p>
                <p className="pv-status-banner-sub">
                  If your application is flagged for more information you'll get an email with what to fix.
                </p>
              </div>
              <button className="pv-contact-btn" onClick={() => window.open('mailto:verify@medbuddie.com')}>
                Contact support
              </button>
            </div>
          )}

          {app.status === 'approved' && (
            <div className="pv-approved-banner">
              <span>🎉</span>
              <div>
                <strong>You're now a Verified MD on MedBuddie!</strong>
                <p>Your badge is live on your profile and all your posts.</p>
              </div>
              <button onClick={() => navigate('/dashboard')}>Go to dashboard →</button>
            </div>
          )}

          {app.status === 'rejected' && (
            <div className="pv-rejected-banner">
              <span>✕</span>
              <div>
                <strong>Application not approved</strong>
                <p>{app.rejection_reason || 'Please contact support for more information.'}</p>
              </div>
            </div>
          )}

          {/* Check results */}
          <div className="pv-checks-list">
            <CheckRow check="npi"      status={npiStatus}
              detail={app.npi_check_result?.npiRecord
                ? `Name matched NPI record · ${app.npi_check_result.npiRecord?.basic?.enumeration_date || ''}`
                : app.npi_check_passed === false ? app.npi_check_result?.reason : null}
            />
            <CheckRow check="identity" status={identityStatus}
              detail={app.identity_check_result?.detail || null}
              subDetail={app.identity_check_result?.document || null}
            />
            <CheckRow check="oig"      status={oigStatus}
              detail={oigResult?.passed ? 'Not present on the LEIE federal exclusion list.' : oigResult?.reason}
              subDetail={oigResult?.snapshotDate ? `Cross-referenced full name + NPI against ${oigResult.snapshotDate} OIG snapshot.` : null}
            />
            <CheckRow check="fsmb"     status={fsmbStatus}
              detail={fsmb?.note || (fsmbStatus === 'passed' ? 'Active license · No disciplinary action on record.' : null)}
            />
            <CheckRow check="manual"   status={manualStatus}
              detail={manualStatus === 'in_progress'
                ? 'All automated checks passed. Awaiting a reviewer.'
                : manualStatus === 'passed' ? 'Application approved by MedBuddie team.'
                : 'Pending automated checks.'}
              subDetail={manualStatus === 'in_progress' && app.queue_position != null
                ? `Reviewer SLA: 48h · queue position ${parseInt(app.queue_position) + 1}`
                : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
