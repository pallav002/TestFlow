import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
    Clock, Play, LogOut, CheckCircle, Loader, BarChart2,
    User, Mail, Phone, BookOpen, Briefcase, Tag, Edit2,
    Trophy, X, AlertTriangle, FilePlus, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const C = {
    sidebar:  '#0a0619',
    primary:  '#a855f7',
    accent:   '#6366f1',
    light:    '#f3f0ff',
    text:     '#0f172a',
    muted:    '#6b7280',
    border:   '#ede9fe',
    white:    '#ffffff',
};

const spin = `@keyframes spin { to { transform: rotate(360deg); } }`;

const Spinner = () => (
    <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>
        <Loader size={16} />
    </span>
);

const PassBadge = ({ passed }) => (
    <span style={{
        padding: '0.15rem 0.55rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
        background: passed ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
        color: passed ? '#10b981' : '#ef4444',
        border: `1px solid ${passed ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}`,
    }}>
        {passed ? '✓ Passed' : '✗ Failed'}
    </span>
);

const gradeLabel = (acc) => {
    if (acc >= 80) return { text: 'Excellent', color: '#10b981' };
    if (acc >= 60) return { text: 'Good', color: '#6366f1' };
    if (acc >= 40) return { text: 'Average', color: '#f59e0b' };
    return { text: 'Needs Improvement', color: '#ef4444' };
};

const lightThemeCSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes gradShimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
.glass-card {
    background: #fff;
    border-radius: 1rem;
    border: 1px solid #ede9fe;
    box-shadow: 0 1px 3px rgba(109,40,217,0.06), 0 4px 16px rgba(109,40,217,0.05);
    transition: box-shadow 0.2s, transform 0.2s;
    position: relative; overflow: hidden;
}
.glass-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #a855f7, #6366f1, #06b6d4);
    opacity: 0; transition: opacity 0.2s;
}
.glass-card:hover { box-shadow: 0 4px 24px rgba(109,40,217,0.13); transform: translateY(-2px); }
.glass-card:hover::before { opacity: 1; }
.btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.875rem;
    border-radius: 0.625rem;
    border: 1.5px solid #e5e7eb;
    background: #fff;
    color: #374151;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
}
.btn:hover { background: #faf5ff; border-color: #a855f7; color: #a855f7; }
.btn-primary {
    background: linear-gradient(135deg, #a855f7, #6366f1) !important;
    color: #fff !important;
    border: none !important;
    box-shadow: 0 4px 14px rgba(168,85,247,0.32);
}
.btn-primary:hover { opacity: 0.88 !important; transform: translateY(-1px); }
.input-field {
    width: 100%;
    padding: 0.6rem 0.875rem;
    border: 1.5px solid #ede9fe;
    border-radius: 0.625rem;
    font-size: 0.875rem;
    outline: none;
    color: #111827;
    background: #faf5ff;
    box-sizing: border-box;
    font-family: inherit;
}
.input-field:focus { border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168,85,247,0.12); background: #fff; }
.sidebar-nav-item { display: none; }
.logout-btn { display: none; }
@media (max-width: 768px) {
    .dash-sidebar { transform: translateX(-100%) !important; transition: transform 0.3s ease !important; }
    .dash-sidebar.open { transform: translateX(0) !important; }
    .dash-main { margin-left: 0 !important; }
    .dash-overlay { display: block !important; }
}
`;

const CandidateDashboard = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('tests');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [tests, setTests]             = useState([]);
    const [results, setResults]         = useState([]);
    const [profile, setProfile]         = useState(null);
    const [profileForm, setProfileForm] = useState({});
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg]   = useState(null);

    const [loadingTests, setLoadingTests]     = useState(true);
    const [loadingResults, setLoadingResults] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false);

    const fetchTests = useCallback(async () => {
        setLoadingTests(true);
        try {
            const res = await api.get('/candidate/available-tests');
            setTests(res.data);
        } catch { /* silent */ } finally { setLoadingTests(false); }
    }, []);

    const fetchResults = useCallback(async () => {
        setLoadingResults(true);
        try {
            const res = await api.get('/candidate/results');
            setResults(res.data);
        } catch { /* silent */ } finally { setLoadingResults(false); }
    }, []);

    const fetchProfile = useCallback(async () => {
        setLoadingProfile(true);
        try {
            const res = await api.get('/candidate/profile');
            setProfile(res.data);
            setProfileForm({
                full_name:          res.data.full_name || '',
                email:              res.data.email || '',
                phone:              res.data.phone || '',
                college_or_company: res.data.college_or_company || '',
                experience_level:   res.data.experience_level || 'Fresher',
                skills:             res.data.skills || '',
            });
        } catch { /* silent */ } finally { setLoadingProfile(false); }
    }, []);

    useEffect(() => { fetchTests(); }, [fetchTests]);
    useEffect(() => {
        if (activeTab === 'results' && results.length === 0) fetchResults();
    }, [activeTab]);
    useEffect(() => {
        if (activeTab === 'profile' && !profile) fetchProfile();
    }, [activeTab]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileMsg(null);
        try {
            const res = await api.put('/candidate/profile', profileForm);
            setProfile(res.data);
            setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
        } catch {
            setProfileMsg({ text: 'Failed to save profile.', type: 'error' });
        } finally {
            setSavingProfile(false);
            setTimeout(() => setProfileMsg(null), 3000);
        }
    };

    const handleRefresh = () => {
        if (activeTab === 'tests') fetchTests();
        if (activeTab === 'results') fetchResults();
        if (activeTab === 'profile') fetchProfile();
    };

    const initials = (user?.full_name || user?.username || '?')
        .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const tabs = [
        { id: 'tests',   label: 'My Tests',  icon: <FilePlus size={16} /> },
        { id: 'results', label: 'Results',   icon: <BarChart2 size={16} /> },
        { id: 'profile', label: 'Profile',   icon: <User size={16} /> },
    ];

    const tabTitle = tabs.find(t => t.id === activeTab)?.label || '';

    /* ── Sidebar nav button ── */
    const NavBtn = ({ tab }) => {
        const active = activeTab === tab.id;
        return (
            <button
                onClick={() => setActiveTab(tab.id)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', margin: '0 0.875rem',
                    background: active ? 'rgba(168,85,247,0.18)' : 'transparent',
                    border: 'none',
                    borderRadius: '0.75rem',
                    boxShadow: active ? 'inset 0 0 0 1px rgba(168,85,247,0.35)' : 'none',
                    color: active ? '#e9d5ff' : 'rgba(255,255,255,0.45)',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    width: 'calc(100% - 1.75rem)',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                }}
            >
                <span style={{ color: active ? '#c084fc' : 'rgba(255,255,255,0.3)', display: 'flex' }}>{tab.icon}</span>
                {tab.label}
            </button>
        );
    };

    return (
        <div style={{ minHeight: '100vh', background: C.light, fontFamily: '"Inter",system-ui,sans-serif', display: 'flex' }}>
            <style>{lightThemeCSS}</style>

            {sidebarOpen && <div className="dash-overlay" onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:199, display:'none' }} />}

            {/* ── LEFT SIDEBAR ── */}
            <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`} style={{
                width: 230, flexShrink: 0,
                background: 'linear-gradient(180deg,#0a0619 0%,#160a2e 45%,#0a0614 100%)',
                display: 'flex', flexDirection: 'column',
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
                boxShadow: '4px 0 32px rgba(168,85,247,0.16)',
            }}>
                {/* Decorative glows */}
                <div style={{ position:'absolute', top:60, left:-40, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.2),transparent)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', bottom:80, right:-30, width:110, height:110, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.18),transparent)', pointerEvents:'none' }} />

                {/* Brand */}
                <div style={{ padding:'1.5rem 1.25rem 1.25rem', borderBottom:'1px solid rgba(168,85,247,0.15)', position:'relative' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <div style={{
                            width:40, height:40, borderRadius:'0.875rem',
                            background:'linear-gradient(135deg,#a855f7,#6366f1)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:'0.85rem', fontWeight:800, color:'#fff',
                            boxShadow:'0 4px 16px rgba(168,85,247,0.45)',
                        }}>TF</div>
                        <div>
                            <div style={{ color:'#fff', fontWeight:800, fontSize:'1rem', letterSpacing:'-0.01em', lineHeight:1 }}>TestFlow</div>
                            <div style={{ fontSize:'0.58rem', background:'linear-gradient(135deg,#a855f7,#6366f1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:800, letterSpacing:'0.12em', marginTop:3 }}>CANDIDATE PORTAL</div>
                        </div>
                    </div>
                </div>

                {/* Candidate identity */}
                <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid rgba(168,85,247,0.12)', position:'relative' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem 0.875rem', borderRadius:'0.875rem', background:'rgba(168,85,247,0.12)', border:'1px solid rgba(168,85,247,0.2)' }}>
                        <div style={{
                            width:36, height:36, borderRadius:'50%', flexShrink:0,
                            background:'linear-gradient(135deg,#a855f7,#6366f1)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:'0.78rem', fontWeight:800, color:'#fff',
                            boxShadow:'0 4px 10px rgba(168,85,247,0.4)',
                        }}>{initials}</div>
                        <div style={{ minWidth:0 }}>
                            <div style={{ color:'#e9d5ff', fontWeight:700, fontSize:'0.82rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {user?.full_name || user?.username}
                            </div>
                            <div style={{ fontSize:'0.65rem', color:'#c084fc', marginTop:'0.1rem', fontWeight:600 }}>Candidate</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex:1, paddingTop:'0.875rem', display:'flex', flexDirection:'column', gap:'0.2rem', position:'relative' }}>
                    {tabs.map(t => <NavBtn key={t.id} tab={t} />)}
                </nav>

                {/* Bottom actions */}
                <div style={{ padding:'1rem 0.875rem', borderTop:'1px solid rgba(168,85,247,0.12)', display:'flex', flexDirection:'column', gap:'0.5rem', position:'relative' }}>
                    <button onClick={handleRefresh} style={{
                        display:'flex', alignItems:'center', gap:'0.5rem',
                        background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
                        borderRadius:'0.75rem', color:'rgba(255,255,255,0.45)',
                        padding:'0.625rem 1rem', fontSize:'0.8rem', cursor:'pointer', width:'100%', fontFamily:'inherit',
                    }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button onClick={logout} style={{
                        display:'flex', alignItems:'center', gap:'0.5rem',
                        background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)',
                        borderRadius:'0.75rem', color:'#fca5a5',
                        padding:'0.625rem 1rem', fontSize:'0.8rem', cursor:'pointer', width:'100%', fontFamily:'inherit',
                    }}>
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </aside>

            {/* ── MAIN COLUMN ── */}
            <div className="dash-main" style={{ marginLeft: 230, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

                {/* Sticky top header */}
                <header style={{
                    height: 60, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(168,85,247,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 1.25rem',
                    position: 'sticky', top: 0, zIndex: 100,
                    boxShadow: '0 1px 0 rgba(168,85,247,0.06)',
                }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <button onClick={() => setSidebarOpen(o => !o)} className="dash-hamburger" style={{ display:'none', padding:'0.4rem', background:'transparent', border:'1px solid #ede9fe', borderRadius:'0.5rem', cursor:'pointer', color:'#a855f7' }}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        </button>
                        <div>
                        <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>{tabTitle}</h1>
                        <p style={{ margin: 0, fontSize: '0.71rem', color: C.muted, fontWeight: 500 }}>Candidate Portal</p>
                        </div>
                    </div>
                    <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#a855f7,#6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 800, color: '#fff',
                        boxShadow: '0 4px 12px rgba(168,85,247,0.3)',
                    }}>{initials}</div>
                </header>

                {/* Page content */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: '#f3f0ff' }}>

                    {/* ── TESTS TAB ── */}
                    {activeTab === 'tests' && (
                        <>
                            <div style={{ marginBottom: '1.75rem' }}>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem', color: C.text }}>Available Assessments</h2>
                                <p style={{ color: C.muted, fontSize: '0.875rem', margin: 0 }}>
                                    Tests assigned to you that are within their active window.
                                </p>
                            </div>

                            {loadingTests ? (
                                <div style={{ textAlign: 'center', padding: '4rem', color: C.muted }}>
                                    <Loader size={28} style={{ animation: 'spin 1s linear infinite' }} />
                                </div>
                            ) : tests.length === 0 ? (
                                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                                    <CheckCircle size={48} style={{ color: C.primary, marginBottom: '1rem', opacity: 0.5 }} />
                                    <h3 style={{ marginBottom: '0.5rem', color: C.text }}>No Tests Available</h3>
                                    <p style={{ color: C.muted, fontSize: '0.9rem', margin: 0 }}>
                                        You have completed all assigned assessments, or your test window has not started yet.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                                    {tests.map(test => (
                                        <div key={test.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, flex: 1, color: C.text }}>{test.title}</h3>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: `${C.primary}18`, color: C.primary, padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.78rem', flexShrink: 0 }}>
                                                    <Clock size={12} /> {test.duration_minutes}m
                                                </span>
                                            </div>

                                            {test.category && (
                                                <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '20px', background: `${C.primary}15`, color: C.primary, width: 'fit-content' }}>
                                                    {test.category}
                                                </span>
                                            )}

                                            <p style={{ color: C.muted, fontSize: '0.85rem', margin: 0, minHeight: '2.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                {test.description || 'No description provided for this assessment.'}
                                            </p>

                                            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem', alignItems: 'center' }}>
                                                <div>
                                                    <p style={{ fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', margin: '0 0 0.1rem' }}>Questions</p>
                                                    <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem', color: C.text }}>{test.questions?.length || 0}</p>
                                                </div>
                                                {test.passing_score != null && (
                                                    <div>
                                                        <p style={{ fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', margin: '0 0 0.1rem' }}>Pass Mark</p>
                                                        <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem', color: C.primary }}>{test.passing_score}%</p>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => navigate(`/test/${test.id}`)}
                                                    className="btn btn-primary"
                                                    style={{ flex: 1, marginLeft: 'auto', justifyContent: 'center' }}
                                                >
                                                    <Play size={16} /> Start Test
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* ── RESULTS TAB ── */}
                    {activeTab === 'results' && (
                        <>
                            <div style={{ marginBottom: '1.75rem' }}>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem', color: C.text }}>My Results</h2>
                                <p style={{ color: C.muted, fontSize: '0.875rem', margin: 0 }}>
                                    All your submitted assessments and scores.
                                </p>
                            </div>

                            {loadingResults ? (
                                <div style={{ textAlign: 'center', padding: '4rem', color: C.muted }}><Spinner /></div>
                            ) : results.length === 0 ? (
                                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                                    <Trophy size={48} style={{ opacity: 0.3, marginBottom: '1rem', color: C.text }} />
                                    <h3 style={{ marginBottom: '0.5rem', color: C.text }}>No Results Yet</h3>
                                    <p style={{ color: C.muted, fontSize: '0.9rem', margin: 0 }}>Complete a test to see your results here.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    {results.map(r => {
                                        const pct = Math.round(r.accuracy);
                                        const g = gradeLabel(pct);
                                        const scoreColor = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
                                        return (
                                            <div key={r.id} className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                                                {/* Score circle */}
                                                <div style={{
                                                    width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                                                    background: `${scoreColor}18`, border: `2px solid ${scoreColor}55`,
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{pct}%</span>
                                                    <span style={{ fontSize: '0.55rem', color: C.muted, textTransform: 'uppercase' }}>acc</span>
                                                </div>

                                                {/* Test info */}
                                                <div style={{ flex: 1, minWidth: '160px' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem', color: C.text }}>{r.test_title || 'Deleted Test'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: C.muted }}>
                                                        Submitted: {r.submitted_at ? new Date(r.submitted_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                                                    </div>
                                                </div>

                                                {/* Stats */}
                                                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', flexShrink: 0 }}>
                                                    {[
                                                        { label: 'Score',   value: `${r.score}`,                            color: C.primary },
                                                        { label: 'Correct', value: `${r.correct_answers}/${r.total_questions}`, color: '#10b981' },
                                                        { label: 'Wrong',   value: r.wrong_answers,                          color: '#ef4444' },
                                                    ].map(({ label, value, color }) => (
                                                        <div key={label} style={{ textAlign: 'center' }}>
                                                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color }}>{value}</div>
                                                            <div style={{ fontSize: '0.62rem', color: C.muted, textTransform: 'uppercase', marginTop: '0.1rem' }}>{label}</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Hidden Pass/Fail status for candidates per request */}
                                                <div style={{ display: 'none' }}>
                                                    <PassBadge passed={r.passed} />
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: g.color }}>{g.text}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* ── PROFILE TAB ── */}
                    {activeTab === 'profile' && (
                        <>
                            <div style={{ marginBottom: '1.75rem' }}>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem', color: C.text }}>My Profile</h2>
                                <p style={{ color: C.muted, fontSize: '0.875rem', margin: 0 }}>
                                    Keep your information up to date.
                                </p>
                            </div>

                            {loadingProfile ? (
                                <div style={{ textAlign: 'center', padding: '4rem', color: C.muted }}><Spinner /></div>
                            ) : (
                                <div style={{ maxWidth: 540 }}>
                                    <div className="glass-card" style={{ padding: '2rem' }}>
                                        {profileMsg && (
                                            <div style={{
                                                marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: '8px',
                                                background: profileMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                border: `1px solid ${profileMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                                color: profileMsg.type === 'success' ? '#10b981' : '#ef4444',
                                                fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            }}>
                                                {profileMsg.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                                                {profileMsg.text}
                                            </div>
                                        )}

                                        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: C.muted, display: 'block', marginBottom: '0.3rem' }}>Full Name</label>
                                                <input className="input-field" value={profileForm.full_name || ''} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Your full name" />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: C.muted, display: 'block', marginBottom: '0.3rem' }}>Email</label>
                                                    <input type="email" className="input-field" value={profileForm.email || ''} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: C.muted, display: 'block', marginBottom: '0.3rem' }}>Phone</label>
                                                    <input type="tel" className="input-field" value={profileForm.phone || ''} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 00001" />
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: C.muted, display: 'block', marginBottom: '0.3rem' }}>College / Company</label>
                                                <input className="input-field" value={profileForm.college_or_company || ''} onChange={e => setProfileForm(f => ({ ...f, college_or_company: e.target.value }))} placeholder="e.g. University / Company name" />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                <div>
                                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: C.muted, display: 'block', marginBottom: '0.3rem' }}>Experience Level</label>
                                                    <select className="input-field" value={profileForm.experience_level || 'Fresher'} onChange={e => setProfileForm(f => ({ ...f, experience_level: e.target.value }))}>
                                                        {['Fresher', '1-3yr', '3-5yr', '5+yr'].map(l => <option key={l}>{l}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: C.muted, display: 'block', marginBottom: '0.3rem' }}>Username</label>
                                                    <input className="input-field" value={user?.username || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: C.muted, display: 'block', marginBottom: '0.3rem' }}>Skills (comma-separated)</label>
                                                <input className="input-field" value={profileForm.skills || ''} onChange={e => setProfileForm(f => ({ ...f, skills: e.target.value }))} placeholder="React, Node.js, Python, SQL" />
                                                {profileForm.skills && (
                                                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                                        {profileForm.skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                                                            <span key={s} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '20px', background: `${C.primary}15`, color: C.primary, fontWeight: 600 }}>{s}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ marginTop: '0.5rem' }}>
                                                {savingProfile ? <><Spinner /> Saving…</> : <><Edit2 size={15} /> Save Profile</>}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

export default CandidateDashboard;
