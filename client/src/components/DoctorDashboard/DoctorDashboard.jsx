import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import UserAvatar from '../common/UserAvatar';
import './DoctorDashboard.css';
import logo from '../../../assets/medbuddie_logo.png';
import {
    FaUserMd, FaComments, FaVideo, FaPhone, FaCheck, FaTimes,
    FaSignOutAlt, FaPaperPlane, FaCheckCircle, FaClock,
    FaExternalLinkAlt, FaChevronDown, FaChevronUp,
} from 'react-icons/fa';

const STATUS_META = {
    pending:   { label: 'Pending',   bg: '#fff8e1', color: '#f57f17' },
    accepted:  { label: 'Accepted',  bg: '#e8f5e9', color: '#2e7d32' },
    declined:  { label: 'Declined',  bg: '#ffebee', color: '#c62828' },
    completed: { label: 'Completed', bg: '#e8eaf6', color: '#3949ab' },
};

function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export default function DoctorDashboard() {
    const { user, logout } = useUser();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [selected, setSelected]           = useState(null); // active consultation
    const [messages, setMessages]           = useState([]);
    const [msgLoading, setMsgLoading]       = useState(false);
    const [msgInput, setMsgInput]           = useState('');
    const [sending, setSending]             = useState(false);
    const [filter, setFilter]               = useState('all'); // 'all' | 'pending' | 'accepted' | 'completed'
    const [callModal, setCallModal]         = useState(null);
    const [showUserMenu, setShowUserMenu]   = useState(false);
    const messagesEndRef = useRef(null);
    const userMenuRef    = useRef(null);

    useEffect(() => {
        const handle = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target))
                setShowUserMenu(false);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    useEffect(() => {
        loadConsultations();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Poll for new messages every 4 s while a consultation is open
    useEffect(() => {
        if (!selected) return;
        const id = setInterval(() => {
            fetch(`/api/consultations/${selected.id}/messages`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(r => r.ok ? r.json() : null)
                .then(data => { if (Array.isArray(data)) setMessages(data); })
                .catch(() => {});
        }, 4000);
        return () => clearInterval(id);
    }, [selected?.id, token]);

    const loadConsultations = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/consultations', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setConsultations(await res.json());
        } catch { /* silent */ } finally { setLoading(false); }
    };

    const loadMessages = async (consultId) => {
        setMsgLoading(true);
        setMessages([]);
        try {
            const res = await fetch(`/api/consultations/${consultId}/messages`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setMessages(await res.json());
        } catch { /* silent */ } finally { setMsgLoading(false); }
    };

    const selectConsultation = (c) => {
        setSelected(c);
        setMsgInput('');
        loadMessages(c.id);
    };

    const updateStatus = async (id, status) => {
        try {
            const res = await fetch(`/api/consultations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                const updated = await res.json();
                setConsultations(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
                if (selected?.id === id) setSelected(prev => ({ ...prev, ...updated }));
            }
        } catch { /* silent */ }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!msgInput.trim() || !selected || sending) return;
        setSending(true);
        const optimistic = {
            id: Date.now(),
            content: msgInput.trim(),
            senderId: user.id,
            senderName: user.name,
            senderIsDoctor: true,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);
        setMsgInput('');
        try {
            const res = await fetch(`/api/consultations/${selected.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: optimistic.content }),
            });
            if (res.ok) {
                const saved = await res.json();
                setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, ...saved } : m));
            }
        } catch { /* keep optimistic */ } finally { setSending(false); }
    };

    const pendingCount = consultations.filter(c => c.status === 'pending').length;

    // Group consultations by patient so the same patient appears once in the sidebar
    const patientGroups = useMemo(() => {
        const source = filter === 'all'
            ? consultations
            : consultations.filter(c => c.status === filter);
        const map = new Map();
        for (const c of source) {
            if (!map.has(c.patientId)) {
                map.set(c.patientId, {
                    patientId: c.patientId,
                    patientName: c.patientName,
                    patientAvatar: c.patientAvatar,
                    consultations: [],
                });
            }
            map.get(c.patientId).consultations.push(c);
        }
        return Array.from(map.values());
    }, [consultations, filter]);

    // All consultations for the currently selected patient (for the switcher tabs)
    const selectedPatientConsults = useMemo(() =>
        consultations.filter(c => c.patientId === selected?.patientId),
    [consultations, selected?.patientId]);

    const PRIORITY = { pending: 3, accepted: 2, completed: 1, declined: 0 };

    const bestConsultation = (consults) =>
        [...consults].sort((a, b) => (PRIORITY[b.status] ?? 0) - (PRIORITY[a.status] ?? 0))[0];

    const selectPatientGroup = (group) => {
        const best = bestConsultation(group.consultations);
        setSelected(best);
        setMsgInput('');
        loadMessages(best.id);
    };

    const handleLogout = () => { logout(); navigate('/physician'); };

    return (
        <div className="dd-shell">
            {/* ── Top bar ── */}
            <header className="dd-topbar">
                <div className="dd-topbar-left" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <img src={logo} alt="MedBuddie" width="28" height="28" />
                    <span className="dd-brand">MedBuddie</span>
                    <span className="dd-portal-label">Physician Portal</span>
                </div>
                <div className="dd-topbar-right">
                    {pendingCount > 0 && (
                        <span className="dd-pending-badge">{pendingCount} pending</span>
                    )}
                    <div className="dd-user-wrap" ref={userMenuRef}>
                        <button className="dd-user-chip" onClick={() => setShowUserMenu(m => !m)}>
                            <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size={28} />
                            <span>{user?.name?.split(' ')[0] || 'Doctor'}</span>
                            {showUserMenu ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                        </button>
                        {showUserMenu && (
                            <div className="dd-user-dropdown">
                                <div className="dd-user-info">
                                    <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size={36} />
                                    <div>
                                        <p className="dd-user-name">{user?.name}</p>
                                        <p className="dd-user-email">{user?.email}</p>
                                    </div>
                                </div>
                                {user?.doctorSpecialties?.length > 0 && (
                                    <div className="dd-user-specs">
                                        {user.doctorSpecialties.slice(0, 3).map(s => (
                                            <span key={s} className="dd-spec-pill">{s}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="dd-user-divider" />
                                <button className="dd-user-menu-item dd-signout" onClick={handleLogout}>
                                    <FaSignOutAlt size={13} /> Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="dd-body">
                {/* ── Left: consultation list ── */}
                <aside className="dd-sidebar">
                    <div className="dd-sidebar-header">
                        <h2 className="dd-sidebar-title">Consultations</h2>
                        <button className="dd-refresh-btn" onClick={loadConsultations} title="Refresh">↻</button>
                    </div>

                    {/* Filter tabs */}
                    <div className="dd-filter-tabs">
                        {[
                            { key: 'all',       label: 'All' },
                            { key: 'pending',   label: 'Pending' },
                            { key: 'accepted',  label: 'Active' },
                            { key: 'completed', label: 'Done' },
                        ].map(f => (
                            <button
                                key={f.key}
                                className={`dd-filter-tab ${filter === f.key ? 'active' : ''}`}
                                onClick={() => setFilter(f.key)}
                            >
                                {f.label}
                                {f.key === 'pending' && pendingCount > 0 && (
                                    <span className="dd-tab-badge">{pendingCount}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <p className="dd-list-empty">Loading…</p>
                    ) : patientGroups.length === 0 ? (
                        <p className="dd-list-empty">No {filter !== 'all' ? filter : ''} consultations.</p>
                    ) : (
                        <div className="dd-consult-list">
                            {patientGroups.map(group => {
                                const best = bestConsultation(group.consultations);
                                const sm = STATUS_META[best.status] || STATUS_META.pending;
                                const isActive = group.consultations.some(c => c.id === selected?.id);
                                return (
                                    <div
                                        key={group.patientId}
                                        className={`dd-consult-item ${isActive ? 'active' : ''}`}
                                        onClick={() => selectPatientGroup(group)}
                                    >
                                        <UserAvatar name={group.patientName} avatarUrl={group.patientAvatar} size={38} />
                                        <div className="dd-consult-item-body">
                                            <div className="dd-consult-item-row">
                                                <span className="dd-consult-item-name">{group.patientName || 'Patient'}</span>
                                                <span className="dd-status-dot" style={{ background: sm.color }} title={sm.label} />
                                            </div>
                                            <p className="dd-consult-item-concern">{best.concern?.slice(0, 55)}{best.concern?.length > 55 ? '…' : ''}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span className="dd-consult-item-time">{timeAgo(best.createdAt)}</span>
                                                {group.consultations.length > 1 && (
                                                    <span className="dd-multi-badge">{group.consultations.length} requests</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </aside>

                {/* ── Main: consultation detail + chat ── */}
                <main className="dd-main">
                    {!selected ? (
                        <div className="dd-empty-state">
                            <FaUserMd size={52} color="#ccc" />
                            <h3>Select a consultation</h3>
                            <p>Choose a patient request from the left to view details and start communicating.</p>
                        </div>
                    ) : (
                        <div className="dd-detail">
                            {/* Patient info bar */}
                            <div className="dd-detail-header">
                                <div className="dd-detail-who">
                                    <UserAvatar name={selected.patientName} avatarUrl={selected.patientAvatar} size={44} />
                                    <div>
                                        <h3 className="dd-detail-name">{selected.patientName || 'Patient'}</h3>
                                        <span
                                            className="dd-detail-status"
                                            style={{
                                                background: STATUS_META[selected.status]?.bg,
                                                color: STATUS_META[selected.status]?.color,
                                            }}
                                        >
                                            {STATUS_META[selected.status]?.label || selected.status}
                                        </span>
                                        <span className="dd-detail-date">{new Date(selected.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                </div>
                                <div className="dd-detail-actions">
                                    {selected.status === 'pending' && (
                                        <>
                                            <button className="dd-accept-btn" onClick={() => updateStatus(selected.id, 'accepted')}>
                                                <FaCheck size={12} /> Accept
                                            </button>
                                            <button className="dd-decline-btn" onClick={() => updateStatus(selected.id, 'declined')}>
                                                <FaTimes size={12} /> Decline
                                            </button>
                                        </>
                                    )}
                                    {selected.status === 'accepted' && selected.meetingUrl && (
                                        <>
                                            <a className="dd-video-btn" href={selected.meetingUrl} target="_blank" rel="noopener noreferrer">
                                                <FaVideo size={13} /> Video Call
                                            </a>
                                            <button className="dd-complete-btn" onClick={() => updateStatus(selected.id, 'completed')}>
                                                <FaCheckCircle size={12} /> Mark Complete
                                            </button>
                                        </>
                                    )}
                                    {selected.status === 'accepted' && !selected.meetingUrl && (
                                        <button className="dd-video-btn" onClick={() => updateStatus(selected.id, 'accepted')}>
                                            <FaVideo size={13} /> Generate Call Link
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Request switcher — shown when same patient has multiple consultations */}
                            {selectedPatientConsults.length > 1 && (
                                <div className="dd-consult-switcher">
                                    {selectedPatientConsults.map((c, i) => (
                                        <button
                                            key={c.id}
                                            className={`dd-consult-switch-tab ${selected.id === c.id ? 'active' : ''}`}
                                            onClick={() => { setSelected(c); setMsgInput(''); loadMessages(c.id); }}
                                        >
                                            Request {i + 1}
                                            <span style={{ marginLeft: 5, color: STATUS_META[c.status]?.color, fontSize: '0.72rem' }}>
                                                {STATUS_META[c.status]?.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Concern card */}
                            <div className="dd-concern-card">
                                <p className="dd-concern-label">Patient's Concern</p>
                                <p className="dd-concern-text">{selected.concern}</p>
                                {selected.meetingUrl && (
                                    <div className="dd-meeting-row">
                                        <FaVideo size={12} color="#005c55" />
                                        <span className="dd-meeting-label">Video call ready:</span>
                                        <a className="dd-meeting-link" href={selected.meetingUrl} target="_blank" rel="noopener noreferrer">
                                            Join Call <FaExternalLinkAlt size={10} />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Messages */}
                            <div className="dd-chat">
                                <div className="dd-chat-header">
                                    <FaComments size={14} /> Messages
                                </div>
                                <div className="dd-messages">
                                    {msgLoading ? (
                                        <p className="dd-msg-loading">Loading messages…</p>
                                    ) : messages.length === 0 ? (
                                        <p className="dd-msg-empty">No messages yet. Send one to start the conversation.</p>
                                    ) : (
                                        messages.map(m => {
                                            const isMe = m.senderId === user?.id;
                                            return (
                                                <div key={m.id} className={`dd-msg ${isMe ? 'dd-msg-me' : 'dd-msg-them'}`}>
                                                    {!isMe && (
                                                        <UserAvatar name={m.senderName} avatarUrl={m.senderAvatar} size={28} />
                                                    )}
                                                    <div className="dd-msg-bubble">
                                                        {!isMe && <span className="dd-msg-sender">{m.senderName}</span>}
                                                        <p className="dd-msg-text">{m.content}</p>
                                                        <span className="dd-msg-time">{timeAgo(m.createdAt)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {selected.status !== 'declined' && (
                                    <form className="dd-msg-form" onSubmit={sendMessage}>
                                        <input
                                            className="dd-msg-input"
                                            placeholder={selected.status === 'pending'
                                                ? 'Accept the request to enable messaging…'
                                                : 'Type a message…'}
                                            value={msgInput}
                                            onChange={e => setMsgInput(e.target.value)}
                                            disabled={selected.status === 'pending' || sending}
                                            maxLength={2000}
                                        />
                                        <button
                                            type="submit"
                                            className="dd-msg-send"
                                            disabled={!msgInput.trim() || selected.status === 'pending' || sending}
                                        >
                                            <FaPaperPlane size={14} />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Video call modal */}
            {callModal && (
                <div className="dd-modal-overlay" onClick={() => setCallModal(null)}>
                    <div className="dd-modal" onClick={e => e.stopPropagation()}>
                        <div className="dd-modal-header">
                            <span>Video Call — {callModal.patientName}</span>
                            <button onClick={() => setCallModal(null)}><FaTimes /></button>
                        </div>
                        <div className="dd-modal-body">
                            <a className="dd-modal-join-btn" href={callModal.url} target="_blank" rel="noopener noreferrer">
                                <FaVideo /> Open Video Call
                            </a>
                            <p className="dd-modal-hint">Opens in a new tab. Allow camera and microphone access when prompted.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
