import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import './SecondOpinion.css';
import logo from '../../../assets/medbuddie_logo.png';
import {
    FaPaperclip, FaImage, FaLink, FaPlus, FaSearch,
    FaExclamationTriangle, FaChevronRight, FaChevronDown,
    FaCheckCircle, FaCog, FaUserCircle, FaCheck,
} from 'react-icons/fa';

/* ── Static data ─────────────────────────────────────────────────────────── */
const DOCTORS = [
    { id: 1, name: 'Dr. S. Patel',  specialty: 'Hypertension', tag: 'Nephrologist',  initials: 'SP', color: '#005c55' },
    { id: 2, name: 'Dr. J. Rivera', specialty: 'Cardiology',   tag: 'Cardiologist',  initials: 'JR', color: '#1565c0' },
    { id: 3, name: 'Dr. W. Nguyen', specialty: 'Cardiology',   tag: 'Cardiologist',  initials: 'WN', color: '#6a1b9a' },
];

const FAQS = [
    {
        q: 'How does a second opinion help me?',
        a: 'A second opinion from a licensed physician helps you validate your diagnosis, explore alternative treatments, and make more informed healthcare decisions backed by evidence.',
    },
    {
        q: 'How soon should I expect a response?',
        a: 'Most physicians respond within 24–48 hours. Response time may vary based on physician availability and the complexity of your case.',
    },
    {
        q: 'Who reviews my case?',
        a: 'Your case is reviewed by licensed, board-certified physicians who have been verified on the MedBuddie platform.',
    },
];

const RESOURCES = [
    'Medical Response Guide',
    'Latest Treatment Guidelines',
    'How Specialist Selection Works',
    'Uploading Records Properly',
];

const SUBMIT_CHECKS = [
    'Case Summary',
    'Medical Concern',
    'Medical History',
    'Attached Source(s)',
    'Latest Records',
];

/* ══════════════════════════════════════════════════════════════════════════════
   SECOND OPINION PAGE
   ══════════════════════════════════════════════════════════════════════════════ */
export default function SecondOpinionPage() {
    const { user }   = useUser();
    const navigate   = useNavigate();

    const [concern,     setConcern]     = useState('');
    const [medHistory,  setMedHistory]  = useState('');
    const [selectedDoc, setSelectedDoc] = useState(DOCTORS[0]);
    const [faqOpen,     setFaqOpen]     = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [submitted,   setSubmitted]   = useState(false);
    const [submitting,  setSubmitting]  = useState(false);

    const toggleFaq = (i) => setFaqOpen(prev => ({ ...prev, [i]: !prev[i] }));

    const handleSubmit = () => {
        if (!concern.trim() || submitting) return;
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 4000);
        }, 800);
    };

    /* ── Filtered doctors by search ── */
    const filteredDoctors = DOCTORS.filter(d =>
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="so-shell">

            {/* ── Top nav ── */}
            <header className="so-header">
                <div
                    className="so-header-left"
                    onClick={() => navigate('/dashboard')}
                    style={{ cursor: 'pointer' }}
                >
                    <img src={logo} alt="MedBuddie" width="32" height="32" />
                    <span className="so-brand">MedBuddie</span>
                </div>
                <div className="so-header-right">
                    <button className="so-header-btn" onClick={() => navigate('/edit-profile')}>
                        <FaCog size={12} /> Settings
                    </button>
                    <button className="so-header-user" onClick={() => navigate('/profile')}>
                        <FaUserCircle size={15} />
                        {user?.name || user?.username || 'User'} ▾
                    </button>
                </div>
            </header>

            <div className="so-page">

                {/* ── Page title + filter ── */}
                <div className="so-title-row">
                    <div>
                        <h1 className="so-title">Get a Second Opinion</h1>
                        <p className="so-subtitle">
                            Here are second opinion requests from a licensed physician. Select a specialty,
                            provide your medical history, and update your latest health records to receive
                            a personalized, evidence-based second opinion.
                        </p>
                    </div>
                    <div className="so-filter-toggle">
                        <span className="so-filter-label">Great Distributions</span>
                        <div className="so-toggle-pill" />
                    </div>
                </div>

                {/* ── Stats bar ── */}
                <div className="so-stats-bar">
                    <div className="so-stats-left">
                        <span className="so-stat">Reputation <strong>1,240 pts</strong> ✦</span>
                        <span className="so-stat-sep" />
                        <span className="so-stat">Responses: <strong>278</strong></span>
                        <span className="so-stat-sep" />
                        <span className="so-stat">Avg rating <strong>4.9 / 5</strong> ✦</span>
                    </div>
                    <div className="so-search-wrap">
                        <FaSearch className="so-search-icon" size={11} />
                        <input
                            className="so-search"
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* ── Two-column body ── */}
                <div className="so-body">

                    {/* ════ MAIN COLUMN ════ */}
                    <div className="so-main">

                        {/* ── Describe Your Concern ── */}
                        <div className="so-card">
                            <div className="so-card-head">
                                <h3 className="so-card-title">Describe Your Concern</h3>
                                <div className="so-card-head-right">
                                    <span className="so-attach-count">
                                        <FaPaperclip size={10} /> 127
                                    </span>
                                    <FaChevronDown size={10} color="#bbb" />
                                </div>
                            </div>

                            <textarea
                                className="so-textarea"
                                placeholder="Type your medical concern here — describe symptoms, duration, and context…"
                                value={concern}
                                onChange={e => setConcern(e.target.value)}
                                rows={4}
                            />

                            <div className="so-note-box">
                                <FaExclamationTriangle size={12} color="#f9a825" style={{ flexShrink: 0 }} />
                                <span>
                                    Note: Please attach at least one relevant source as all medical
                                    claims must be backed by evidence.
                                </span>
                            </div>

                            <div className="so-btn-row">
                                <button className="so-action-btn"><FaPaperclip size={11} /> Attach Files</button>
                                <button className="so-action-btn"><FaImage     size={11} /> Upload Image</button>
                                <button className="so-action-btn"><FaLink      size={11} /> Source</button>
                                <button className="so-action-btn so-action-dashed">
                                    <FaPlus size={10} /> Attach Guidelines or Study
                                </button>
                            </div>

                            <div className="so-info-banner">
                                <span className="so-info-emoji">💬</span>
                                Always include the source when providing a medical treatment claim!
                            </div>
                        </div>

                        {/* ── Medical History ── */}
                        <div className="so-card">
                            <div className="so-card-head">
                                <div className="so-card-head-left">
                                    <h3 className="so-card-title">Medical History</h3>
                                    <FaCheckCircle size={13} color="#005c55" />
                                </div>
                                <button className="so-pill-btn">Concerteur ▾</button>
                            </div>

                            <p className="so-history-hint">
                                Age, gender, existing conditions, recent surgeries, medications,
                                relevant medical history, fler…
                            </p>

                            <textarea
                                className="so-textarea"
                                placeholder="Describe your medical history…"
                                value={medHistory}
                                onChange={e => setMedHistory(e.target.value)}
                                rows={4}
                            />

                            <div className="so-history-footer">
                                <div className="so-btn-row" style={{ margin: 0 }}>
                                    <button className="so-action-btn"><FaPaperclip size={11} /> Attach Files</button>
                                    <button className="so-action-btn"><FaImage     size={11} /> Upload Image</button>
                                    <button className="so-action-btn"><FaLink      size={11} /> Source</button>
                                </div>
                                <div className="so-history-submit-row">
                                    <span className="so-char-count">
                                        {medHistory.length > 0 ? `${medHistory.length} chars` : '0.839'}
                                    </span>
                                    <button
                                        className="so-respond-btn"
                                        disabled={!medHistory.trim()}
                                    >
                                        Respond
                                    </button>
                                </div>
                            </div>

                            <div className="so-history-extra">
                                <span className="so-volume-text">Volume: rahments Genricatedn… 11,789</span>
                                <button className="so-action-btn so-action-dashed">
                                    <FaPlus size={10} /> Attach Guidelines or Study
                                </button>
                            </div>
                            <p className="so-char-hint">Characters: (9,1,4,200&amp;l)</p>
                        </div>

                        {/* ── Update Records ── */}
                        <div className="so-card">
                            <div className="so-card-head">
                                <div className="so-card-head-left">
                                    <h3 className="so-card-title">Update Records</h3>
                                    <FaCheckCircle size={13} color="#005c55" />
                                </div>
                                <div className="so-card-head-right">
                                    <button className="so-action-btn">
                                        <FaPlus size={10} /> Add Research / Reports
                                    </button>
                                    <FaChevronDown size={10} color="#bbb" />
                                </div>
                            </div>

                            {/* Record 1 */}
                            <div className="so-record">
                                <div className="so-record-av so-av-teal">W</div>
                                <div className="so-record-body">
                                    <div className="so-record-top">
                                        <span className="so-record-name">Weight</span>
                                        <span className="so-record-val">185 lbs</span>
                                        <span className="so-record-img-count">1 image</span>
                                    </div>
                                    <p className="so-record-desc">
                                        Cor atses with prahe with are angoing inprerationl, dry cough that
                                        has sated for case to ra provth. Could the boce sign, phucing
                                        consiltont? Sencern that hailth roncors.
                                    </p>
                                    <div className="so-record-tags">
                                        <span className="so-tag-chip">#Cmost</span>
                                        <span className="so-tag-chip">Pulmonology</span>
                                        <button className="so-mini-btn so-mini-credid">Credid</button>
                                        <button className="so-mini-btn so-mini-select">Select ›</button>
                                    </div>
                                </div>
                            </div>

                            {/* Record 2 */}
                            <div className="so-record">
                                <div className="so-record-av so-av-blue">P</div>
                                <div className="so-record-body">
                                    <div className="so-record-top">
                                        <span className="so-record-name">Dr. Patel</span>
                                        <span className="so-record-val">185 lbs</span>
                                        <span className="so-record-img-count">1 image</span>
                                        <FaChevronDown size={10} color="#bbb" style={{ marginLeft: 'auto' }} />
                                    </div>
                                    <p className="so-record-desc">
                                        I aperteniores, Nguien ating ceve, sit tibe for baine recommeneded
                                        conseter checking if thae that ory plmual medical historn. U dasnges
                                        mut boud flor deulingthat atoms.
                                    </p>
                                    <div className="so-record-tags">
                                        <span className="so-tag-chip">#Cmost</span>
                                        <span className="so-tag-chip">Pulmonology</span>
                                        <button className="so-mini-btn so-mini-source">Sourcel</button>
                                        <button className="so-mini-btn so-mini-select">Select ›</button>
                                    </div>
                                </div>
                            </div>

                            {/* FAQ mini row */}
                            <div className="so-record-faq-row">
                                <span className="so-rfaq-label">FAQs</span>
                                <span className="so-rfaq-item">How does a second opinion response?</span>
                                <span className="so-rfaq-sep">·</span>
                                <span className="so-rfaq-item">Movical litatitor s…</span>
                                <span className="so-rfaq-sep">·</span>
                                <span className="so-rfaq-item">Write resviws my crase?</span>
                            </div>
                        </div>

                        {/* ── FAQs ── */}
                        <div className="so-card">
                            <h3 className="so-card-title" style={{ marginBottom: '0.75rem' }}>FAQs</h3>
                            {FAQS.map((faq, i) => (
                                <div key={i} className="so-faq-item">
                                    <button className="so-faq-btn" onClick={() => toggleFaq(i)}>
                                        <span className="so-faq-icon">{faqOpen[i] ? '−' : '+'}</span>
                                        <span className="so-faq-q">{faq.q}</span>
                                        <FaChevronRight
                                            size={10}
                                            className={`so-faq-chevron ${faqOpen[i] ? 'so-faq-open' : ''}`}
                                        />
                                    </button>
                                    {faqOpen[i] && (
                                        <p className="so-faq-answer">{faq.a}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* ════ RIGHT SIDEBAR ════ */}
                    <aside className="so-sidebar">

                        {/* ── Choose Physician Specialty ── */}
                        <div className="so-card">
                            <h4 className="so-sidebar-title">Choose Physician Specialty</h4>

                            {/* Featured */}
                            <div className="so-featured-doc">
                                <div className="so-featured-av" style={{ background: selectedDoc.color }}>
                                    {selectedDoc.initials}
                                </div>
                                <div>
                                    <p className="so-featured-name">{selectedDoc.name}</p>
                                    <span className="so-featured-badge">{selectedDoc.specialty}</span>
                                </div>
                            </div>
                            <p className="so-featured-tag">{selectedDoc.tag}</p>

                            {/* List */}
                            <div className="so-doc-list">
                                {filteredDoctors.map(doc => (
                                    <div
                                        key={doc.id}
                                        className={`so-doc-row ${selectedDoc.id === doc.id ? 'so-doc-row-active' : ''}`}
                                    >
                                        <div className="so-doc-av" style={{ background: doc.color }}>
                                            {doc.initials}
                                        </div>
                                        <div className="so-doc-info">
                                            <p className="so-doc-name">{doc.name}</p>
                                            <span className="so-doc-spec">{doc.specialty}</span>
                                        </div>
                                        <button
                                            className={`so-select-btn ${selectedDoc.id === doc.id ? 'so-selected' : ''}`}
                                            onClick={() => setSelectedDoc(doc)}
                                        >
                                            {selectedDoc.id === doc.id ? 'Selected' : 'Select'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Help & Resources ── */}
                        <div className="so-card">
                            <div className="so-card-head">
                                <h4 className="so-sidebar-title" style={{ margin: 0 }}>Help &amp; Resources</h4>
                                <button className="so-mini-btn so-mini-select">Select</button>
                            </div>
                            <div className="so-resource-list">
                                {RESOURCES.map((r, i) => (
                                    <div key={i} className="so-resource-row">
                                        <div className="so-resource-thumb" />
                                        <span className="so-resource-label">{r}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Summarize & Submit ── */}
                        <div className="so-card">
                            <h4 className="so-sidebar-title">Summarize &amp; Submit Case</h4>

                            <p className="so-submit-caption">Selected Opinion</p>
                            <div className="so-submit-doc-row">
                                <div className="so-doc-av" style={{ background: selectedDoc.color }}>
                                    {selectedDoc.initials}
                                </div>
                                <div className="so-doc-info">
                                    <p className="so-doc-name">{selectedDoc.name}</p>
                                    <span className="so-doc-spec">{selectedDoc.specialty}</span>
                                </div>
                            </div>

                            <div className="so-submit-tags">
                                <span className="so-submit-tag">✓ {selectedDoc.specialty}</span>
                                <span className="so-submit-tag">✓ Persistent dry cough</span>
                            </div>

                            <p className="so-submit-note">
                                <em>Sattgorrial Reports</em> — if oftas chalise: serces
                            </p>

                            <div className="so-checklist">
                                {SUBMIT_CHECKS.map((c, i) => (
                                    <label key={i} className="so-check-row">
                                        <input type="checkbox" defaultChecked className="so-checkbox" />
                                        <span>{c}</span>
                                    </label>
                                ))}
                            </div>

                            {submitted ? (
                                <div className="so-success-msg">
                                    <FaCheck size={12} /> Case submitted successfully!
                                </div>
                            ) : (
                                <button
                                    className="so-submit-btn"
                                    onClick={handleSubmit}
                                    disabled={!concern.trim() || submitting}
                                >
                                    {submitting ? 'Submitting…' : 'Submit Case for Review'}
                                </button>
                            )}
                        </div>

                        {/* ── Help bottom ── */}
                        <div className="so-card">
                            <h4 className="so-sidebar-title">Help &amp; Resources</h4>
                            <button
                                className="so-support-link"
                                onClick={() => navigate('/dashboard')}
                            >
                                Contact MedBuddie Support
                                <FaChevronRight size={10} />
                            </button>
                        </div>

                    </aside>

                </div>
            </div>
        </div>
    );
}
