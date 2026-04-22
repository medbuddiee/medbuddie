import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import './Dashboard.css';
import logo from '../../../assets/medbuddie_logo.png';
import { FaSearch, FaCog, FaBell, FaTimes, FaUser, FaUserCircle, FaSignOutAlt, FaEdit } from 'react-icons/fa';
import UserAvatar from '../common/UserAvatar';
import { MdArticle } from 'react-icons/md';

/** Truncate a string to maxLen chars, appending "…" if needed */
function truncate(str, maxLen = 80) {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/**
 * TopNav
 *
 * Props:
 *   searchQuery  — the active search query driving the Feed (string)
 *   onSearch(q)  — called to commit a query to the Feed (Enter / "See all")
 */
export default function TopNav({ searchQuery, onSearch }) {
    const { user, logout } = useUser();
    const navigate = useNavigate();

    // inputValue tracks what is typed; may differ from the committed searchQuery
    const [inputValue, setInputValue]       = useState(searchQuery || '');
    const [dropdownResults, setDropdownResults] = useState({ posts: [], users: [] });
    const [showDropdown, setShowDropdown]   = useState(false);
    const [searching, setSearching]         = useState(false);
    const [showUserMenu, setShowUserMenu]   = useState(false);

    const containerRef  = useRef(null);
    const inputRef      = useRef(null);
    const debounceRef   = useRef(null);
    const userMenuRef   = useRef(null);

    // Keep input in sync when Feed search is cleared externally (e.g. "Back to feed")
    useEffect(() => {
        if (!searchQuery) setInputValue('');
    }, [searchQuery]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target))
                setShowDropdown(false);
            if (userMenuRef.current && !userMenuRef.current.contains(e.target))
                setShowUserMenu(false);
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // Debounce: fire /api/search 300 ms after the user stops typing
    useEffect(() => {
        const q = inputValue.trim();

        if (!q) {
            setDropdownResults({ posts: [], users: [] });
            setShowDropdown(false);
            return;
        }

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
                if (res.ok) {
                    const data = await res.json();
                    setDropdownResults(data);
                    setShowDropdown(true);
                }
            } catch {
                // Network error — keep dropdown hidden
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(debounceRef.current);
    }, [inputValue]);

    // ── Commit the search to the Feed ──────────────────────────────────────────
    const commitSearch = (q = inputValue) => {
        const trimmed = q.trim();
        onSearch(trimmed);
        setShowDropdown(false);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter')  commitSearch();
        if (e.key === 'Escape') {
            setShowDropdown(false);
            inputRef.current?.blur();
        }
    };

    const handleClear = () => {
        setInputValue('');
        onSearch('');
        setShowDropdown(false);
        inputRef.current?.focus();
    };

    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

    const hasResults =
        dropdownResults.posts.length > 0 || dropdownResults.users.length > 0;

    return (
        <header className="topnav">
            {/* ── Brand — clicking navigates to the dashboard ── */}
            <div className="topnav-left" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                <img src={logo} alt="MedBuddie" width="28" height="28" />
                <span className="topnav-brand">MedBuddie</span>
            </div>

            {/* ── Search ── */}
            <div className="topnav-center" ref={containerRef}>
                <div className="topnav-search-wrap">
                    {searching
                        ? <span className="topnav-search-icon topnav-search-spinner" />
                        : <FaSearch className="topnav-search-icon" />
                    }

                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search posts, people, topics…"
                        className="topnav-search"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onFocus={() => inputValue.trim() && setShowDropdown(true)}
                        onKeyDown={handleKeyDown}
                        aria-label="Search"
                        aria-expanded={showDropdown}
                        aria-haspopup="listbox"
                        autoComplete="off"
                    />

                    {/* Clear button — shown when there is input text */}
                    {inputValue && (
                        <button
                            className="topnav-search-clear"
                            onClick={handleClear}
                            aria-label="Clear search"
                        >
                            <FaTimes size={11} />
                        </button>
                    )}
                </div>

                {/* ── Dropdown ── */}
                {showDropdown && (
                    <div className="search-dropdown" role="listbox">

                        {!hasResults && !searching && (
                            <p className="search-no-results">
                                No results for "{inputValue.trim()}"
                            </p>
                        )}

                        {/* Posts section */}
                        {dropdownResults.posts.length > 0 && (
                            <div className="search-dropdown-section">
                                <span className="search-section-label">Posts</span>
                                {dropdownResults.posts.map(post => (
                                    <button
                                        key={post.id}
                                        className="search-result-item"
                                        onClick={() => commitSearch(inputValue)}
                                        role="option"
                                    >
                                        <span className="search-result-icon">
                                            <MdArticle size={15} />
                                        </span>
                                        <span className="search-result-content">
                                            <span className="search-result-title">
                                                {truncate(post.content, 70)}
                                            </span>
                                            <span className="search-result-meta">
                                                {post.author}
                                                {post.type === 'medical_opinion' && (
                                                    <span className="search-result-badge">Physician</span>
                                                )}
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* People section */}
                        {dropdownResults.users.length > 0 && (
                            <div className="search-dropdown-section">
                                <span className="search-section-label">People</span>
                                {dropdownResults.users.map(u => (
                                    <button
                                        key={u.id}
                                        className="search-result-item"
                                        onClick={() => {
                                            setShowDropdown(false);
                                            navigate('/profile');
                                        }}
                                        role="option"
                                    >
                                        <span className="search-result-avatar-sm">
                                            {u.name?.[0]?.toUpperCase() || <FaUser size={10} />}
                                        </span>
                                        <span className="search-result-content">
                                            <span className="search-result-title">{u.name}</span>
                                            {u.username && (
                                                <span className="search-result-meta">@{u.username}</span>
                                            )}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Footer: commit search to Feed */}
                        {hasResults && (
                            <button
                                className="search-see-all"
                                onClick={() => commitSearch()}
                            >
                                See all results for "{inputValue.trim()}"
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Right icons ── */}
            <div className="topnav-right">
                <button className="topnav-icon-btn" aria-label="Notifications" title="Notifications (coming soon)" onClick={() => navigate('/dashboard')}>
                    <FaBell />
                </button>
                <button className="topnav-icon-btn" aria-label="Settings" title="Settings" onClick={() => navigate('/edit-profile')}>
                    <FaCog />
                </button>

                {/* Avatar + dropdown menu */}
                <div className="topnav-user-menu-wrap" ref={userMenuRef}>
                    <button
                        className="topnav-avatar-btn"
                        onClick={() => setShowUserMenu(m => !m)}
                        title={`Signed in as ${user?.name || user?.email}`}
                        aria-label="User menu"
                        aria-expanded={showUserMenu}
                    >
                        <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size={32} />
                    </button>

                    {showUserMenu && (
                        <div className="topnav-user-dropdown">
                            <div className="topnav-user-info">
                                <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size={38} />
                                <div>
                                    <p className="topnav-user-name">{user?.name || 'User'}</p>
                                    <p className="topnav-user-email">{user?.email}</p>
                                </div>
                            </div>
                            <div className="topnav-menu-divider" />
                            <button className="topnav-menu-item" onClick={() => { setShowUserMenu(false); navigate('/profile'); }}>
                                <FaUserCircle size={14} /> My Profile
                            </button>
                            <button className="topnav-menu-item" onClick={() => { setShowUserMenu(false); navigate('/edit-profile'); }}>
                                <FaEdit size={14} /> Edit Profile
                            </button>
                            <div className="topnav-menu-divider" />
                            <button className="topnav-menu-item topnav-menu-signout" onClick={handleLogout}>
                                <FaSignOutAlt size={14} /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
