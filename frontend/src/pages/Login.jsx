import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ShieldCheck, User, Lock, Eye, EyeOff, AlertCircle, LogIn,
    CheckCircle, Zap, BarChart2, Users, FileText, ArrowRight, Star, X,
    Phone, KeyRound, ArrowLeft, Sparkles, TrendingUp, Clock, Award
} from 'lucide-react';
import api from '../api/axios';

function useCountUp(target, duration = 1800, started = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!started) return;
        let startTime = null;
        const num = parseFloat(target.replace(/[^0-9.]/g, ''));
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * num));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [started, target, duration]);
    return count;
}

function useInView(threshold = 0.2) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, inView];
}

function AnimatedStat({ value, label, icon, gradient, started }) {
    const num = useCountUp(value, 1800, started);
    const suffix = value.replace(/[0-9.,]/g, '');
    const formatted = num >= 1000 ? num.toLocaleString('en-IN') : String(num);
    return (
        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{
                width: 40, height: 40, borderRadius: '0.75rem',
                background: gradient, display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 0.75rem',
                boxShadow: `0 8px 20px ${gradient.includes('a855f7') ? 'rgba(168,85,247,0.3)' : gradient.includes('ec4899') ? 'rgba(236,72,153,0.3)' : gradient.includes('3b82f6') ? 'rgba(59,130,246,0.3)' : 'rgba(249,115,22,0.3)'}`,
            }}>
                {icon}
            </div>
            <div style={{
                fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em',
                background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontVariantNumeric: 'tabular-nums',
            }}>
                {formatted}{suffix}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, marginTop: '0.25rem' }}>{label}</div>
        </div>
    );
}

function StepCards() {
    const [ref, inView] = useInView(0.15);
    const steps = [
        { step: '01', title: 'Company Signs Up',        desc: 'Start free trial. SuperAdmin approves and activates your account.',                          gradient: 'linear-gradient(135deg,#a855f7,#6366f1)', glow: 'rgba(168,85,247,0.28)' },
        { step: '02', title: 'Create HR & Candidates',  desc: 'Add your HR team, then create candidate accounts with login credentials.',                    gradient: 'linear-gradient(135deg,#ec4899,#f97316)', glow: 'rgba(236,72,153,0.25)' },
        { step: '03', title: 'Build & Assign Tests',    desc: 'Create tests manually or upload PDF. Assign to candidates with time windows.',               gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)', glow: 'rgba(59,130,246,0.25)' },
        { step: '04', title: 'Review Results',          desc: 'Candidates take timed tests. HR sees auto-scored results and schedules interviews.',           gradient: 'linear-gradient(135deg,#10b981,#3b82f6)', glow: 'rgba(16,185,129,0.25)' },
    ];
    return (
        <div ref={ref} className="steps-container" style={{ position: 'relative', paddingLeft: '2rem' }}>
            {/* Vertical timeline line */}
            <div style={{
                position: 'absolute', left: '1.45rem', top: 24, bottom: 24, width: 2,
                background: 'linear-gradient(180deg,#a855f7,#6366f1,#3b82f6,#10b981)',
                borderRadius: 2, opacity: inView ? 1 : 0,
                transition: 'opacity 0.6s ease 0.05s',
            }} />
            {steps.map((s, i) => (
                <div key={s.step} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '1.25rem',
                    marginBottom: i < 3 ? '1rem' : 0,
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translateX(0)' : 'translateX(-48px)',
                    transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.15}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.15}s`,
                }}>
                    {/* Step badge */}
                    <div style={{
                        width: 46, height: 46, borderRadius: '0.875rem', flexShrink: 0,
                        background: s.gradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.92rem', fontWeight: 900, color: '#fff',
                        boxShadow: `0 6px 20px ${s.glow}`,
                        position: 'relative', zIndex: 1,
                        marginLeft: '-1.45rem',
                    }}>{s.step}</div>
                    {/* Card */}
                    <div style={{
                        flex: 1, background: '#fff', border: '1.5px solid #ede9fe',
                        borderRadius: '1rem', padding: '1rem 1.25rem',
                        boxShadow: '0 2px 12px rgba(109,40,217,0.06)',
                        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                        cursor: 'default',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateX(5px)'; e.currentTarget.style.boxShadow='0 6px 28px rgba(109,40,217,0.12)'; e.currentTarget.style.borderColor='rgba(168,85,247,0.35)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 12px rgba(109,40,217,0.06)'; e.currentTarget.style.borderColor='#ede9fe'; }}
                    >
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.2rem' }}>{s.title}</div>
                        <div style={{ color: '#64748b', fontSize: '0.83rem', lineHeight: 1.55 }}>{s.desc}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function Reveal({ children, delay = 0 }) {
    const [ref, inView] = useInView(0.15);
    return (
        <div ref={ref} style={{
            transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(40px)',
        }}>
            {children}
        </div>
    );
}

const HERO_STATS = [
    { label: 'Tests Conducted', value: '12400+', gradient: 'linear-gradient(135deg,#a855f7,#6366f1)', icon: <FileText size={18} color="#fff" /> },
    { label: 'Companies Trust Us', value: '340+', gradient: 'linear-gradient(135deg,#ec4899,#f97316)', icon: <Award size={18} color="#fff" /> },
    { label: 'Candidates Evaluated', value: '85000+', gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)', icon: <Users size={18} color="#fff" /> },
    { label: 'Avg. Time Saved', value: '68%', gradient: 'linear-gradient(135deg,#10b981,#3b82f6)', icon: <TrendingUp size={18} color="#fff" /> },
];

function StatsCard() {
    const [ref, inView] = useInView(0.3);
    return (
        <div ref={ref} style={{
            position: 'relative', width: '100%', maxWidth: 900, marginTop: '5rem',
            opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(32px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
            <div className="stats-grid" style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(20px)',
                borderRadius: '1.5rem',
                border: '1px solid rgba(168,85,247,0.15)',
                boxShadow: '0 8px 40px rgba(168,85,247,0.08), 0 1px 0 rgba(255,255,255,0.8) inset',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                overflow: 'hidden',
            }}>
                {HERO_STATS.map((s, i) => (
                    <div key={s.label} className="stats-divider" style={{
                        borderRight: i < HERO_STATS.length - 1 ? '1px solid rgba(168,85,247,0.1)' : 'none',
                    }}>
                        <AnimatedStat {...s} started={inView} />
                    </div>
                ))}
            </div>
        </div>
    );
}

const FEATURES = [
    { icon: <FileText size={20} />, title: 'Smart Test Builder', desc: 'Upload PDF or add questions manually. AI extracts MCQs instantly.', gradient: 'linear-gradient(135deg,#a855f7,#6366f1)' },
    { icon: <Users size={20} />, title: 'Candidate Management', desc: 'Add candidates, assign tests, set time windows. Full control.', gradient: 'linear-gradient(135deg,#ec4899,#f97316)' },
    { icon: <Zap size={20} />, title: 'Instant Results', desc: 'Auto-scoring with accuracy, grade, pass/fail. Real-time dashboard.', gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)' },
    { icon: <BarChart2 size={20} />, title: 'HR Analytics', desc: 'Senior/Junior HR isolation. Full company performance overview.', gradient: 'linear-gradient(135deg,#10b981,#3b82f6)' },
    { icon: <ShieldCheck size={20} />, title: 'Secure Environment', desc: 'Timed questions, fullscreen mode, one-time submission enforcement.', gradient: 'linear-gradient(135deg,#f97316,#ec4899)' },
    { icon: <Star size={20} />, title: 'Interview Scheduling', desc: 'Schedule interviews directly from results. Track status end-to-end.', gradient: 'linear-gradient(135deg,#6366f1,#a855f7)' },
];

const PRICING = [
    {
        name: 'Basic', price: '₹2,999', period: '/month',
        gradient: 'linear-gradient(135deg,#6366f1,#a855f7)',
        features: ['5 HR Users', '200 Candidates', '20 Tests', 'Email Support'],
    },
    {
        name: 'Pro', price: '₹7,999', period: '/month',
        gradient: 'linear-gradient(135deg,#ec4899,#f97316)', badge: 'Most Popular',
        features: ['20 HR Users', '1,000 Candidates', '100 Tests', 'Priority Support', 'Advanced Analytics'],
    },
    {
        name: 'Enterprise', price: 'Custom', period: '',
        gradient: 'linear-gradient(135deg,#3b82f6,#10b981)',
        features: ['Unlimited HR', 'Unlimited Candidates', 'Unlimited Tests', 'Dedicated Manager', 'White-label Option'],
    },
];

function PricingCarousel() {
    const [active, setActive] = useState(1); // start with Pro (index 1) in center
    const timerRef = useRef(null);
    const n = PRICING.length;

    const startTimer = () => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setActive(a => (a + 1) % n);
        }, 2800);
    };

    useEffect(() => {
        startTimer();
        return () => clearInterval(timerRef.current);
    }, []);

    const goTo = (i) => { setActive(i); startTimer(); };

    // position: -1 = left, 0 = center, 1 = right (wrap around)
    const getPos = (i) => {
        const diff = i - active;
        if (diff === 0) return 'center';
        if (diff === 1 || diff === -(n - 1)) return 'right';
        return 'left';
    };

    const cardStyle = (pos) => {
        const base = {
            position: 'absolute',
            width: 310,
            borderRadius: '1.25rem',
            padding: '1.75rem 1.6rem',
            transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)',
            cursor: 'pointer',
            userSelect: 'none',
        };
        if (pos === 'center') return { ...base,
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%) scale(1)',
            zIndex: 10, opacity: 1, filter: 'none',
            boxShadow: '0 24px 64px rgba(168,85,247,0.22)',
        };
        if (pos === 'left') return { ...base,
            left: '50%', top: '50%',
            transform: 'translate(calc(-50% - 310px), -50%) scale(0.9)',
            zIndex: 5, opacity: 0.78, filter: 'blur(0.8px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
        };
        return { ...base,
            left: '50%', top: '50%',
            transform: 'translate(calc(-50% + 310px), -50%) scale(0.9)',
            zIndex: 5, opacity: 0.78, filter: 'blur(0.8px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
        };
    };

    return (
        <div className="pricing-container" style={{ position: 'relative', height: 460, width: '100%' }}>
            {PRICING.map((p, i) => {
                const pos = getPos(i);
                const isCenter = pos === 'center';
                return (
                    <div key={p.name}
                        className={pos === 'left' ? 'pricing-side-left' : pos === 'right' ? 'pricing-side-right' : ''}
                        style={{
                            ...cardStyle(pos),
                            background: isCenter
                                ? (p.badge ? 'linear-gradient(#fff,#fff) padding-box, ' + p.gradient + ' border-box' : '#fff')
                                : '#fff',
                            border: isCenter
                                ? (p.badge ? '2px solid transparent' : '1.5px solid #ede9fe')
                                : '1.5px solid #ede9fe',
                        }}
                        onClick={() => goTo(i)}
                    >
                        {p.badge && isCenter && (
                            <div style={{
                                position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                                background: p.gradient, color: '#fff', fontSize: '0.7rem', fontWeight: 800,
                                padding: '0.22rem 0.875rem', borderRadius: '2rem', whiteSpace: 'nowrap',
                                boxShadow: '0 4px 12px rgba(236,72,153,0.35)',
                            }}>{p.badge}</div>
                        )}
                        <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.625rem', background: p.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{p.name}</div>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <span style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em' }}>{p.price}</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{p.period}</span>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {p.features.map(f => (
                                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: '#374151' }}>
                                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: p.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <CheckCircle size={10} color="#fff" />
                                    </div>
                                    {f}
                                </li>
                            ))}
                        </ul>
                        {isCenter && (
                            <Link to="/signup" style={{ textDecoration: 'none' }}>
                                <button style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '0.875rem',
                                    background: p.badge ? p.gradient : 'transparent',
                                    color: p.badge ? '#fff' : '#374151',
                                    border: p.badge ? 'none' : '1.5px solid #ede9fe',
                                    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
                                    boxShadow: p.badge ? '0 6px 18px rgba(236,72,153,0.28)' : 'none',
                                    transition: 'all 0.18s',
                                }}
                                onMouseOver={e => { if (!p.badge) { e.currentTarget.style.borderColor='#a855f7'; e.currentTarget.style.color='#a855f7'; } else e.currentTarget.style.opacity='0.88'; }}
                                onMouseOut={e => { e.currentTarget.style.opacity='1'; if (!p.badge) { e.currentTarget.style.borderColor='#ede9fe'; e.currentTarget.style.color='#374151'; } }}
                                >
                                    {p.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                                </button>
                            </Link>
                        )}
                    </div>
                );
            })}

            {/* Dot indicators */}
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem', zIndex: 20 }}>
                {PRICING.map((_, i) => (
                    <button key={i} onClick={() => goTo(i)} style={{
                        width: active === i ? 24 : 8, height: 8,
                        borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0,
                        background: active === i ? 'linear-gradient(90deg,#a855f7,#6366f1)' : '#e2d9f3',
                        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                    }} />
                ))}
            </div>
        </div>
    );
}

function ForgotPasswordModal({ onClose }) {
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [storedPhone, setStoredPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [username, setUsername] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const inputCss = {
        width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
        border: '1.5px solid #e5e7eb', borderRadius: '0.875rem',
        fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
        color: '#111827', background: '#fafafa', transition: 'border 0.2s, box-shadow 0.2s',
        fontFamily: 'inherit',
    };
    const onF = (e) => { e.target.style.borderColor = '#a855f7'; e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.1)'; };
    const onB = (e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await api.post('/public/forgot-password/send-otp', { phone });
            setUsername(res.data.username || '');
            setStoredPhone(res.data.stored_phone || phone);
            setSuccessMsg(res.data.message);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Failed to send OTP.');
        } finally { setLoading(false); }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            await api.post('/public/forgot-password/verify-otp', { phone: storedPhone, otp });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid or expired OTP.');
        } finally { setLoading(false); }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
        if (newPw.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true);
        try {
            await api.post('/public/forgot-password/reset', { phone: storedPhone, otp, new_password: newPw });
            setDone(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Reset failed. Please try again.');
        } finally { setLoading(false); }
    };

    const STEPS = ['Mobile No.', 'Verify OTP', 'New Password'];

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 600,
            background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', animation: 'fadeIn 0.2s ease both',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                width: '100%', maxWidth: 440, background: '#fff', borderRadius: '1.75rem',
                boxShadow: '0 40px 100px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.8) inset',
                padding: '2.5rem', position: 'relative',
                animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: 16, right: 16, width: 32, height: 32,
                    borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280',
                }}>
                    <X size={16} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '1rem', margin: '0 auto 1rem',
                        background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 10px 30px rgba(168,85,247,0.35)',
                    }}>
                        <KeyRound size={26} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 0.25rem' }}>
                        Forgot Password
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>
                        Reset using your registered mobile number
                    </p>
                </div>

                {!done && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.75rem' }}>
                        {STEPS.map((s, i) => (
                            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                                    <div style={{
                                        width: 30, height: 30, borderRadius: '50%', fontSize: '0.78rem', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: step > i + 1 ? 'linear-gradient(135deg,#10b981,#3b82f6)' : step === i + 1 ? 'linear-gradient(135deg,#a855f7,#6366f1)' : '#e5e7eb',
                                        color: step >= i + 1 ? '#fff' : '#9ca3af',
                                        transition: 'all 0.3s',
                                    }}>
                                        {step > i + 1 ? '✓' : i + 1}
                                    </div>
                                    <span style={{ fontSize: '0.68rem', color: step === i + 1 ? '#a855f7' : '#9ca3af', fontWeight: step === i + 1 ? 700 : 500 }}>{s}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div style={{ width: 40, height: 2, background: step > i + 1 ? 'linear-gradient(90deg,#10b981,#3b82f6)' : '#e5e7eb', margin: '0 0.35rem 1.2rem', transition: 'background 0.3s' }} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {done ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '1.25rem', margin: '0 auto 1.25rem',
                            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 10px 30px rgba(16,185,129,0.3)',
                        }}>
                            <CheckCircle size={32} color="#fff" />
                        </div>
                        <h3 style={{ fontWeight: 800, color: '#111827', margin: '0 0 0.5rem' }}>Password Reset!</h3>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                            Your new credentials have been sent to your registered email address.
                        </p>
                        <button onClick={onClose} style={{
                            width: '100%', padding: '0.875rem', border: 'none', borderRadius: '0.875rem',
                            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                            color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit',
                            boxShadow: '0 8px 20px rgba(168,85,247,0.3)',
                        }}>
                            Back to Login
                        </button>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: '0.875rem', padding: '0.75rem 1rem',
                                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                                marginBottom: '1rem', color: '#b91c1c', fontSize: '0.85rem',
                            }}>
                                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                            </div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                                        Registered Mobile Number
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                                            placeholder="+91XXXXXXXXXX" required autoFocus
                                            style={inputCss} onFocus={onF} onBlur={onB} />
                                    </div>
                                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                                        Enter with country code
                                    </p>
                                </div>
                                <button type="submit" disabled={loading} style={{
                                    width: '100%', padding: '0.875rem', border: 'none', borderRadius: '0.875rem',
                                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                                    color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.8 : 1, fontFamily: 'inherit',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    boxShadow: '0 8px 20px rgba(168,85,247,0.3)',
                                }}>
                                    {loading ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} /> : null}
                                    {loading ? 'Sending OTP…' : 'Send OTP →'}
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '0.875rem', padding: '0.875rem 1rem', fontSize: '0.82rem', color: '#065f46' }}>
                                    <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>✅ OTP Sent!</div>
                                    <div>Check your registered <strong>email</strong> for the 6-digit OTP.</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Enter OTP</label>
                                    <div style={{ position: 'relative' }}>
                                        <KeyRound size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                        <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="6-digit OTP" required autoFocus maxLength={6}
                                            style={{ ...inputCss, letterSpacing: '0.3em', textAlign: 'center', paddingLeft: '1rem' }}
                                            onFocus={onF} onBlur={onB} />
                                    </div>
                                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>Valid for 10 minutes</p>
                                </div>
                                <button type="submit" disabled={loading || otp.length < 6} style={{
                                    width: '100%', padding: '0.875rem', border: 'none', borderRadius: '0.875rem',
                                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                                    color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                                    cursor: (loading || otp.length < 6) ? 'not-allowed' : 'pointer',
                                    opacity: (loading || otp.length < 6) ? 0.7 : 1, fontFamily: 'inherit',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    boxShadow: '0 8px 20px rgba(168,85,247,0.3)',
                                }}>
                                    {loading ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} /> : null}
                                    {loading ? 'Verifying…' : 'Verify OTP →'}
                                </button>
                                <button type="button" onClick={() => { setStep(1); setError(''); setOtp(''); }} style={{
                                    background: 'none', border: 'none', color: '#a855f7', fontSize: '0.82rem',
                                    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center',
                                }}>
                                    <ArrowLeft size={13} /> Change mobile number
                                </button>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {username && (
                                    <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '0.875rem', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#6d28d9' }}>
                                        Account: <strong>{username}</strong>
                                    </div>
                                )}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                        <input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                                            placeholder="Min 6 characters" required autoFocus
                                            style={{ ...inputCss, paddingRight: '3rem' }} onFocus={onF} onBlur={onB} />
                                        <button type="button" onClick={() => setShowPw(p => !p)} style={{
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4,
                                        }}>
                                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Confirm New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                        <input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                                            placeholder="Repeat password" required
                                            style={{ ...inputCss, paddingRight: '3rem' }} onFocus={onF} onBlur={onB} />
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} style={{
                                    width: '100%', padding: '0.875rem', border: 'none', borderRadius: '0.875rem',
                                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                                    color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.8 : 1, fontFamily: 'inherit',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    boxShadow: '0 8px 20px rgba(168,85,247,0.3)',
                                }}>
                                    {loading ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} /> : null}
                                    {loading ? 'Resetting…' : 'Reset Password →'}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function LoginModal({ onClose }) {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [trialExpired, setTrialExpired] = useState(false);
    const [showForgot, setShowForgot] = useState(false);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setTrialExpired(false);
        setLoading(true);
        try {
            const user = await login(username, password);
            if (user.role === 'superadmin')       navigate('/superadmin');
            else if (user.role === 'enterprise')  navigate('/enterprise');
            else if (user.role === 'hr')          navigate('/admin');
            else                                  navigate('/dashboard');
        } catch (err) {
            const msg = err.message || '';
            if (msg.toLowerCase().includes('trial') && msg.toLowerCase().includes('expir')) {
                setTrialExpired(true);
            } else {
                setError(msg || 'Invalid credentials. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const inputCss = {
        width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
        border: '1.5px solid #e5e7eb', borderRadius: '0.875rem',
        fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
        color: '#111827', background: '#fafafa', transition: 'border 0.2s, box-shadow 0.2s',
        fontFamily: 'inherit',
    };

    return (
        <>
        {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', animation: 'fadeIn 0.2s ease both',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                width: '100%', maxWidth: 440,
                background: '#fff', borderRadius: '1.75rem',
                boxShadow: '0 40px 100px rgba(0,0,0,0.15)',
                padding: '2.5rem', position: 'relative',
                animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
                overflow: 'hidden',
            }}>
                {/* Top gradient accent bar */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                    background: 'linear-gradient(90deg, #a855f7, #ec4899, #f97316)',
                }} />

                <button onClick={onClose} style={{
                    position: 'absolute', top: 20, right: 16, width: 32, height: 32,
                    borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280',
                    transition: 'background 0.15s',
                }}
                    onMouseOver={e => e.currentTarget.style.background = '#e5e7eb'}
                    onMouseOut={e => e.currentTarget.style.background = '#f3f4f6'}
                >
                    <X size={16} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '0.5rem' }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '1rem', margin: '0 auto 1rem',
                        background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 10px 30px rgba(168,85,247,0.35)',
                    }}>
                        <ShieldCheck size={28} color="#fff" />
                    </div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', margin: '0 0 0.35rem', letterSpacing: '-0.02em' }}>
                        Welcome back
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                        Sign in to your TestFlow account
                    </p>
                </div>

                {trialExpired && (
                    <div style={{
                        background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)',
                        borderRadius: '0.875rem', padding: '1rem', marginBottom: '1.25rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#92400e', fontWeight: 700, fontSize: '0.875rem' }}>
                            <AlertCircle size={16} /> Free Trial Expired
                        </div>
                        <p style={{ color: '#78350f', fontSize: '0.8rem', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                            Your free trial has ended. Upgrade to continue.
                        </p>
                        <Link to="/signup" style={{ textDecoration: 'none' }}>
                            <button style={{
                                padding: '0.4rem 1rem', borderRadius: '0.5rem', border: 'none',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                            }}>
                                Request Upgrade →
                            </button>
                        </Link>
                    </div>
                )}

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '0.875rem', padding: '0.875rem 1rem',
                        display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
                        marginBottom: '1.25rem', color: '#b91c1c', fontSize: '0.875rem',
                    }}>
                        <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                            Username / ID
                        </label>
                        <div style={{ position: 'relative' }}>
                            <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                                placeholder="Enter your username" required autoFocus style={inputCss}
                                onFocus={e => { e.target.style.borderColor = '#a855f7'; e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••" required
                                style={{ ...inputCss, paddingRight: '3rem' }}
                                onFocus={e => { e.target.style.borderColor = '#a855f7'; e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.1)'; }}
                                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }} />
                            <button type="button" onClick={() => setShowPw(!showPw)} style={{
                                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4,
                            }}>
                                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        width: '100%', padding: '0.9rem', marginTop: '0.25rem',
                        borderRadius: '0.875rem', border: 'none',
                        background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                        color: '#fff', fontSize: '0.95rem', fontWeight: 700,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        opacity: loading ? 0.8 : 1,
                        boxShadow: '0 8px 24px rgba(168,85,247,0.35)',
                        transition: 'opacity 0.2s, transform 0.15s',
                    }}
                        onMouseOver={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        {loading ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} /> : <LogIn size={17} />}
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <div style={{
                    marginTop: '1.5rem', padding: '0.75rem 1rem', borderRadius: '0.875rem',
                    background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.1)',
                    fontSize: '0.78rem', color: '#6b7280', textAlign: 'center', lineHeight: 1.6,
                }}>
                    Your role is detected automatically.<br />
                    Candidates receive credentials from HR.
                </div>

                <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.83rem', color: '#6b7280' }}>
                    <button onClick={() => setShowForgot(true)} style={{
                        background: 'none', border: 'none', color: '#a855f7', fontWeight: 700,
                        fontSize: '0.83rem', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                    }}>
                        Forgot Password?
                    </button>
                </p>

                <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.83rem', color: '#6b7280' }}>
                    Don't have an account?{' '}
                    <Link to="/signup" style={{ color: '#a855f7', fontWeight: 700, textDecoration: 'none' }}>
                        Start free trial →
                    </Link>
                </p>
            </div>
        </div>
        </>
    );
}

export default function Login() {
    const [showLogin, setShowLogin] = useState(false);

    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#ffffff',
            color: '#0f172a',
            fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
            overflowX: 'hidden',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(3deg)} }
                @keyframes float2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(-3deg)} }
                @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
                @keyframes fadeIn { from{opacity:0} to{opacity:1} }
                @keyframes slideUp { from{opacity:0;transform:translateY(40px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes shimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
                @keyframes pulse-glow { 0%,100%{opacity:0.6} 50%{opacity:1} }

                .nav-link {
                    background:none; border:none; cursor:pointer; color:#475569;
                    font-size:0.9rem; font-weight:500; padding:0.4rem 0.75rem;
                    border-radius:6px; transition:color 0.15s; font-family:inherit;
                }
                .nav-link:hover { color:#a855f7; }

                .feature-card {
                    background:#fff;
                    border:1px solid #f1f5f9;
                    border-radius:1.25rem;
                    padding:2rem;
                    transition:transform 0.25s, box-shadow 0.25s, border-color 0.25s;
                    height:100%; box-sizing:border-box;
                    position:relative; overflow:hidden;
                }
                .feature-card:hover {
                    transform:translateY(-6px);
                    box-shadow:0 20px 50px rgba(168,85,247,0.1);
                    border-color:rgba(168,85,247,0.2);
                }

                .price-card {
                    background:#fff; border-radius:1.5rem; padding:2.25rem;
                    border:1.5px solid #e5e7eb;
                    transition:transform 0.25s, box-shadow 0.25s;
                    height:100%; box-sizing:border-box; position:relative;
                }
                .price-card:hover { transform:translateY(-6px); box-shadow:0 24px 60px rgba(0,0,0,0.08); }

                .btn-outline {
                    padding:0.55rem 1.4rem; border-radius:2rem;
                    border:1.5px solid #e2e8f0; background:transparent;
                    color:#374151; font-weight:600; font-size:0.875rem;
                    cursor:pointer; transition:all 0.18s; font-family:inherit;
                }
                .btn-outline:hover { border-color:#a855f7; color:#a855f7; background:rgba(168,85,247,0.05); }

                .btn-primary {
                    padding:0.55rem 1.4rem; border-radius:2rem; border:none;
                    background:linear-gradient(135deg,#a855f7,#6366f1);
                    color:#fff; font-weight:600; font-size:0.875rem; cursor:pointer;
                    box-shadow:0 4px 16px rgba(168,85,247,0.35);
                    transition:transform 0.15s, box-shadow 0.15s; font-family:inherit;
                }
                .btn-primary:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(168,85,247,0.4); }

                .hero-gradient-text {
                    background: linear-gradient(135deg, #a855f7 0%, #ec4899 40%, #f97316 100%);
                    background-size: 200% 200%;
                    animation: shimmer 4s ease infinite;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                /* ── RESPONSIVE ─────────────────────────────────────────── */

                /* Tablet: 768px and below */
                @media (max-width: 768px) {
                    /* Navbar: hide text links, keep logo + sign in */
                    .nav-desktop { display: none !important; }
                    .nav-cta-text { display: none !important; }

                    /* Stats: 2x2 grid */
                    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    .stats-divider { border-right: none !important; border-bottom: 1px solid rgba(168,85,247,0.1); }

                    /* Features: single column */
                    .features-grid { grid-template-columns: 1fr !important; }

                    /* Pricing carousel side offset */
                    .pricing-side-left  { transform: translate(calc(-50% - 200px), -50%) scale(0.88) !important; }
                    .pricing-side-right { transform: translate(calc(-50% + 200px), -50%) scale(0.88) !important; }
                }

                /* Mobile: 480px and below */
                @media (max-width: 480px) {
                    /* Navbar: only logo + sign in button */
                    .nav-desktop { display: none !important; }
                    .nav-cta-text { display: none !important; }

                    /* Hero padding reduction */
                    .hero-section { padding: 3rem 4vw 3rem !important; }

                    /* Stats: 2x2 */
                    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }

                    /* Pricing: only show center card, hide sides */
                    .pricing-side-left  { opacity: 0 !important; pointer-events: none !important; }
                    .pricing-side-right { opacity: 0 !important; pointer-events: none !important; }
                    .pricing-container  { height: 400px !important; }

                    /* Section padding */
                    .section-pad { padding: 4rem 4vw !important; }

                    /* Step cards */
                    .steps-container { padding-left: 1.25rem !important; }

                    /* CTA banner */
                    .cta-banner { padding: 3rem 1.5rem !important; border-radius: 1.25rem !important; }
                }

                /* Large desktop: 1400px+ */
                @media (min-width: 1400px) {
                    .pricing-side-left  { transform: translate(calc(-50% - 360px), -50%) scale(0.9) !important; }
                    .pricing-side-right { transform: translate(calc(-50% + 360px), -50%) scale(0.9) !important; }
                }

            `}</style>

            {/* Decorative blobs — fixed in background */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', top: '-10%', right: '-5%',
                    width: 700, height: 700, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)',
                    animation: 'pulse-glow 6s ease infinite',
                }} />
                <div style={{
                    position: 'absolute', top: '20%', left: '-8%',
                    width: 500, height: 500, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)',
                    animation: 'pulse-glow 8s ease infinite 2s',
                }} />
                <div style={{
                    position: 'absolute', top: '60%', right: '10%',
                    width: 400, height: 400, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
                    animation: 'pulse-glow 7s ease infinite 1s',
                }} />
                <div style={{
                    position: 'absolute', bottom: '5%', left: '20%',
                    width: 600, height: 600, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)',
                    animation: 'pulse-glow 9s ease infinite 3s',
                }} />
            </div>

            {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

            {/* ─── NAVBAR ─────────────────────────────────────────────────── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 200,
                background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                padding: '0 5vw', height: 68,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: '0.75rem',
                        background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(168,85,247,0.3)',
                    }}>
                        <ShieldCheck size={21} color="#fff" />
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                        Test<span style={{
                            background: 'linear-gradient(135deg,#a855f7,#ec4899)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>Flow</span>
                    </span>
                </div>

                <nav className="nav-desktop" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <button className="nav-link" onClick={() => scrollTo('features')}>Features</button>
                    <button className="nav-link" onClick={() => scrollTo('pricing')}>Pricing</button>
                    <button className="nav-link" onClick={() => scrollTo('about')}>How it works</button>
                    <button className="nav-link" onClick={() => scrollTo('contact')}>Contact</button>
                </nav>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button className="btn-outline" onClick={() => setShowLogin(true)}>Sign in</button>
                    <Link to="/signup" style={{ textDecoration: 'none' }}>
                        <button className="btn-primary nav-cta-text">Get started free</button>
                    </Link>
                </div>
            </header>

            {/* ─── HERO ───────────────────────────────────────────────────── */}
            <section className="hero-section" style={{
                minHeight: 'calc(100vh - 68px)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '5rem 5vw 4rem', textAlign: 'center',
                position: 'relative', zIndex: 1,
                animation: 'fadeUp 0.7s ease both',
            }}>
                {/* Top badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(236,72,153,0.08))',
                    border: '1px solid rgba(168,85,247,0.2)',
                    borderRadius: '2rem', padding: '0.4rem 1.1rem',
                    fontSize: '0.82rem', fontWeight: 700, color: '#a855f7', marginBottom: '2rem',
                    boxShadow: '0 2px 10px rgba(168,85,247,0.1)',
                }}>
                    <Sparkles size={13} /> AI-Powered Enterprise Assessment Platform
                </div>

                {/* Headline */}
                <h1 style={{
                    fontSize: 'clamp(2.75rem, 6.5vw, 5rem)',
                    fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.04em',
                    color: '#0f172a', marginBottom: '1.5rem', maxWidth: 900,
                }}>
                    Hire smarter with{' '}
                    <span className="hero-gradient-text">
                        intelligent assessments
                    </span>
                </h1>

                <p style={{
                    fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', color: '#64748b',
                    maxWidth: 640, lineHeight: 1.75, marginBottom: '3rem', fontWeight: 400,
                }}>
                    Create targeted tests, manage candidates, ensure secure exam environment,
                    and access real-time results — all in one beautiful platform.
                </p>

                {/* CTA Buttons */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Link to="/signup" style={{ textDecoration: 'none' }}>
                        <button style={{
                            padding: '1rem 2.5rem', fontSize: '1rem', borderRadius: '3rem', border: 'none',
                            background: 'linear-gradient(135deg, #a855f7, #ec4899, #f97316)',
                            backgroundSize: '200% 200%',
                            animation: 'shimmer 4s ease infinite',
                            color: '#fff', fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 12px 32px rgba(168,85,247,0.35)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'inherit',
                        }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 18px 40px rgba(168,85,247,0.45)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(168,85,247,0.35)'; }}
                        >
                            Start free trial <ArrowRight size={18} />
                        </button>
                    </Link>
                    <button onClick={() => setShowLogin(true)} style={{
                        padding: '1rem 2.5rem', fontSize: '1rem', borderRadius: '3rem',
                        border: '1.5px solid #e2e8f0', background: 'rgba(255,255,255,0.8)',
                        color: '#374151', fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.18s', fontFamily: 'inherit',
                        backdropFilter: 'blur(10px)',
                    }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = '#a855f7'; e.currentTarget.style.color = '#a855f7'; e.currentTarget.style.background = 'rgba(168,85,247,0.05)'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
                    >
                        Sign in →
                    </button>
                </div>

                {/* Trust badges */}
                <div style={{
                    display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center',
                    marginTop: '2.5rem', color: '#64748b', fontSize: '0.82rem', fontWeight: 500,
                }}>
                    {['No credit card required', '5-day free trial', 'Cancel anytime'].map(t => (
                        <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <CheckCircle size={14} color="#10b981" /> {t}
                        </span>
                    ))}
                </div>

                <StatsCard />
            </section>

            {/* ─── FEATURES ───────────────────────────────────────────────── */}
            <section id="features" className="section-pad" style={{ padding: '7rem 5vw', background: '#fafafa', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: 1140, margin: '0 auto' }}>
                    <Reveal>
                        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                fontSize: '0.78rem', fontWeight: 700, color: '#a855f7',
                                textTransform: 'uppercase', letterSpacing: '0.14em',
                                background: 'rgba(168,85,247,0.08)', padding: '0.3rem 0.875rem',
                                borderRadius: '2rem', marginBottom: '1rem',
                            }}>
                                <Zap size={11} /> Features
                            </div>
                            <h2 style={{
                                fontSize: 'clamp(1.875rem, 4vw, 3rem)', fontWeight: 800,
                                color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 1rem',
                            }}>
                                Everything you need to{' '}
                                <span style={{
                                    background: 'linear-gradient(135deg,#a855f7,#ec4899)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                }}>hire smarter</span>
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
                                From test creation to interview scheduling — one platform, complete workflow.
                            </p>
                        </div>
                    </Reveal>
                    <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {FEATURES.map((f, i) => (
                            <Reveal key={f.title} delay={i * 80}>
                                <div className="feature-card">
                                    <div style={{
                                        width: 52, height: 52, borderRadius: '1rem',
                                        background: f.gradient,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', marginBottom: '1.25rem',
                                        boxShadow: `0 8px 20px rgba(168,85,247,0.2)`,
                                    }}>{f.icon}</div>
                                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: '0.6rem', letterSpacing: '-0.01em' }}>{f.title}</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ───────────────────────────────────────────── */}
            <section id="about" className="section-pad" style={{ padding: '5rem 5vw', background: '#fff', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                    <Reveal>
                        <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                fontSize: '0.78rem', fontWeight: 700, color: '#3b82f6',
                                textTransform: 'uppercase', letterSpacing: '0.14em',
                                background: 'rgba(59,130,246,0.08)', padding: '0.3rem 0.875rem',
                                borderRadius: '2rem', marginBottom: '0.875rem',
                            }}>
                                <Clock size={11} /> How it works
                            </div>
                            <h2 style={{
                                fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 800,
                                color: '#0f172a', letterSpacing: '-0.03em', margin: 0,
                            }}>
                                Up and running in{' '}
                                <span style={{
                                    background: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                }}>4 simple steps</span>
                            </h2>
                        </div>
                    </Reveal>
                    <StepCards />
                </div>
            </section>

            {/* ─── PRICING ────────────────────────────────────────────────── */}
            <section id="pricing" className="section-pad" style={{ padding: '7rem 5vw', background: '#fafafa', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <Reveal>
                        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                fontSize: '0.78rem', fontWeight: 700, color: '#ec4899',
                                textTransform: 'uppercase', letterSpacing: '0.14em',
                                background: 'rgba(236,72,153,0.08)', padding: '0.3rem 0.875rem',
                                borderRadius: '2rem', marginBottom: '1rem',
                            }}>
                                <Star size={11} /> Pricing
                            </div>
                            <h2 style={{
                                fontSize: 'clamp(1.875rem, 4vw, 3rem)', fontWeight: 800,
                                color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 0.75rem',
                            }}>
                                Simple, transparent{' '}
                                <span style={{
                                    background: 'linear-gradient(135deg,#ec4899,#f97316)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                }}>pricing</span>
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '1rem' }}>Start free. Upgrade when you grow.</p>
                        </div>
                    </Reveal>
                    <PricingCarousel />
                </div>
            </section>

            {/* ─── CTA / CONTACT ──────────────────────────────────────────── */}
            <section id="contact" className="section-pad" style={{ padding: '7rem 5vw', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
                <Reveal>
                    <div className="cta-banner" style={{
                        maxWidth: 820, margin: '0 auto',
                        background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 35%, #3b82f6 65%, #06b6d4 100%)',
                        borderRadius: '2rem', padding: '5rem 4rem',
                        textAlign: 'center', position: 'relative', overflow: 'hidden',
                        boxShadow: '0 40px 80px rgba(168,85,247,0.25)',
                    }}>
                        {/* Noise overlay */}
                        <div style={{
                            position: 'absolute', inset: 0, borderRadius: '2rem',
                            background: 'rgba(255,255,255,0.05)',
                        }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                background: 'rgba(255,255,255,0.2)', borderRadius: '2rem',
                                padding: '0.35rem 1rem', fontSize: '0.8rem', fontWeight: 700,
                                color: '#fff', marginBottom: '1.5rem',
                            }}>
                                <Sparkles size={12} /> Ready to get started?
                            </div>
                            <h2 style={{
                                fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 900,
                                color: '#fff', letterSpacing: '-0.04em', margin: '0 0 1rem', lineHeight: 1.1,
                            }}>
                                Transform your hiring process today
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', lineHeight: 1.7, margin: '0 0 2.5rem', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
                                Sign up for a free trial or reach out for enterprise pricing. Our team responds within 24 hours.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Link to="/signup" style={{ textDecoration: 'none' }}>
                                    <button style={{
                                        padding: '0.95rem 2.25rem', borderRadius: '2rem', border: 'none',
                                        background: '#fff', color: '#a855f7',
                                        fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transition: 'transform 0.15s',
                                    }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        Start Free Trial →
                                    </button>
                                </Link>
                                <a href="mailto:hello@testflow.in" style={{ textDecoration: 'none' }}>
                                    <button style={{
                                        padding: '0.95rem 2.25rem', borderRadius: '2rem',
                                        border: '2px solid rgba(255,255,255,0.5)', background: 'transparent',
                                        color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit',
                                        transition: 'all 0.15s',
                                    }}
                                        onMouseOver={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                        onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        hello@testflow.in
                                    </button>
                                </a>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* ─── FOOTER ─────────────────────────────────────────────────── */}
            <footer style={{
                padding: '2.5rem 5vw', borderTop: '1px solid #f1f5f9',
                background: '#fff', position: 'relative', zIndex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: '0.5rem',
                        background: 'linear-gradient(135deg,#a855f7,#6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ShieldCheck size={15} color="#fff" />
                    </div>
                    <span style={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                        Test<span style={{
                            background: 'linear-gradient(135deg,#a855f7,#ec4899)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>Flow</span>
                    </span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>
                    © 2025 TestFlow · Enterprise Assessment Platform
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem' }}>
                    <button className="nav-link" style={{ fontSize: '0.82rem', padding: '0.2rem 0' }} onClick={() => scrollTo('features')}>Features</button>
                    <button className="nav-link" style={{ fontSize: '0.82rem', padding: '0.2rem 0' }} onClick={() => scrollTo('pricing')}>Pricing</button>
                    <button className="nav-link" style={{ fontSize: '0.82rem', padding: '0.2rem 0' }} onClick={() => scrollTo('contact')}>Contact</button>
                </div>
            </footer>
        </div>
    );
}
