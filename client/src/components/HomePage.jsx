import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import bannerImage from '../../assets/homepage_banner.png';
import logo from '../../assets/medbuddie_logo.png';
import communitySupportIcon from '../../assets/community_support.png'
import latestResearchIcon from '../../assets/latest_research.png'
import medicalInfoIcon from '../../assets/medical_info.png'
import physiciansOpinionIcon from '../../assets/physicians_opinion.png'

export default function HomePage() {
    const navigate = useNavigate();

    return (
        <div className="homepage">
            <header className="top-bar">
                <div className="logo">
                    <img
                        src={logo}
                        alt="MedBuddie Logo"
                        width="40"
                        height="40"
                        style={{ display: 'inline-block'}}
                    />
                    <span>MedBuddie</span>
                </div>
                <div className="auth-buttons">
                    <button className="outlined" onClick={() => navigate('/signin')}>Sign In</button>
                    <button className="filled" onClick={() => navigate('/signup')}>Sign Up</button>
                </div>
            </header>

            <div className="hero-section" style={{ backgroundImage: `url(${bannerImage})`, borderRadius: '8px'}}>
                <div className="hero-overlay">
                    <div className="hero-card">
                        <h1>Connect. Learn. Heal.</h1>
                        <p>Smart health decisions start here – backed by science, powered by people.</p>
                        <div className="hero-buttons">
                            <button className="filled" onClick={() => navigate('/signup')}>Join as Member</button>
                            <button className="outlined" onClick={() => navigate('/physician')}>
                                Enter Physician Portal <span className="subtext">(Verification Required)</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="info-section">
                <div className="info-box">
                    <img src={medicalInfoIcon} alt="Verified Medical Information" className="info-icon" />
                    <strong>Verified Medical Information</strong>
                    <p>Access expert-reviewed health information.</p>
                </div>
                <div className="info-box">
                    <img src={communitySupportIcon} alt="Community Support" className="info-icon" />
                    <strong>Community Support</strong>
                    <p>Connect with others who share your condition.</p>
                </div>
                <div className="info-box">
                    <img src={physiciansOpinionIcon} alt="Physician Opinions" className="info-icon" />
                    <strong>Physician Opinions</strong>
                    <p>Get a second opinion from verified doctors.</p>
                </div>
                <div className="info-box">
                    <img src={latestResearchIcon} alt="Latest Research" className="info-icon" />
                    <strong>Latest Research</strong>
                    <p>Stay informed with scientific discoveries.</p>
                </div>
            </footer>
        </div>
    );
}
