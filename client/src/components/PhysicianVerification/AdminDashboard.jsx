import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import './PhysicianVerification.css';

const STATUS_FILTERS = [
  { id: 'all',           label: 'All'              },
  { id: 'manual_review', label: 'Clean (auto-pass)'},
  { id: 'fsmb_flagged',  label: 'FSMB flag'        },
  { id: 'expired',       label: 'Expired license'  },
  { id: 'sla_critical',  label: 'SLA < 12h'        },
  { id: 'more_info_requested', label: 'More info requested' },
];

function CheckBadge({ passed, label }) {
  const cls = passed === true ? 'pv-admin-check-ok'
            : passed === false ? 'pv-admin-check-fail'
            : 'pv-admin-check-warn';
  const icon = passed === true ? '✓' : passed === false ? '✕' : '⚠';
  return <span className={`pv-admin-check-badge ${cls}`}>{label} {icon}</span>;
}

function StatusBadge({ status, slaHours }) {
  const urgent = slaHours !== null && slaHours < 12;
  const map = {
    manual_review:        { label: 'Ready to review', cls: 'pv-status-ready'   },
    more_info_requested:  { label: 'More info requested', cls: 'pv-status-info' },
    approved:             { label: 'Approved',         cls: 'pv-status-approved'},
    rejected:             { label: 'Rejected',         cls: 'pv-status-rejected'},
    checks_running:       { label: 'Checks running',   cls: 'pv-status-running' },
    pending:              { label: 'Pending',           cls: 'pv-status-pending' },
  };
  const meta = map[status] || { label: status, cls: 'pv-status-pending' };
  return (
    <span className={`pv-admin-status-badge ${meta.cls} ${urgent ? 'pv-status-urgent' : ''}`}>
      {meta.label}
    </span>
  );
}

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function AdminDashboard() {
  const { user }  = useUser();
  const navigate  = useNavigate();
  const [data, setData]     = useState({ applications: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [q, setQ]           = useState('');

  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ limit: 100 });
    if (filter !== 'all' && !['fsmb_flagged','sla_critical','expired'].includes(filter)) {
      params.set('status', filter);
    }
    if (q.trim()) params.set('q', q.trim());
    const res  = await fetch(`/api/physician-applications/admin?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [filter, q]);

  useEffect(() => { load(); }, [load]);

  // Client-side filter for special tabs
  const visible = data.applications.filter(app => {
    if (filter === 'fsmb_flagged')  return app.fsmb_check_status === 'flagged';
    if (filter === 'sla_critical')  return app.sla_hours_left !== null && app.sla_hours_left < 12;
    if (filter === 'expired')       return app.fsmb_check_status === 'expired';
    return true;
  });

  const stats = data.stats || {};
  const fmt   = (n) => n != null ? Math.round(n) : '—';

  return (
    <div className="pv-admin-shell">
      {/* ── Left nav ── */}
      <aside className="pv-admin-nav">
        <div className="pv-admin-brand">MedBuddie Admin</div>
        <nav>
          {[
            { label: 'Verification queue',   count: stats.pending,              path: '/admin/verification' },
            { label: 'Approved physicians',  count: null,                       path: '/admin/verification/approved' },
            { label: 'Quarterly re-checks',  count: null,                       path: '/admin/verification/rechecks' },
            { label: 'Audit log',            count: null,                       path: '/admin/audit' },
            { label: 'Settings',             count: null,                       path: '/admin/settings' },
          ].map(item => (
            <div key={item.label} className="pv-admin-nav-item"
              onClick={() => item.path === '/admin/verification' ? load() : null}>
              <span>{item.label}</span>
              {item.count != null && <span className="pv-admin-nav-badge">{item.count}</span>}
            </div>
          ))}
        </nav>
        <div className="pv-admin-reviewer">
          <div className="pv-admin-reviewer-avatar">{initials(user?.name)}</div>
          <div>
            <p className="pv-admin-reviewer-name">{user?.name}</p>
            <p className="pv-admin-reviewer-role">Reviewer</p>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="pv-admin-main">
        <div className="pv-admin-header">
          <div>
            <h1 className="pv-admin-title">Verification queue</h1>
            <p className="pv-admin-sub">
              {fmt(stats.pending)} applications awaiting review
              {stats.pending > 0 ? ' · check SLA column for urgent items' : ''}
            </p>
          </div>
          <input className="pv-admin-search" placeholder="⌕ Search by name or NPI"
            value={q} onChange={e => setQ(e.target.value)} />
        </div>

        {/* Stats bar */}
        <div className="pv-admin-stats">
          {[
            { label: 'Pending review',      value: fmt(stats.pending),          sub: null },
            { label: 'Avg decision time',   value: `${fmt(stats.avg_decision_hours)}h`, sub: 'target: under 48h', cls: 'pv-stat-green' },
            { label: 'Approved · this week',value: fmt(stats.approved_this_week), sub: null },
            { label: 'Auto-rejected · this week', value: fmt(stats.rejected_this_week), sub: 'Most due to NPI mismatch', cls: 'pv-stat-red' },
          ].map(s => (
            <div key={s.label} className="pv-admin-stat-card">
              <p className="pv-admin-stat-label">{s.label}</p>
              <p className={`pv-admin-stat-value ${s.cls || ''}`}>{s.value}</p>
              {s.sub && <p className="pv-admin-stat-sub">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="pv-admin-filter-row">
          {STATUS_FILTERS.map(f => (
            <button key={f.id}
              className={`pv-admin-filter-btn ${filter === f.id ? 'pv-admin-filter-active' : ''}`}
              onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="pv-admin-loading">Loading applications…</div>
        ) : (
          <div className="pv-admin-table">
            <div className="pv-admin-table-head">
              <span>Applicant</span>
              <span>NPI</span>
              <span>Specialty</span>
              <span>Automated checks</span>
              <span>SLA</span>
              <span>Status</span>
            </div>
            {visible.length === 0 && (
              <div className="pv-admin-empty">No applications match this filter.</div>
            )}
            {visible.map(app => {
              const sla = app.sla_hours_left != null ? Math.round(app.sla_hours_left) : null;
              const slaUrgent = sla !== null && sla < 12;
              return (
                <div key={app.id} className="pv-admin-table-row"
                  onClick={() => navigate(`/admin/verification/${app.id}`)}>
                  {/* Applicant */}
                  <div className="pv-admin-applicant">
                    <div className="pv-admin-avatar">{initials(app.full_legal_name)}</div>
                    <div>
                      <p className="pv-admin-applicant-name">{app.full_legal_name}</p>
                      <p className="pv-admin-applicant-sub">
                        {app.primary_specialty} · {JSON.parse(app.licensure_states || '[]').join(', ')}
                      </p>
                    </div>
                  </div>
                  <span className="pv-admin-npi">{app.npi_number}</span>
                  <span>{app.primary_specialty}</span>
                  {/* Check badges */}
                  <div className="pv-admin-checks">
                    <CheckBadge passed={app.npi_check_passed} label="NPI" />
                    <CheckBadge passed={app.identity_check_status === 'passed' ? true : app.identity_check_status === 'failed' ? false : null} label="ID" />
                    <CheckBadge passed={app.oig_check_passed} label="OIG" />
                    <CheckBadge passed={app.fsmb_check_passed} label="FSMB" />
                  </div>
                  {/* SLA */}
                  <span className={`pv-admin-sla ${slaUrgent ? 'pv-sla-urgent' : ''}`}>
                    {sla !== null ? `${sla}h left` : '—'}
                  </span>
                  {/* Status */}
                  <StatusBadge status={app.status} slaHours={sla} />
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
