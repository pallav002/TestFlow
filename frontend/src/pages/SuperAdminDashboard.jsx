import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck, Building2, Users, BarChart3, LogOut, Plus, Trash2,
    Edit2, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, EyeOff, Key,
    Settings, TrendingUp, Clock, Star, ChevronDown, ChevronUp,
    Bell, ArrowUpRight, UserCheck, X, Save, Loader2, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// ─── Aurora Light palette ────────────────────────────────────────────────────
const C = {
    primary: '#a855f7', accent: '#6366f1', pink: '#ec4899',
    orange: '#f97316', cyan: '#06b6d4',
    amber: '#f59e0b', green: '#10b981', red: '#ef4444',
    gray: '#6b7280', light: '#fafafa', border: '#e5e7eb',
    dark: '#0f172a', card: '#ffffff',
    g1: 'linear-gradient(135deg,#a855f7,#6366f1)',
    g2: 'linear-gradient(135deg,#ec4899,#f97316)',
    g3: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
    g4: 'linear-gradient(135deg,#10b981,#3b82f6)',
};

// ─── tiny helpers ────────────────────────────────────────────────────────────
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
            animation: 'fadeIn 0.3s ease'
        }}>
            {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{msg}</span>
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2 }}>
                <X size={14} />
            </button>
        </div>
    );
};

// ─── Modal wrapper ───────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, width = 520 }) => (
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
                background: 'linear-gradient(135deg, #f0f4ff, #faf5ff)'
            }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: C.dark }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray, padding: 4 }}>
                    <X size={18} />
                </button>
            </div>
            <div style={{ padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
                {children}
            </div>
        </div>
    </div>
);

// ─── Input helper ────────────────────────────────────────────────────────────
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

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = C.primary }) => (
    <div style={{
        background: C.card, borderRadius: '1rem', padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 3px rgba(109,40,217,0.06),0 4px 16px rgba(109,40,217,0.05)', border: '1px solid #ede9fe',
        display: 'flex', alignItems: 'flex-start', gap: '1rem'
    }}>
        <div style={{
            width: 44, height: 44, borderRadius: '0.75rem',
            background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: C.dark, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: C.gray, marginTop: 4 }}>{label}</div>
            {sub && <div style={{ fontSize: '0.72rem', color: C.gray + '99', marginTop: 2 }}>{sub}</div>}
        </div>
    </div>
);

// ────────────────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
    const { logout } = useAuth();
    const [tab, setTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [signupRequests, setSignupRequests] = useState([]);
    const [upgradeRequests, setUpgradeRequests] = useState([]);
    const [trialSettings, setTrialSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // modals
    const [addCompanyModal, setAddCompanyModal] = useState(false);
    const [editCompanyModal, setEditCompanyModal] = useState(null);
    const [trialSettingsModal, setTrialSettingsModal] = useState(false);
    const [directAccessKey, setDirectAccessKey] = useState(null);
    const [expandedCompany, setExpandedCompany] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const loadStats = useCallback(async () => {
        try {
            const res = await api.get('/superadmin/stats');
            // normalize field names (backend uses total_hrs not total_hr)
            const d = res.data;
            setStats({
                total_enterprises: d.total_enterprises ?? 0,
                total_hr: d.total_hrs ?? d.total_hr ?? 0,
                total_candidates: d.total_candidates ?? 0,
                total_tests: d.total_tests ?? 0,
            });
        } catch { /* silent */ }
    }, []);

    const loadCompanies = useCallback(async () => {
        try {
            const res = await api.get('/superadmin/enterprises');
            setCompanies(res.data);
        } catch { /* silent */ }
    }, []);

    const loadSignupRequests = useCallback(async () => {
        try {
            const res = await api.get('/superadmin/signup-requests');
            setSignupRequests(res.data);
        } catch { /* silent */ }
    }, []);

    const loadUpgradeRequests = useCallback(async () => {
        try {
            const res = await api.get('/superadmin/upgrade-requests');
            setUpgradeRequests(res.data);
        } catch { /* silent */ }
    }, []);

    const loadTrialSettings = useCallback(async () => {
        try {
            const res = await api.get('/superadmin/trial-settings');
            setTrialSettings(res.data);
        } catch { /* silent */ }
    }, []);

    const loadAll = useCallback(async () => {
        setLoading(true);
        await Promise.all([loadStats(), loadCompanies(), loadSignupRequests(), loadUpgradeRequests(), loadTrialSettings()]);
        setLoading(false);
    }, [loadStats, loadCompanies, loadSignupRequests, loadUpgradeRequests, loadTrialSettings]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const totalSignups = signupRequests.length;
    const pendingUpgrades = upgradeRequests.filter(r => r.status === 'pending');

    const tabs = [
        { key: 'overview', label: 'Overview', icon: <BarChart3 size={15} /> },
        { key: 'companies', label: 'Companies', icon: <Building2 size={15} />, badge: companies.length },
        { key: 'signups', label: 'Signup Details', icon: <UserCheck size={15} />, badge: totalSignups, badgeColor: C.primary },
        { key: 'upgrades', label: 'Upgrade Requests', icon: <TrendingUp size={15} />, badge: pendingUpgrades.length, badgeColor: C.pink },
        { key: 'settings', label: 'Trial Settings', icon: <Settings size={15} /> },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#f3f0ff', fontFamily: '"Inter",system-ui,sans-serif', display: 'flex' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes shimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
                .sa-nav-btn:hover { background: rgba(168,85,247,0.12) !important; color: #c084fc !important; }
                .sa-content-card {
                    background:#fff; border-radius:1.25rem;
                    border:1px solid #ede9fe;
                    box-shadow:0 1px 3px rgba(109,40,217,0.06),0 4px 16px rgba(109,40,217,0.05);
                    transition: box-shadow 0.2s, transform 0.2s;
                    position:relative; overflow:hidden;
                }
                .sa-content-card::before {
                    content:''; position:absolute; top:0; left:0; right:0; height:3px;
                    background:linear-gradient(90deg,#f59e0b,#f97316,#a855f7);
                    opacity:0; transition:opacity 0.2s;
                }
                .sa-content-card:hover { box-shadow:0 4px 24px rgba(109,40,217,0.13); transform:translateY(-2px); }
                .sa-content-card:hover::before { opacity:1; }

                @media (max-width: 768px) {
                    .dash-sidebar { transform: translateX(-100%) !important; transition: transform 0.3s ease !important; }
                    .dash-sidebar.open { transform: translateX(0) !important; }
                    .dash-main { margin-left: 0 !important; }
                    .dash-overlay { display: block !important; }
                }
            `}</style>

            {sidebarOpen && <div className="dash-overlay" onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:199, display:'none' }} />}

            {/* ── SIDEBAR ── */}
            <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`} style={{
                width: 230, flexShrink: 0,
                background: 'linear-gradient(180deg,#0d0a1f 0%,#150a2e 40%,#1a0520 100%)',
                display: 'flex', flexDirection: 'column',
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
                boxShadow: '4px 0 32px rgba(168,85,247,0.2)',
            }}>
                {/* Decorative glows */}
                <div style={{ position:'absolute', top:30, left:-50, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.22),transparent)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', bottom:80, right:-40, width:140, height:140, borderRadius:'50%', background:'radial-gradient(circle,rgba(236,72,153,0.15),transparent)', pointerEvents:'none' }} />

                {/* Logo */}
                <div style={{ padding:'1.5rem 1.25rem 1.25rem', borderBottom:'1px solid rgba(168,85,247,0.15)', position:'relative' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <div style={{
                            width:40, height:40, borderRadius:'0.875rem',
                            background:'linear-gradient(135deg,#f59e0b,#f97316)',
                            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                            boxShadow:'0 4px 16px rgba(245,158,11,0.5)',
                        }}>
                            <ShieldCheck size={21} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontSize:'1.05rem', fontWeight:800, color:'#fff', lineHeight:1, letterSpacing:'-0.01em' }}>TestFlow</div>
                            <div style={{ fontSize:'0.58rem', background:'linear-gradient(135deg,#f59e0b,#f97316)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:800, letterSpacing:'0.12em', marginTop:3 }}>SUPER ADMIN</div>
                        </div>
                    </div>
                </div>

                {/* Nav items */}
                <nav style={{ flex:1, padding:'1rem 0.875rem', display:'flex', flexDirection:'column', gap:'0.2rem', position:'relative' }}>
                    {tabs.map(t => {
                        const active = tab === t.key;
                        return (
                            <button key={t.key} className="sa-nav-btn" onClick={() => setTab(t.key)} style={{
                                display:'flex', alignItems:'center', gap:'0.75rem',
                                padding:'0.75rem 1rem', borderRadius:'0.75rem', border:'none',
                                fontSize:'0.875rem', fontWeight:600, cursor:'pointer', width:'100%', textAlign:'left',
                                background: active ? 'rgba(168,85,247,0.18)' : 'transparent',
                                color: active ? '#e9d5ff' : 'rgba(255,255,255,0.45)',
                                boxShadow: active ? 'inset 0 0 0 1px rgba(168,85,247,0.35)' : 'none',
                                transition:'all 0.15s',
                            }}>
                                <span style={{ flexShrink:0, color: active ? '#c084fc' : 'rgba(255,255,255,0.3)' }}>{t.icon}</span>
                                <span style={{ flex:1 }}>{t.label}</span>
                                {t.badge > 0 && (
                                    <span style={{
                                        background: t.badgeColor === C.pink ? C.g2 : C.g1,
                                        color:'#fff', borderRadius:20, padding:'1px 8px', fontSize:'0.62rem', fontWeight:700, flexShrink:0
                                    }}>{t.badge}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div style={{ padding:'1rem 0.875rem', borderTop:'1px solid rgba(168,85,247,0.12)', display:'flex', flexDirection:'column', gap:'0.5rem', position:'relative' }}>
                    <button onClick={loadAll} style={{
                        display:'flex', alignItems:'center', gap:'0.625rem',
                        padding:'0.625rem 1rem', background:'rgba(255,255,255,0.05)',
                        border:'1px solid rgba(255,255,255,0.08)', borderRadius:'0.75rem',
                        color:'rgba(255,255,255,0.45)', fontSize:'0.82rem', fontWeight:600, cursor:'pointer', width:'100%',
                    }}>
                        <RefreshCw size={14} /> Refresh Data
                    </button>
                    <button onClick={logout} style={{
                        display:'flex', alignItems:'center', gap:'0.625rem',
                        padding:'0.625rem 1rem', background:'rgba(239,68,68,0.1)',
                        border:'1px solid rgba(239,68,68,0.2)', borderRadius:'0.75rem',
                        color:'#fca5a5', fontSize:'0.82rem', fontWeight:600, cursor:'pointer', width:'100%',
                    }}>
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <div className="dash-main" style={{ marginLeft:230, flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
                {/* Top bar */}
                <header style={{
                    height:60, background:'rgba(255,255,255,0.85)', backdropFilter:'blur(20px)',
                    borderBottom:'1px solid rgba(168,85,247,0.1)',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'0 1.25rem', position:'sticky', top:0, zIndex:100,
                    boxShadow:'0 1px 0 rgba(168,85,247,0.06)',
                }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <button onClick={() => setSidebarOpen(o => !o)} className="dash-hamburger" style={{ display:'none', padding:'0.4rem', background:'transparent', border:'1px solid #ede9fe', borderRadius:'0.5rem', cursor:'pointer', color:'#a855f7' }}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        </button>
                        <div>
                        <h1 style={{ margin:0, fontSize:'1.05rem', fontWeight:800, color:C.dark, letterSpacing:'-0.01em' }}>
                            {tabs.find(t => t.key === tab)?.label}
                        </h1>
                        <p style={{ margin:0, fontSize:'0.71rem', color:C.gray, fontWeight:500 }}>TestFlow Platform Management</p>
                        </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
                        <div style={{
                            width:34, height:34, borderRadius:'50%',
                            background:'linear-gradient(135deg,#f59e0b,#f97316)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:'0.78rem', fontWeight:800, color:'#fff',
                            boxShadow:'0 4px 12px rgba(245,158,11,0.35)',
                        }}>SA</div>
                        <div>
                            <div style={{ fontSize:'0.82rem', fontWeight:700, color:C.dark }}>Super Admin</div>
                            <div style={{ fontSize:'0.68rem', color:C.gray }}>Platform Owner</div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div style={{ flex:1, padding:'2rem', overflowY:'auto', background:'#f3f0ff' }}>
                    {loading ? <Spinner /> : (
                        <>
                            {tab === 'overview' && <OverviewTab stats={stats} companies={companies} totalSignups={totalSignups} pendingUpgrades={pendingUpgrades} setTab={setTab} />}
                            {tab === 'companies' && (
                                <CompaniesTab
                                    companies={companies} reload={loadCompanies}
                                    showToast={showToast}
                                    addModal={addCompanyModal} setAddModal={setAddCompanyModal}
                                    editModal={editCompanyModal} setEditModal={setEditCompanyModal}
                                    directAccessKey={directAccessKey} setDirectAccessKey={setDirectAccessKey}
                                    expandedCompany={expandedCompany} setExpandedCompany={setExpandedCompany}
                                />
                            )}
                            {tab === 'signups' && <SignupRequestsTab requests={signupRequests} reload={() => { loadSignupRequests(); loadCompanies(); loadStats(); }} showToast={showToast} />}
                            {tab === 'upgrades' && <UpgradeRequestsTab requests={upgradeRequests} reload={() => { loadUpgradeRequests(); loadCompanies(); }} showToast={showToast} />}
                            {tab === 'settings' && <TrialSettingsTab settings={trialSettings} reload={loadTrialSettings} showToast={showToast} modal={trialSettingsModal} setModal={setTrialSettingsModal} />}
                        </>
                    )}
                </div>
            </div>

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

// ─────────────────────── OVERVIEW TAB ────────────────────────────────────────
function OverviewTab({ stats, companies, totalSignups, pendingUpgrades, setTab }) {
    const active = companies.filter(c => c.is_active).length;
    const inactive = companies.filter(c => !c.is_active).length;

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: C.dark }}>Platform Overview</h2>
                <p style={{ margin: '0.25rem 0 0', color: C.gray, fontSize: '0.875rem' }}>Real-time platform statistics and quick actions</p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatCard icon={<Building2 size={22} color={C.primary} />} label="Total Companies" value={stats?.total_enterprises ?? 0} sub={`${active} active · ${inactive} inactive`} color={C.primary} />
                <StatCard icon={<Users size={22} color={C.accent} />} label="Total HR Users" value={stats?.total_hr ?? 0} color={C.accent} />
                <StatCard icon={<UserCheck size={22} color={C.green} />} label="Total Candidates" value={stats?.total_candidates ?? 0} color={C.green} />
                <StatCard icon={<BarChart3 size={22} color={C.pink} />} label="Tests Created" value={stats?.total_tests ?? 0} color={C.pink} />
                <StatCard icon={<Clock size={22} color={C.amber} />} label="Total Signups" value={totalSignups} color={C.amber} />
                <StatCard icon={<TrendingUp size={22} color={C.red} />} label="Upgrade Requests" value={pendingUpgrades.length} color={C.red} />
            </div>

            {/* Quick Action Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Recent Companies */}
                <div style={{ background: C.card, borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(109,40,217,0.06),0 4px 16px rgba(109,40,217,0.05)', border: '1px solid #ede9fe' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: C.dark }}>Recent Companies</h3>
                        <button onClick={() => setTab('companies')} style={{ background: 'none', border: 'none', color: C.primary, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            View all <ArrowUpRight size={13} />
                        </button>
                    </div>
                    {companies.slice(0, 5).map(c => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: `1px solid ${C.border}` }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: C.dark }}>{c.name}</div>
                                <div style={{ fontSize: '0.72rem', color: C.gray }}>{c.industry} · {fmtDate(c.created_at)}</div>
                            </div>
                            <Badge label={c.is_active ? 'Active' : 'Inactive'} color={c.is_active ? C.green : C.gray} />
                        </div>
                    ))}
                    {companies.length === 0 && <p style={{ color: C.gray, fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No companies yet</p>}
                </div>

                {/* Pending Actions */}
                <div style={{ background: C.card, borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(109,40,217,0.06),0 4px 16px rgba(109,40,217,0.05)', border: '1px solid #ede9fe' }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: C.dark }}>Pending Actions</h3>
                    <div onClick={() => setTab('signups')} style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem',
                        background: C.amber + '10', borderRadius: '0.75rem', marginBottom: '0.75rem',
                        cursor: 'pointer', border: `1px solid ${C.amber}30`
                    }}>
                        <div style={{ width: 40, height: 40, borderRadius: '0.625rem', background: C.amber + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bell size={18} color={C.amber} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: C.dark }}>{totalSignups}</div>
                            <div style={{ fontSize: '0.8rem', color: C.gray }}>Recent free trial signups</div>
                        </div>
                        <ArrowUpRight size={16} color={C.amber} style={{ marginLeft: 'auto' }} />
                    </div>
                    <div onClick={() => setTab('upgrades')} style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem',
                        background: C.pink + '10', borderRadius: '0.75rem', cursor: 'pointer',
                        border: `1px solid ${C.pink}30`
                    }}>
                        <div style={{ width: 40, height: 40, borderRadius: '0.625rem', background: C.pink + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={18} color={C.pink} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: C.dark }}>{pendingUpgrades.length}</div>
                            <div style={{ fontSize: '0.8rem', color: C.gray }}>Plan upgrade requests</div>
                        </div>
                        <ArrowUpRight size={16} color={C.pink} style={{ marginLeft: 'auto' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────── COMPANIES TAB ───────────────────────────────────────
// ─── View Company Modal ───────────────────────────────────────────────────────
function ViewCompanyModal({ company: c, onClose }) {
    const now = new Date();
    const createdAt = c.created_at ? new Date(c.created_at) : null;
    const trialEnds = c.trial_ends_at ? new Date(c.trial_ends_at) : null;
    const daysUsed = createdAt ? Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)) : null;
    const daysLeft = trialEnds ? Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24)) : null;
    const totalTrialDays = (createdAt && trialEnds) ? Math.round((trialEnds - createdAt) / (1000 * 60 * 60 * 24)) : null;
    const trialProgress = (totalTrialDays && daysUsed !== null) ? Math.min(100, Math.round((daysUsed / totalTrialDays) * 100)) : 0;
    const isExpired = daysLeft !== null && daysLeft <= 0;

    const planColor = (p) => ({ trial: C.amber, basic: C.primary, pro: C.accent, enterprise: C.green, custom: C.green }[p] || C.gray);
    const Row = ({ label, value, color }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '0.82rem', color: C.gray, fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: color || C.dark }}>{value}</span>
        </div>
    );

    return (
        <Modal title={`Company Details — ${c.name}`} onClose={onClose} width={600}>
            {/* Header banner */}
            <div style={{
                background: `linear-gradient(135deg, ${planColor(c.plan)}18, ${planColor(c.plan)}08)`,
                border: `1px solid ${planColor(c.plan)}30`,
                borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.25rem',
                display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
                <div style={{
                    width: 52, height: 52, borderRadius: '0.875rem', flexShrink: 0,
                    background: `linear-gradient(135deg, ${planColor(c.plan)}, ${planColor(c.plan)}99)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', fontWeight: 900, color: '#fff'
                }}>{c.name?.[0]?.toUpperCase()}</div>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: C.dark }}>{c.name}</div>
                    <div style={{ fontSize: '0.78rem', color: C.gray, marginTop: 2 }}>{c.email} · {c.industry}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 6 }}>
                        <Badge label={c.plan?.toUpperCase()} color={planColor(c.plan)} />
                        <Badge label={c.is_active ? 'Active' : 'Inactive'} color={c.is_active ? C.green : C.gray} />
                        {c.signup_method === 'public' && <Badge label="Self Signup" color={C.primary} />}
                    </div>
                </div>
            </div>

            {/* Trial Progress Bar */}
            {c.is_trial && totalTrialDays && (
                <div style={{ background: C.light, borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: C.dark }}>
                            {isExpired ? '⚠️ Trial Expired' : `Trial Progress`}
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isExpired ? C.red : daysLeft <= 2 ? C.amber : C.green }}>
                            {isExpired ? 'Expired' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                        </span>
                    </div>
                    <div style={{ background: C.border, borderRadius: 99, height: 8, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 99, width: `${trialProgress}%`,
                            background: isExpired ? C.red : daysLeft <= 2 ? `linear-gradient(90deg,${C.amber},${C.red})` : `linear-gradient(90deg,${C.primary},${C.green})`,
                            transition: 'width 0.5s ease'
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.72rem', color: C.gray }}>
                        <span>Started: {fmtDate(c.created_at)}</span>
                        <span>{daysUsed} / {totalTrialDays} days used</span>
                        <span>Ends: {fmtDate(c.trial_ends_at)}</span>
                    </div>
                </div>
            )}

            {/* Details Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.5rem' }}>
                <div>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company Info</p>
                    <Row label="Company Name" value={c.name} />
                    <Row label="Email" value={c.email} />
                    <Row label="Phone" value={c.phone || '—'} />
                    <Row label="Industry" value={c.industry || '—'} />
                    <Row label="GST Number" value={c.gst_number || '—'} />
                    <Row label="Website" value={c.website || '—'} />
                    <Row label="City" value={c.city || '—'} />
                    <Row label="State" value={c.state || '—'} />
                </div>
                <div>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan & Limits</p>
                    <Row label="Plan" value={c.plan?.toUpperCase()} color={planColor(c.plan)} />
                    <Row label="Is Trial" value={c.is_trial ? 'Yes' : 'No'} />
                    <Row label="Status" value={c.is_active ? '✅ Active' : '❌ Inactive'} color={c.is_active ? C.green : C.red} />
                    <Row label="HR Limit" value={c.hr_limit === -1 ? 'Unlimited' : c.hr_limit} />
                    <Row label="Candidate Limit" value={c.candidate_limit === -1 ? 'Unlimited' : c.candidate_limit} />
                    <Row label="Test Limit" value={c.test_limit === -1 ? 'Unlimited' : c.test_limit} />
                    <Row label="Signup Method" value={c.signup_method === 'public' ? 'Self Signup' : 'Admin Created'} />
                    <Row label="Registered On" value={fmtDate(c.created_at)} />
                    {c.trial_ends_at && <Row label="Trial Ends" value={fmtDate(c.trial_ends_at)} color={isExpired ? C.red : daysLeft <= 2 ? C.amber : C.green} />}
                </div>
            </div>
        </Modal>
    );
}

function CompaniesTab({ companies, reload, showToast, addModal, setAddModal, editModal, setEditModal, directAccessKey, setDirectAccessKey, expandedCompany, setExpandedCompany }) {
    const [saving, setSaving] = useState(false);
    const [viewCompany, setViewCompany] = useState(null);
    const [form, setForm] = useState({
        company_name: '', email: '', phone: '',
        industry: 'IT', plan_type: 'trial',
        hr_limit: 1, candidate_limit: 10, test_limit: 2,
        username: '', password: ''
    });
    const handlePhoneChange = (e, target = 'add') => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
        if (target === 'add') setForm(f => ({ ...f, phone: val }));
        else setEditModal(m => ({ ...m, phone: val }));
    };
    const resetForm = () => setForm({
        company_name: '', email: '', phone: '',
        industry: 'IT', plan_type: 'trial',
        hr_limit: 1, candidate_limit: 10, test_limit: 2,
        username: '', password: ''
    });

    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

    const createCompany = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // backend EnterpriseCreate fields: name, email, phone, industry, plan, hr_limit, candidate_limit, test_limit, username, password
            const payload = {
                name: form.company_name,
                email: form.email,
                phone: form.phone,
                industry: form.industry,
                plan: form.plan_type,
                hr_limit: +form.hr_limit,
                candidate_limit: +form.candidate_limit,
                test_limit: +form.test_limit,
                username: form.username,
                password: form.password,
            };
            await api.post('/superadmin/enterprises', payload);
            showToast('Company created successfully!');
            setAddModal(false);
            resetForm();
            reload();
        } catch (err) {
            showToast(err.message || 'Failed to create company', 'error');
        } finally { setSaving(false); }
    };

    const updateCompany = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // send only EnterpriseUpdate fields
            const payload = {
                name: editModal.name,
                email: editModal.email,
                phone: editModal.phone,
                industry: editModal.industry,
                plan: editModal.plan,
                hr_limit: editModal.hr_limit,
                candidate_limit: editModal.candidate_limit,
                test_limit: editModal.test_limit,
                is_active: editModal.is_active,
            };
            await api.put(`/superadmin/enterprises/${editModal.id}`, payload);
            showToast('Company updated!');
            setEditModal(null);
            reload();
        } catch (err) {
            showToast(err.message || 'Failed to update', 'error');
        } finally { setSaving(false); }
    };

    const toggleActive = async (company) => {
        try {
            await api.put(`/superadmin/enterprises/${company.id}`, { is_active: !company.is_active });
            showToast(`Company ${company.is_active ? 'deactivated' : 'activated'}!`);
            reload();
        } catch (err) { showToast(err.message || 'Failed', 'error'); }
    };

    const deleteCompany = async (id) => {
        if (!window.confirm('Delete this company and all its data permanently?')) return;
        try {
            await api.delete(`/superadmin/enterprises/${id}`);
            showToast('Company deleted');
            reload();
        } catch (err) { showToast(err.message || 'Failed to delete', 'error'); }
    };

    const getDirectAccess = async (company) => {
        try {
            const res = await api.post(`/superadmin/enterprises/${company.id}/access-token`);
            setDirectAccessKey({ company: company.name, token: res.data.access_token, id: company.id });
        } catch (err) { showToast(err.message || 'Failed', 'error'); }
    };

    // backend uses 'trial', 'basic', 'pro', 'enterprise', 'custom'
    const planColor = (p) => ({ trial: C.amber, free_trial: C.amber, basic: C.primary, standard: C.accent, pro: C.accent, enterprise: C.green, custom: C.green }[p] || C.gray);

    const industries = ['IT', 'Finance', 'Manufacturing', 'Healthcare', 'Education', 'Retail', 'Other'];
    // backend plan values: trial, basic, pro, enterprise, custom
    const plans = [
        { value: 'trial', label: 'Free Trial' },
        { value: 'basic', label: 'Basic' },
        { value: 'pro', label: 'Pro' },
        { value: 'enterprise', label: 'Enterprise' },
    ];

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: C.dark }}>Companies</h2>
                    <p style={{ margin: '0.2rem 0 0', color: C.gray, fontSize: '0.85rem' }}>{companies.length} registered companies</p>
                </div>
                <button onClick={() => setAddModal(true)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.625rem 1.25rem', background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                    color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                    boxShadow: `0 4px 12px ${C.primary}40`
                }}>
                    <Plus size={16} /> Add Company
                </button>
            </div>

            {/* Company Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {companies.map(c => (
                    <div key={c.id} style={{
                        background: C.card, borderRadius: '1rem', border: `1px solid ${C.border}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden'
                    }}>
                        <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {/* Avatar */}
                            <div style={{
                                width: 40, height: 40, borderRadius: '0.75rem', flexShrink: 0,
                                background: `linear-gradient(135deg, ${planColor(c.plan)}, ${planColor(c.plan)}99)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1rem', fontWeight: 800, color: '#fff'
                            }}>
                                {c.name?.[0]?.toUpperCase()}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: C.dark }}>{c.name}</span>
                                    <Badge label={c.plan?.replace('_', ' ').toUpperCase()} color={planColor(c.plan)} />
                                    <Badge label={c.is_active ? 'Active' : 'Inactive'} color={c.is_active ? C.green : C.gray} />
                                </div>
                                <div style={{ fontSize: '0.75rem', color: C.gray, marginTop: 2 }}>
                                    {c.industry} · {c.email}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <button onClick={() => getDirectAccess(c)} title="Direct Access" style={{
                                    padding: '0.4rem 0.7rem', background: C.amber + '18', border: 'none',
                                    borderRadius: '0.5rem', color: C.amber, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 600
                                }}>
                                    <Key size={13} /> Access
                                </button>
                                <button onClick={() => setViewCompany(c)} title="View Details" style={{
                                    padding: '0.4rem 0.7rem', background: C.green + '18', border: 'none',
                                    borderRadius: '0.5rem', color: C.green, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 600
                                }}>
                                    <Eye size={13} /> View
                                </button>
                                <button onClick={() => setEditModal({ ...c })} title="Edit" style={{
                                    padding: '0.4rem 0.7rem', background: C.primary + '18', border: 'none',
                                    borderRadius: '0.5rem', color: C.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', fontWeight: 600
                                }}>
                                    <Edit2 size={13} /> Edit
                                </button>
                                <button onClick={() => toggleActive(c)} title={c.is_active ? 'Deactivate' : 'Activate'} style={{
                                    padding: '0.4rem 0.7rem', background: (c.is_active ? C.red : C.green) + '18', border: 'none',
                                    borderRadius: '0.5rem', color: c.is_active ? C.red : C.green, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600
                                }}>
                                    {c.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button onClick={() => deleteCompany(c.id)} title="Delete" style={{
                                    padding: '0.45rem', background: '#fef2f2', border: 'none', borderRadius: '0.5rem', color: C.red, cursor: 'pointer'
                                }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                    </div>
                ))}
                {companies.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: C.gray }}>
                        <Building2 size={48} color={C.border} style={{ marginBottom: '1rem' }} />
                        <p>No companies yet. Add your first company.</p>
                    </div>
                )}
            </div>

            {/* Add Company Modal */}
            {addModal && (
                <Modal title="Add New Company" onClose={() => setAddModal(false)} width={560}>
                    <form onSubmit={createCompany}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
                            <Input label="Company Name *" value={form.company_name} onChange={set('company_name')} required placeholder="Your company name" />
                            <Input label="Email *" type="email" value={form.email} onChange={set('email')} required placeholder="contact@company.com" />
                        </div>
                        <div style={{ marginBottom: '0.875rem' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Phone</label>
                            <PhoneInput
                                country="in" value={form.phone}
                                onChange={val => setForm(f => ({ ...f, phone: '+' + val }))}
                                inputStyle={{ width: '100%', height: '38px', fontSize: '0.875rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', background: '#fafafa', color: C.dark }}
                                buttonStyle={{ border: `1.5px solid ${C.border}`, borderRight: 'none', borderRadius: '0.5rem 0 0 0.5rem', background: '#fafafa' }}
                                containerStyle={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
                            <div style={{ marginBottom: '0.875rem' }}>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Industry</label>
                                <select value={form.industry} onChange={set('industry')} style={{ width: '100%', padding: '0.65rem 0.875rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', fontSize: '0.875rem', background: '#fafafa', color: C.dark, outline: 'none' }}>
                                    {industries.map(i => <option key={i}>{i}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: '0.875rem' }}>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Plan Type</label>
                                <select value={form.plan_type} onChange={set('plan_type')} style={{ width: '100%', padding: '0.65rem 0.875rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', fontSize: '0.875rem', background: '#fafafa', color: C.dark, outline: 'none' }}>
                                    {plans.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ background: C.light, borderRadius: '0.75rem', padding: '1rem', marginBottom: '0.875rem' }}>
                            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', fontWeight: 700, color: C.dark }}>Plan Limits (-1 = Unlimited)</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                <Input label="HR Limit" type="number" value={form.hr_limit} onChange={set('hr_limit')} min="-1" />
                                <Input label="Candidates" type="number" value={form.candidate_limit} onChange={set('candidate_limit')} min="-1" />
                                <Input label="Tests" type="number" value={form.test_limit} onChange={set('test_limit')} min="-1" />
                                <Input label="Trial Days" type="number" value={form.trial_days} onChange={set('trial_days')} min="1" />
                            </div>
                        </div>

                        <div style={{ background: '#f0f4ff', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem' }}>
                            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', fontWeight: 700, color: C.primary }}>Enterprise Admin Account</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
                                <Input label="Username *" value={form.username} onChange={set('username')} required placeholder="admin_username" />
                                <Input label="Password *" type="password" value={form.password} onChange={set('password')} required placeholder="Min 6 chars" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setAddModal(false)} style={{ padding: '0.625rem 1.25rem', background: C.light, border: `1px solid ${C.border}`, borderRadius: '0.625rem', color: C.gray, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                            <button type="submit" disabled={saving} style={{
                                padding: '0.625rem 1.5rem', background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                                border: 'none', borderRadius: '0.625rem', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.75 : 1,
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                {saving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
                                {saving ? 'Creating...' : 'Create Company'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit Company Modal */}
            {editModal && (
                <Modal title={`Edit: ${editModal.name}`} onClose={() => setEditModal(null)} width={560}>
                    <form onSubmit={updateCompany}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
                            <Input label="Company Name" value={editModal.name || ''} onChange={e => setEditModal(m => ({ ...m, name: e.target.value }))} />
                            <Input label="Email" type="email" value={editModal.email || ''} onChange={e => setEditModal(m => ({ ...m, email: e.target.value }))} />
                        </div>
                        <div style={{ marginBottom: '0.875rem' }}>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Phone</label>
                            <PhoneInput
                                country="in" value={editModal.phone || ''}
                                onChange={val => setEditModal(m => ({ ...m, phone: '+' + val }))}
                                inputStyle={{ width: '100%', height: '38px', fontSize: '0.875rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', background: '#fafafa', color: C.dark }}
                                buttonStyle={{ border: `1.5px solid ${C.border}`, borderRight: 'none', borderRadius: '0.5rem 0 0 0.5rem', background: '#fafafa' }}
                                containerStyle={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
                            <div style={{ marginBottom: '0.875rem' }}>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Industry</label>
                                <select value={editModal.industry || 'IT'} onChange={e => setEditModal(m => ({ ...m, industry: e.target.value }))} style={{ width: '100%', padding: '0.65rem 0.875rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', fontSize: '0.875rem', background: '#fafafa', color: C.dark, outline: 'none' }}>
                                    {['IT', 'Finance', 'Manufacturing', 'Healthcare', 'Education', 'Retail', 'Other'].map(i => <option key={i}>{i}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: '0.875rem' }}>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>Plan</label>
                                <select value={editModal.plan || 'trial'} onChange={e => setEditModal(m => ({ ...m, plan: e.target.value }))} style={{ width: '100%', padding: '0.65rem 0.875rem', border: `1.5px solid ${C.border}`, borderRadius: '0.5rem', fontSize: '0.875rem', background: '#fafafa', color: C.dark, outline: 'none' }}>
                                    {[{ value: 'trial', label: 'Free Trial' }, { value: 'basic', label: 'Basic' }, { value: 'pro', label: 'Pro' }, { value: 'enterprise', label: 'Enterprise' }].map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ background: C.light, borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem' }}>
                            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', fontWeight: 700, color: C.dark }}>Plan Limits (-1 = Unlimited)</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                <Input label="HR Limit" type="number" value={editModal.hr_limit ?? 2} onChange={e => setEditModal(m => ({ ...m, hr_limit: +e.target.value }))} min="-1" />
                                <Input label="Candidates" type="number" value={editModal.candidate_limit ?? 50} onChange={e => setEditModal(m => ({ ...m, candidate_limit: +e.target.value }))} min="-1" />
                                <Input label="Tests" type="number" value={editModal.test_limit ?? 5} onChange={e => setEditModal(m => ({ ...m, test_limit: +e.target.value }))} min="-1" />
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

            {/* View Company Modal */}
            {viewCompany && <ViewCompanyModal company={viewCompany} onClose={() => setViewCompany(null)} />}

            {/* Direct Access Key Modal */}
            {directAccessKey && (
                <Modal title={`Access: ${directAccessKey.company}`} onClose={() => setDirectAccessKey(null)}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.amber + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <Key size={24} color={C.amber} />
                        </div>
                        <h3 style={{ margin: '0 0 0.5rem', color: C.dark }}>{directAccessKey.company}</h3>
                        <p style={{ color: C.gray, fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            Click below to enter this company's dashboard as SuperAdmin.<br />
                            Your session will be saved — use the browser back button or log out to return.
                        </p>
                        <button
                            onClick={() => {
                                // Save SA token so they can come back
                                const saToken = localStorage.getItem('token');
                                if (saToken) sessionStorage.setItem('sa_token', saToken);
                                // Swap in enterprise token
                                localStorage.setItem('token', directAccessKey.token);
                                // Navigate to enterprise dashboard (full reload so AuthContext picks up new token)
                                window.location.href = '/enterprise';
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.75rem 1.75rem', background: `linear-gradient(135deg, ${C.amber}, #d97706)`,
                                border: 'none', borderRadius: '0.75rem', color: '#fff',
                                fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                                boxShadow: `0 4px 12px ${C.amber}40`, margin: '0 auto 1rem',
                            }}
                        >
                            <ExternalLink size={16} /> Enter Enterprise Dashboard
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(directAccessKey.token); showToast('Token copied'); }} style={{
                            padding: '0.5rem 1.25rem', background: 'transparent',
                            border: `1px solid ${C.border}`, borderRadius: '0.5rem',
                            color: C.gray, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                        }}>
                            Copy Token Only
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ─────────────────────── SIGNUP REQUESTS TAB ─────────────────────────────────
function SignupRequestsTab({ requests, reload, showToast }) {
    const [processingId, setProcessingId] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const approve = async (req) => {
        setProcessingId(req.id);
        try {
            await api.post(`/superadmin/signup-requests/${req.id}/approve`);
            showToast(`${req.company_name} approved and account created!`);
            reload();
        } catch (err) { showToast(err.message || 'Failed to approve', 'error'); }
        finally { setProcessingId(null); }
    };

    const reject = async () => {
        if (!rejectModal) return;
        setProcessingId(rejectModal.id);
        try {
            const url = rejectReason
                ? `/superadmin/signup-requests/${rejectModal.id}/reject?rejection_note=${encodeURIComponent(rejectReason)}`
                : `/superadmin/signup-requests/${rejectModal.id}/reject`;
            await api.post(url);
            showToast('Request rejected');
            setRejectModal(null);
            setRejectReason('');
            reload();
        } catch (err) { showToast(err.message || 'Failed to reject', 'error'); }
        finally { setProcessingId(null); }
    };

    const deleteRequest = async () => {
        if (!deleteConfirm) return;
        setProcessingId(deleteConfirm.id);
        try {
            await api.delete(`/superadmin/signup-requests/${deleteConfirm.id}`);
            showToast(`${deleteConfirm.company_name} request deleted`);
            setDeleteConfirm(null);
            reload();
        } catch (err) { showToast(err.message || 'Failed to delete', 'error'); }
        finally { setProcessingId(null); }
    };

    const statusColor = (s) => ({ pending: C.amber, approved: C.green, rejected: C.red }[s] || C.gray);

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: C.dark }}>Free Trial Signup Details</h2>
                <p style={{ margin: '0.2rem 0 0', color: C.gray, fontSize: '0.85rem' }}>{requests.length} total signups</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {requests.map(r => (
                    <div key={r.id} style={{
                        background: C.card, borderRadius: '1rem', padding: '1.25rem 1.5rem',
                        border: `1px solid ${r.status === 'pending' ? C.amber + '50' : C.border}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: '0.75rem', flexShrink: 0,
                                background: `linear-gradient(135deg, ${C.amber}, #f97316)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.1rem', fontWeight: 800, color: '#fff'
                            }}>
                                {r.company_name?.[0]?.toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, color: C.dark }}>{r.company_name}</span>
                                    <Badge label={r.status.toUpperCase()} color={statusColor(r.status)} />
                                    <Badge label={r.industry} color={C.primary} />
                                </div>
                                <div style={{ fontSize: '0.8rem', color: C.gray, marginTop: 4 }}>
                                    Contact: {r.contact_name} · {r.email} · {r.phone}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: C.gray, marginTop: 2 }}>
                                    Username: <b style={{ color: C.dark }}>{r.username}</b> · Submitted: {fmtDate(r.created_at)}
                                </div>
                                {r.rejection_note && (
                                    <div style={{ fontSize: '0.78rem', color: C.red, marginTop: 4 }}>
                                        Rejected: {r.rejection_note}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                <Badge label="ACTIVATED" color={C.green} />
                                <button onClick={() => setDeleteConfirm(r)} disabled={processingId === r.id} style={{
                                    padding: '0.45rem 1rem', background: '#fef2f2', border: `1px solid ${C.red}40`,
                                    borderRadius: '0.5rem', color: C.red, fontSize: '0.8rem', fontWeight: 700,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                }}>
                                    <Trash2 size={13} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {requests.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: C.gray }}>
                        <UserCheck size={48} color={C.border} style={{ marginBottom: '1rem' }} />
                        <p>No signups yet</p>
                    </div>
                )}
            </div>

            {deleteConfirm && (
                <Modal title="Delete Signup Details" onClose={() => setDeleteConfirm(null)}>
                    <p style={{ color: C.gray, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                        Are you sure you want to delete the record for <b style={{ color: C.dark }}>{deleteConfirm.company_name}</b>? This will only remove the history record, not the company itself.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setDeleteConfirm(null)} style={{ padding: '0.625rem 1.25rem', background: C.light, border: `1px solid ${C.border}`, borderRadius: '0.625rem', color: C.gray, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                        <button onClick={deleteRequest} disabled={processingId === deleteConfirm.id} style={{ padding: '0.625rem 1.25rem', background: C.red, border: 'none', borderRadius: '0.625rem', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ─────────────────────── UPGRADE REQUESTS TAB ────────────────────────────────
function UpgradeRequestsTab({ requests, reload, showToast }) {
    const [processingId, setProcessingId] = useState(null);

    const approve = async (req) => {
        setProcessingId(req.id);
        try {
            await api.post(`/superadmin/upgrade-requests/${req.id}/approve`);
            showToast('Upgrade approved and plan updated!');
            reload();
        } catch (err) { showToast(err.message || 'Failed to approve', 'error'); }
        finally { setProcessingId(null); }
    };

    const reject = async (req) => {
        setProcessingId(req.id);
        try {
            await api.post(`/superadmin/upgrade-requests/${req.id}/reject`);
            showToast('Upgrade request rejected');
            reload();
        } catch (err) { showToast(err.message || 'Failed to reject', 'error'); }
        finally { setProcessingId(null); }
    };

    const statusColor = (s) => ({ pending: C.amber, approved: C.green, rejected: C.red }[s] || C.gray);

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: C.dark }}>Plan Upgrade Requests</h2>
                <p style={{ margin: '0.2rem 0 0', color: C.gray, fontSize: '0.85rem' }}>{requests.filter(r => r.status === 'pending').length} pending</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {requests.map(r => (
                    <div key={r.id} style={{
                        background: C.card, borderRadius: '1rem', padding: '1.25rem 1.5rem',
                        border: `1px solid ${r.status === 'pending' ? C.pink + '50' : C.border}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: '0.75rem', flexShrink: 0,
                                background: `linear-gradient(135deg, ${C.pink}, ${C.accent})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <TrendingUp size={20} color="#fff" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, color: C.dark }}>{r.enterprise_name || `Enterprise #${r.enterprise_id}`}</span>
                                    <Badge label={r.status.toUpperCase()} color={statusColor(r.status)} />
                                </div>
                                <div style={{ fontSize: '0.8rem', color: C.gray, marginTop: 4 }}>
                                    Requested Plan: <b style={{ color: C.primary }}>{r.requested_plan?.replace('_', ' ')}</b>
                                    {r.message && ` · "${r.message}"`}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: C.gray, marginTop: 2 }}>
                                    Submitted: {fmtDate(r.created_at)}
                                </div>
                            </div>
                            {r.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                    <button onClick={() => approve(r)} disabled={processingId === r.id} style={{
                                        padding: '0.45rem 1rem', background: C.green, border: 'none',
                                        borderRadius: '0.5rem', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 4
                                    }}>
                                        <CheckCircle size={13} /> Approve
                                    </button>
                                    <button onClick={() => reject(r)} disabled={processingId === r.id} style={{
                                        padding: '0.45rem 1rem', background: '#fef2f2', border: `1px solid ${C.red}30`,
                                        borderRadius: '0.5rem', color: C.red, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 4
                                    }}>
                                        <XCircle size={13} /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {requests.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: C.gray }}>
                        <TrendingUp size={48} color={C.border} style={{ marginBottom: '1rem' }} />
                        <p>No upgrade requests yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────── TRIAL SETTINGS TAB ──────────────────────────────────
function TrialSettingsTab({ settings, reload, showToast }) {
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (settings) setForm({ ...settings });
    }, [settings]);

    const set = k => e => setForm(f => ({ ...f, [k]: +e.target.value }));

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/superadmin/trial-settings', form);
            showToast('Trial settings updated!');
            reload();
        } catch (err) { showToast(err.message || 'Failed to save', 'error'); }
        finally { setSaving(false); }
    };

    if (!form) return <Spinner />;

    return (
        <div style={{ maxWidth: 760 }}>
            <div style={{ marginBottom: '1.75rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: C.dark }}>Free Trial Settings</h2>
                <p style={{ margin: '0.2rem 0 0', color: C.gray, fontSize: '0.85rem' }}>Default limits applied to new free trial accounts</p>
            </div>

            <div style={{ background: C.card, borderRadius: '1rem', padding: '2rem 2.5rem', boxShadow: '0 1px 3px rgba(109,40,217,0.06),0 4px 16px rgba(109,40,217,0.05)', border: '1px solid #ede9fe' }}>
                <form onSubmit={save}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 2rem' }}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: C.dark, marginBottom: '0.4rem' }}>Trial Duration (days)</label>
                            <input type="number" value={form.trial_duration_days} onChange={set('trial_duration_days')} min="1" max="365" style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${C.border}`, borderRadius: '0.625rem', fontSize: '1rem', fontWeight: 700, color: C.primary, outline: 'none', boxSizing: 'border-box', textAlign: 'center' }}
                                onFocus={e => e.target.style.borderColor = C.primary}
                                onBlur={e => e.target.style.borderColor = C.border} />
                            <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: C.gray }}>Days from activation</p>
                        </div>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: C.dark, marginBottom: '0.4rem' }}>Max HR Users</label>
                            <input type="number" value={form.hr_limit} onChange={set('hr_limit')} min="-1" style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${C.border}`, borderRadius: '0.625rem', fontSize: '1rem', fontWeight: 700, color: C.accent, outline: 'none', boxSizing: 'border-box', textAlign: 'center' }}
                                onFocus={e => e.target.style.borderColor = C.primary}
                                onBlur={e => e.target.style.borderColor = C.border} />
                            <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: C.gray }}>-1 = unlimited</p>
                        </div>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: C.dark, marginBottom: '0.4rem' }}>Max Candidates</label>
                            <input type="number" value={form.candidate_limit} onChange={set('candidate_limit')} min="-1" style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${C.border}`, borderRadius: '0.625rem', fontSize: '1rem', fontWeight: 700, color: C.green, outline: 'none', boxSizing: 'border-box', textAlign: 'center' }}
                                onFocus={e => e.target.style.borderColor = C.primary}
                                onBlur={e => e.target.style.borderColor = C.border} />
                            <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: C.gray }}>-1 = unlimited</p>
                        </div>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: C.dark, marginBottom: '0.4rem' }}>Max Tests</label>
                            <input type="number" value={form.test_limit} onChange={set('test_limit')} min="-1" style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${C.border}`, borderRadius: '0.625rem', fontSize: '1rem', fontWeight: 700, color: C.pink, outline: 'none', boxSizing: 'border-box', textAlign: 'center' }}
                                onFocus={e => e.target.style.borderColor = C.primary}
                                onBlur={e => e.target.style.borderColor = C.border} />
                            <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: C.gray }}>-1 = unlimited</p>
                        </div>
                    </div>

                        <b style={{ color: C.dark }}>Note:</b> These defaults are applied automatically when a new company signs up for a free trial. You can override them per-company in the Companies tab.

                    <button type="submit" disabled={saving} style={{
                        width: '100%', padding: '0.875rem', background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                        border: 'none', borderRadius: '0.75rem', color: '#fff', fontSize: '0.95rem',
                        fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.75 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}>
                        {saving ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={16} />}
                        {saving ? 'Saving...' : 'Save Trial Settings'}
                    </button>
                </form>
            </div>
        </div>
    );
}
