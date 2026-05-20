import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Clock, ChevronRight, Send, Maximize, Shield } from 'lucide-react';

const C = {
    bg:      '#f3f0ff',
    surface: '#ffffff',
    border:  '#ede9fe',
    text:    '#111827',
    muted:   '#6b7280',
    primary: '#a855f7',
    success: '#10b981',
};

const TestExecution = () => {
    const { testId } = useParams();
    const [test, setTest] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTest = async () => {
            try {
                const res = await api.get(`/candidate/tests/${testId}`);
                if (!res.data.questions || res.data.questions.length === 0) {
                    alert('This test has no questions yet.');
                    navigate('/dashboard');
                    return;
                }
                setTest(res.data);
                setQuestionTimeLeft(res.data.time_per_question_seconds || 60);
                setLoading(false);
                
                // Automatically request fullscreen when test starts
                setTimeout(() => {
                    const elem = document.documentElement;
                    if (elem.requestFullscreen) {
                        elem.requestFullscreen().catch(() => {});
                    }
                }, 500);
            } catch {
                navigate('/dashboard');
            }
        };
        fetchTest();
    }, [testId, navigate]);

    const enterFullscreen = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => {});
        }
    };

    useEffect(() => {
        const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    useEffect(() => {
        if (questionTimeLeft > 0) {
            const timer = setTimeout(() => setQuestionTimeLeft(questionTimeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (questionTimeLeft === 0 && !loading) {
            handleAutoNext();
        }
    }, [questionTimeLeft, loading]);

    const handleAutoNext = () => {
        if (submitting) return;
        if (currentQuestionIndex < test.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setQuestionTimeLeft(test.time_per_question_seconds || 60);
        } else {
            handleSubmit();
        }
    };

    const handleManualNext = () => {
        if (currentQuestionIndex < test.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setQuestionTimeLeft(test.time_per_question_seconds || 60);
        } else {
            handleSubmit();
        }
    };

    const handleOptionSelect = (questionId, option) => {
        setAnswers({ ...answers, [questionId]: option });
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        setSubmitError('');
        try {
            const res = await api.post(`/candidate/tests/${testId}/submit`, answers);
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            navigate('/results', {
                state: {
                    score:      res.data.score,
                    totalMarks: res.data.total_questions,
                    attempted:  res.data.attempted_questions,
                    correct:    res.data.correct_answers,
                    wrong:      res.data.wrong_answers,
                    accuracy:   res.data.accuracy,
                    passed:     res.data.passed,
                    testTitle:  test.title,
                }
            });
        } catch (err) {
            setSubmitting(false);
            setSubmitError(err.response?.data?.detail || 'Error submitting test. Please contact staff.');
        }
    };

    if (loading) return (
        <div style={{
            display: 'flex', height: '100vh', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: C.bg,
        }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '3px solid #e5e7eb', borderTopColor: C.primary,
                animation: 'spin 1s linear infinite', marginBottom: '1rem',
            }} />
            <p style={{ color: C.muted, fontSize: '0.9rem' }}>Preparing Examination Environment…</p>
        </div>
    );

    const currentQuestion = test.questions[currentQuestionIndex];
    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const urgent = questionTimeLeft < 10;
    const progress = Math.round((currentQuestionIndex / test.questions.length) * 100);

    return (
        <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, sans-serif' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Fullscreen nudge */}
            {!isFullscreen && (
                <button
                    onClick={enterFullscreen}
                    style={{
                        position: 'fixed', bottom: '1.25rem', right: '1.25rem', zIndex: 1000,
                        padding: '0.45rem 1rem', borderRadius: '30px',
                        background: 'rgba(168,85,247,0.08)', color: C.primary,
                        border: `1px solid ${C.primary}`, fontSize: '0.78rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}
                >
                    <Maximize size={13} /> Full Screen
                </button>
            )}

            {/* ── Top Nav ── */}
            <nav style={{
                padding: '0 2rem', height: 60,
                background: C.surface, borderBottom: `1px solid ${C.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'sticky', top: 0, zIndex: 100,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: `linear-gradient(135deg, ${C.primary}, #6366f1)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 800, color: '#fff',
                    }}>TF</div>
                    <div style={{ width: 1, height: 24, background: C.border }} />
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: C.text }}>{test.title}</div>
                        <div style={{ fontSize: '0.72rem', color: C.muted }}>
                            Question {currentQuestionIndex + 1} of {test.questions.length} · {progress}% done
                        </div>
                    </div>
                </div>

                {/* Timer */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.45rem 1.25rem', borderRadius: '50px',
                    background: urgent ? 'rgba(239,68,68,0.08)' : 'rgba(168,85,247,0.06)',
                    border: `1.5px solid ${urgent ? '#fca5a5' : 'rgba(168,85,247,0.2)'}`,
                    color: urgent ? '#dc2626' : C.primary,
                    fontWeight: 700, fontSize: '1.3rem', fontVariantNumeric: 'tabular-nums',
                    transition: 'all 0.3s',
                }}>
                    <Clock size={18} />
                    {formatTime(questionTimeLeft)}
                </div>
            </nav>

            {/* Progress bar */}
            <div style={{ height: 3, background: '#ede9fe' }}>
                <div style={{
                    height: '100%', width: `${((currentQuestionIndex + 1) / test.questions.length) * 100}%`,
                    background: `linear-gradient(90deg, ${C.primary}, #6366f1)`,
                    transition: 'width 0.4s ease',
                }} />
            </div>

            {/* ── Content ── */}
            <div style={{ maxWidth: 800, margin: '2.5rem auto', padding: '0 1.5rem' }}>

                {/* Question card */}
                <div style={{
                    background: C.surface, borderRadius: '1rem',
                    border: `1px solid ${C.border}`,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    padding: '2rem 2.25rem',
                    marginBottom: '1.5rem',
                }} key={currentQuestionIndex}>

                    {/* Question label */}
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                        Question {currentQuestionIndex + 1}
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: C.text, lineHeight: 1.5, marginBottom: '1.75rem', margin: '0 0 1.75rem' }}>
                        {currentQuestion.question_text}
                    </h3>

                    {/* Options */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {['A', 'B', 'C', 'D'].map((opt) => {
                            const selected = answers[currentQuestion.id] === opt;
                            return (
                                <label
                                    key={opt}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '0.9rem 1.25rem', borderRadius: '0.75rem',
                                        background: selected ? 'rgba(168,85,247,0.06)' : '#faf5ff',
                                        border: `1.5px solid ${selected ? C.primary : C.border}`,
                                        boxShadow: selected ? `0 0 0 3px rgba(168,85,247,0.1)` : 'none',
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = '#c4b5fd'; }}
                                    onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = C.border; }}
                                >
                                    {/* Custom radio */}
                                    <div style={{
                                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                        border: `2px solid ${selected ? C.primary : '#d1d5db'}`,
                                        background: selected ? C.primary : '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.15s',
                                    }}>
                                        {selected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                                    </div>
                                    <input
                                        type="radio" name={`q-${currentQuestion.id}`}
                                        checked={selected}
                                        onChange={() => handleOptionSelect(currentQuestion.id, opt)}
                                        style={{ display: 'none' }}
                                    />
                                    <span style={{ fontSize: '0.95rem', color: C.text }}>
                                        <strong style={{ opacity: 0.45, marginRight: '0.5rem', fontFamily: 'monospace' }}>{opt}</strong>
                                        {currentQuestion[`option_${opt.toLowerCase()}`]}
                                    </span>
                                </label>
                            );
                        })}
                    </div>

                    {/* Submit error */}
                    {submitError && (
                        <div style={{
                            marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '0.625rem',
                            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
                            color: '#b91c1c', fontSize: '0.82rem',
                        }}>
                            {submitError}
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{
                        marginTop: '2rem', paddingTop: '1.5rem',
                        borderTop: `1px solid ${C.border}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <p style={{ fontSize: '0.78rem', color: C.muted, display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                            <Shield size={13} /> Secure TestFlow Environment
                        </p>

                        {currentQuestionIndex < test.questions.length - 1 ? (
                            <button
                                onClick={handleManualNext}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.7rem 1.75rem', borderRadius: '0.625rem', border: 'none',
                                    background: `linear-gradient(135deg, ${C.primary}, #6366f1)`,
                                    color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(168,85,247,0.3)',
                                }}
                            >
                                Next <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={submitting}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.7rem 1.75rem', borderRadius: '0.625rem', border: 'none',
                                    background: submitting ? C.muted : `linear-gradient(135deg, ${C.success}, #059669)`,
                                    color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: submitting ? 'not-allowed' : 'pointer',
                                    boxShadow: submitting ? 'none' : '0 4px 12px rgba(16,185,129,0.3)',
                                    opacity: submitting ? 0.7 : 1,
                                }}
                            >
                                {submitting ? (
                                    <>Submitting...</>
                                ) : (
                                    <><Send size={16} /> Submit Assessment</>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Question dots */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {test.questions.map((q, i) => (
                        <div key={q.id} style={{
                            width: 28, height: 28, borderRadius: '50%', fontSize: '0.65rem', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: i < currentQuestionIndex
                                ? (answers[q.id] ? `${C.primary}22` : '#f3f0ff')
                                : i === currentQuestionIndex
                                    ? C.primary
                                    : '#f3f0ff',
                            color: i === currentQuestionIndex ? '#fff' : i < currentQuestionIndex && answers[q.id] ? C.primary : C.muted,
                            border: i === currentQuestionIndex ? `2px solid ${C.primary}` : '2px solid #e5e7eb',
                        }}>
                            {i + 1}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TestExecution;
