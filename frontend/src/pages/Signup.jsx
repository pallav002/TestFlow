import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ShieldCheck, Building2, User, Mail, Lock,
    Eye, EyeOff, AlertCircle, CheckCircle2, Zap, BarChart2, Users, Star
} from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import api from '../api/axios';

const PERKS = [
    { icon: <Zap size={14} />,       text: 'Create tests in minutes — upload PDF or add manually' },
    { icon: <Users size={14} />,     text: 'Manage candidates with role-based access control' },
    { icon: <BarChart2 size={14} />, text: 'Auto-scoring, analytics & pass/fail grading instantly' },
    { icon: <Star size={14} />,      text: 'Schedule interviews directly from assessment results' },
];

export default function Signup() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        company_name: '', contact_name: '', email: '',
        phone: '', username: '', password: '', confirm_password: '',
        industry: 'IT',
    });
    const [showPw,  setShowPw]  = useState(false);
    const [showCPw, setShowCPw] = useState(false);
    const [error,   setError]   = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return; }
        if (form.password.length < 6)               { setError('Password must be at least 6 characters.'); return; }
        if (!form.phone || form.phone.length < 7)   { setError('Please enter a valid phone number.'); return; }
        setLoading(true);
        try {
            const { confirm_password, ...payload } = form;
            await api.post('/public/signup', payload);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /* ── success screen ── */
    if (success) return (
        <div style={{
            height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #f3e7e9 0%, #e3eeff 50%, #fef5f5 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif', padding: '1.5rem',
        }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes popIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}`}</style>
            <div style={{
                background: '#fff', borderRadius: '1.5rem', padding: '2.5rem 2rem',
                maxWidth: 400, width: '100%', textAlign: 'center',
                boxShadow: '0 24px 64px rgba(0,0,0,0.1)',
                animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
            }}>
                <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.25rem', boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
                }}>
                    <CheckCircle2 size={32} color="#fff" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 0.625rem' }}>
                    Account Created!
                </h2>
                <p style={{ color: '#6b7280', lineHeight: 1.65, margin: '0 0 0.75rem', fontSize: '0.875rem' }}>
                    Congratulations! Your free trial account has been activated instantly.
                    You can now login and start conducting tests right away.
                </p>
                <div style={{
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: '0.625rem', padding: '0.75rem 1rem',
                    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                    marginBottom: '1.75rem', textAlign: 'left',
                }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>📧</span>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#166534', lineHeight: 1.55 }}>
                        Your <strong>username & password</strong> have been sent to your registered email address. Please check your inbox.
                    </p>
                </div>
                <button onClick={() => navigate('/login')} style={{
                    padding: '0.8rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 700,
                    fontSize: '0.9rem', cursor: 'pointer', width: '100%', fontFamily: 'inherit',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                }}>
                    Go to Login →
                </button>
            </div>
        </div>
    );

    /* ── input style — compact ── */
    const inp = (extra = {}) => ({
        width: '100%', padding: '0.55rem 0.75rem 0.55rem 2.25rem',
        border: '1.5px solid #e5e7eb', borderRadius: '0.5rem',
        fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box',
        color: '#111827', background: '#f9fafb',
        transition: 'border 0.15s, box-shadow 0.15s',
        fontFamily: 'inherit', ...extra,
    });
    const onF = (e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; };
    const onB = (e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; };

    return (
        <div style={{
            height: '100vh', display: 'flex', overflow: 'hidden',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            <style>{`
                @keyframes spin  { to { transform: rotate(360deg); } }
                @keyframes fadeL { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
                @keyframes fadeR { from{opacity:0;transform:translateX(20px)}  to{opacity:1;transform:translateX(0)} }
                @media(max-width:680px){ .sf-left{ display:none!important; } }

                /* Phone input overrides */
                .phone-field .react-tel-input .form-control {
                    width: 100% !important;
                    height: auto !important;
                    padding: 0.55rem 0.75rem 0.55rem 3rem !important;
                    border: 1.5px solid #e5e7eb !important;
                    border-radius: 0.5rem !important;
                    font-size: 0.8rem !important;
                    font-family: inherit !important;
                    color: #111827 !important;
                    background: #f9fafb !important;
                    transition: border 0.15s, box-shadow 0.15s !important;
                    box-sizing: border-box !important;
                }
                .phone-field .react-tel-input .form-control:focus {
                    border-color: #6366f1 !important;
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.08) !important;
                    outline: none !important;
                }
                .phone-field .react-tel-input .flag-dropdown {
                    border: 1.5px solid #e5e7eb !important;
                    border-right: none !important;
                    border-radius: 0.5rem 0 0 0.5rem !important;
                    background: #f9fafb !important;
                }
                .phone-field .react-tel-input .flag-dropdown:hover,
                .phone-field .react-tel-input .flag-dropdown.open {
                    background: #f3f4f6 !important;
                    border-color: #6366f1 !important;
                }
                .phone-field .react-tel-input .selected-flag {
                    border-radius: 0.5rem 0 0 0.5rem !important;
                    padding: 0 0 0 10px !important;
                }
                .phone-field .react-tel-input .country-list {
                    border-radius: 0.5rem !important;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
                    border: 1.5px solid #e5e7eb !important;
                    font-size: 0.8rem !important;
                    font-family: inherit !important;
                    z-index: 9999 !important;
                }
                .phone-field .react-tel-input .country-list .country:hover,
                .phone-field .react-tel-input .country-list .country.highlight {
                    background: rgba(99,102,241,0.07) !important;
                }
                .phone-field .react-tel-input .country-list .search-box {
                    border: 1px solid #e5e7eb !important;
                    border-radius: 0.35rem !important;
                    font-size: 0.78rem !important;
                    font-family: inherit !important;
                    outline: none !important;
                }
                .phone-field .react-tel-input .country-list .search-box:focus {
                    border-color: #6366f1 !important;
                }
            `}</style>

            {/* ── LEFT BRANDING PANEL ── */}
            <div className="sf-left" style={{
                width: '38%', minWidth: 280, flexShrink: 0,
                background: 'linear-gradient(150deg, #4f46e5 0%, #7c3aed 55%, #a21caf 100%)',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center', padding: '2.5rem 2.75rem',
                animation: 'fadeL 0.5s ease both',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: -70, right: -70, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: -50, left: -50, width: 170, height: 170, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1.5px solid rgba(255,255,255,0.25)',
                    }}>
                        <ShieldCheck size={19} color="#fff" />
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                        Test<span style={{ opacity: 0.7 }}>Flow</span>
                    </span>
                </div>

                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '0.6rem' }}>
                    Hire smarter,<br />not harder.
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                    Join 340+ companies using TestFlow to automate their hiring assessments.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
                    {PERKS.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '0.4rem', flexShrink: 0,
                                background: 'rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                            }}>{p.icon}</div>
                            <span style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.8rem', lineHeight: 1.5, paddingTop: 5 }}>{p.text}</span>
                        </div>
                    ))}
                </div>

                <div style={{
                    padding: '0.7rem 1rem', borderRadius: '0.75rem',
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
                    fontSize: '0.75rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.5,
                }}>
                    🔒 &nbsp;No credit card required · 5-day free trial · Cancel anytime
                </div>
            </div>

            {/* ── RIGHT FORM PANEL ── */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                background: 'linear-gradient(135deg, #f8f9ff 0%, #fdf4ff 100%)',
                overflow: 'hidden',
                animation: 'fadeR 0.5s ease both',
            }}>
                {/* Top bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.875rem 2rem', flexShrink: 0,
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)',
                }}>
                    <Link to="/login" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <ShieldCheck size={16} color="#6366f1" />
                        <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.95rem' }}>
                            Test<span style={{ color: '#6366f1' }}>Flow</span>
                        </span>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Already have an account?</span>
                        <Link to="/login" style={{ textDecoration: 'none' }}>
                            <button style={{
                                padding: '0.4rem 1rem', borderRadius: '2rem',
                                border: '1.5px solid #6366f1', background: 'transparent',
                                color: '#6366f1', fontWeight: 700, fontSize: '0.78rem',
                                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                            }}
                                onMouseOver={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = '#fff'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6366f1'; }}
                            >
                                Log in
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Form */}
                <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem 2rem',
                }}>
                    <div style={{ width: '100%', maxWidth: 460 }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
                                Start your free trial
                            </h2>
                            <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>
                                Create your account and start testing candidates instantly.
                            </p>
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: '0.5rem', padding: '0.6rem 0.875rem',
                                display: 'flex', gap: '0.5rem', marginBottom: '0.875rem', alignItems: 'flex-start',
                            }}>
                                <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                                <span style={{ color: '#b91c1c', fontSize: '0.78rem' }}>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

                            {/* Row 1: Company Name */}
                            <F label="Company Name" icon={<Building2 size={13} />}>
                                <input style={inp()} type="text" placeholder="Your company name"
                                    value={form.company_name} onChange={set('company_name')} required
                                    onFocus={onF} onBlur={onB} />
                            </F>

                            {/* Row 2: Contact + Industry */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                <F label="Contact Person" icon={<User size={13} />}>
                                    <input style={inp()} type="text" placeholder="Full name"
                                        value={form.contact_name} onChange={set('contact_name')} required
                                        onFocus={onF} onBlur={onB} />
                                </F>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                                        Industry
                                    </label>
                                    <select value={form.industry} onChange={set('industry')} style={{
                                        width: '100%', padding: '0.55rem 0.75rem',
                                        border: '1.5px solid #e5e7eb', borderRadius: '0.5rem',
                                        fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box',
                                        color: '#111827', background: '#f9fafb', cursor: 'pointer',
                                        fontFamily: 'inherit', appearance: 'none',
                                        transition: 'border 0.15s, box-shadow 0.15s',
                                    }} onFocus={onF} onBlur={onB}>
                                        {['IT', 'Finance', 'Manufacturing', 'Healthcare', 'Education', 'Retail', 'Other'].map(i => (
                                            <option key={i}>{i}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 3: Email + Phone */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                <F label="Email" icon={<Mail size={13} />}>
                                    <input style={inp()} type="email" placeholder="contact@company.com"
                                        value={form.email} onChange={set('email')} required
                                        onFocus={onF} onBlur={onB} />
                                </F>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                                        Phone
                                    </label>
                                    <div className="phone-field">
                                        <PhoneInput
                                            country={'in'}
                                            value={form.phone}
                                            onChange={(phone) => setForm(f => ({ ...f, phone: '+' + phone }))}
                                            enableSearch
                                            searchPlaceholder="Search country..."
                                            inputProps={{ required: true }}
                                            containerStyle={{ width: '100%' }}
                                            inputStyle={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Row 4: Username */}
                            <F label="Choose Username" icon={<User size={13} />}>
                                <input style={inp()} type="text" placeholder="your_username"
                                    value={form.username} onChange={set('username')} required
                                    onFocus={onF} onBlur={onB} />
                            </F>

                            {/* Row 5: Password + Confirm */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                <F label="Password" icon={<Lock size={13} />}>
                                    <div style={{ position: 'relative' }}>
                                        <input style={inp({ paddingRight: '2rem' })}
                                            type={showPw ? 'text' : 'password'} placeholder="Min 6 chars"
                                            value={form.password} onChange={set('password')} required
                                            onFocus={onF} onBlur={onB} />
                                        <button type="button" onClick={() => setShowPw(p => !p)} style={{
                                            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </F>
                                <F label="Confirm Password" icon={<Lock size={13} />}>
                                    <div style={{ position: 'relative' }}>
                                        <input style={inp({ paddingRight: '2rem' })}
                                            type={showCPw ? 'text' : 'password'} placeholder="Repeat password"
                                            value={form.confirm_password} onChange={set('confirm_password')} required
                                            onFocus={onF} onBlur={onB} />
                                        <button type="button" onClick={() => setShowCPw(p => !p)} style={{
                                            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </F>
                            </div>

                            {/* Submit */}
                            <button type="submit" disabled={loading} style={{
                                width: '100%', padding: '0.75rem', border: 'none', borderRadius: '0.625rem',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.8 : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                                fontFamily: 'inherit', marginTop: '0.25rem',
                                transition: 'opacity 0.2s, transform 0.15s',
                            }}
                                onMouseOver={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                {loading && (
                                    <div style={{
                                        width: 16, height: 16, borderRadius: '50%',
                                        border: '2px solid rgba(255,255,255,0.35)',
                                        borderTopColor: '#fff',
                                        animation: 'spin 0.7s linear infinite',
                                    }} />
                                )}
                                {loading ? 'Creating Account…' : 'Signup Now'}
                            </button>
                        </form>

                        <p style={{ textAlign: 'center', marginTop: '0.875rem', fontSize: '0.78rem', color: '#6b7280' }}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'none' }}>
                                Sign in →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function F({ label, icon, children }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                {label}
            </label>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
                    {icon}
                </div>
                {children}
            </div>
        </div>
    );
}
