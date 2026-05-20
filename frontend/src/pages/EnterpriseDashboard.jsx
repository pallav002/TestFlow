import { useState, useEffect, useCallback } from 'react';
import {
    Building2, Users, BarChart3, LogOut, Plus, Trash2,
    Edit2, CheckCircle, AlertCircle, RefreshCw, Settings,
    TrendingUp, Crown, User, Mail, Phone, Lock, X, Save,
    Loader2, ShieldCheck, Star, ArrowUpRight, Eye, EyeOff,
    Search, XCircle, Calendar, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// ─── Aurora Light palette ────────────────────────────────────────────────────
const C = {
    primary: '#a855f7', accent: '#6366f1', pink: '#ec4899',
    orange: '#f97316', cyan: '#06b6d4', blue: '#3b82f6',
    amber: '#f59e0b', green: '#10b981', red: '#ef4444',
    gray: '#6b7280', light: '#fafafa', border: '#e5e7eb',
    dark: '#0f172a', card: '#ffffff',
    g1: 'linear-gradient(135deg,#a855f7,#6366f1)',
    g2: 'linear-gradient(135deg,#ec4899,#f97316)',
    g3: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
    g4: 'linear-gradient(135deg,#10b981,#3b82f6)',
};

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Badge = ({ label, color = C.primary }) => (
    <span style={{
        display: 'inline-block', padding: '2px 10px', borderRadius: 20,
        fontSize: '0.72rem', fontWeight: 700, letterSpacing: 0.3,
        background: color + '18', color,
    }}>{label}</span>
);

const Spinner = () => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loader2 size={32} color={C.primary} style={{ animation: 'spin 0.8s linear infinite' }} />
    </div>
);

const Toast = ({ msg, type, onClose }) => {
    const bg = type === 'success' ? C.green : C.red;
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            background: bg, color: '#fff', padding: '0.875rem 1.25rem',
            borderRadius: '0.75rem', boxShadow: `0 8px 24px ${bg}40`,
            display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: 340,
        }}>
            {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{msg}</span>
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={14} />
            </button>
        </div>
    );
};

const Modal = ({ title, onClose, children, width = 500 }) => (
    <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem'
    }}>
        <div style={{
            background: '#fff', borderRadius: '1.25rem', width: '100%', maxWidth: width,
            boxShadow: '0 24px 72px rgba(0,0,0,0.18)', overflow: 'hidden'
        }}>
            <div style={{
                padding: '1.25rem 1.5rem', borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #fff0f6, #faf5ff)'
            }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: C.dark }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray }}>
                    <X size={18} />
                </button>
            </div>
            <div style={{ padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
                {children}
            </div>
        </div>
    </div>
);

const Input = ({ label, type = 'text', ...props }) => {
    const [show, setShow] = useState(false);
    const isPw = type === 'password';

    return (
        <div style={{ marginBottom: '0.875rem' }}>
            {label && <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>{label}</label>}
            <div style={{ position: 'relative' }}>
                <input
                    type={isPw ? (show ? 'text' : 'password') : type}
                    style={{
                        width: '100%', padding: isPw ? '0.65rem 2.5rem 0.65rem 0.875rem' : '0.65rem 0.875rem',
                        border: `1.5px solid ${C.border}`,
                        borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none',
                        boxSizing: 'border-box', color: C.dark, background: '#fafafa'
                    }}
                    {...props}
                    onFocus={e => e.target.style.borderColor = C.primary}
                    onBlur={e => e.target.style.borderColor = C.border}
                />
                {isPw && (
                    <button
                        type="button"
                        onClick={() => setShow(!show)}
                        style={{
                            position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', color: C.gray, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, sub, limit, color = C.primary }) => {
    const pct = limit && limit !== -1 ? Math.min(100, Math.round((value / limit) * 100)) : null;
    return (
        <div style={{
            background: C.card, borderRadius: '1rem', padding: '1.25rem 1.5rem',
            boxShadow: '0 1px 3px rgba(109,40,217,0.06),0 4px 16px rgba(109,40,217,0.05)', border: '1px solid #ede9fe'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: pct !== null ? '0.75rem' : 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                </div>
                <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: C.dark, lineHeight: 1 }}>
                        {value}{limit !== undefined && limit !== -1 ? <span style={{ fontSize: '0.875rem', color: C.gray, fontWeight: 500 }}>/{limit}</span> : limit === -1 ? <span style={{ fontSize: '0.875rem', color: C.green, fontWeight: 600 }}> ∞</span> : ''}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: C.gray, marginTop: 3 }}>{label}</div>
                    {sub && <div style={{ fontSize: '0.72rem', color: C.gray + '99', marginTop: 2 }}>{sub}</div>}
                </div>
            </div>
            {pct !== null && (
                <div>
                    <div style={{ height: 5, background: C.border, borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct > 85 ? C.red : pct > 60 ? C.amber : color, borderRadius: 10, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: C.gray, marginTop: 4, textAlign: 'right' }}>{pct}% used</div>
                </div>
            )}
        </div>
    );
};

// ────────────────────────────────────────────────────────────────────────────
export default function EnterpriseDashboard() {
    const { user, logout } = useAuth();
    const [tab, setTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState(null);
    const [hrList, setHrList] = useState([]);
    const [upgradeRequests, setUpgradeRequests] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const [addHRModal, setAddHRModal] = useState(false);
    const [editHRModal, setEditHRModal] = useState(null);
    const [upgradeModal, setUpgradeModal] = useState(false);
    const [editProfileModal, setEditProfileModal] = useState(false);
    const [trialAlertDismissed, setTrialAlertDismissed] = useState(false);

    const handlePhoneChange = (e, isEditProfile = false) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
        if (isEditProfile) setProfile(p => ({ ...p, phone: val }));
        // HR form doesn't have phone in the shown code, but if it did we'd handle it here
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const loadStats = useCallback(async () => {
        try { const r = await api.get('/enterprise/stats'); setStats(r.data); } catch { /* silent */ }
    }, []);

    const loadHR = useCallback(async () => {
        try { const r = await api.get('/enterprise/hrs'); setHrList(r.data); } catch { /* silent */ }
    }, []);

    const loadUpgradeRequests = useCallback(async () => {
        try { const r = await api.get('/enterprise/upgrade-requests'); setUpgradeRequests(r.data); } catch { /* silent */ }
    }, []);

    const loadProfile = useCallback(async () => {
        try { const r = await api.get('/enterprise/profile'); setProfile(r.data); } catch { /* silent */ }
    }, []);

    const loadAll = useCallback(async () => {
        setLoading(true);
        await Promise.all([loadStats(), loadHR(), loadUpgradeRequests(), loadProfile()]);
        setLoading(false);
    }, [loadStats, loadHR, loadUpgradeRequests, loadProfile]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const tabs = [
        { key: 'overview', label: 'Overview', icon: <BarChart3 size={15} /> },
        { key: 'hr', label: 'HR Team', icon: <Users size={15} />, badge: hrList.length },
        { key: 'upgrade', label: 'Plan & Upgrade', icon: <TrendingUp size={15} /> },
        { key: 'profile', label: 'Company Profile', icon: <Building2 size={15} /> },
    ];

    // Trial expiry wall — shown when trial has ended
    const trialExpired = stats && stats.is_trial && stats.trial_ends_at && new Date(stats.trial_ends_at) < new Date();

    // Trial warning popup — shown when ≤3 days left
    const trialDaysLeft = (stats && stats.is_trial && stats.trial_ends_at && !trialExpired)
        ? Math.ceil((new Date(stats.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
        : null;
    const showTrialWarning = trialDaysLeft !== null && trialDaysLeft <= 3 && !trialAlertDismissed;
    if (trialExpired) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f3f0ff', fontFamily: '"Inter",system-ui, sans-serif', padding: '2rem',
            }}>
                <div style={{
                    background: '#fff', borderRadius: '1.5rem', padding: '3rem 2.5rem', maxWidth: 480,
                    width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                    border: '2px solid #fde68a',
                }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.5rem',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Crown size={34} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 0.75rem' }}>
                        Your Free Trial Has Ended
                    </h2>
                    <p style={{ color: '#6b7280', lineHeight: 1.6, margin: '0 0 0.5rem' }}>
                        Your {stats.trial_ends_at ? `trial expired on ${fmtDate(stats.trial_ends_at)}` : 'trial period has ended'}.
                    </p>
                    <p style={{ color: '#6b7280', lineHeight: 1.6, margin: '0 0 2rem', fontSize: '0.9rem' }}>
                        Upgrade your plan to continue managing HR, candidates, and tests.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button
                            onClick={() => { setTab('upgrade'); setUpgradeModal(true); }}
                            style={{
                                padding: '0.875rem 2rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                color: '#fff', border: 'none', borderRadius: '0.875rem', fontWeight: 700,
                                fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
                            }}
                        >
                            Request Plan Upgrade →
                        </button>
                        <button onClick={logout} style={{
                            padding: '0.75rem', background: 'transparent', border: '1px solid #e5e7eb',
                            borderRadius: '0.875rem', color: '#6b7280', fontWeight: 600, cursor: 'pointer',
                        }}>
                            Logout
                        </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '1.5rem' }}>
                        Contact your TestFlow administrator for immediate access.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f3f0ff', fontFamily: '"Inter",system-ui,sans-serif', display: 'flex' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
                @keyframes slideDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
                @keyframes shimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
                .ent-nav-btn:hover { background: rgba(168,85,247,0.12) !important; color: #a855f7 !important; }
                .ent-content-card {
                    background: #fff;
                    border-radius: 1.25rem;
                    border: 1px solid #ede9fe;
                    box-shadow: 0 1px 3px rgba(109,40,217,0.06), 0 4px 16px rgba(109,40,217,0.05);
                    transition: box-shadow 0.2s, transform 0.2s;
                    position: relative; overflow: hidden;
                }
                .ent-content-card::before {
                    content:''; position:absolute; top:0; left:0; right:0; height:3px;
                    background:linear-gradient(90deg,#a855f7,#6366f1,#06b6d4);
                    opacity:0; transition:opacity 0.2s;
                }
                .ent-content-card:hover { box-shadow: 0 4px 24px rgba(109,40,217,0.13); transform:translateY(-2px); }
                .ent-content-card:hover::before { opacity:1; }

                @media (max-width: 768px) {
                    .dash-sidebar { transform: translateX(-100%) !important; transition: transform 0.3s ease !important; }
                    .dash-sidebar.open { transform: translateX(0) !important; }
                    .dash-main { margin-left: 0 !important; }
                    .dash-overlay { display: block !important; }
                }
            `}</style>

            {/* ── Trial Expiry Warning Popup ── */}
            {showTrialWarning && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9000, padding: '1rem'
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '1.5rem', padding: '2.5rem 2rem',
                        maxWidth: 440, width: '100%', textAlign: 'center',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
                        border: `2px solid ${trialDaysLeft <= 1 ? '#ef4444' : '#f59e0b'}`,
                        animation: 'slideDown 0.35s ease'
                    }}>
                        <div style={{
                            width: 68, height: 68, borderRadius: '50%', margin: '0 auto 1.25rem',
                            background: trialDaysLeft <= 1
                                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                : 'linear-gradient(135deg, #f59e0b, #d97706)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Crown size={30} color="#fff" />
                        </div>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', margin: '0 0 0.625rem' }}>
                            {trialDaysLeft <= 1 ? '⚠️ Trial Expires Today!' : `⏳ Trial Expires in ${trialDaysLeft} Days`}
                        </h2>
                        <p style={{ color: '#6b7280', lineHeight: 1.65, margin: '0 0 0.5rem', fontSize: '0.9rem' }}>
                            Your free trial ends on <strong>{fmtDate(stats.trial_ends_at)}</strong>.
                        </p>
                        <p style={{ color: '#6b7280', lineHeight: 1.65, margin: '0 0 1.75rem', fontSize: '0.875rem' }}>
                            Upgrade now to keep access to all features — HR management, candidate tests, and more.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            <button
                                onClick={() => { setTrialAlertDismissed(true); setTab('upgrade'); setUpgradeModal(true); }}
                                style={{
                                    padding: '0.875rem 1.5rem',
                                    background: trialDaysLeft <= 1
                                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                        : 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: '#fff', border: 'none', borderRadius: '0.875rem',
                                    fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                                    boxShadow: trialDaysLeft <= 1 ? '0 4px 16px rgba(239,68,68,0.35)' : '0 4px 16px rgba(245,158,11,0.35)',
                                }}
                            >
                                Upgrade Now →
                            </button>
                            <button
                                onClick={() => setTrialAlertDismissed(true)}
                                style={{
                                    padding: '0.625rem', background: 'transparent',
                                    border: '1px solid #e5e7eb', borderRadius: '0.875rem',
                                    color: '#6b7280', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                                }}
                            >
                                Remind Me Later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {sidebarOpen && <div className="dash-overlay" onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:199, display:'none' }} />}

            {/* ── SIDEBAR ── */}
            <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`} style={{
                width: 230, flexShrink: 0,
                background: 'linear-gradient(180deg, #0f0a1e 0%, #1a0a2e 50%, #0f0a1e 100%)',
                display: 'flex', flexDirection: 'column',
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
                boxShadow: '4px 0 32px rgba(168,85,247,0.15)'
            }}>
                {/* Decorative glow */}
                <div style={{ position: 'absolute', top: 60, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.25),transparent)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: 100, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.18),transparent)', pointerEvents: 'none' }} />

                {/* Logo */}
                <div style={{ padding: '1.5rem 1.25rem 1.25rem', borderBottom: '1px solid rgba(168,85,247,0.15)', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '0.875rem',
                            background: C.g1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            boxShadow: '0 4px 16px rgba(168,85,247,0.45)',
                        }}>
                            <Building2 size={21} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.01em' }}>{profile?.name || 'Enterprise'}</div>
                            <div style={{ fontSize: '0.58rem', background: C.g1, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, letterSpacing: '0.12em', marginTop: 3 }}>ENTERPRISE PANEL</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '1rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', position: 'relative' }}>
                    {tabs.map(t => {
                        const active = tab === t.key;
                        return (
                            <button key={t.key} className="ent-nav-btn" onClick={() => setTab(t.key)} style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.75rem 1rem', borderRadius: '0.75rem', border: 'none',
                                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left',
                                background: active ? 'rgba(168,85,247,0.18)' : 'transparent',
                                color: active ? '#e9d5ff' : 'rgba(255,255,255,0.45)',
                                boxShadow: active ? 'inset 0 0 0 1px rgba(168,85,247,0.35)' : 'none',
                                transition: 'all 0.15s',
                            }}>
                                <span style={{ flexShrink: 0, color: active ? '#c084fc' : 'rgba(255,255,255,0.3)' }}>{t.icon}</span>
                                <span style={{ flex: 1 }}>{t.label}</span>
                                {t.badge > 0 && (
                                    <span style={{ background: C.g1, color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: '0.62rem', fontWeight: 700 }}>{t.badge}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div style={{ padding: '1rem 0.875rem', borderTop: '1px solid rgba(168,85,247,0.12)', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                    <button onClick={loadAll} style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        padding: '0.625rem 1rem', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem',
                        color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', width: '100%',
                        transition: 'all 0.15s',
                    }}>
                        <RefreshCw size={14} /> Refresh Data
                    </button>
                    <button onClick={logout} style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        padding: '0.625rem 1rem', background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.75rem',
                        color: '#fca5a5', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', width: '100%',
                    }}>
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <div className="dash-main" style={{ marginLeft: 230, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Top bar */}
                <header style={{
                    height: 60, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(168,85,247,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 1.25rem', position: 'sticky', top: 0, zIndex: 100,
                    boxShadow: '0 1px 0 rgba(168,85,247,0.06)',
                }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <button onClick={() => setSidebarOpen(o => !o)} className="dash-hamburger" style={{ display:'none', padding:'0.4rem', background:'transparent', border:'1px solid #ede9fe', borderRadius:'0.5rem', cursor:'pointer', color:'#a855f7' }}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        </button>
                        <div>
                        <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: C.dark, letterSpacing: '-0.01em' }}>
                            {tabs.find(t => t.key === tab)?.label}
                        </h1>
                        <p style={{ margin: 0, fontSize: '0.71rem', color: C.gray, fontWeight: 500 }}>Enterprise Management Panel</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: C.g1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.8rem', fontWeight: 800, color: '#fff',
                            boxShadow: '0 4px 12px rgba(168,85,247,0.3)',
                        }}>
                            {(profile?.name || user?.username || 'E')[0].toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: C.dark }}>{user?.username}</div>
                            <div style={{ fontSize: '0.68rem', color: C.gray }}>Enterprise Admin</div>
                        </div>
                    </div>
                </header>

                {/* SuperAdmin impersonation banner */}
                {sessionStorage.getItem('sa_token') && (
                    <div style={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        padding: '0.6rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>
                            👁 You are viewing this company as SuperAdmin
                        </span>
                        <button
                            onClick={() => {
                                const saToken = sessionStorage.getItem('sa_token');
                                sessionStorage.removeItem('sa_token');
                                localStorage.setItem('token', saToken);
                                window.location.href = '/superadmin';
                            }}
                            style={{
                                padding: '0.3rem 0.875rem', background: 'rgba(255,255,255,0.2)',
                                border: '1px solid rgba(255,255,255,0.4)', borderRadius: '0.375rem',
                                color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                            }}
                        >
                            ← Return to SuperAdmin
                        </button>
                    </div>
                )}

                {/* Content */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: '#f3f0ff' }}>
                    {loading ? <Spinner /> : (
                        <>
                            {tab === 'overview' && <OverviewTab stats={stats} profile={profile} hrList={hrList} setTab={setTab} />}
                            {tab === 'hr' && <HRTab hrList={hrList} stats={stats} reload={loadHR} showToast={showToast} addModal={addHRModal} setAddModal={setAddHRModal} editModal={editHRModal} setEditModal={setEditHRModal} />}
                            {tab === 'upgrade' && <UpgradeTab profile={profile} upgradeRequests={upgradeRequests} reload={() => { loadUpgradeRequests(); loadProfile(); }} showToast={showToast} upgradeModal={upgradeModal} setUpgradeModal={setUpgradeModal} />}
                            {tab === 'profile' && <ProfileTab profile={profile} reload={loadProfile} showToast={showToast} editModal={editProfileModal} setEditModal={setEditProfileModal} />}
                        </>
                    )}
                </div>
            </div>

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

// ─────────────────────── OVERVIEW ────────────────────────────────────────────
function OverviewTab({ stats, profile, hrList, setTab }) {
    const planColor = { trial: C.amber, free_trial: C.amber, basic: C.blue, standard: C.accent, pro: C.accent, enterprise: C.green }[profile?.plan] || C.gray;
    const daysLeft = profile?.trial_ends_at ? Math.ceil((new Date(profile.trial_ends_at) - new Date()) / 86400000) : null;
    const passRate = stats?.total_submissions > 0
        ? Math.round(((stats.passed_submissions ?? 0) / stats.total_submissions) * 100)
        : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: C.dark }}>Welcome, {profile?.name}</h2>
                    <p style={{ margin: '0.2rem 0 0', color: C.gray, fontSize: '0.82rem' }}>
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Badge label={profile?.plan?.replace('_', ' ').toUpperCase()} color={planColor} />
                    {daysLeft !== null && <Badge label={daysLeft > 0 ? `${daysLeft} days left` : 'Trial expired'} color={daysLeft > 7 ? C.green : C.red} />}
                </div>
            </div>

            {/* Trial warning */}
            {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
                <div style={{ background: '#faf5ff', border: `1px solid rgba(168,85,247,0.15)`, borderRadius: '0.875rem', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <AlertCircle size={20} color={C.amber} />
                    <div>
                        <div style={{ fontWeight: 700, color: C.dark }}>Trial expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</div>
                        <div style={{ fontSize: '0.8rem', color: C.gray }}>Upgrade to continue uninterrupted access.</div>
                    </div>
                    <button onClick={() => setTab('upgrade')} style={{ marginLeft: 'auto', padding: '0.5rem 1rem', background: C.amber, border: 'none', borderRadius: '0.5rem', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Upgrade <ArrowUpRight size={13} />
                    </button>
                </div>
            )}

            {/* 4 usage stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.875rem' }}>
                {[
                    { icon: <Users size={20} color={C.primary} />,     label: 'HR Users',       value: stats?.total_hrs ?? 0,         limit: stats?.hr_limit,        used: stats?.total_hrs,        color: C.primary },
                    { icon: <User size={20} color={C.accent} />,       label: 'Candidates',     value: stats?.total_candidates ?? 0,  limit: stats?.candidate_limit, used: stats?.total_candidates, color: C.accent  },
                    { icon: <BarChart3 size={20} color={C.blue} />,    label: 'Tests Created',  value: stats?.total_tests ?? 0,       limit: stats?.test_limit,      used: stats?.total_tests,      color: C.blue    },
                    { icon: <CheckCircle size={20} color={C.green} />, label: 'Submissions',    value: stats?.total_submissions ?? 0, limit: null,                   used: null,                    color: C.green,  sub: `${stats?.total_submissions ?? 0} total tests taken` },
                ].map((w, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: '0.875rem', border: '1.5px solid #ede9fe', padding: '1.1rem 1.25rem', boxShadow: '0 2px 10px rgba(109,40,217,0.06)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{w.label}</div>
                            {w.icon}
                        </div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: w.color, lineHeight: 1 }}>
                            {w.value}{w.limit != null && w.limit !== -1 && <span style={{ fontSize: '1rem', color: '#9ca3af', fontWeight: 400 }}>/{w.limit}</span>}
                        </div>
                        {w.limit != null && w.limit !== -1 && (
                            <div style={{ height: 4, background: '#f3f0ff', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, Math.round(((w.used||0) / w.limit) * 100))}%`, background: w.color, borderRadius: 4, transition: 'width 0.4s' }} />
                            </div>
                        )}
                        <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                            {w.sub || (w.limit === -1 ? 'Unlimited' : w.limit != null ? `${Math.round(((w.used||0)/w.limit)*100)}% used` : '')}
                        </div>
                    </div>
                ))}
            </div>

            {/* 2 insight cards: HR Team + Activity summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                {/* HR Team */}
                <div style={{ background: '#fff', borderRadius: '0.875rem', border: '1.5px solid #ede9fe', padding: '1rem 1.25rem', boxShadow: '0 2px 10px rgba(109,40,217,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: C.dark }}>HR Team</div>
                        <button onClick={() => setTab('hr')} style={{ background: 'none', border: 'none', color: C.primary, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                            Manage <ArrowUpRight size={12} />
                        </button>
                    </div>
                    {hrList.length === 0
                        ? <p style={{ color: C.gray, fontSize: '0.82rem', textAlign: 'center', padding: '0.75rem 0', margin: 0 }}>No HR users yet. Add your first HR.</p>
                        : hrList.slice(0, 5).map(hr => (
                            <div key={hr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px solid ${C.border}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: hr.hr_type === 'senior' ? C.primary + '20' : C.blue + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={14} color={hr.hr_type === 'senior' ? C.primary : C.blue} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: C.dark }}>{hr.full_name || hr.username}</div>
                                        <div style={{ fontSize: '0.68rem', color: C.gray }}>{hr.department || 'HR Dept'}</div>
                                    </div>
                                </div>
                                <Badge label={hr.hr_type === 'senior' ? 'Senior HR' : 'Junior HR'} color={hr.hr_type === 'senior' ? C.primary : C.blue} />
                            </div>
                        ))
                    }
                </div>

                {/* Plan summary */}
                <div style={{ background: '#fff', borderRadius: '0.875rem', border: '1.5px solid #ede9fe', padding: '1rem 1.25rem', boxShadow: '0 2px 10px rgba(109,40,217,0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: C.dark }}>Plan Summary</div>
                    {[
                        { label: 'Current Plan', value: profile?.plan?.replace('_',' ').toUpperCase() || '—', color: planColor },
                        { label: 'HR Slots',     value: `${stats?.total_hrs ?? 0} / ${stats?.hr_limit === -1 ? '∞' : stats?.hr_limit ?? '—'}`, color: C.primary },
                        { label: 'Candidates',   value: `${stats?.total_candidates ?? 0} / ${stats?.candidate_limit === -1 ? '∞' : stats?.candidate_limit ?? '—'}`, color: C.accent },
                        { label: 'Tests',        value: `${stats?.total_tests ?? 0} / ${stats?.test_limit === -1 ? '∞' : stats?.test_limit ?? '—'}`, color: C.blue },
                        { label: 'Trial Ends',   value: profile?.trial_ends_at ? new Date(profile.trial_ends_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—', color: C.gray },
                    ].map((row, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none' }}>
                            <span style={{ fontSize: '0.78rem', color: C.gray }}>{row.label}</span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: row.color }}>{row.value}</span>
                        </div>
                    ))}
                    <button onClick={() => setTab('upgrade')} style={{ marginTop: 'auto', padding: '0.5rem', background: `linear-gradient(135deg,${C.primary},${C.accent})`, border: 'none', borderRadius: '0.5rem', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        Upgrade Plan <ArrowUpRight size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────── HR TAB ───────────────────────────────────────────────
function HRTab({ hrList, stats, reload, showToast, addModal, setAddModal, editModal, setEditModal }) {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ username: '', password: '', hr_type: 'junior', department: '', email: '', phone: '' });
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

    const resetForm = () => setForm({ username: '', password: '', hr_type: 'junior', department: '', email: '', phone: '' });

    const addHR = async (e) => {
        e.preventDefault();
        if (!form.email) { showToast('Email is required', 'error'); return; }
        if (form.password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
        setSaving(true);
        try {
            const payload = { ...form, role: 'hr' };
            await api.post('/enterprise/hrs', payload);
            showToast(`HR user created! Login credentials sent to ${form.email}`);
            setAddModal(false);
            resetForm();
            reload();
        } catch (err) { showToast(err.message || 'Failed to add HR', 'error'); }
        finally { setSaving(false); }
    };

    const updateHR = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { id, hashed_password, _newPassword, created_at, enterprise_id, role, ...payload } = editModal;
            if (_newPassword) payload.password = _newPassword;
            await api.put(`/enterprise/hrs/${editModal.id}`, payload);
            showToast('HR user updated!');
            setEditModal(null);
            reload();
        } catch (err) { showToast(err.message || 'Failed to update', 'error'); }
        finally { setSaving(false); }
    };

    const deleteHR = async (id) => {
        if (!window.confirm('Delete this HR user?')) return;
        try {
            await api.delete(`/enterprise/hrs/${id}`);
            showToast('HR user deleted');
            reload();
        } catch (err) { showToast(err.message || 'Failed to delete', 'error'); }
    };

    const atLimit = stats?.hr_limit !== undefined && stats?.hr_limit !== -1 && hrList.length >= (stats?.hr_limit ?? 0);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: C.dark }}>HR Team</h2>
                    <p style={{ margin: '0.2rem 0 0', color: C.gray, fontSize: '0.85rem' }}>
                        {hrList.length} HR users{stats?.hr_limit !== -1 ? ` of ${stats?.hr_limit} max` : ' (unlimited)'}
                    </p>
                </div>
                <button onClick={() => setAddModal(true)} disabled={atLimit} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.625rem 1.25rem', background: atLimit ? C.border : `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                    color: atLimit ? C.gray : '#fff', border: 'none', borderRadius: '0.75rem',
                    fontSize: '0.875rem', fontWeight: 700, cursor: atLimit ? 'not-allowed' : 'pointer',
                    title: atLimit ? 'HR limit reached. Please upgrade your plan.' : ''
                }}>
                    <Plus size={16} /> Add HR User
                </button>
            </div>

            {atLimit && (
                <div style={{
                    background: '#faf5ff', border: `1px solid rgba(168,85,247,0.15)`, borderRadius: '0.75rem',
                    padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem'
                }}>
                    <AlertCircle size={18} color={C.amber} />
                    <span style={{ fontSize: '0.85rem', color: C.dark }}>HR limit reached for your plan. Upgrade to add more HR users.</span>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {hrList.map(hr => (
                    <div key={hr.id} style={{
                        background: C.card, borderRadius: '1rem', padding: '1.25rem 1.5rem',
                        border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex', alignItems: 'center', gap: '1rem'
                    }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                            background: hr.hr_type === 'senior' ? `linear-gradient(135deg, ${C.primary}, ${C.accent})` : `linear-gradient(135deg, ${C.blue}, ${C.accent})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {hr.hr_type === 'senior' ? <Star size={20} color="#fff" /> : <User size={20} color="#fff" />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, color: C.dark }}>{hr.username}</span>
                                <Badge label={hr.hr_type === 'senior' ? 'Senior HR' : 'Junior HR'} color={hr.hr_type === 'senior' ? C.primary : C.blue} />
                            </div>
                            <div style={{ fontSize: '0.78rem', color: C.gray, marginTop: 3 }}>
                                {hr.full_name && <span>{hr.full_name} · </span>}
                                {hr.email && <span>{hr.email} · </span>}
                                {hr.phone && <span>{hr.phone} · </span>}
                                {hr.department && <span>{hr.department} · </span>}
                                Added {fmtDate(hr.created_at)}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setEditModal({ ...hr })} style={{
                                padding: '0.45rem 0.875rem', background: C.primary + '18', border: 'none',
                                borderRadius: '0.5rem', color: C.primary, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 600
                            }}>
                                <Edit2 size={13} /> Edit
                            </button>
                            <button onClick={() => deleteHR(hr.id)} style={{
                                padding: '0.45rem', background: '#fef2f2', border: 'none',
                                borderRadius: '0.5rem', color: C.red, cursor: 'pointer'
                            }}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
                {hrList.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: C.gray }}>
                        <Users size={48} color={C.border} style={{ marginBottom: '1rem' }} />
                        <p>No HR users yet. Add your first HR user.</p>
                    </div>
                )}
            </div>

            {/* Add HR Modal */}
            {addModal && (
                <Modal title="Add HR User" onClose={() => { setAddModal(false); resetForm(); }}>
                    <form onSubmit={addHR}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
                            <Input label="Username *" value={form.username} onChange={set('username')} required placeholder="hr_username" />
                            <Input label="Password *" type="password" value={form.password} onChange={set('password')} required placeholder="Min 6 chars" />
                            <Input label="Email * (credentials will be sent here)" type="email" value={form.email} onChange={set('email')} required placeholder="hr@company.com" />
                            <Input label="Full Name" value={form.full_name || ''} onChange={set('full_name')} placeholder="HR's full name" />
                        </div>
                        <div style={{ marginBottom: '0.875rem' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                                Phone (used for forgot password OTP)
                            </label>
                            <PhoneInput
                                country="in" value={form.phone}
                                onChange={val => setForm(f => ({ ...f, phone: '+' + val }))}
                                inputStyle={{ width: '100%', height: '38px', fontSize: '0.875rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', background: '#fafafa', color: C.dark }}
                                buttonStyle={{ border: `1.5px solid ${C.border}`, borderRight: 'none', borderRadius: '0.5rem 0 0 0.5rem', background: '#fafafa' }}
                                containerStyle={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ marginBottom: '0.875rem' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Department</label>
                            <select
                                value={form.department}
                                onChange={set('department')}
                                style={{ width: '100%', padding: '0.55rem 0.75rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', background: '#fafafa', color: form.department ? C.dark : '#9ca3af', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
                            >
                                <option value="">— Select Department —</option>
                                {['HR / Recruitment', 'Talent Acquisition', 'Learning & Development', 'Operations', 'Engineering', 'Finance', 'Sales & Marketing', 'Admin', 'Other'].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>HR Type</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {[{ value: 'senior', label: 'Senior HR', desc: 'Sees all company data', icon: <Star size={16} /> }, { value: 'junior', label: 'Junior HR', desc: 'Sees only own data', icon: <User size={16} /> }].map(opt => (
                                    <button key={opt.value} type="button" onClick={() => setForm(f => ({ ...f, hr_type: opt.value }))} style={{
                                        padding: '0.875rem', border: `2px solid ${form.hr_type === opt.value ? C.primary : C.border}`,
                                        borderRadius: '0.75rem', background: form.hr_type === opt.value ? C.primary + '10' : '#fff',
                                        cursor: 'pointer', textAlign: 'left'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: form.hr_type === opt.value ? C.primary : C.dark, fontWeight: 700, marginBottom: 4 }}>
                                            {opt.icon} {opt.label}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: C.gray }}>{opt.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => { setAddModal(false); resetForm(); }} style={{ padding: '0.625rem 1.25rem', background: C.light, border: `1px solid ${C.border}`, borderRadius: '0.625rem', color: C.gray, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                            <button type="submit" disabled={saving} style={{
                                padding: '0.625rem 1.5rem', background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                                border: 'none', borderRadius: '0.625rem', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                {saving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
                                {saving ? 'Sending Invite...' : '+ Invite & Add HR User'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit HR Modal */}
            {editModal && (
                <Modal title={`Edit: ${editModal.username}`} onClose={() => setEditModal(null)}>
                    <form onSubmit={updateHR}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
                            <Input label="Email" type="email" value={editModal.email || ''} onChange={e => setEditModal(m => ({ ...m, email: e.target.value }))} placeholder="hr@company.com" />
                            <Input label="Full Name" value={editModal.full_name || ''} onChange={e => setEditModal(m => ({ ...m, full_name: e.target.value }))} placeholder="HR's full name" />
                            <Input label="Department" value={editModal.department || ''} onChange={e => setEditModal(m => ({ ...m, department: e.target.value }))} placeholder="HR / Recruitment" />
                            <Input label="New Password (leave blank to keep)" type="password" value={editModal._newPassword || ''} onChange={e => setEditModal(m => ({ ...m, _newPassword: e.target.value }))} placeholder="New password" />
                        </div>
                        <div style={{ marginBottom: '0.875rem' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Phone (for forgot password OTP)</label>
                            <PhoneInput
                                country="in" value={editModal.phone || ''}
                                onChange={val => setEditModal(m => ({ ...m, phone: '+' + val }))}
                                inputStyle={{ width: '100%', height: '38px', fontSize: '0.875rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', background: '#fafafa', color: C.dark }}
                                buttonStyle={{ border: `1.5px solid ${C.border}`, borderRight: 'none', borderRadius: '0.5rem 0 0 0.5rem', background: '#fafafa' }}
                                containerStyle={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>HR Type</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {[{ value: 'senior', label: 'Senior HR', icon: <Star size={16} /> }, { value: 'junior', label: 'Junior HR', icon: <User size={16} /> }].map(opt => (
                                    <button key={opt.value} type="button" onClick={() => setEditModal(m => ({ ...m, hr_type: opt.value }))} style={{
                                        padding: '0.75rem', border: `2px solid ${editModal.hr_type === opt.value ? C.primary : C.border}`,
                                        borderRadius: '0.75rem', background: editModal.hr_type === opt.value ? C.primary + '10' : '#fff',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        color: editModal.hr_type === opt.value ? C.primary : C.dark, fontWeight: 700
                                    }}>
                                        {opt.icon} {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setEditModal(null)} style={{ padding: '0.625rem 1.25rem', background: C.light, border: `1px solid ${C.border}`, borderRadius: '0.625rem', color: C.gray, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                            <button type="submit" disabled={saving} style={{
                                padding: '0.625rem 1.5rem', background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                                border: 'none', borderRadius: '0.625rem', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ─────────────────────── UPGRADE TAB ─────────────────────────────────────────
function UpgradeTab({ profile, upgradeRequests, reload, showToast, upgradeModal, setUpgradeModal }) {
    const [form, setForm] = useState({ requested_plan: 'basic', notes: '' });
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/enterprise/upgrade-request', form);
            showToast('Upgrade request submitted! Our team will review it.');
            setUpgradeModal(false);
            reload();
        } catch (err) { showToast(err.message || 'Failed to submit', 'error'); }
        finally { setSaving(false); }
    };

    // backend plan values: trial, basic, pro, enterprise, custom
    const plans = [
        { key: 'basic', name: 'Basic', price: '₹2,999/mo', hr: 5, candidates: 200, tests: 20, color: C.blue },
        { key: 'pro', name: 'Pro', price: '₹7,999/mo', hr: 20, candidates: 1000, tests: 100, color: C.accent },
        { key: 'enterprise', name: 'Enterprise', price: 'Custom', hr: '∞', candidates: '∞', tests: '∞', color: C.green },
    ];

    const currentPlan = profile?.plan;
    const statusColor = (s) => ({ pending: C.amber, approved: C.green, rejected: C.red }[s] || C.gray);

    return (
        <div style={{ maxWidth: 800 }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: C.dark }}>Plan & Upgrade</h2>
                <p style={{ margin: '0.2rem 0 0', color: C.gray, fontSize: '0.85rem' }}>Current plan and upgrade options</p>
            </div>

            {/* Current Plan */}
            <div style={{ background: C.card, borderRadius: '1rem', padding: '1.5rem', border: `2px solid ${C.primary}30`, marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '0.875rem', background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Crown size={22} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: C.dark }}>
                            {currentPlan?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Plan
                        </div>
                        <div style={{ fontSize: '0.82rem', color: C.gray }}>
                            HR: {profile?.hr_limit === -1 ? '∞' : profile?.hr_limit} ·
                            Candidates: {profile?.candidate_limit === -1 ? '∞' : profile?.candidate_limit} ·
                            Tests: {profile?.test_limit === -1 ? '∞' : profile?.test_limit}
                            {profile?.trial_ends_at && ` · Expires: ${fmtDate(profile.trial_ends_at)}`}
                        </div>
                    </div>
                    <button onClick={() => setUpgradeModal(true)} style={{
                        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.625rem 1.25rem', background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                        border: 'none', borderRadius: '0.75rem', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer'
                    }}>
                        <TrendingUp size={15} /> Request Upgrade
                    </button>
                </div>
            </div>

            {/* Plan Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {plans.map(p => (
                    <div key={p.key} style={{
                        background: C.card, borderRadius: '1rem', padding: '1.5rem',
                        border: `2px solid ${currentPlan === p.key ? p.color : C.border}`,
                        boxShadow: currentPlan === p.key ? `0 4px 20px ${p.color}20` : 'none'
                    }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: p.color, marginBottom: '0.25rem' }}>{p.name}</div>
                        <div style={{ fontWeight: 700, fontSize: '1.3rem', color: C.dark, marginBottom: '0.875rem' }}>{p.price}</div>
                        <div style={{ fontSize: '0.82rem', color: C.gray, lineHeight: 1.8 }}>
                            <div>HR Users: <b style={{ color: C.dark }}>{p.hr}</b></div>
                            <div>Candidates: <b style={{ color: C.dark }}>{p.candidates}</b></div>
                            <div>Tests: <b style={{ color: C.dark }}>{p.tests}</b></div>
                        </div>
                        {currentPlan === p.key && (
                            <div style={{ marginTop: '0.875rem' }}>
                                <Badge label="Current Plan" color={p.color} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Past upgrade requests */}
            {upgradeRequests.length > 0 && (
                <div style={{ background: C.card, borderRadius: '1rem', padding: '1.5rem', border: `1px solid ${C.border}` }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: C.dark }}>Upgrade Request History</h3>
                    {upgradeRequests.map(r => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: `1px solid ${C.border}` }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: C.dark }}>
                                    Requested: {r.requested_plan?.replace('_', ' ')}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: C.gray }}>{fmtDate(r.created_at)}{r.notes && ` · "${r.notes}"`}</div>
                            </div>
                            <Badge label={r.status.toUpperCase()} color={statusColor(r.status)} />
                        </div>
                    ))}
                </div>
            )}

            {/* Upgrade Modal */}
            {upgradeModal && (
                <Modal title="Request Plan Upgrade" onClose={() => setUpgradeModal(false)}>
                    <form onSubmit={submit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Requested Plan</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {plans.map(p => (
                                    <button key={p.key} type="button" onClick={() => setForm(f => ({ ...f, requested_plan: p.key }))} style={{
                                        padding: '0.875rem 1rem', border: `2px solid ${form.requested_plan === p.key ? p.color : C.border}`,
                                        borderRadius: '0.75rem', background: form.requested_plan === p.key ? p.color + '10' : '#fff',
                                        cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: form.requested_plan === p.key ? p.color : C.dark }}>{p.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: C.gray }}>HR: {p.hr} · Candidates: {p.candidates} · Tests: {p.tests}</div>
                                        </div>
                                        <div style={{ fontWeight: 700, color: C.gray }}>{p.price}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Notes (optional)</label>
                            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Any special requirements or notes..." style={{
                                width: '100%', padding: '0.75rem', border: `1.5px solid ${C.border}`, borderRadius: '0.625rem',
                                fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none'
                            }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setUpgradeModal(false)} style={{ padding: '0.625rem 1.25rem', background: C.light, border: `1px solid ${C.border}`, borderRadius: '0.625rem', color: C.gray, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                            <button type="submit" disabled={saving} style={{
                                padding: '0.625rem 1.5rem', background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                                border: 'none', borderRadius: '0.625rem', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                <TrendingUp size={14} /> {saving ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ─────────────────────── PROFILE TAB ─────────────────────────────────────────
function ProfileTab({ profile, reload, showToast, editModal, setEditModal }) {
    const [saving, setSaving] = useState(false);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { id, plan, is_active, is_trial, created_at, trial_ends_at, updated_at, ...payload } = editModal;
            await api.put('/enterprise/profile', payload);
            showToast('Profile updated!');
            setEditModal(false);
            reload();
        } catch (err) { showToast(err.message || 'Failed to save', 'error'); }
        finally { setSaving(false); }
    };

    if (!profile) return <Spinner />;

    const fields = [
        { label: 'Company Name',  value: profile.name },
        { label: 'Email',         value: profile.email },
        { label: 'Phone',         value: profile.phone || '—' },
        { label: 'GST Number',    value: profile.gst_number || '—' },
        { label: 'Industry',      value: profile.industry || '—' },
        { label: 'Address',       value: profile.address || '—' },
        { label: 'City',          value: profile.city || '—' },
        { label: 'State',         value: profile.state || '—' },
        { label: 'Website',       value: profile.website || '—' },
        { label: 'Plan',          value: profile.plan },
        { label: 'HR Limit',      value: profile.hr_limit === -1 ? 'Unlimited' : profile.hr_limit },
        { label: 'Trial',         value: profile.is_trial ? 'Yes' : 'No' },
    ];

    return (
        <div style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: C.dark }}>Company Profile</h2>
                <button onClick={() => setEditModal({ ...profile })} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.625rem 1.25rem', background: C.primary + '18', border: 'none',
                    borderRadius: '0.75rem', color: C.primary, fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer'
                }}>
                    <Edit2 size={15} /> Edit Profile
                </button>
            </div>

            <div style={{ background: C.card, borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 1px 3px rgba(109,40,217,0.06),0 4px 16px rgba(109,40,217,0.05)', border: '1px solid #ede9fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: '1rem', flexShrink: 0,
                        background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', fontWeight: 800, color: '#fff'
                    }}>
                        {profile.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: C.dark }}>{profile.name}</div>
                        <div style={{ fontSize: '0.85rem', color: C.gray }}>{profile.industry} Company</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {fields.map(f => (
                        <div key={f.label}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: C.gray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{f.label}</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: C.dark }}>{f.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {editModal && (
                <Modal title="Edit Company Profile" onClose={() => setEditModal(false)} width={580}>
                    <form onSubmit={save}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
                            <Input label="Company Name *" value={editModal.name || ''} onChange={e => setEditModal(m => ({ ...m, name: e.target.value }))} required />
                            <Input label="Phone" value={editModal.phone || ''} onChange={e => setEditModal(m => ({ ...m, phone: e.target.value }))} placeholder="+91 98765 00001" />
                            <Input label="GST Number" value={editModal.gst_number || ''} onChange={e => setEditModal(m => ({ ...m, gst_number: e.target.value }))} placeholder="GST Registration Number" />
                            <Input label="Website" value={editModal.website || ''} onChange={e => setEditModal(m => ({ ...m, website: e.target.value }))} placeholder="https://company.com" />
                            <Input label="City" value={editModal.city || ''} onChange={e => setEditModal(m => ({ ...m, city: e.target.value }))} />
                            <Input label="State" value={editModal.state || ''} onChange={e => setEditModal(m => ({ ...m, state: e.target.value }))} />
                        </div>
                        <Input label="Address" value={editModal.address || ''} onChange={e => setEditModal(m => ({ ...m, address: e.target.value }))} placeholder="Full office address" />
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Industry</label>
                            <select value={editModal.industry || 'IT'} onChange={e => setEditModal(m => ({ ...m, industry: e.target.value }))} style={{ width: '100%', padding: '0.65rem 0.875rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', fontSize: '0.875rem', background: '#fafafa', color: C.dark, outline: 'none' }}>
                                {['IT', 'Finance', 'Manufacturing', 'Healthcare', 'Education', 'Retail', 'Other'].map(i => <option key={i}>{i}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setEditModal(false)} style={{ padding: '0.625rem 1.25rem', background: C.light, border: `1px solid ${C.border}`, borderRadius: '0.625rem', color: C.gray, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                            <button type="submit" disabled={saving} style={{
                                padding: '0.625rem 1.5rem', background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                                border: 'none', borderRadius: '0.625rem', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                <Save size={14} /> {saving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
