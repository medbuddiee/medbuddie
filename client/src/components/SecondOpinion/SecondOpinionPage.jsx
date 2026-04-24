import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import Sidebar from '../Dashboard/Sidebar';
import TopNav from '../Dashboard/TopNav';
import UserAvatar from '../common/UserAvatar';
import './SecondOpinion.css';
import {
    FaUserMd, FaCheckCircle, FaVideo, FaPhone,
    FaSearch, FaStar, FaTimes, FaChevronDown, FaChevronUp,
    FaPaperclip, FaCalendarAlt, FaComments, FaPaperPlane,
} from 'react-icons/fa';

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

const SPECIALTIES_FILTER = ['All', 'Cardiology', 'Neurology', 'Oncology', 'Endocrinology',
    'Gastroenterology', 'Pulmonology', 'Orthopedics', 'Dermatology',
    'Psychiatry', 'Pediatrics', 'General Practice', 'Internal Medicine'];

const STATUS_COLORS = {
    pending:   { bg: '#fff8e1', color: '#f57f17', label: 'Pending' },
    accepted:  { bg: '#e8f5e9', color: '#2e7d32', label: 'Accepted' },
    declined:  { bg: '#ffebee', color: '#c62828', label: 'Declined' },
    completed: { bg: '#e8eaf6', color: '#3949ab', label: 'Completed' },
};

const FAQS = [
    { q: 'How does a second opinion help me?',
      a: 'A second opinion validates your diagnosis, explores alternatives, and helps you make evidence-backed healthcare decisions.' },
    { q: 'How soon will the doctor respond?',
      a: 'Most physicians respond within 24–48 hours. You\'ll be notified when they accept and schedule a call.' },
    { q: 'How does the video call work?',
      a: 'When a doctor accepts your request, a secure video call link is generated. You can join from the consultation card using your browser — no downloads needed.' },
];

export default function SecondOpinionPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [tab, setTab]                   = useState('find');   // 'find' | 'my-consultations'
    const [doctors, setDoctors]           = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [loadingDoctors, setLoadingDoctors]   = useState(true);
    const [loadingConsults, setLoadingConsults] = useState(false);
    const [specialtyFilter, setSpecialtyFilter] = useState('All');
    const [doctorSearch, setDoctorSearch]   = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [concern, setConcern]             = useState('');
    const [submitting, setSubmitting]       = useState(false);
    const [submitted, setSubmitted]         = useState(false);
    const [openFaq, setOpenFaq]             = useState(null);
    const [callModal, setCallModal]         = useState(null); // { url, doctorName }
    const [doctorTab, setDoctorTab]         = useState('accept'); // for doctor: pending vs history
    const iframeRef = useRef(null);

    // Patient chat state (My Consultations tab)
    const [selectedConsult, setSelectedConsult] = useState(null);
    const [chatMessages, setChatMessages]       = useState([]);
    const [chatMsgInput, setChatMsgInput]       = useState('');
    const [chatSending, setChatSending]         = useState(false);
    const [chatMsgLoading, setChatMsgLoading]   = useState(false);
    const chatEndRef = useRef(null);

    const isDoctor = user?.isDoctor || user?.isVerifiedDoctor;

    // Group patient consultations by doctorId — same doctor appears once in sidebar
    const CONSULT_PRIORITY = { pending: 3, accepted: 2, completed: 1, declined: 0 };
    const bestConsult = (list) =>
        [...list].sort((a, b) => (CONSULT_PRIORITY[b.status] ?? 0) - (CONSULT_PRIORITY[a.status] ?? 0))[0];

    const doctorGroups = useMemo(() => {
        const map = new Map();
        for (const c of consultations) {
            if (!map.has(c.doctorId)) {
                map.set(c.doctorId, {
                    doctorId: c.doctorId,
                    doctorName: c.doctorName,
                    doctorAvatar: c.doctorAvatar,
                    doctorSpecialties: c.doctorSpecialties,
                    consultations: [],
                });
            }
            map.get(c.doctorId).consultations.push(c);
        }
        return Array.from(map.values());
    }, [consultations]);

    const selectDoctorGroup = (group) => {
        setSelectedConsult(bestConsult(group.consultations));
    };

    // All consultations with the currently selected doctor (for the switcher tabs)
    const selectedDoctorConsults = useMemo(() =>
        consultations.filter(c => c.doctorId === selectedConsult?.doctorId),
    [consultations, selectedConsult?.doctorId]);

    // Load doctors
    useEffect(() => {
        if (tab !== 'find') return;
        setLoadingDoctors(true);
        let url = '/api/users/doctors/list';
        const params = [];
        if (specialtyFilter !== 'All') params.push(`specialty=${encodeURIComponent(specialtyFilter)}`);
        if (doctorSearch.trim()) params.push(`q=${encodeURIComponent(doctorSearch.trim())}`);
        if (params.length) url += '?' + params.join('&');
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setDoctors(d); })
            .catch(() => {})
            .finally(() => setLoadingDoctors(false));
    }, [tab, specialtyFilter, token]);

    // Load consultations
    useEffect(() => {
        if (tab !== 'my-consultations') return;
        setLoadingConsults(true);
        fetch('/api/consultations', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setConsultations(d); })
            .catch(() => {})
            .finally(() => setLoadingConsults(false));
    }, [tab, token]);

    // Load messages when a consultation is selected in the My Consultations tab
    useEffect(() => {
        if (!selectedConsult) return;
        setChatMsgLoading(true);
        setChatMessages([]);
        fetch(`/api/consultations/${selectedConsult.id}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setChatMessages(d); })
            .catch(() => {})
            .finally(() => setChatMsgLoading(false));
    }, [selectedConsult?.id, token]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Poll for new messages every 4 s while a consultation is open
    useEffect(() => {
        if (!selectedConsult) return;
        const id = setInterval(() => {
            fetch(`/api/consultations/${selectedConsult.id}/messages`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(r => r.ok ? r.json() : null)
                .then(data => { if (Array.isArray(data)) setChatMessages(data); })
                .catch(() => {});
        }, 4000);
        return () => clearInterval(id);
    }, [selectedConsult?.id, token]);

    // Poll consultation list every 8 s on the My Consultations tab so status
    // changes (e.g. doctor accepts) appear without a manual refresh
    useEffect(() => {
        if (tab !== 'my-consultations') return;
        const id = setInterval(() => {
            fetch('/api/consultations', { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.json())
                .then(d => {
                    if (!Array.isArray(d)) return;
                    setConsultations(d);
                    // Keep selectedConsult in sync with latest server data
                    setSelectedConsult(prev => {
                        if (!prev) return prev;
                        return d.find(c => c.id === prev.id) ?? prev;
                    });
                })
                .catch(() => {});
        }, 8000);
        return () => clearInterval(id);
    }, [tab, token]);

    const sendChatMessage = async (e) => {
        e.preventDefault();
        if (!chatMsgInput.trim() || !selectedConsult || chatSending) return;
        setChatSending(true);
        const optimistic = {
            id: Date.now(),
            content: chatMsgInput.trim(),
            senderId: user.id,
            senderName: user.name,
            createdAt: new Date().toISOString(),
        };
        setChatMessages(prev => [...prev, optimistic]);
        setChatMsgInput('');
        try {
            const res = await fetch(`/api/consultations/${selectedConsult.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: optimistic.content }),
            });
            if (res.ok) {
                const saved = await res.json();
                setChatMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, ...saved } : m));
            }
        } catch { /* keep optimistic */ } finally { setChatSending(false); }
    };

    const handleDoctorSearch = (e) => {
        e.preventDefault();
        // Re-trigger effect
        setDoctors([]);
        setLoadingDoctors(true);
        let url = '/api/users/doctors/list';
        const params = [];
        if (specialtyFilter !== 'All') params.push(`specialty=${encodeURIComponent(specialtyFilter)}`);
        if (doctorSearch.trim()) params.push(`q=${encodeURIComponent(doctorSearch.trim())}`);
        if (params.length) url += '?' + params.join('&');
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setDoctors(d); })
            .catch(() => {})
            .finally(() => setLoadingDoctors(false));
    };

    const handleRequestConsultation = async (e) => {
        e.preventDefault();
        if (!selectedDoctor || !concern.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/consultations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ doctorId: selectedDoctor.id, concern: concern.trim() }),
            });
            if (res.ok) {
                setSubmitted(true);
                setConcern('');
            } else {
                const d = await res.json();
                alert(d.error || 'Failed to submit consultation request');
            }
        } catch { alert('Network error'); } finally { setSubmitting(false); }
    };

    // Doctor actions — accept/decline
    const updateConsultation = async (id, status) => {
        try {
            const res = await fetch(`/api/consultations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                const updated = await res.json();
                setConsultations(prev => prev.map(c =>
                    c.id === id ? { ...c, ...updated } : c
                ));
            }
        } catch { /* silent */ }
    };

    const joinCall = (c) => {
        setCallModal({ url: c.meetingUrl, doctorName: isDoctor ? c.patientName : c.doctorName });
    };

    return (
        <div className="dashboard-shell">
            <TopNav searchQuery="" onSearch={() => {}} />
            <div className="dashboard-body">
                <Sidebar />
                <main className="so-main-new">
                    {/* Doctor redirect banner */}
                    {isDoctor && (
                        <div className="so-doctor-banner">
                            <FaUserMd size={18} />
                            <div>
                                <p className="so-doctor-banner-title">You're logged in as a verified physician</p>
                                <p className="so-doctor-banner-sub">Manage patient requests, messages and calls from your dedicated portal.</p>
                            </div>
                            <button className="so-doctor-banner-btn" onClick={() => navigate('/doctor-dashboard')}>
                                Go to Physician Portal →
                            </button>
                        </div>
                    )}

                    {/* Header */}
                    <div className="so-header-new">
                        <div>
                            <h2 className="so-title-new">Second Opinion</h2>
                            <p className="so-sub-new">Connect with verified doctors for a professional second opinion on your health concerns.</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="so-tabs-new">
                        {[
                            { key: 'find',             label: isDoctor ? 'Patient Requests' : 'Find a Doctor' },
                            { key: 'my-consultations', label: isDoctor ? 'My Consultations' : 'My Requests' },
                        ].map(t => (
                            <button key={t.key} className={`so-tab-new ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ══ Find a Doctor tab ══════════════════════════════════════ */}
                    {tab === 'find' && (
                        <div className="so-find-layout">
                            <div className="so-find-main">
                                {/* Specialty filter */}
                                <div className="so-spec-filter">
                                    {SPECIALTIES_FILTER.map(s => (
                                        <button
                                            key={s}
                                            className={`so-spec-chip ${specialtyFilter === s ? 'active' : ''}`}
                                            onClick={() => setSpecialtyFilter(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>

                                {/* Search doctors */}
                                <form className="so-doctor-search" onSubmit={handleDoctorSearch}>
                                    <div className="so-search-wrap">
                                        <FaSearch className="so-search-icon" />
                                        <input
                                            className="so-search-input"
                                            placeholder="Search doctors by name or specialty…"
                                            value={doctorSearch}
                                            onChange={e => setDoctorSearch(e.target.value)}
                                        />
                                    </div>
                                </form>

                                {/* Doctors list */}
                                {loadingDoctors ? (
                                    <p className="so-loading">Loading doctors…</p>
                                ) : doctors.length === 0 ? (
                                    <div className="so-empty-doctors">
                                        <FaUserMd size={40} color="#ccc" />
                                        <p>No verified doctors found for this specialty yet.</p>
                                        <p className="so-empty-hint">Are you a doctor? <button className="so-link-btn" onClick={() => navigate('/doctor-portal')}>Register here</button></p>
                                    </div>
                                ) : (
                                    <div className="so-doctors-list">
                                        {doctors.map(doc => (
                                            <div
                                                key={doc.id}
                                                className={`so-doctor-card ${selectedDoctor?.id === doc.id ? 'selected' : ''}`}
                                                onClick={() => { setSelectedDoctor(doc); setSubmitted(false); }}
                                            >
                                                <UserAvatar name={doc.name} avatarUrl={doc.avatarUrl} size={48} />
                                                <div className="so-doctor-info">
                                                    <div className="so-doctor-name-row">
                                                        <span className="so-doctor-name">{doc.name}</span>
                                                        <span className="so-verified-badge"><FaCheckCircle size={11} /> Verified</span>
                                                    </div>
                                                    {doc.doctorSpecialties?.length > 0 && (
                                                        <div className="so-doctor-specs">
                                                            {doc.doctorSpecialties.slice(0, 3).map(s => (
                                                                <span key={s} className="so-spec-pill">{s}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {doc.doctorBio && <p className="so-doctor-bio">{doc.doctorBio}</p>}
                                                    <div className="so-doctor-meta">
                                                        {doc.yearsExperience > 0 && <span><FaStar size={11} color="#f9a825" /> {doc.yearsExperience} yrs experience</span>}
                                                        <span>{doc.completedConsultations} consultations completed</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className={`so-select-btn ${selectedDoctor?.id === doc.id ? 'active' : ''}`}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedDoctor(doc); setSubmitted(false); }}
                                                >
                                                    {selectedDoctor?.id === doc.id ? '✓ Selected' : 'Select'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right panel — request form / FAQs */}
                            <div className="so-find-sidebar">
                                {/* Request form */}
                                {selectedDoctor && !submitted ? (
                                    <div className="so-request-panel">
                                        <h3 className="so-panel-title">Request Consultation</h3>
                                        <div className="so-selected-doc-row">
                                            <UserAvatar name={selectedDoctor.name} avatarUrl={selectedDoctor.avatarUrl} size={36} />
                                            <div>
                                                <p className="so-selected-doc-name">{selectedDoctor.name}</p>
                                                <p className="so-selected-doc-spec">{selectedDoctor.doctorSpecialties?.slice(0,2).join(', ')}</p>
                                            </div>
                                            <button className="so-deselect-btn" onClick={() => setSelectedDoctor(null)}>
                                                <FaTimes size={12} />
                                            </button>
                                        </div>
                                        <form onSubmit={handleRequestConsultation}>
                                            <label className="so-form-label">Describe your concern *</label>
                                            <textarea
                                                className="so-concern-textarea"
                                                rows={5}
                                                placeholder="Describe your symptoms, diagnosis, or the question you'd like a second opinion on…"
                                                value={concern}
                                                onChange={e => setConcern(e.target.value)}
                                                required
                                                maxLength={2000}
                                            />
                                            <button
                                                type="submit"
                                                className="so-submit-btn"
                                                disabled={submitting || !concern.trim()}
                                            >
                                                {submitting ? 'Sending…' : 'Send Consultation Request'}
                                            </button>
                                        </form>
                                    </div>
                                ) : submitted ? (
                                    <div className="so-submitted-panel">
                                        <FaCheckCircle size={36} color="#2e7d32" />
                                        <h3>Request Sent!</h3>
                                        <p>Your consultation request has been sent to <strong>{selectedDoctor?.name}</strong>. They will respond within 24–48 hours.</p>
                                        <button className="so-new-request-btn" onClick={() => { setSubmitted(false); setSelectedDoctor(null); setTab('my-consultations'); }}>
                                            View My Requests
                                        </button>
                                    </div>
                                ) : (
                                    <div className="so-select-prompt">
                                        <FaUserMd size={32} color="#ccc" />
                                        <p>Select a doctor to request a consultation</p>
                                    </div>
                                )}

                                {/* FAQs */}
                                <div className="so-faqs-panel">
                                    <h3 className="so-panel-title">Frequently Asked Questions</h3>
                                    {FAQS.map((f, i) => (
                                        <div key={i} className="so-faq-item">
                                            <button className="so-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                                {f.q}
                                                {openFaq === i ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                                            </button>
                                            {openFaq === i && <p className="so-faq-a">{f.a}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══ My Consultations tab — two-panel chat layout ══════════ */}
                    {tab === 'my-consultations' && (
                        loadingConsults ? (
                            <p className="so-loading">Loading…</p>
                        ) : consultations.length === 0 ? (
                            <div className="so-empty-consults">
                                <FaCalendarAlt size={40} color="#ccc" />
                                <p>You haven't requested any consultations yet.</p>
                                <button className="so-submit-btn" onClick={() => setTab('find')}>
                                    Find a Doctor
                                </button>
                            </div>
                        ) : (
                            <div className="so-chat-layout">
                                {/* Left: conversation list */}
                                <div className="so-chat-sidebar">
                                    <div className="so-chat-sidebar-header">
                                        <FaComments size={13} style={{ marginRight: 6 }} />
                                        My Consultations
                                    </div>
                                    {doctorGroups.map(group => {
                                        const best = bestConsult(group.consultations);
                                        const sm = STATUS_COLORS[best.status] || STATUS_COLORS.pending;
                                        const isActive = group.consultations.some(c => c.id === selectedConsult?.id);
                                        return (
                                            <div
                                                key={group.doctorId}
                                                className={`so-chat-item ${isActive ? 'active' : ''}`}
                                                onClick={() => selectDoctorGroup(group)}
                                            >
                                                <UserAvatar name={group.doctorName} avatarUrl={group.doctorAvatar} size={38} />
                                                <div className="so-chat-item-body">
                                                    <div className="so-chat-item-row">
                                                        <span className="so-chat-item-name">{group.doctorName}</span>
                                                        <span className="so-chat-status-dot" style={{ background: sm.color }} title={sm.label} />
                                                    </div>
                                                    <p className="so-chat-item-concern">
                                                        {best.concern?.slice(0, 50)}{best.concern?.length > 50 ? '…' : ''}
                                                    </p>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span className="so-chat-item-time">{timeAgo(best.createdAt)}</span>
                                                        {group.consultations.length > 1 && (
                                                            <span className="so-chat-multi-badge">{group.consultations.length} requests</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Right: chat panel */}
                                <div className="so-chat-main">
                                    {!selectedConsult ? (
                                        <div className="so-chat-empty-state">
                                            <FaComments size={40} color="#ccc" />
                                            <p>Select a conversation to view messages</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Doctor info header */}
                                            <div className="so-chat-header">
                                                <UserAvatar name={selectedConsult.doctorName} avatarUrl={selectedConsult.doctorAvatar} size={38} />
                                                <div>
                                                    <p className="so-chat-doctor-name">{selectedConsult.doctorName}</p>
                                                    {selectedConsult.doctorSpecialties?.length > 0 && (
                                                        <p className="so-chat-doctor-spec">{selectedConsult.doctorSpecialties.slice(0,2).join(', ')}</p>
                                                    )}
                                                </div>
                                                <span
                                                    className="so-status-badge"
                                                    style={{
                                                        background: STATUS_COLORS[selectedConsult.status]?.bg,
                                                        color: STATUS_COLORS[selectedConsult.status]?.color,
                                                        marginLeft: 'auto',
                                                    }}
                                                >
                                                    {STATUS_COLORS[selectedConsult.status]?.label}
                                                </span>
                                                {selectedConsult.status === 'accepted' && selectedConsult.meetingUrl && (
                                                    <a
                                                        href={selectedConsult.meetingUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="so-chat-video-btn"
                                                        title={selectedConsult.meetingUrl}
                                                    >
                                                        <FaVideo size={13} /> Join Video Call
                                                    </a>
                                                )}
                                                {selectedConsult.status === 'accepted' && !selectedConsult.meetingUrl && (
                                                    <span className="so-chat-awaiting-link">
                                                        <FaVideo size={12} /> Awaiting call link from doctor…
                                                    </span>
                                                )}
                                            </div>

                                            {/* Request switcher — shown when patient has multiple consultations with same doctor */}
                                            {selectedDoctorConsults.length > 1 && (
                                                <div className="so-chat-switcher">
                                                    {selectedDoctorConsults.map((c, i) => {
                                                        const sm = STATUS_COLORS[c.status] || STATUS_COLORS.pending;
                                                        return (
                                                            <button
                                                                key={c.id}
                                                                className={`so-chat-switch-tab ${selectedConsult.id === c.id ? 'active' : ''}`}
                                                                onClick={() => setSelectedConsult(c)}
                                                            >
                                                                Request {i + 1}
                                                                <span style={{ marginLeft: 5, color: sm.color, fontSize: '0.72rem' }}>
                                                                    {sm.label}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Concern + notes */}
                                            <div className="so-chat-concern-bar">
                                                <p className="so-chat-concern-label">Your concern</p>
                                                <p className="so-chat-concern-text">{selectedConsult.concern}</p>
                                                {selectedConsult.notes && (
                                                    <div className="so-chat-notes">
                                                        <strong>Doctor's notes:</strong> {selectedConsult.notes}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Messages */}
                                            <div className="so-chat-messages">
                                                {chatMsgLoading ? (
                                                    <p className="so-chat-msg-hint">Loading messages…</p>
                                                ) : chatMessages.length === 0 ? (
                                                    <p className="so-chat-msg-hint">
                                                        {selectedConsult.status === 'pending'
                                                            ? 'Waiting for the doctor to accept your request before you can message.'
                                                            : 'No messages yet. Send one to start the conversation.'}
                                                    </p>
                                                ) : (
                                                    chatMessages.map(m => {
                                                        const isMe = m.senderId === user?.id;
                                                        return (
                                                            <div key={m.id} className={`so-chat-msg ${isMe ? 'so-chat-msg-me' : 'so-chat-msg-them'}`}>
                                                                {!isMe && (
                                                                    <UserAvatar name={m.senderName} avatarUrl={m.senderAvatar} size={26} />
                                                                )}
                                                                <div className="so-chat-msg-bubble">
                                                                    {!isMe && <span className="so-chat-msg-sender">{m.senderName}</span>}
                                                                    <p className="so-chat-msg-text">{m.content}</p>
                                                                    <span className="so-chat-msg-time">{timeAgo(m.createdAt)}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                                <div ref={chatEndRef} />
                                            </div>

                                            {/* Message input */}
                                            {selectedConsult.status !== 'declined' && selectedConsult.status !== 'completed' && (
                                                <form className="so-chat-input-row" onSubmit={sendChatMessage}>
                                                    <input
                                                        className="so-chat-input"
                                                        placeholder={
                                                            selectedConsult.status === 'pending'
                                                                ? 'Waiting for doctor to accept…'
                                                                : 'Type a message…'
                                                        }
                                                        value={chatMsgInput}
                                                        onChange={e => setChatMsgInput(e.target.value)}
                                                        disabled={selectedConsult.status === 'pending' || chatSending}
                                                        maxLength={2000}
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="so-chat-send-btn"
                                                        disabled={!chatMsgInput.trim() || selectedConsult.status === 'pending' || chatSending}
                                                    >
                                                        <FaPaperPlane size={13} />
                                                    </button>
                                                </form>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </main>
            </div>

            {/* ── Video call modal ─────────────────────────────────────────── */}
            {callModal && (
                <div className="call-modal-overlay">
                    <div className="call-modal-box">
                        <div className="call-modal-header">
                            <span>Call with {callModal.doctorName}</span>
                            <button className="call-modal-close" onClick={() => setCallModal(null)}>
                                <FaTimes size={16} />
                            </button>
                        </div>
                        <div className="call-modal-body">
                            <div className="call-info-row">
                                <FaVideo size={18} color="#005c55" />
                                <span>Video call with {callModal.doctorName}</span>
                            </div>
                            <p className="call-room-url">{callModal.url}</p>
                            <div className="call-actions">
                                <a
                                    href={callModal.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="call-open-btn"
                                >
                                    <FaVideo size={15} /> Join Video Call
                                </a>
                                <p className="call-hint">Opens in a new tab. Allow camera and microphone access when prompted.</p>
                            </div>
                            <div className="call-tips">
                                <strong>Before joining:</strong>
                                <ul>
                                    <li>Allow camera and microphone access when prompted</li>
                                    <li>Find a quiet, private location</li>
                                    <li>Have your medical records ready to discuss</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
