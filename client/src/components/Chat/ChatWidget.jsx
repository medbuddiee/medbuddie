import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaTimes, FaRobot, FaPaperPlane, FaExclamationTriangle } from 'react-icons/fa';
import './ChatWidget.css';

const DISCLAIMER = "I can provide general health information based on medical guidelines, but I'm not a substitute for professional medical advice. Always consult a qualified healthcare provider for diagnosis and treatment.";

function Message({ msg }) {
    return (
        <div className={`chat-msg chat-msg--${msg.role}`}>
            {msg.role === 'assistant' && (
                <div className="chat-msg-avatar">
                    <FaRobot size={13} />
                </div>
            )}
            <div className="chat-msg-bubble">
                {msg.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                        {line}
                        {i < msg.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                ))}
                {msg.streaming && <span className="chat-cursor" />}
            </div>
        </div>
    );
}

export default function ChatWidget() {
    const [open, setOpen]           = useState(false);
    const [messages, setMessages]   = useState([]);
    const [input, setInput]         = useState('');
    const [loading, setLoading]     = useState(false);
    const [accepted, setAccepted]   = useState(false);
    const [error, setError]         = useState(null);

    const bottomRef  = useRef(null);
    const inputRef   = useRef(null);
    const abortRef   = useRef(null);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (open && accepted) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open, accepted]);

    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || loading) return;

        setInput('');
        setError(null);

        const userMsg   = { role: 'user', content: text };
        const history   = [...messages, userMsg];
        setMessages(history);

        // Placeholder streaming message
        const streamingId = Date.now();
        setMessages(prev => [...prev, { id: streamingId, role: 'assistant', content: '', streaming: true }]);
        setLoading(true);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const token = localStorage.getItem('token');
            const res   = await fetch('/api/chat', {
                method:  'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body:   JSON.stringify({ messages: history }),
                signal: controller.signal,
            });

            if (!res.ok) {
                throw new Error('Server error');
            }

            const reader  = res.body.getReader();
            const decoder = new TextDecoder();
            let   buffer  = '';
            let   aiText  = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // keep incomplete line in buffer

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const payload = line.slice(6).trim();
                    if (payload === '[DONE]') break;

                    try {
                        const { text, error: streamErr } = JSON.parse(payload);
                        if (streamErr) throw new Error(streamErr);
                        if (text) {
                            aiText += text;
                            setMessages(prev => prev.map(m =>
                                m.id === streamingId
                                    ? { ...m, content: aiText }
                                    : m
                            ));
                        }
                    } catch { /* skip malformed chunk */ }
                }
            }

            // Finalise — remove streaming flag
            setMessages(prev => prev.map(m =>
                m.id === streamingId ? { ...m, streaming: false } : m
            ));
        } catch (err) {
            if (err.name === 'AbortError') return;
            setError('Something went wrong. Please try again.');
            setMessages(prev => prev.filter(m => m.id !== streamingId));
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages]);

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const handleClose = () => {
        abortRef.current?.abort();
        setOpen(false);
    };

    const handleClear = () => {
        abortRef.current?.abort();
        setMessages([]);
        setError(null);
        setLoading(false);
    };

    return (
        <>
            {/* ── Floating button ── */}
            <button
                className={`chat-fab ${open ? 'chat-fab--open' : ''}`}
                onClick={() => setOpen(o => !o)}
                aria-label="Open AI health assistant"
            >
                {open ? <FaTimes size={18} /> : <FaRobot size={20} />}
                {!open && <span className="chat-fab-label">AI Assistant</span>}
            </button>

            {/* ── Chat panel ── */}
            {open && (
                <div className="chat-panel">
                    {/* Header */}
                    <div className="chat-header">
                        <div className="chat-header-left">
                            <div className="chat-header-icon"><FaRobot size={14} /></div>
                            <div>
                                <p className="chat-header-title">MedBuddie AI</p>
                                <p className="chat-header-sub">Health Assistant</p>
                            </div>
                        </div>
                        <div className="chat-header-actions">
                            {messages.length > 0 && (
                                <button className="chat-clear-btn" onClick={handleClear} title="Clear chat">
                                    Clear
                                </button>
                            )}
                            <button className="chat-close-btn" onClick={handleClose} aria-label="Close">
                                <FaTimes size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Disclaimer gate */}
                    {!accepted ? (
                        <div className="chat-disclaimer">
                            <div className="chat-disclaimer-icon">
                                <FaExclamationTriangle size={22} />
                            </div>
                            <p className="chat-disclaimer-title">Before we start</p>
                            <p className="chat-disclaimer-text">{DISCLAIMER}</p>
                            <button
                                className="chat-disclaimer-btn"
                                onClick={() => setAccepted(true)}
                            >
                                I understand — start chatting
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Messages */}
                            <div className="chat-messages">
                                {messages.length === 0 && (
                                    <div className="chat-empty">
                                        <FaRobot size={32} style={{ opacity: 0.2 }} />
                                        <p>Ask me anything about your health, medications, or medical guidelines.</p>
                                        <div className="chat-suggestions">
                                            {[
                                                'What does my HbA1c level mean?',
                                                'What are the side effects of Metformin?',
                                                'When should I worry about blood pressure?',
                                            ].map(s => (
                                                <button
                                                    key={s}
                                                    className="chat-suggestion"
                                                    onClick={() => { setInput(s); inputRef.current?.focus(); }}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, i) => (
                                    <Message key={msg.id || i} msg={msg} />
                                ))}

                                {error && (
                                    <div className="chat-error">
                                        <FaExclamationTriangle size={12} /> {error}
                                    </div>
                                )}

                                <div ref={bottomRef} />
                            </div>

                            {/* Input */}
                            <div className="chat-input-area">
                                <textarea
                                    ref={inputRef}
                                    className="chat-input"
                                    placeholder="Ask a health question…"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKey}
                                    rows={1}
                                    maxLength={2000}
                                    disabled={loading}
                                />
                                <button
                                    className="chat-send-btn"
                                    onClick={sendMessage}
                                    disabled={!input.trim() || loading}
                                    aria-label="Send"
                                >
                                    <FaPaperPlane size={13} />
                                </button>
                            </div>
                            <p className="chat-footer-note">
                                Not medical advice · Always consult a doctor
                            </p>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
