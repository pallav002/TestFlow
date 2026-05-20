import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy, CheckCircle, XCircle, Target, Home, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Results = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);

    const score      = location.state?.score     ?? 0;
    const totalMarks = location.state?.totalMarks ?? 0;
    const attempted  = location.state?.attempted  ?? 0;
    const correct    = location.state?.correct    ?? 0;
    const wrong      = location.state?.wrong      ?? 0;
    const accuracy   = location.state?.accuracy   ?? 0;
    const testTitle  = location.state?.testTitle  ?? 'Assessment';

    const pct = Math.round(accuracy);
    const scoreColor = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
    const grade = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Average' : 'Needs Improvement';

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(t);
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f3f0ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: '"Inter", system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes fadeUp  { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
                @keyframes pop     { 0%{transform:scale(0.6);opacity:0} 70%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
                @keyframes pglow   { 0%,100%{opacity:0.5} 50%{opacity:1} }
            `}</style>

            {/* bg blobs */}
            <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
                <div style={{ position:'absolute', top:'-10%', right:'-5%', width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.1),transparent 70%)', animation:'pglow 6s ease infinite' }} />
                <div style={{ position:'absolute', bottom:'5%', left:'-5%', width:350, height:350, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.08),transparent 70%)', animation:'pglow 8s ease infinite 2s' }} />
            </div>

            {/* Spinner */}
            {!visible && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem', position:'relative', zIndex:1 }}>
                    <div style={{ width:44, height:44, borderRadius:'50%', border:'4px solid #ede9fe', borderTopColor:'#a855f7', animation:'spin 0.9s linear infinite' }} />
                    <p style={{ color:'#a855f7', fontSize:'0.9rem', fontWeight:600, margin:0 }}>Calculating results…</p>
                </div>
            )}

            {/* Card */}
            {visible && (
                <div style={{
                    width:'100%', maxWidth:520,
                    animation:'fadeUp 0.5s ease forwards',
                    position:'relative', zIndex:1,
                    display:'flex', flexDirection:'column', gap:'0.75rem',
                }}>

                    {/* Header row */}
                    <div style={{
                        background:'#fff', borderRadius:'1rem',
                        border:'1.5px solid #ede9fe',
                        boxShadow:'0 2px 16px rgba(109,40,217,0.07)',
                        padding:'1.25rem 1.5rem',
                        display:'flex', alignItems:'center', gap:'1rem',
                    }}>
                        <div style={{
                            width:52, height:52, borderRadius:'50%', flexShrink:0,
                            background:`${scoreColor}18`, border:`2px solid ${scoreColor}44`,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            animation:'pop 0.5s ease 0.1s both',
                        }}>
                            <Trophy size={26} strokeWidth={1.8} style={{ color:scoreColor }} />
                        </div>
                        <div>
                            <h1 style={{ margin:0, fontSize:'1.2rem', fontWeight:800, color:'#0f172a', letterSpacing:'-0.02em', lineHeight:1.2 }}>
                                Assessment Complete
                            </h1>
                            <p style={{ margin:'0.2rem 0 0', fontSize:'0.8rem', color:'#a855f7', fontWeight:600 }}>{testTitle}</p>
                            <p style={{ margin:'0.1rem 0 0', fontSize:'0.8rem', color:'#64748b' }}>
                                Well done, <strong style={{ color:'#0f172a' }}>{user?.full_name || user?.username || 'Candidate'}</strong>! Your results are in.
                            </p>
                        </div>
                    </div>

                    {/* Score + Accuracy */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                        {[
                            { label:'Final Score', value: <>{score}<span style={{ fontSize:'1rem', color:'#9ca3af', fontWeight:400 }}>/{totalMarks}</span></>, color:'#a855f7' },
                            { label:'Accuracy',    value: <>{pct}<span style={{ fontSize:'1rem', fontWeight:400, opacity:0.6 }}>%</span></>,              color:scoreColor },
                        ].map(item => (
                            <div key={item.label} style={{
                                background:'#fff', borderRadius:'1rem',
                                border:'1.5px solid #ede9fe',
                                boxShadow:'0 2px 12px rgba(109,40,217,0.06)',
                                padding:'1.1rem 1.25rem', textAlign:'center',
                            }}>
                                <p style={{ margin:'0 0 0.35rem', fontSize:'0.65rem', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:600 }}>{item.label}</p>
                                <div style={{ fontSize:'2.5rem', fontWeight:900, color:item.color, lineHeight:1 }}>{item.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Stats row */}
                    <div style={{
                        background:'#fff', borderRadius:'1rem',
                        border:'1.5px solid #ede9fe',
                        boxShadow:'0 2px 12px rgba(109,40,217,0.06)',
                        display:'grid', gridTemplateColumns:'repeat(3,1fr)',
                        overflow:'hidden',
                    }}>
                        {[
                            { icon:<Target size={14} />,      label:'Attempted', value:attempted, color:'#6366f1' },
                            { icon:<CheckCircle size={14} />, label:'Correct',   value:correct,   color:'#10b981' },
                            { icon:<XCircle size={14} />,     label:'Wrong',     value:wrong,     color:'#ef4444' },
                        ].map(({ icon, label, value, color }, i, arr) => (
                            <div key={label} style={{
                                padding:'0.9rem 0.5rem', textAlign:'center',
                                borderRight: i < arr.length - 1 ? '1px solid #ede9fe' : 'none',
                            }}>
                                <div style={{ color:'#c4b5fd', marginBottom:'0.3rem', display:'flex', justifyContent:'center' }}>{icon}</div>
                                <div style={{ fontSize:'1.5rem', fontWeight:800, color, lineHeight:1, marginBottom:'0.2rem' }}>{value}</div>
                                <div style={{ fontSize:'0.6rem', color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Grade + Verified side by side */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                        <div style={{
                            background:'#faf5ff', borderRadius:'0.875rem',
                            border:'1.5px solid #ede9fe',
                            padding:'0.875rem 1rem',
                            display:'flex', alignItems:'center', gap:'0.625rem',
                        }}>
                            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#a855f7,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                <Trophy size={14} color="#fff" />
                            </div>
                            <div>
                                <div style={{ fontWeight:700, color:'#a855f7', fontSize:'0.82rem' }}>Grade</div>
                                <div style={{ fontSize:'0.75rem', color:'#6b7280' }}>{grade} · {pct}%</div>
                            </div>
                        </div>
                        <div style={{
                            background:'rgba(16,185,129,0.05)', borderRadius:'0.875rem',
                            border:'1px solid rgba(16,185,129,0.2)',
                            padding:'0.875rem 1rem',
                            display:'flex', alignItems:'center', gap:'0.625rem',
                        }}>
                            <ShieldCheck size={20} style={{ color:'#10b981', flexShrink:0 }} />
                            <div>
                                <div style={{ fontWeight:700, color:'#10b981', fontSize:'0.82rem' }}>Verified</div>
                                <div style={{ fontSize:'0.72rem', color:'#6b7280' }}>Securely recorded</div>
                            </div>
                        </div>
                    </div>

                    {/* Return button */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            width:'100%', padding:'0.875rem', borderRadius:'0.875rem', border:'none',
                            background:'linear-gradient(135deg,#a855f7,#6366f1)',
                            color:'#fff', fontSize:'0.95rem', fontWeight:700, cursor:'pointer',
                            display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
                            boxShadow:'0 6px 20px rgba(168,85,247,0.3)',
                            transition:'transform 0.15s, box-shadow 0.15s',
                            fontFamily:'inherit',
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 28px rgba(168,85,247,0.4)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 6px 20px rgba(168,85,247,0.3)'; }}
                    >
                        <Home size={17} /> Return to Portal
                    </button>

                    <p style={{ textAlign:'center', margin:0, fontSize:'0.7rem', color:'#c4b5fd' }}>
                        © 2025 TestFlow · Professional Assessment Platform
                    </p>
                </div>
            )}
        </div>
    );
};

export default Results;
