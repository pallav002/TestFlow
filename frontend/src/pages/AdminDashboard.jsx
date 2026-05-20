import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
    FilePlus, Users, BarChart, LogOut, Plus, FileText,
    Trash2, Edit2, Upload, X, ChevronDown, ChevronUp,
    AlertTriangle, CheckCircle, Loader, FileUp, RefreshCw,
    ClipboardList, Clock, Calendar, Eye, EyeOff,
    CalendarDays, Video, UserCheck, UserX, RotateCcw, Link, Pencil,
    Briefcase, MapPin, DollarSign, GraduationCap, Tag, Building2, ToggleLeft, ToggleRight,
    ShieldAlert, Info, Mail, Phone, BookOpen, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// ---------------------------------------------------------------------------
// Global Styles for scrollbars inside modals
// ---------------------------------------------------------------------------
const modalScrollbarStyles = `
    .modal-form-scroll::-webkit-scrollbar {
        width: 6px;
    }
    .modal-form-scroll::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 10px;
    }
    .modal-form-scroll::-webkit-scrollbar-thumb {
        background: var(--primary);
        border-radius: 10px;
        opacity: 0.8;
    }
    .modal-form-scroll::-webkit-scrollbar-thumb:hover {
        background: var(--accent);
    }
`;

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------

const fmt = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—';

// Format a Date object to the value string required by <input type="datetime-local">
// Output: "YYYY-MM-DDTHH:MM"
const toDatetimeLocal = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// ---------------------------------------------------------------------------
// Reusable UI pieces
// ---------------------------------------------------------------------------

const Overlay = ({ onClose, children }) => (
    <div
        onClick={onClose}
        style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            zIndex: 200, backdropFilter: 'blur(4px)', overflowY: 'auto', padding: '1.5rem 1rem'
        }}
    >
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '460px', margin: 'auto' }}>
            {children}
        </div>
    </div>
);

const ConfirmModal = ({ message, detail, onConfirm, onCancel, danger = true, isPdfDelete = false, questionsExtracted = 0 }) => (
    <Overlay onClose={onCancel}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <AlertTriangle size={22} color={danger ? 'var(--error)' : 'var(--warning)'} />
                <h3 style={{ margin: 0 }}>{message}</h3>
            </div>

            {isPdfDelete ? (
                <>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                        This will remove the PDF file from storage and its database record.
                        {questionsExtracted > 0 && <> It extracted <strong>{questionsExtracted} questions</strong>.</>}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {questionsExtracted > 0 && (
                            <button
                                className="btn"
                                style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'left', padding: '0.65rem 0.9rem' }}
                                onClick={() => onConfirm(true)}
                            >
                                <strong>Delete PDF + {questionsExtracted} Questions</strong>
                                <div style={{ fontSize: '0.74rem', opacity: 0.75, marginTop: '0.15rem' }}>Removes file, record, and all extracted questions</div>
                            </button>
                        )}
                        <button
                            className="btn"
                            style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.3)', textAlign: 'left', padding: '0.65rem 0.9rem' }}
                            onClick={() => onConfirm(false)}
                        >
                            <strong>Delete PDF Only</strong>
                            <div style={{ fontSize: '0.74rem', opacity: 0.75, marginTop: '0.15rem' }}>Keeps extracted questions in the test</div>
                        </button>
                        <button className="btn" style={{ marginTop: '0.2rem' }} onClick={onCancel}>Cancel</button>
                    </div>
                </>
            ) : (
                <>
                    {detail && <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{detail}</p>}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
                        <button
                            className="btn"
                            style={{ flex: 1, background: danger ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: danger ? 'var(--error)' : 'var(--warning)', border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}` }}
                            onClick={onConfirm}
                        >
                            Confirm
                        </button>
                    </div>
                </>
            )}
        </div>
    </Overlay>
);

const Toast = ({ msg, type = 'success', onDone }) => {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
    const color = type === 'success' ? 'var(--success)' : 'var(--error)';
    return (
        <div style={{
            position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 999,
            background: 'var(--surface)', border: `1px solid ${color}`,
            borderRadius: '10px', padding: '0.85rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)', maxWidth: '380px'
        }}>
            {type === 'success' ? <CheckCircle size={18} color={color} /> : <AlertTriangle size={18} color={color} />}
            <span style={{ fontSize: '0.9rem', color }}>{msg}</span>
        </div>
    );
};

const Spinner = () => (
    <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>
        <Loader size={16} />
    </span>
);

// ---------------------------------------------------------------------------
// Field components
// ---------------------------------------------------------------------------

const Field = ({ label, children }) => (
    <div style={{ marginBottom: '0.85rem' }}>
        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{label}</label>
        {children}
    </div>
);

// ---------------------------------------------------------------------------
// Result Cards — grouped by candidate
// ---------------------------------------------------------------------------

const AccuracyBadge = ({ value }) => {
    const pct = Math.round(value);
    const good = pct >= 70;
    return (
        <span style={{
            padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
            background: good ? 'rgba(16,185,129,0.12)' : pct >= 40 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.1)',
            color: good ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--error)',
        }}>
            {pct}%
        </span>
    );
};

const PassedBadge = ({ passed }) => (
    <span style={{
        padding: '0.15rem 0.55rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
        background: passed ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
        color: passed ? 'var(--success)' : 'var(--error)',
        border: `1px solid ${passed ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}`,
    }}>
        {passed ? '✓ Passed' : '✗ Failed'}
    </span>
);

const CandidateDetailModal = ({ group, onClose, onDelete }) => {
    const subs = group.submissions;
    const totalTests = subs.length;
    const totalCorrect = subs.reduce((s, r) => s + r.correct_answers, 0);
    const totalPossible = subs.reduce((s, r) => s + r.total_questions, 0);
    const avgAccuracy = (totalCorrect / totalPossible * 100) || 0;
    const totalScore = subs.reduce((s, r) => s + r.score, 0);
    const initials = (group.name || group.username || '?')
        .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        <Overlay onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--surface)', borderRadius: '1.25rem', width: '100%', maxWidth: '560px',
                    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)', overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{ padding: '1.5rem 1.75rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    <div style={{
                        width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', fontWeight: '800', color: '#fff', letterSpacing: '0.05em'
                    }}>
                        {initials}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{group.name || 'Deleted User'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{group.username}</div>
                    </div>
                    <button onClick={onClose} className="btn btn-icon" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', flexShrink: 0 }}>✕</button>
                </div>

                {/* Summary stats */}
                <div style={{ display: 'flex', gap: '0.75rem', padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                    {[
                        { label: 'Tests Taken', value: totalTests, color: 'var(--primary)' },
                        { label: 'Total Score', value: totalScore, color: 'var(--success)' },
                        { label: 'Avg Accuracy', value: <AccuracyBadge value={avgAccuracy} /> },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: color || 'inherit' }}>{value}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Submissions list — scrollable */}
                <div style={{ overflowY: 'auto', padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.1rem' }}>
                        Submission Details
                    </div>
                    {subs.map(r => (
                        <div key={r.id} style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
                            {/* Test title bar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.95rem', flex: 1 }}>{r.test_title || 'Deleted Test'}</span>
                                <PassedBadge passed={r.passed} />
                                <button
                                    onClick={() => { onDelete(r); }}
                                    className="btn btn-icon"
                                    title="Delete submission"
                                    style={{ color: 'var(--error)', opacity: 0.7, flexShrink: 0 }}
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}>
                                {[
                                    { label: 'Questions', value: `${r.attempted_questions}/${r.total_questions}` },
                                    { label: 'Correct', value: `+${r.correct_answers}`, color: 'var(--success)' },
                                    { label: 'Wrong', value: `-${r.wrong_answers}`, color: 'var(--error)' },
                                    { label: 'Score', value: r.score, color: 'var(--primary)' },
                                    { label: 'Accuracy', value: <AccuracyBadge value={(r.correct_answers / r.total_questions) * 100} /> },
                                ].map(({ label, value, color }, i, arr) => (
                                    <div key={label} style={{
                                        padding: '0.7rem 0.4rem', textAlign: 'center',
                                        borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                                    }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: color || 'inherit' }}>{value}</div>
                                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{label}</div>
                                    </div>
                                ))}
                            </div>
                            {/* Date */}
                            <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                Submitted: {fmtDate(r.submitted_at)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Overlay>
    );
};

const ResultCards = ({ results, onDelete, expandedCandidate, setExpandedCandidate }) => {
    const grouped = results.reduce((acc, r) => {
        const key = r.candidate_username || 'unknown';
        if (!acc[key]) acc[key] = { name: r.candidate_name, username: r.candidate_username, submissions: [] };
        acc[key].submissions.push(r);
        return acc;
    }, {});

    const groups = Object.values(grouped);

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {groups.map(group => {
                    const subs = group.submissions;
                    const totalTests = subs.length;
                    const totalCorrect = subs.reduce((s, r) => s + r.correct_answers, 0);
                    const totalPossible = subs.reduce((s, r) => s + r.total_questions, 0);
                    const avgAccuracy = (totalCorrect / totalPossible * 100) || 0;
                    const totalScore = subs.reduce((s, r) => s + r.score, 0);
                    const initials = (group.name || group.username || '?')
                        .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

                    return (
                        <div key={group.username} className="glass-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                            {/* Avatar + name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                <div style={{
                                    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                                    background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.75rem', fontWeight: '800', color: '#fff'
                                }}>
                                    {initials}
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {group.name || 'Deleted User'}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>@{group.username}</div>
                                </div>
                            </div>

                            {/* Summary stats */}
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                {[
                                    { label: `Test${totalTests !== 1 ? 's' : ''}`, value: totalTests, color: 'var(--primary)' },
                                    { label: 'Score', value: totalScore, color: 'var(--success)' },
                                    { label: 'Accuracy', value: <AccuracyBadge value={avgAccuracy} /> },
                                ].map(({ label, value, color }) => (
                                    <div key={label} style={{ flex: 1, padding: '0.35rem 0.2rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: color || 'inherit' }}>{value}</div>
                                        <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* View button */}
                            <button
                                onClick={() => setExpandedCandidate(group.username)}
                                className="btn btn-primary"
                                style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                            >
                                <Eye size={12} /> View {totalTests} Submission{totalTests !== 1 ? 's' : ''}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Detail modal */}
            {expandedCandidate && (() => {
                const group = Object.values(grouped).find(g => g.username === expandedCandidate);
                if (!group) return null;
                return (
                    <CandidateDetailModal
                        group={group}
                        onClose={() => setExpandedCandidate(null)}
                        onDelete={r => { onDelete(r); setExpandedCandidate(null); }}
                    />
                );
            })()}
        </>
    );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const AdminDashboard = () => {
    const { logout, user } = useAuth();
    const isJuniorHR = user?.hr_type === 'junior';
    const hrLabel = user?.hr_type === 'senior' ? 'Senior HR' : user?.hr_type === 'junior' ? 'Junior HR' : 'HR';
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Data
    const [tests, setTests] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [results, setResults] = useState([]);

    // Loading
    const [loadingTests, setLoadingTests] = useState(false);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);

    // Toasts
    const [toast, setToast] = useState(null);
    const showToast = (msg, type = 'success') => setToast({ msg, type, key: Date.now() });

    // Confirm modal state
    const [confirm, setConfirm] = useState(null); // {message, detail, onConfirm}

    // Expanded candidate card in Results tab
    const [expandedCandidate, setExpandedCandidate] = useState(null);

    // -----------------------------------------------------------------------
    // Modal states
    // -----------------------------------------------------------------------
    const [showCreateTest, setShowCreateTest] = useState(false);
    const [editingTest, setEditingTest] = useState(null);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [pdfUploadTarget, setPdfUploadTarget] = useState(null);
    const [assigningUser, setAssigningUser] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [assignForm, setAssignForm] = useState({ test_id: '', login_start: '', login_end: '' });

    // Interview scheduling
    const [interviews, setInterviews] = useState([]);
    const [loadingInterviews, setLoadingInterviews] = useState(false);
    const [showInterviewForm, setShowInterviewForm] = useState(false);
    const [editingInterview, setEditingInterview] = useState(null);
    const emptyInterview = { user_id: '', interviewer_name: '', interview_date: '', meeting_url: '', notes: '', status: 'pending' };
    const [interviewForm, setInterviewForm] = useState(emptyInterview);

    // Job Openings
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [showJobForm, setShowJobForm] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [expandedJob, setExpandedJob] = useState(null);
    const emptyJob = {
        title: '', department: '', location: '', job_type: 'Full-Time',
        experience_level: 'Any', min_experience_years: 0, max_experience_years: '',
        skills_required: '', jd_description: '', responsibilities: '',
        qualifications: '', salary_range: '', vacancies: 1, status: 'open',
    };
    const [jobForm, setJobForm] = useState(emptyJob);

    // Question Bank
    const [qbSubTab, setQbSubTab] = useState('manual'); // 'manual' | 'ai' | 'pdf'
    const [qbTestId, setQbTestId] = useState('');
    const [qbQuestions, setQbQuestions] = useState([]); // questions for selected test
    const [qbLoading, setQbLoading] = useState(false);
    // Manual form
    const emptyManual = { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', marks: 1 };
    const [manualForm, setManualForm] = useState(emptyManual);
    const [manualSaving, setManualSaving] = useState(false);
    // AI form
    const [aiForm, setAiForm] = useState({ topic: '', count: 5, difficulty: 'medium' });
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiPreview, setAiPreview] = useState([]); // [{...question, _approved: true}]
    const [aiSaving, setAiSaving] = useState(false);
    // PDF upload for question bank tab
    const [qbPdfUploading, setQbPdfUploading] = useState(false);

    // Form state
    const emptyTest = { title: '', description: '', duration_minutes: 30, time_per_question_seconds: 60, total_questions_limit: 0, category: 'Technical', passing_score: 60 };
    const emptyUser = { username: '', password: '', full_name: '', email: '', phone: '', college_or_company: '', experience_level: 'Fresher', skills: '', applied_for_job: '' };
    const [newTest, setNewTest] = useState(emptyTest);
    const [newUser, setNewUser] = useState(emptyUser);
    const [editTestForm, setEditTestForm] = useState({});
    const [editUserForm, setEditUserForm] = useState({});

    const [showPwCreate, setShowPwCreate] = useState(false);
    const [showPwEdit, setShowPwEdit] = useState(false);

    // Overview tab filters (must be top-level to follow React Rules of Hooks)
    const [ovDateFrom, setOvDateFrom] = useState('');
    const [ovDateTo, setOvDateTo] = useState('');
    const [ovSearchQ, setOvSearchQ] = useState('');
    const [ovActiveSection, setOvActiveSection] = useState(null); // 'passed' | 'failed' | null

    const handlePhoneChange = (e, isEdit = false) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
        if (isEdit) setEditUserForm({ ...editUserForm, phone: val });
        else setNewUser({ ...newUser, phone: val });
    };

    // Welcome popup — shown once per token (every fresh login)
    const [showWelcome, setShowWelcome] = useState(() => {
        const token = localStorage.getItem('token') || '';
        const key = `tf_hr_welcomed_${token.slice(-16)}`;
        if (sessionStorage.getItem(key)) return false;
        sessionStorage.setItem(key, '1');
        return true;
    });

    // Submitting flags
    const [submitting, setSubmitting] = useState(false);
    const [uploadingPdf, setUploadingPdf] = useState({}); // { [testId]: bool }

    // -----------------------------------------------------------------------
    // Fetch helpers
    // -----------------------------------------------------------------------

    const fetchTests = useCallback(async () => {
        setLoadingTests(true);
        try {
            const res = await api.get('/admin/tests');
            setTests(res.data);
        } catch {
            showToast('Failed to load tests', 'error');
        } finally {
            setLoadingTests(false);
        }
    }, []);

    const fetchCandidates = useCallback(async () => {
        setLoadingCandidates(true);
        try {
            const res = await api.get('/admin/candidates');
            setCandidates(res.data);
        } catch {
            showToast('Failed to load candidates', 'error');
        } finally {
            setLoadingCandidates(false);
        }
    }, []);

    const fetchAssignments = useCallback(async () => {
        try {
            const res = await api.get('/admin/assignments');
            setAssignments(res.data);
        } catch {
            // non-fatal
        }
    }, []);

    const fetchResults = useCallback(async () => {
        setLoadingResults(true);
        try {
            const res = await api.get('/admin/results');
            setResults(res.data);
        } catch {
            showToast('Failed to load results', 'error');
        } finally {
            setLoadingResults(false);
        }
    }, []);

    const fetchInterviews = useCallback(async () => {
        setLoadingInterviews(true);
        try {
            const res = await api.get('/admin/interviews');
            setInterviews(res.data);
        } catch {
            showToast('Failed to load interviews', 'error');
        } finally {
            setLoadingInterviews(false);
        }
    }, []);

    const fetchJobs = useCallback(async () => {
        setLoadingJobs(true);
        try {
            const res = await api.get('/admin/jobs');
            setJobs(res.data);
        } catch {
            showToast('Failed to load jobs', 'error');
        } finally {
            setLoadingJobs(false);
        }
    }, []);

    useEffect(() => { fetchTests(); fetchResults(); fetchCandidates(); fetchAssignments(); fetchInterviews(); fetchJobs(); }, [fetchTests, fetchResults, fetchCandidates, fetchAssignments, fetchInterviews, fetchJobs]);

    const fetchQbQuestions = async (testId) => {
        if (!testId) { setQbQuestions([]); return; }
        setQbLoading(true);
        try {
            const res = await api.get(`/admin/tests/${testId}/questions`);
            setQbQuestions(res.data);
        } catch {
            showToast('Failed to load questions', 'error');
        } finally {
            setQbLoading(false);
        }
    };

    const handleQbTestChange = (id) => {
        setQbTestId(id);
        setAiPreview([]);
        fetchQbQuestions(id);
    };

    const handleManualSave = async (e) => {
        e.preventDefault();
        if (!qbTestId) { showToast('Select a test first', 'error'); return; }
        setManualSaving(true);
        try {
            await api.post(`/admin/tests/${qbTestId}/questions`, manualForm);
            setManualForm(emptyManual);
            await fetchQbQuestions(qbTestId);
            await fetchTests();
            showToast('Question added');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error saving question', 'error');
        } finally {
            setManualSaving(false);
        }
    };

    const handleAiGenerate = async (e) => {
        e.preventDefault();
        if (!qbTestId) { showToast('Select a test first', 'error'); return; }
        setAiGenerating(true);
        setAiPreview([]);
        try {
            const res = await api.post(`/admin/tests/${qbTestId}/ai-generate`, aiForm);
            setAiPreview(res.data.questions.map(q => ({ ...q, _approved: true })));
            showToast(`${res.data.count} questions generated — review below`);
        } catch (err) {
            showToast(err.response?.data?.detail || 'AI generation failed', 'error');
        } finally {
            setAiGenerating(false);
        }
    };

    const handleAiSave = async () => {
        const approved = aiPreview.filter(q => q._approved);
        if (!approved.length) { showToast('No approved questions to save', 'error'); return; }
        setAiSaving(true);
        try {
            const payload = approved.map(({ _approved, ...q }) => q);
            await api.post(`/admin/tests/${qbTestId}/questions/bulk`, { questions: payload });
            setAiPreview([]);
            await fetchQbQuestions(qbTestId);
            await fetchTests();
            showToast(`${payload.length} questions saved`);
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error saving questions', 'error');
        } finally {
            setAiSaving(false);
        }
    };

    const [qbPdfResult, setQbPdfResult] = useState(null); // { type: 'success'|'error', msg, count }

    const handleQbPdfUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !qbTestId) return;
        setQbPdfUploading(true);
        setQbPdfResult(null);
        const form = new FormData();
        form.append('file', file);
        try {
            const res = await api.post(`/admin/tests/${qbTestId}/upload-pdf?mode=append`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
            await fetchQbQuestions(qbTestId);
            await fetchTests();
            const count = res.data.questions_extracted;
            setQbPdfResult({
                type: 'success',
                count,
                msg: `${count} question${count !== 1 ? 's' : ''} successfully extracted and saved.`,
            });
        } catch (err) {
            const detail = err.response?.data?.detail || 'PDF upload failed. Please try again.';
            setQbPdfResult({ type: 'error', msg: detail });
        } finally {
            setQbPdfUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteQbQuestion = async (qid) => {
        try {
            await api.delete(`/admin/questions/${qid}`);
            setQbQuestions(prev => prev.filter(q => q.id !== qid));
            await fetchTests();
        } catch {
            showToast('Error deleting question', 'error');
        }
    };

    // -----------------------------------------------------------------------
    // Test CRUD
    // -----------------------------------------------------------------------

    const handleCreateTest = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/admin/tests', newTest);
            setShowCreateTest(false);
            setNewTest(emptyTest);
            await fetchTests();
            showToast('Assessment created');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error creating test', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateTest = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.put(`/admin/tests/${editingTest.id}`, editTestForm);
            setEditingTest(null);
            await fetchTests();
            showToast('Assessment updated');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error updating test', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (testId) => {
        // Optimistic update
        setTests(prev => prev.map(t => t.id === testId ? { ...t, is_active: !t.is_active } : t));
        try {
            await api.patch(`/admin/tests/${testId}/toggle-active`);
            // Optionally re-fetch to sync with server, but optimistic state is already set
            // await fetchTests(); 
        } catch {
            showToast('Error updating test status', 'error');
            await fetchTests(); // Rollback/sync on error
        }
    };

    const askDeleteTest = (test) => {
        doDeleteTest(test.id);
    };

    const doDeleteTest = async (testId) => {
        setConfirm(null);
        // Optimistic update
        const originalTests = [...tests];
        setTests(prev => prev.filter(t => t.id !== testId));
        try {
            await api.delete(`/admin/tests/${testId}`);
            showToast('Test deleted');
        } catch {
            showToast('Error deleting test', 'error');
            setTests(originalTests); // Rollback
        }
    };

    // -----------------------------------------------------------------------
    // PDF upload
    // -----------------------------------------------------------------------

    const handleFileChosen = (test, file) => {
        const existingPdfs = test.uploaded_pdfs || [];
        if (existingPdfs.length > 0) {
            // Ask append or replace
            setPdfUploadTarget({ test, file });
        } else {
            doUploadPdf(test.id, file, 'append');
        }
    };

    const doUploadPdf = async (testId, file, mode) => {
        setPdfUploadTarget(null);
        setUploadingPdf(prev => ({ ...prev, [testId]: true }));
        try {
            const form = new FormData();
            form.append('file', file);
            await api.post(`/admin/tests/${testId}/upload-pdf?mode=${mode}`, form);
            await fetchTests();
            showToast(`PDF parsed successfully (${mode === 'replace' ? 'replaced' : 'appended'})`);
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error uploading PDF', 'error');
        } finally {
            setUploadingPdf(prev => ({ ...prev, [testId]: false }));
        }
    };

    // -----------------------------------------------------------------------
    // PDF delete
    // -----------------------------------------------------------------------

    const askDeletePdf = (pdf) => {
        // Since deleting a PDF can also delete questions (2 modes), 
        // we might still need a choice, but the user wants "one click".
        // I'll default to 'Delete PDF Only' for one-click, or just call doDeletePdf.
        // Actually, let's just make it one click for 'Delete PDF + Questions' 
        // as that's the most common intent when clicking Trash.
        doDeletePdf(pdf.id, true);
    };

    const doDeletePdf = async (pdfId, deleteQuestions = false) => {
        setConfirm(null);
        // Optimistic update - complex because PDFs are nested in tests
        const originalTests = [...tests];
        setTests(prev => prev.map(test => ({
            ...test,
            uploaded_pdfs: (test.uploaded_pdfs || []).filter(p => p.id !== pdfId)
        })));

        try {
            await api.delete(`/admin/pdfs/${pdfId}?delete_questions=${deleteQuestions}`);
            showToast(deleteQuestions ? 'PDF and questions deleted' : 'PDF deleted');
            if (deleteQuestions) await fetchTests(); // Sync if questions were removed
        } catch {
            showToast('Error deleting PDF', 'error');
            setTests(originalTests); // Rollback
        }
    };

    // -----------------------------------------------------------------------
    // Candidate CRUD
    // -----------------------------------------------------------------------

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await api.post('/admin/users', newUser);
            setShowCreateUser(false);
            setNewUser(emptyUser);
            await fetchCandidates();
            showToast('Candidate created');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error creating candidate', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {};
            if (editUserForm.full_name) payload.full_name = editUserForm.full_name;
            if (editUserForm.password) payload.password = editUserForm.password;
            if (editUserForm.email !== undefined) payload.email = editUserForm.email || null;
            if (editUserForm.phone !== undefined) payload.phone = editUserForm.phone || null;
            if (editUserForm.college_or_company !== undefined) payload.college_or_company = editUserForm.college_or_company || null;
            if (editUserForm.experience_level !== undefined) payload.experience_level = editUserForm.experience_level || null;
            if (editUserForm.skills !== undefined) payload.skills = editUserForm.skills || null;
            await api.put(`/admin/candidates/${editingUser.id}`, payload);
            setEditingUser(null);
            await fetchCandidates();
            showToast('Candidate updated');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error updating candidate', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const askDeleteCandidate = (c) => {
        setConfirm({
            message: `Remove candidate "${c.full_name}"?`,
            detail: 'The account will be deleted. All past test results will be preserved for audit purposes.',
            onConfirm: () => doDeleteCandidate(c.id),
        });
    };

    const doDeleteCandidate = async (userId) => {
        setConfirm(null);
        const original = [...candidates];
        setCandidates(candidates.filter(c => c.id !== userId));
        try {
            await api.delete(`/admin/candidates/${userId}`);
            showToast('Candidate removed');
        } catch {
            setCandidates(original);
            showToast('Error deleting candidate', 'error');
        }
    };

    // -----------------------------------------------------------------------
    // Assignments
    // -----------------------------------------------------------------------

    const openAssignModal = (candidate) => {
        setAssigningUser(candidate);
        const now = new Date();
        const end = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hrs default
        setAssignForm({
            test_id: '',
            login_start: toDatetimeLocal(now),
            login_end: toDatetimeLocal(end),
        });
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        if (!assignForm.test_id) return showToast('Please select a test', 'error');
        setSubmitting(true);
        try {
            const payload = {
                user_id: assigningUser.id,
                test_id: parseInt(assignForm.test_id),
                login_start: assignForm.login_start || null,
                login_end: assignForm.login_end || null,
            };
            await api.post('/admin/assignments', payload);
            await fetchAssignments();
            setAssignForm({ test_id: '', login_start: '', login_end: '' });
            showToast('Test assigned — invitation email sent to candidate');
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error assigning test', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAssignment = async (assignmentId) => {
        // Optimistic update
        const originalAssignments = [...assignments];
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        try {
            await api.delete(`/admin/assignments/${assignmentId}`);
            showToast('Assignment removed');
        } catch {
            showToast('Error removing assignment', 'error');
            setAssignments(originalAssignments); // Rollback
        }
    };

    // -----------------------------------------------------------------------
    // Interview CRUD
    // -----------------------------------------------------------------------

    const openInterviewForm = (iv = null) => {
        if (iv) {
            setEditingInterview(iv);
            setInterviewForm({
                user_id: iv.user_id,
                interviewer_name: iv.interviewer_name,
                interview_date: iv.interview_date ? iv.interview_date.slice(0, 16) : '',
                meeting_url: iv.meeting_url || '',
                notes: iv.notes || '',
                status: iv.status,
            });
        } else {
            setEditingInterview(null);
            setInterviewForm(emptyInterview);
        }
        setShowInterviewForm(true);
    };

    const handleSaveInterview = async (e) => {
        e.preventDefault();
        if (!interviewForm.user_id) return showToast('Please select a candidate', 'error');
        if (!interviewForm.interviewer_name) return showToast('Interviewer name required', 'error');
        if (!interviewForm.interview_date) return showToast('Interview date required', 'error');
        setSubmitting(true);
        try {
            const payload = {
                ...interviewForm,
                user_id: parseInt(interviewForm.user_id),
                interview_date: interviewForm.interview_date || null,
                meeting_url: interviewForm.meeting_url || null,
                notes: interviewForm.notes || null,
            };
            if (editingInterview) {
                await api.put(`/admin/interviews/${editingInterview.id}`, payload);
                showToast('Interview updated');
            } else {
                await api.post('/admin/interviews', payload);
                showToast('Interview scheduled');
            }
            await fetchInterviews();
            setShowInterviewForm(false);
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error saving interview', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (iv, newStatus) => {
        // Optimistic update
        setInterviews(prev => prev.map(i => i.id === iv.id ? { ...i, status: newStatus } : i));
        try {
            await api.put(`/admin/interviews/${iv.id}`, { status: newStatus });
            showToast('Status updated');
        } catch {
            showToast('Error updating status', 'error');
            await fetchInterviews(); // Rollback
        }
    };

    const handleDeleteInterview = async (iv) => {
        // Optimistic Update: Remove from UI immediately
        const originalInterviews = [...interviews];
        setInterviews(interviews.filter(i => i.id !== iv.id));

        try {
            await api.delete(`/admin/interviews/${iv.id}`);
            showToast('Interview deleted');
        } catch {
            setInterviews(originalInterviews); // Rollback on error
            showToast('Error deleting interview', 'error');
        }
    };

    // -----------------------------------------------------------------------
    // Job Openings CRUD
    // -----------------------------------------------------------------------

    const openJobForm = (job = null) => {
        if (job) {
            setEditingJob(job);
            setJobForm({
                title: job.title, department: job.department || '',
                location: job.location || '', job_type: job.job_type,
                experience_level: job.experience_level,
                min_experience_years: job.min_experience_years,
                max_experience_years: job.max_experience_years ?? '',
                skills_required: job.skills_required || '',
                jd_description: job.jd_description || '',
                responsibilities: job.responsibilities || '',
                qualifications: job.qualifications || '',
                salary_range: job.salary_range || '',
                vacancies: job.vacancies, status: job.status,
            });
        } else {
            setEditingJob(null);
            setJobForm(emptyJob);
        }
        setShowJobForm(true);
    };

    const handleSaveJob = async (e) => {
        e.preventDefault();
        if (!jobForm.title) return showToast('Job title is required', 'error');
        setSubmitting(true);
        try {
            const payload = {
                ...jobForm,
                min_experience_years: parseInt(jobForm.min_experience_years) || 0,
                max_experience_years: jobForm.max_experience_years !== '' ? parseInt(jobForm.max_experience_years) : null,
                vacancies: parseInt(jobForm.vacancies) || 1,
            };
            if (editingJob) {
                await api.put(`/admin/jobs/${editingJob.id}`, payload);
                showToast('Job updated');
            } else {
                await api.post('/admin/jobs', payload);
                showToast('Job opening created');
            }
            await fetchJobs();
            setShowJobForm(false);
        } catch (err) {
            showToast(err.response?.data?.detail || 'Error saving job', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleJobStatus = async (job) => {
        const newStatus = job.status === 'open' ? 'closed' : 'open';
        // Optimistic update
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
        try {
            await api.put(`/admin/jobs/${job.id}`, { status: newStatus });
            showToast(`Job marked as ${newStatus}`);
        } catch {
            showToast('Error updating job status', 'error');
            await fetchJobs(); // Rollback
        }
    };

    const handleDeleteJob = async (job) => {
        const originalJobs = [...jobs];
        setJobs(jobs.filter(j => j.id !== job.id));

        try {
            await api.delete(`/admin/jobs/${job.id}`);
            showToast('Job deleted');
        } catch {
            setJobs(originalJobs);
            showToast('Error deleting job', 'error');
        }
    };

    // -----------------------------------------------------------------------
    // Result delete
    // -----------------------------------------------------------------------

    const askDeleteResult = (r) => {
        doDeleteResult(r.id);
    };

    const doDeleteResult = async (id) => {
        setConfirm(null);
        // Optimistic update
        setResults(prev => prev.filter(r => r.id !== id));
        try {
            await api.delete(`/admin/results/${id}`);
            showToast('Submission deleted');
        } catch {
            showToast('Error deleting submission', 'error');
            await fetchResults(); // Rollback
        }
    };

    // -----------------------------------------------------------------------
    // Render helpers
    // -----------------------------------------------------------------------

    const renderTestCard = (test) => {
        const uploading = uploadingPdf[test.id];
        const pdfs = test.uploaded_pdfs || [];

        return (
            <div key={test.id} className="glass-card" style={{ padding: '0.75rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: test.is_active ? 1 : 0.65 }}>
                {/* Row 1: title + actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{test.title}</h3>
                    <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                        <button
                            onClick={() => { setEditingTest(test); setEditTestForm({ title: test.title, description: test.description || '', duration_minutes: test.duration_minutes, time_per_question_seconds: test.time_per_question_seconds, total_questions_limit: test.total_questions_limit, category: test.category || 'Technical', passing_score: test.passing_score ?? 60 }); }}
                            className="btn btn-icon" title="Edit test"
                            style={{ color: 'var(--primary)', opacity: 0.8 }}
                        >
                            <Edit2 size={14} />
                        </button>
                        <button onClick={() => askDeleteTest(test)} className="btn btn-icon" title="Delete test" style={{ color: 'var(--error)', opacity: 0.7 }}>
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Row 2: description */}
                {test.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{test.description}</p>
                )}

                {/* Row 3: stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FileText size={13} color="var(--primary)" />{test.questions?.length || 0} Q</span>
                    <span>·</span>
                    <span>{test.duration_minutes}m</span>
                    <span>·</span>
                    <span>{test.time_per_question_seconds}s/q</span>
                    <span>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FileUp size={12} />{pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''}</span>
                    {test.category && <><span>·</span><span style={{ color: 'var(--primary)', fontWeight: 600 }}>{test.category}</span></>}
                    {test.passing_score != null && <><span>·</span><span style={{ color: 'var(--success)', fontWeight: 600 }}>Pass: {test.passing_score}%</span></>}
                </div>

                {/* Row 4: status badge + toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', borderRadius: '7px', background: test.is_active ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${test.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '600', color: test.is_active ? 'var(--success)' : 'var(--error)' }}>
                        {test.is_active ? '● Active' : '● Inactive'}
                    </span>
                    <button
                        onClick={() => handleToggleActive(test.id)}
                        className="btn"
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', background: test.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: test.is_active ? 'var(--error)' : 'var(--success)', border: 'none', lineHeight: 1.4 }}
                    >
                        {test.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                </div>

                {/* Row 5: upload + PDF list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {/* Upload button */}
                    <input
                        type="file" accept=".pdf" id={`pdf-${test.id}`} style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files[0]; if (f) { handleFileChosen(test, f); e.target.value = ''; } }}
                    />
                    <label htmlFor={`pdf-${test.id}`} className="btn" style={{ border: '1px solid var(--border)', width: '100%', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1, fontSize: '0.78rem', padding: '0.45rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        {uploading ? <><Spinner /> Parsing…</> : <><Upload size={13} /> Upload PDF Questions</>}
                    </label>

                    {/* Uploaded PDF rows — always visible */}
                    {pdfs.map(pdf => (
                        <div key={pdf.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.6rem', borderRadius: '6px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}>
                            {/* file icon */}
                            <FileText size={13} color="var(--primary)" style={{ flexShrink: 0 }} />

                            {/* filename + meta */}
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.74rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pdf.original_filename}>
                                    {pdf.original_filename}
                                </div>
                                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                    {fmt(pdf.file_size_bytes)} · {pdf.questions_extracted} Qs · {fmtDate(pdf.uploaded_at)}
                                </div>
                            </div>

                            {/* delete PDF button */}
                            <button
                                onClick={() => askDeletePdf(pdf)}
                                className="btn btn-icon"
                                title="Delete this PDF"
                                style={{ color: 'var(--error)', opacity: 0.75, flexShrink: 0, padding: '0.2rem' }}
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // -----------------------------------------------------------------------
    // JSX
    // -----------------------------------------------------------------------

    const navTabs = [
        { id: 'overview',   icon: <BarChart size={17} />,    label: 'Overview' },
        { id: 'tests',      icon: <FilePlus size={17} />,    label: 'Tests' },
        { id: 'users',      icon: <Users size={17} />,       label: 'Candidates' },
        { id: 'results',    icon: <BarChart size={17} />,    label: 'Results' },
        { id: 'interviews', icon: <CalendarDays size={17} />,label: 'Interviews' },
        { id: 'jobs',       icon: <Briefcase size={17} />,   label: 'Job Openings' },
        { id: 'qbank',      icon: <BookOpen size={17} />,    label: 'Question Bank' },
    ];

    const pageTitle = { overview: 'Dashboard', tests: 'Tests', users: 'Candidates', results: 'Results', interviews: 'Interviews', jobs: 'Job Openings', qbank: 'Question Bank' }[activeTab] || 'Dashboard';

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f0ff', fontFamily: '"Inter",system-ui,sans-serif' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                ${modalScrollbarStyles}
                :root {
                    --primary:#a855f7; --accent:#6366f1; --success:#10b981; --error:#ef4444;
                    --warning:#f59e0b; --surface:#ffffff; --border:#ede9fe;
                    --text-muted:#6b7280; --bg:#f3f0ff;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes welcomeFadeIn { from { opacity:0; transform:translateY(-28px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
                @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.7} }
                @keyframes gradShimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
                .hr-nav-btn:hover { background: rgba(168,85,247,0.14) !important; color: #c084fc !important; }
                .glass-card {
                    background: #fff;
                    border-radius: 1rem;
                    border: 1px solid #ede9fe;
                    box-shadow: 0 1px 3px rgba(109,40,217,0.06), 0 4px 16px rgba(109,40,217,0.05);
                    transition: box-shadow 0.2s, transform 0.2s;
                    position: relative;
                    overflow: hidden;
                }
                .glass-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #a855f7, #6366f1, #06b6d4);
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .glass-card:hover { box-shadow: 0 4px 24px rgba(109,40,217,0.13); transform: translateY(-2px); }
                .glass-card:hover::before { opacity: 1; }
                .btn { display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 0.875rem;border-radius:0.625rem;border:1.5px solid #ede9fe;background:#fff;color:#374151;font-size:0.82rem;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:inherit; }
                .btn:hover { background:#faf5ff; border-color:#a855f7; color:#a855f7; }
                .btn-primary { background:linear-gradient(135deg,#a855f7,#6366f1) !important;color:#fff !important;border:none !important;box-shadow:0 4px 14px rgba(168,85,247,0.32); }
                .btn-primary:hover { opacity:0.88 !important;box-shadow:0 6px 20px rgba(168,85,247,0.42) !important;transform:translateY(-1px); }
                .btn-danger { background:linear-gradient(135deg,#ef4444,#dc2626) !important;color:#fff !important;border:none !important;box-shadow:0 4px 12px rgba(239,68,68,0.25); }
                .btn-danger:hover { opacity:0.88 !important;transform:translateY(-1px); }
                .btn-icon { padding:0.4rem;border:none !important;background:transparent !important; }
                .btn-icon:hover { background:rgba(168,85,247,0.1) !important; border-radius:0.4rem; color:#a855f7 !important; }
                .input-field { width:100%;padding:0.55rem 0.75rem;border:1.5px solid #ede9fe;border-radius:0.625rem;font-size:0.83rem;outline:none;color:#111827;background:#faf5ff;box-sizing:border-box;font-family:inherit; }
                .input-field:focus { border-color:#a855f7; box-shadow:0 0 0 3px rgba(168,85,247,0.12); background:#fff; }
                .sidebar-nav { display:flex;flex-direction:column;gap:0.25rem; }
                .sidebar-nav-item { display:none; }
                .logout-btn { display:none; }

                @media (max-width: 768px) {
                    .dash-sidebar { transform: translateX(-100%) !important; transition: transform 0.3s ease !important; }
                    .dash-sidebar.open { transform: translateX(0) !important; }
                    .dash-main { margin-left: 0 !important; }
                    .dash-overlay { display: block !important; }
                    .dash-hamburger { display: flex !important; }
                }
            `}</style>

            {/* ── HR Welcome Popup ── */}
            {showWelcome && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 9999, padding: '1rem', backdropFilter: 'blur(2px)',
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '1.25rem', width: '100%', maxWidth: 360,
                        boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
                        animation: 'welcomeFadeIn 0.45s cubic-bezier(0.16,1,0.3,1)',
                    }}>
                        {/* Gradient header — compact */}
                        <div style={{
                            background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 55%,#ec4899 100%)',
                            padding: '1.25rem 1.25rem 1rem', textAlign: 'center', position: 'relative',
                        }}>
                            <button onClick={() => setShowWelcome(false)} style={{
                                position: 'absolute', top: '0.625rem', right: '0.625rem',
                                background: 'rgba(255,255,255,0.18)', border: 'none',
                                borderRadius: '50%', width: 26, height: 26,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#fff',
                            }}>
                                <X size={13} />
                            </button>

                            {/* Animated avatar */}
                            <div style={{
                                width: 52, height: 52, borderRadius: '50%', margin: '0 auto 0.625rem',
                                background: 'rgba(255,255,255,0.22)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.4rem', fontWeight: 800, color: '#fff',
                                border: '2.5px solid rgba(255,255,255,0.45)',
                                animation: 'shimmer 2.5s ease-in-out infinite',
                            }}>
                                {(user?.full_name || user?.username || 'H')[0].toUpperCase()}
                            </div>

                            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                                Welcome back
                            </div>
                            <h2 style={{ color: '#fff', margin: '0 0 0.2rem', fontSize: '1.15rem', fontWeight: 800 }}>
                                {user?.full_name || user?.username} 👋
                            </h2>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.2rem 0.7rem', borderRadius: 99,
                                background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
                                fontSize: '0.72rem', fontWeight: 700, color: '#fff',
                            }}>
                                <Users size={11} /> {hrLabel} · TestFlow
                            </span>
                        </div>

                        {/* Body — compact 2×2 grid */}
                        <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
                            <p style={{ margin: '0 0 0.875rem', fontSize: '0.78rem', color: '#6b7280', textAlign: 'center', fontWeight: 500 }}>
                                Your HR panel is ready. Here's what you can do:
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                {[
                                    { icon: <FileText size={14} color="#6366f1" />, text: 'Create Tests', bg: '#eef2ff' },
                                    { icon: <Users size={14} color="#8b5cf6" />, text: 'Add Candidates', bg: '#f5f3ff' },
                                    { icon: <BarChart size={14} color="#ec4899" />, text: 'Track Results', bg: '#fdf2f8' },
                                    { icon: <CalendarDays size={14} color="#10b981" />, text: 'Interviews', bg: '#f0fdf4' },
                                ].map((item, i) => (
                                    <div key={i} style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                                        padding: '0.625rem 0.5rem', borderRadius: '0.625rem',
                                        background: item.bg, border: '1px solid #f3f4f6',
                                        animation: `welcomeFadeIn ${0.35 + i * 0.07}s cubic-bezier(0.16,1,0.3,1)`,
                                    }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: '0.5rem', background: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                        }}>{item.icon}</div>
                                        <span style={{ fontSize: '0.72rem', color: '#374151', fontWeight: 600 }}>{item.text}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowWelcome(false)}
                                style={{
                                    width: '100%', padding: '0.7rem',
                                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                    border: 'none', borderRadius: '0.75rem', color: '#fff',
                                    fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                                    letterSpacing: '0.02em', transition: 'opacity 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                                Let's Get Started →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── SIDEBAR ── */}
            {/* Mobile overlay */}
            {sidebarOpen && <div className="dash-overlay" onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:199, display:'none' }} />}

            <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`} style={{
                width: 230, flexShrink: 0,
                background: 'linear-gradient(180deg,#0a0619 0%,#160a2e 45%,#0e0618 100%)',
                display: 'flex', flexDirection: 'column',
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
                boxShadow: '4px 0 32px rgba(168,85,247,0.18)',
            }}>
                {/* Decorative glows */}
                <div style={{ position:'absolute', top:50, left:-40, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.22),transparent)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', bottom:100, right:-30, width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.18),transparent)', pointerEvents:'none' }} />

                {/* Logo block */}
                <div style={{ padding:'1.5rem 1.25rem 1rem', borderBottom:'1px solid rgba(168,85,247,0.15)', position:'relative' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' }}>
                        <div style={{
                            width:40, height:40, borderRadius:'0.875rem',
                            background:'linear-gradient(135deg,#a855f7,#6366f1)',
                            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                            boxShadow:'0 4px 16px rgba(168,85,247,0.45)',
                        }}>
                            <FilePlus size={19} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontSize:'1rem', fontWeight:800, color:'#fff', lineHeight:1, letterSpacing:'-0.01em' }}>TestFlow</div>
                            <div style={{ fontSize:'0.58rem', background:'linear-gradient(135deg,#a855f7,#6366f1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:800, letterSpacing:'0.12em', marginTop:3 }}>HR PANEL</div>
                        </div>
                    </div>
                    {/* HR identity pill */}
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.5rem 0.75rem', borderRadius:'0.75rem', background:'rgba(168,85,247,0.12)', border:'1px solid rgba(168,85,247,0.2)' }}>
                            <div style={{
                                width:28, height:28, borderRadius:'50%', flexShrink:0,
                                background: isJuniorHR ? 'linear-gradient(135deg,#f59e0b,#f97316)' : 'linear-gradient(135deg,#10b981,#3b82f6)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:'0.65rem', fontWeight:800, color:'#fff',
                                boxShadow: isJuniorHR ? '0 2px 8px rgba(245,158,11,0.4)' : '0 2px 8px rgba(16,185,129,0.4)',
                            }}>
                                {(user?.username || 'HR')[0].toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#e9d5ff' }}>{user?.username}</div>
                                <div style={{ fontSize:'0.6rem', color: isJuniorHR ? '#fcd34d' : '#6ee7b7', fontWeight:600 }}>{hrLabel}</div>
                            </div>
                        </div>
                        {isJuniorHR && (
                            <div style={{ padding:'0.3rem 0.625rem', borderRadius:'0.5rem', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                                <Info size={11} color="#fcd34d" />
                                <span style={{ fontSize:'0.62rem', color:'#fcd34d', fontWeight:600 }}>Viewing your data only</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex:1, padding:'1rem 0.875rem', display:'flex', flexDirection:'column', gap:'0.2rem', position:'relative' }}>
                    {navTabs.map(t => {
                        const active = activeTab === t.id;
                        return (
                            <button key={t.id} className="hr-nav-btn" onClick={() => setActiveTab(t.id)} style={{
                                display:'flex', alignItems:'center', gap:'0.75rem',
                                padding:'0.75rem 1rem', borderRadius:'0.75rem', border:'none',
                                fontSize:'0.875rem', fontWeight:600, cursor:'pointer', width:'100%', textAlign:'left',
                                background: active ? 'rgba(168,85,247,0.18)' : 'transparent',
                                color: active ? '#e9d5ff' : 'rgba(255,255,255,0.45)',
                                boxShadow: active ? 'inset 0 0 0 1px rgba(168,85,247,0.35)' : 'none',
                                transition:'all 0.15s',
                            }}>
                                <span style={{ color: active ? '#c084fc' : 'rgba(255,255,255,0.3)', display:'flex' }}>{t.icon}</span>
                                {t.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div style={{ padding:'1rem 0.875rem', borderTop:'1px solid rgba(168,85,247,0.12)', display:'flex', flexDirection:'column', gap:'0.5rem', position:'relative' }}>
                    <button onClick={() => { fetchTests(); fetchCandidates(); fetchResults(); fetchInterviews(); fetchJobs(); }} style={{
                        display:'flex', alignItems:'center', gap:'0.625rem',
                        padding:'0.625rem 1rem', background:'rgba(255,255,255,0.05)',
                        border:'1px solid rgba(255,255,255,0.08)', borderRadius:'0.75rem',
                        color:'rgba(255,255,255,0.45)', fontSize:'0.82rem', fontWeight:600, cursor:'pointer', width:'100%',
                    }}>
                        <RefreshCw size={13} /> Refresh
                    </button>
                    <button onClick={logout} style={{
                        display:'flex', alignItems:'center', gap:'0.625rem',
                        padding:'0.625rem 1rem', background:'rgba(239,68,68,0.1)',
                        border:'1px solid rgba(239,68,68,0.2)', borderRadius:'0.75rem',
                        color:'#fca5a5', fontSize:'0.82rem', fontWeight:600, cursor:'pointer', width:'100%',
                    }}>
                        <LogOut size={13} /> Logout
                    </button>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <div className="dash-main" style={{ marginLeft: 230, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Top bar */}
                <header style={{
                    height: 60, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(168,85,247,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 1.25rem 0 1.25rem', position: 'sticky', top: 0, zIndex: 100,
                    boxShadow: '0 1px 0 rgba(168,85,247,0.06)',
                }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <button onClick={() => setSidebarOpen(o => !o)} style={{ display:'none', padding:'0.4rem', background:'transparent', border:'1px solid #ede9fe', borderRadius:'0.5rem', cursor:'pointer', color:'#a855f7' }} className="dash-hamburger">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>{pageTitle}</h1>
                        <p style={{ margin: 0, fontSize: '0.71rem', color: '#6b7280', fontWeight: 500 }}>
                            {user?.full_name || user?.username} &middot; <span style={{ color: isJuniorHR ? '#f59e0b' : '#10b981', fontWeight: 700 }}>{hrLabel}</span>
                        </p>
                    </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {activeTab === 'tests' && (
                            <button onClick={() => setShowCreateTest(true)} className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
                                <Plus size={15} /> Create Test
                            </button>
                        )}
                        {activeTab === 'users' && (
                            <button onClick={() => setShowCreateUser(true)} className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
                                <Plus size={15} /> Add Candidate
                            </button>
                        )}
                    </div>
                </header>

                {/* Content */}
                <div style={{ flex: 1, padding: '1.25rem 1.5rem', overflowY: 'auto', background: '#f3f0ff' }}>

                {/* ---- OVERVIEW TAB ---- */}
                {activeTab === 'overview' && (() => {
                    const today = new Date(); today.setHours(0,0,0,0);
                    const isToday = d => { if (!d) return false; const x = new Date(d); x.setHours(0,0,0,0); return x.getTime() === today.getTime(); };
                    const inRange = (d, from, to) => {
                        if (!d) return false;
                        const dt = new Date(d);
                        if (from && dt < new Date(from)) return false;
                        if (to && dt > new Date(to + 'T23:59:59')) return false;
                        return true;
                    };

                    const dateFrom = ovDateFrom;
                    const dateTo = ovDateTo;
                    const searchQ = ovSearchQ;
                    const activeSection = ovActiveSection;
                    const setActiveSection = setOvActiveSection;

                    const hasFilter = dateFrom || dateTo;
                    const filteredResults = results.filter(r => {
                        const matchDate = !hasFilter ? true : inRange(r.submitted_at, dateFrom, dateTo);
                        const q = searchQ.toLowerCase();
                        const matchSearch = !q || (r.candidate_name||'').toLowerCase().includes(q) || (r.candidate_username||'').toLowerCase().includes(q) || (r.test_title||'').toLowerCase().includes(q);
                        return matchDate && matchSearch;
                    });

                    const todayCandidates = candidates.filter(c => isToday(c.created_at)).length;
                    const totalCandidates = candidates.length;
                    const activeJobs = jobs.filter(j => j.status === 'open').length;
                    const pendingJobs = jobs.filter(j => j.status === 'on_hold').length;
                    const interviewsToday = interviews.filter(i => isToday(i.interview_date)).length;
                    const rejectedInv = interviews.filter(i => i.status === 'rejected').length;
                    const selectedInv = interviews.filter(i => i.status === 'shortlisted').length;
                    const totalResults = filteredResults.length;
                    const passedList = filteredResults.filter(r => r.passed);
                    const failedList = filteredResults.filter(r => !r.passed);
                    const passRate = totalResults > 0 ? Math.round((passedList.length / totalResults) * 100) : 0;

                    // Group filtered results by date for timeline
                    const byDate = filteredResults.reduce((acc, r) => {
                        const d = r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown';
                        if (!acc[d]) acc[d] = [];
                        acc[d].push(r);
                        return acc;
                    }, {});

                    const sectionList = activeSection === 'passed' ? passedList : activeSection === 'failed' ? failedList : null;

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Greeting */}
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                                    Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.full_name?.split(' ')[0] || user?.username} 👋
                                </h2>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>

                            {/* Top widgets */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                {[
                                    { label: 'Candidates Today', value: todayCandidates, sub: `${totalCandidates} total`, icon: <Users size={20}/>, color: '#a855f7', bg: '#faf5ff', border: '#ede9fe' },
                                    { label: 'Active Jobs',       value: activeJobs,      sub: `${pendingJobs} on hold`, icon: <Briefcase size={20}/>, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
                                    { label: 'Interviews Today',  value: interviewsToday, sub: `${interviews.length} total`, icon: <CalendarDays size={20}/>, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
                                    { label: 'Selected',          value: selectedInv,     sub: 'Shortlisted', icon: <UserCheck size={20}/>, color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
                                    { label: 'Rejected',          value: rejectedInv,     sub: 'In interviews', icon: <UserX size={20}/>, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
                                    { label: 'Total Tests',       value: tests.length,    sub: `${results.length} submissions`, icon: <FilePlus size={20}/>, color: '#a855f7', bg: '#faf5ff', border: '#ede9fe' },
                                ].map((w, i) => (
                                    <div key={i} style={{ background: '#fff', borderRadius: '0.875rem', border: `1.5px solid ${w.border}`, padding: '0.9rem 1rem', boxShadow: '0 2px 10px rgba(109,40,217,0.06)', display: 'flex', flexDirection: 'column', gap: '0.35rem', transition: 'transform 0.15s', cursor: 'default' }}
                                        onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                                        onMouseLeave={e => e.currentTarget.style.transform=''}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.3 }}>{w.label}</div>
                                            <div style={{ color: w.color, opacity: 0.8 }}>{w.icon}</div>
                                        </div>
                                        <div style={{ fontSize: '2rem', fontWeight: 900, color: w.color, lineHeight: 1 }}>{w.value}</div>
                                        <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{w.sub}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Passed / Failed clickable summary cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <button onClick={() => setActiveSection(activeSection === 'passed' ? null : 'passed')} style={{
                                    background: activeSection === 'passed' ? '#f0fdf4' : '#fff', borderRadius: '0.875rem',
                                    border: `2px solid ${activeSection === 'passed' ? '#10b981' : '#bbf7d0'}`,
                                    padding: '1rem 1.25rem', cursor: 'pointer', textAlign: 'left',
                                    boxShadow: '0 2px 10px rgba(16,185,129,0.08)', transition: 'all 0.15s',
                                }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                                        ✅ Passed {hasFilter ? '(filtered)' : 'Total'}
                                    </div>
                                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>{passedList.length}</div>
                                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.25rem' }}>{passRate}% pass rate · Click to view</div>
                                </button>
                                <button onClick={() => setActiveSection(activeSection === 'failed' ? null : 'failed')} style={{
                                    background: activeSection === 'failed' ? '#fef2f2' : '#fff', borderRadius: '0.875rem',
                                    border: `2px solid ${activeSection === 'failed' ? '#ef4444' : '#fecaca'}`,
                                    padding: '1rem 1.25rem', cursor: 'pointer', textAlign: 'left',
                                    boxShadow: '0 2px 10px rgba(239,68,68,0.08)', transition: 'all 0.15s',
                                }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                                        ❌ Failed {hasFilter ? '(filtered)' : 'Total'}
                                    </div>
                                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>{failedList.length}</div>
                                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.25rem' }}>{100 - passRate}% fail rate · Click to view</div>
                                </button>
                            </div>

                            {/* Expanded passed/failed list */}
                            {sectionList && (
                                <div style={{ background: '#fff', borderRadius: '0.875rem', border: `1.5px solid ${activeSection === 'passed' ? '#bbf7d0' : '#fecaca'}`, overflow: 'hidden', boxShadow: '0 2px 10px rgba(109,40,217,0.06)' }}>
                                    <div style={{ background: activeSection === 'passed' ? '#f0fdf4' : '#fef2f2', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${activeSection === 'passed' ? '#bbf7d0' : '#fecaca'}` }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: activeSection === 'passed' ? '#15803d' : '#b91c1c' }}>
                                            {activeSection === 'passed' ? '✅' : '❌'} {sectionList.length} Candidate{sectionList.length !== 1 ? 's' : ''} {activeSection === 'passed' ? 'Passed' : 'Failed'}{hasFilter ? ' (filtered period)' : ''}
                                        </span>
                                        <button onClick={() => setActiveSection(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1rem', lineHeight: 1 }}>×</button>
                                    </div>
                                    {sectionList.length === 0
                                        ? <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.82rem' }}>No candidates {activeSection}</div>
                                        : sectionList.map((r, i) => (
                                            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', borderBottom: i < sectionList.length - 1 ? '1px solid #f5f3ff' : 'none' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>
                                                    {(r.candidate_name || r.candidate_username || '?')[0].toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.candidate_name || r.candidate_username}</div>
                                                    <div style={{ fontSize: '0.68rem', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.test_title}</div>
                                                </div>
                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: activeSection === 'passed' ? '#10b981' : '#ef4444' }}>{Math.round(r.accuracy || 0)}%</div>
                                                    <div style={{ fontSize: '0.65rem', color: '#9ca3af' }}>{r.correct_answers}/{r.total_questions}</div>
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: '#c4b5fd', flexShrink: 0, textAlign: 'right', minWidth: 55 }}>
                                                    {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}

                            {/* Date filter + Search */}
                            <div style={{ background: '#fff', borderRadius: '0.875rem', border: '1.5px solid #ede9fe', padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 2px 8px rgba(109,40,217,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1 1 180px', border: '1.5px solid #ede9fe', borderRadius: '0.5rem', padding: '0.4rem 0.7rem', background: '#faf5ff' }}>
                                    <RefreshCw size={13} color="#a855f7" />
                                    <input value={ovSearchQ} onChange={e => setOvSearchQ(e.target.value)} placeholder="Search candidate or test…"
                                        style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.8rem', color: '#0f172a', width: '100%' }} />
                                    {ovSearchQ && <button onClick={() => setOvSearchQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, fontSize: '0.9rem' }}>×</button>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <CalendarDays size={13} color="#a855f7" />
                                    <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>From</span>
                                    <input type="date" value={ovDateFrom} onChange={e => setOvDateFrom(e.target.value)}
                                        style={{ border: '1.5px solid #ede9fe', borderRadius: '0.5rem', padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: '#0f172a', background: '#faf5ff', outline: 'none', cursor: 'pointer' }} />
                                    <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>To</span>
                                    <input type="date" value={ovDateTo} onChange={e => setOvDateTo(e.target.value)}
                                        style={{ border: '1.5px solid #ede9fe', borderRadius: '0.5rem', padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: '#0f172a', background: '#faf5ff', outline: 'none', cursor: 'pointer' }} />
                                    {hasFilter && <button onClick={() => { setOvDateFrom(''); setOvDateTo(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '0.75rem' }}>Clear</button>}
                                </div>
                                <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#9ca3af' }}>{filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}</div>
                            </div>

                            {/* Timeline by date */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                {Object.keys(byDate).length === 0
                                    ? <div style={{ background: '#fff', borderRadius: '0.875rem', border: '1.5px solid #ede9fe', padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                                        No submissions{hasFilter || searchQ ? ' for the selected filters' : ' yet'}
                                      </div>
                                    : Object.entries(byDate).map(([date, subs]) => (
                                        <div key={date} style={{ background: '#fff', borderRadius: '0.875rem', border: '1.5px solid #ede9fe', overflow: 'hidden', boxShadow: '0 2px 8px rgba(109,40,217,0.05)' }}>
                                            <div style={{ background: '#faf5ff', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ede9fe' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <CalendarDays size={12} color="#a855f7" />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6d28d9' }}>{date}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.68rem' }}>
                                                    <span style={{ color: '#10b981', fontWeight: 700 }}>✓ {subs.filter(s => s.passed).length} passed</span>
                                                    <span style={{ color: '#ef4444', fontWeight: 700 }}>✗ {subs.filter(s => !s.passed).length} failed</span>
                                                </div>
                                            </div>
                                            {subs.map((r, i) => (
                                                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.6rem 1rem', borderBottom: i < subs.length - 1 ? '1px solid #f5f3ff' : 'none' }}>
                                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: r.passed ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${r.passed ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        {r.passed ? <CheckCircle size={14} color="#10b981" /> : <UserX size={14} color="#ef4444" />}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.candidate_name || r.candidate_username}</div>
                                                        <div style={{ fontSize: '0.68rem', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.test_title}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: r.passed ? '#10b981' : '#ef4444' }}>{Math.round(r.accuracy || 0)}%</div>
                                                        <div style={{ fontSize: '0.63rem', color: '#9ca3af' }}>{r.correct_answers}/{r.total_questions}</div>
                                                    </div>
                                                    <div style={{ fontSize: '0.63rem', color: '#c4b5fd', flexShrink: 0, minWidth: 48, textAlign: 'right' }}>
                                                        {r.submitted_at ? new Date(r.submitted_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    );
                })()}

                {/* ---- TESTS TAB ---- */}
                {activeTab === 'tests' && (
                    loadingTests
                        ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><Spinner /></div>
                        : tests.length === 0
                            ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No tests yet. Create one above.</div>
                            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
                                {tests.map(renderTestCard)}
                            </div>
                )}

                {/* ---- CANDIDATES TAB ---- */}
                {activeTab === 'users' && (
                    loadingCandidates
                        ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><Spinner /></div>
                        : candidates.length === 0
                            ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No candidates registered.</div>
                            : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {candidates.map(c => {
                                    const cAssignments = assignments.filter(a => a.user_id === c.id);
                                    return (
                                        <div key={c.id} className="glass-card" style={{ padding: '0.75rem 1rem' }}>
                                            {/* Top row: info + actions */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                {/* Avatar */}
                                                <div style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>
                                                    {(c.full_name || c.username).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                {/* Name / ID */}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                        {c.full_name || c.username}
                                                        {!c.is_active && <span style={{ fontSize: '0.68rem', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: '4px', padding: '0 4px' }}>Inactive</span>}
                                                        {c.experience_level && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '20px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontWeight: 600 }}>{c.experience_level}</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
                                                        <span>@{c.username}</span>
                                                        {c.email && <span>· {c.email}</span>}
                                                        {c.college_or_company && <span>· {c.college_or_company}</span>}
                                                    </div>
                                                    {c.skills && (
                                                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                                                            {c.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5).map(s => (
                                                                <span key={s} style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{s}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Actions */}
                                                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                                    <button onClick={() => openAssignModal(c)} className="btn" title="Assign test" style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)', border: '1px solid var(--primary)', background: 'rgba(99,102,241,0.07)' }}>
                                                        <ClipboardList size={13} /> Assign Test
                                                    </button>
                                                    <button onClick={() => { setEditingUser(c); setEditUserForm({ full_name: c.full_name || '', password: '', email: c.email || '', phone: c.phone || '', college_or_company: c.college_or_company || '', experience_level: c.experience_level || 'Fresher', skills: c.skills || '' }); }} className="btn btn-icon" title="Edit" style={{ color: 'var(--primary)' }}>
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button onClick={() => doDeleteCandidate(c.id)} className="btn btn-icon" title="Delete" style={{ color: 'var(--error)' }}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Assignments list */}
                                            {cAssignments.length > 0 && (
                                                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                    <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assigned Tests</div>
                                                    {cAssignments.map(a => {
                                                        const now = new Date();
                                                        const start = a.login_start ? new Date(a.login_start) : null;
                                                        const end = a.login_end ? new Date(a.login_end) : null;
                                                        const upcoming = start && start > now;
                                                        const expired = end && end < now;
                                                        const statusColor = expired ? 'var(--error)' : upcoming ? 'var(--warning)' : 'var(--success)';
                                                        const statusLabel = expired ? 'Expired' : upcoming ? 'Upcoming' : 'Active';
                                                        return (
                                                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.45rem 0.65rem', borderRadius: '7px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                                                                <FileText size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.test_title}</div>
                                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                                        {start && <span><Calendar size={10} style={{ display: 'inline', marginRight: 2 }} />{start.toLocaleString()}</span>}
                                                                        {end && <span>→ {end.toLocaleString()}</span>}
                                                                        {!start && !end && <span>No time restriction</span>}
                                                                    </div>
                                                                </div>
                                                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: statusColor, flexShrink: 0 }}>{statusLabel}</span>
                                                                <button onClick={() => handleDeleteAssignment(a.id)} className="btn btn-icon" title="Remove assignment" style={{ color: 'var(--error)', opacity: 0.7, flexShrink: 0, padding: '0.15rem' }}>
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                )}

                {/* ---- RESULTS TAB ---- */}
                {activeTab === 'results' && (
                    loadingResults
                        ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}><Spinner /></div>
                        : results.length === 0
                            ? <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No submissions yet.</div>
                            : <ResultCards
                                results={results}
                                onDelete={askDeleteResult}
                                expandedCandidate={expandedCandidate}
                                setExpandedCandidate={setExpandedCandidate}
                            />
                )}

                {/* ---- INTERVIEWS TAB ---- */}
                {activeTab === 'interviews' && (() => {
                    const statusConfig = {
                        pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={13} /> },
                        attended: { label: 'Attended', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <UserCheck size={13} /> },
                        absent: { label: 'Absent', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <UserX size={13} /> },
                        rescheduled: { label: 'Rescheduled', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: <RotateCcw size={13} /> },
                        shortlisted: { label: 'Shortlisted', color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: <CheckCircle size={13} /> },
                        rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: <X size={13} /> },
                    };
                    const fmtIv = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

                    return (
                        <div>
                            {/* Toolbar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {interviews.length} interview{interviews.length !== 1 ? 's' : ''} scheduled
                                </div>
                                <button className="btn btn-primary" onClick={() => openInterviewForm()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                                    <Plus size={16} /> Schedule Interview
                                </button>
                            </div>

                            {loadingInterviews ? (
                                <div style={{ textAlign: 'center', padding: '3rem' }}><Spinner /></div>
                            ) : interviews.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                    <CalendarDays size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                    <p>No interviews scheduled yet. Click "Schedule Interview" to add one.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {interviews.map(iv => {
                                        const sc = statusConfig[iv.status] || statusConfig.pending;
                                        return (
                                            <div key={iv.id} className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>

                                                {/* Date block */}
                                                <div style={{ minWidth: '68px', textAlign: 'center', background: 'rgba(99,102,241,0.08)', borderRadius: '10px', padding: '0.5rem 0.4rem', flexShrink: 0 }}>
                                                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                                                        {new Date(iv.interview_date).getDate()}
                                                    </div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                        {new Date(iv.interview_date).toLocaleString('en-IN', { month: 'short' })}
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)', marginTop: '0.1rem' }}>
                                                        {new Date(iv.interview_date).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div style={{ flex: 1, minWidth: '160px' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{iv.candidate_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{iv.candidate_username}</div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <Users size={12} /> Interviewer: <strong style={{ color: 'var(--text)' }}>{iv.interviewer_name}</strong>
                                                    </div>
                                                    {iv.notes && (
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                                                            {iv.notes}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Meeting URL */}
                                                {iv.meeting_url && (
                                                    <a href={iv.meeting_url} target="_blank" rel="noreferrer"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--primary)', textDecoration: 'none', background: 'rgba(99,102,241,0.08)', padding: '0.35rem 0.65rem', borderRadius: '6px', flexShrink: 0 }}>
                                                        <Video size={14} /> Join Meeting
                                                    </a>
                                                )}

                                                {/* Status dropdown */}
                                                <div style={{ flexShrink: 0 }}>
                                                    <select
                                                        value={iv.status}
                                                        onChange={e => handleStatusChange(iv, e.target.value)}
                                                        style={{ padding: '0.35rem 0.6rem', borderRadius: '8px', border: `1.5px solid ${sc.color}`, background: sc.bg, color: sc.color, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', outline: 'none' }}
                                                    >
                                                        <option value="pending">⏳ Pending</option>
                                                        <option value="attended">✅ Attended</option>
                                                        <option value="shortlisted">🏆 Shortlisted</option>
                                                        <option value="rejected">👎 Rejected</option>
                                                        <option value="absent">❌ Absent</option>
                                                        <option value="rescheduled">🔄 Rescheduled</option>
                                                    </select>
                                                </div>

                                                {/* Actions */}
                                                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                                    <button onClick={() => openInterviewForm(iv)} className="btn btn-icon" title="Edit" style={{ color: 'var(--primary)' }}><Pencil size={15} /></button>
                                                    <button onClick={() => handleDeleteInterview(iv)} className="btn btn-icon" title="Delete" style={{ color: 'var(--error)' }}><Trash2 size={15} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* ---- JOB OPENINGS TAB ---- */}
                {activeTab === 'jobs' && (() => {
                    const statusBadge = {
                        open: { label: 'Open', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
                        closed: { label: 'Closed', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                        on_hold: { label: 'On Hold', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                    };
                    const openCount = jobs.filter(j => j.status === 'open').length;

                    return (
                        <div>
                            {/* Toolbar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <span style={{ color: '#10b981', fontWeight: 700 }}>{openCount}</span> open &nbsp;·&nbsp; {jobs.length} total
                                </div>
                                <button className="btn btn-primary" onClick={() => openJobForm()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                                    <Plus size={16} /> Post New Job
                                </button>
                            </div>

                            {loadingJobs ? (
                                <div style={{ textAlign: 'center', padding: '3rem' }}><Spinner /></div>
                            ) : jobs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                    <Briefcase size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                    <p>No job openings yet. Click "Post New Job" to add one.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    {jobs.map(job => {
                                        const sb = statusBadge[job.status] || statusBadge.open;
                                        const isExpanded = expandedJob === job.id;
                                        const skills = job.skills_required ? job.skills_required.split(',').map(s => s.trim()).filter(Boolean) : [];

                                        return (
                                            <div key={job.id} className="glass-card" style={{ overflow: 'hidden' }}>
                                                {/* Card header row */}
                                                <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>

                                                    {/* Icon */}
                                                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Briefcase size={20} color="var(--primary)" />
                                                    </div>

                                                    {/* Title + meta */}
                                                    <div style={{ flex: 1, minWidth: '160px' }}>
                                                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{job.title}</div>
                                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                                                            {job.department && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Building2 size={11} /> {job.department}</span>}
                                                            {job.location && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><MapPin size={11} /> {job.location}</span>}
                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><GraduationCap size={11} /> {job.experience_level}</span>
                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{job.job_type}</span>
                                                            {job.salary_range && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><DollarSign size={11} /> {job.salary_range}</span>}
                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{job.vacancies} vacancy{job.vacancies !== 1 ? 'ies' : ''}</span>
                                                        </div>
                                                    </div>

                                                    {/* Skills tags */}
                                                    {skills.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxWidth: '220px' }}>
                                                            {skills.slice(0, 4).map(s => (
                                                                <span key={s} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '20px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontWeight: 600 }}>{s}</span>
                                                            ))}
                                                            {skills.length > 4 && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{skills.length - 4}</span>}
                                                        </div>
                                                    )}

                                                    {/* Status badge */}
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.7rem', borderRadius: '20px', background: sb.bg, color: sb.color, flexShrink: 0 }}>
                                                        {sb.label}
                                                    </span>

                                                    {/* Actions */}
                                                    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                                                        <button onClick={() => setExpandedJob(isExpanded ? null : job.id)} className="btn btn-icon" title="View JD" style={{ color: 'var(--text-muted)' }}>
                                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                        <button onClick={() => handleToggleJobStatus(job)} className="btn btn-icon" title={job.status === 'open' ? 'Close job' : 'Reopen job'} style={{ color: job.status === 'open' ? '#ef4444' : '#10b981' }}>
                                                            {job.status === 'open' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                                        </button>
                                                        <button onClick={() => openJobForm(job)} className="btn btn-icon" title="Edit" style={{ color: 'var(--primary)' }}><Pencil size={15} /></button>
                                                        <button onClick={() => handleDeleteJob(job)} className="btn btn-icon" title="Delete" style={{ color: 'var(--error)' }}><Trash2 size={15} /></button>
                                                    </div>
                                                </div>

                                                {/* Expanded JD */}
                                                {isExpanded && (
                                                    <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                                                        {job.jd_description && (
                                                            <div>
                                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Job Description</div>
                                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{job.jd_description}</p>
                                                            </div>
                                                        )}
                                                        {job.responsibilities && (
                                                            <div>
                                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Responsibilities</div>
                                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{job.responsibilities}</p>
                                                            </div>
                                                        )}
                                                        {job.qualifications && (
                                                            <div>
                                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Qualifications</div>
                                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{job.qualifications}</p>
                                                            </div>
                                                        )}
                                                        {skills.length > 0 && (
                                                            <div>
                                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Required Skills</div>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                                    {skills.map(s => (
                                                                        <span key={s} style={{ fontSize: '0.78rem', padding: '0.2rem 0.65rem', borderRadius: '20px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontWeight: 600 }}>{s}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* ---- QUESTION BANK TAB ---- */}
                {activeTab === 'qbank' && (() => {
                    const C = { primary: '#6366f1', success: '#10b981', warning: '#f59e0b', error: '#ef4444' };
                    const optionColors = { A: '#6366f1', B: '#8b5cf6', C: '#10b981', D: '#f59e0b' };

                    return (
                        <div>
                            {/* Test selector + question count */}
                            <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>Select Test</label>
                                    <select
                                        className="input-field"
                                        value={qbTestId}
                                        onChange={e => handleQbTestChange(e.target.value)}
                                        style={{ maxWidth: 340 }}
                                    >
                                        <option value="">— Choose a test —</option>
                                        {tests.map(t => (
                                            <option key={t.id} value={t.id}>{t.title} ({t.questions?.length || 0} Q)</option>
                                        ))}
                                    </select>
                                </div>
                                {qbTestId && (
                                    <div style={{ fontSize: '0.82rem', color: '#6b7280', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, color: C.primary, fontSize: '1.1rem' }}>{qbQuestions.length}</span>
                                        <span>questions saved</span>
                                    </div>
                                )}
                            </div>

                            {/* Sub-tab pills */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                {[
                                    { id: 'manual', label: '✏️ Manual Entry' },
                                    { id: 'ai',     label: '✨ AI Generator' },
                                    { id: 'pdf',    label: '📄 Upload PDF' },
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setQbSubTab(t.id)}
                                        style={{
                                            padding: '0.45rem 1rem', borderRadius: '2rem', fontSize: '0.82rem', fontWeight: 600,
                                            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                                            background: qbSubTab === t.id ? C.primary : '#fff',
                                            color: qbSubTab === t.id ? '#fff' : '#374151',
                                            boxShadow: qbSubTab === t.id ? '0 4px 12px rgba(99,102,241,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
                                        }}
                                    >{t.label}</button>
                                ))}
                            </div>

                            {/* ── Manual Entry ── */}
                            {qbSubTab === 'manual' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="glass-card" style={{ padding: '1.25rem' }}>
                                        <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700 }}>Add Question Manually</h3>
                                        <form onSubmit={handleManualSave}>
                                            <Field label="Question Text">
                                                <textarea
                                                    className="input-field" required
                                                    style={{ height: 80, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.82rem' }}
                                                    placeholder="Enter your question here…"
                                                    value={manualForm.question_text}
                                                    onChange={e => setManualForm({ ...manualForm, question_text: e.target.value })}
                                                />
                                            </Field>
                                            {['a', 'b', 'c', 'd'].map(opt => (
                                                <Field key={opt} label={`Option ${opt.toUpperCase()}`}>
                                                    <input
                                                        className="input-field" required
                                                        style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                                                        placeholder={`Option ${opt.toUpperCase()}`}
                                                        value={manualForm[`option_${opt}`]}
                                                        onChange={e => setManualForm({ ...manualForm, [`option_${opt}`]: e.target.value })}
                                                    />
                                                </Field>
                                            ))}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                <Field label="Correct Answer">
                                                    <select className="input-field" value={manualForm.correct_option} onChange={e => setManualForm({ ...manualForm, correct_option: e.target.value })}>
                                                        {['A', 'B', 'C', 'D'].map(o => <option key={o}>{o}</option>)}
                                                    </select>
                                                </Field>
                                                <Field label="Marks">
                                                    <input type="number" step="0.5" min="0.5" className="input-field" value={manualForm.marks} onChange={e => setManualForm({ ...manualForm, marks: +e.target.value })} />
                                                </Field>
                                            </div>
                                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={!qbTestId || manualSaving}>
                                                {manualSaving ? <Spinner /> : <><Plus size={14} /> Save Question</>}
                                            </button>
                                        </form>
                                    </div>

                                    {/* Saved questions list */}
                                    <div className="glass-card" style={{ padding: '1.25rem', maxHeight: 560, display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700 }}>
                                            Saved Questions {qbTestId && <span style={{ color: C.primary }}>({qbQuestions.length})</span>}
                                        </h3>
                                        {!qbTestId ? (
                                            <p style={{ color: '#9ca3af', fontSize: '0.82rem' }}>Select a test to view its questions.</p>
                                        ) : qbLoading ? (
                                            <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner /></div>
                                        ) : qbQuestions.length === 0 ? (
                                            <p style={{ color: '#9ca3af', fontSize: '0.82rem' }}>No questions yet. Add one on the left.</p>
                                        ) : (
                                            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                {qbQuestions.map((q, i) => (
                                                    <div key={q.id} style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '0.7rem 0.9rem', border: '1px solid #e5e7eb', position: 'relative' }}>
                                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem', fontFamily: 'monospace' }}>
                                                            <span style={{ color: '#9ca3af', marginRight: '0.4rem' }}>Q{i + 1}.</span>{q.question_text}
                                                        </div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                                            {['a', 'b', 'c', 'd'].map(o => {
                                                                const letter = o.toUpperCase();
                                                                const isCorrect = q.correct_option === letter;
                                                                return (
                                                                    <span key={o} style={{
                                                                        fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontFamily: 'monospace',
                                                                        background: isCorrect ? 'rgba(16,185,129,0.15)' : '#fff',
                                                                        color: isCorrect ? '#059669' : '#6b7280',
                                                                        border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.4)' : '#e5e7eb'}`,
                                                                        fontWeight: isCorrect ? 700 : 400,
                                                                    }}>
                                                                        {letter}. {q[`option_${o}`]}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteQbQuestion(q.id)}
                                                            style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.6 }}
                                                            title="Delete question"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── AI Generator ── */}
                            {qbSubTab === 'ai' && (
                                <div>
                                    <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                                        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700 }}>AI Question Generator</h3>
                                        <form onSubmit={handleAiGenerate} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                            <div style={{ flex: 2, minWidth: 200 }}>
                                                <Field label="Topic / Subject">
                                                    <input
                                                        className="input-field" required
                                                        placeholder="e.g. Java OOP, SQL Joins, React Hooks"
                                                        value={aiForm.topic}
                                                        onChange={e => setAiForm({ ...aiForm, topic: e.target.value })}
                                                    />
                                                </Field>
                                            </div>
                                            <div style={{ width: 90 }}>
                                                <Field label="Question Count">
                                                    <input type="number" min="1" className="input-field" value={aiForm.count} onChange={e => setAiForm({ ...aiForm, count: +e.target.value })} />
                                                </Field>
                                            </div>
                                            <div style={{ width: 110 }}>
                                                <Field label="Difficulty">
                                                    <select className="input-field" value={aiForm.difficulty} onChange={e => setAiForm({ ...aiForm, difficulty: e.target.value })}>
                                                        {['easy', 'medium', 'hard'].map(d => <option key={d}>{d}</option>)}
                                                    </select>
                                                </Field>
                                            </div>
                                            <div style={{ paddingBottom: '0.85rem' }}>
                                                <button type="submit" className="btn btn-primary" disabled={!qbTestId || aiGenerating}>
                                                    {aiGenerating ? <><Spinner /> Generating…</> : <><Award size={14} /> Generate</>}
                                                </button>
                                            </div>
                                        </form>
                                        {!qbTestId && <p style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: '0.25rem' }}>⚠ Select a test above first.</p>}
                                    </div>

                                    {/* AI Preview */}
                                    {aiPreview.length > 0 && (
                                        <div className="glass-card" style={{ padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                                                    Review Questions — <span style={{ color: C.success }}>{aiPreview.filter(q => q._approved).length} approved</span> / {aiPreview.length} total
                                                </h3>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={() => setAiPreview(aiPreview.map(q => ({ ...q, _approved: true })))}>Approve All</button>
                                                    <button className="btn btn-primary" onClick={handleAiSave} disabled={aiSaving || !aiPreview.some(q => q._approved)}>
                                                        {aiSaving ? <Spinner /> : <><CheckCircle size={13} /> Save Approved</>}
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 500, overflowY: 'auto' }}>
                                                {aiPreview.map((q, i) => (
                                                    <div key={i} style={{
                                                        borderRadius: '0.625rem', border: `2px solid ${q._approved ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.3)'}`,
                                                        background: q._approved ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)',
                                                        padding: '0.875rem 1rem',
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                                            <div style={{ fontWeight: 700, fontSize: '0.85rem', fontFamily: 'monospace', flex: 1, color: '#111827' }}>
                                                                <span style={{ color: '#9ca3af', marginRight: '0.4rem' }}>Q{i + 1}.</span>{q.question_text}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                                                                <button
                                                                    onClick={() => setAiPreview(aiPreview.map((x, j) => j === i ? { ...x, _approved: !x._approved } : x))}
                                                                    style={{
                                                                        padding: '0.25rem 0.6rem', borderRadius: '0.375rem', border: 'none', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                                                                        background: q._approved ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                                                        color: q._approved ? '#059669' : '#dc2626',
                                                                    }}
                                                                >
                                                                    {q._approved ? '✓ Approved' : '✗ Rejected'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                                                            {['a', 'b', 'c', 'd'].map(o => {
                                                                const letter = o.toUpperCase();
                                                                const isCorrect = q.correct_option === letter;
                                                                return (
                                                                    <div key={o} style={{
                                                                        padding: '0.3rem 0.6rem', borderRadius: '0.375rem', fontSize: '0.78rem', fontFamily: 'monospace',
                                                                        background: isCorrect ? 'rgba(16,185,129,0.12)' : '#f9fafb',
                                                                        border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.4)' : '#e5e7eb'}`,
                                                                        color: isCorrect ? '#059669' : '#374151',
                                                                        fontWeight: isCorrect ? 700 : 400,
                                                                    }}>
                                                                        <span style={{ opacity: 0.5, marginRight: '0.3rem' }}>{letter}.</span>{q[`option_${o}`]}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── PDF Upload ── */}
                            {qbSubTab === 'pdf' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Upload MCQ PDF</h3>
                                            <p style={{ fontSize: '0.76rem', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                                                Upload a PDF and questions will be automatically extracted. Follow the format guide below.
                                            </p>
                                        </div>

                                        {/* Format example */}
                                        <div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Required Format</div>
                                            <pre style={{ background: '#faf5ff', borderRadius: '0.625rem', padding: '0.75rem', fontSize: '0.71rem', color: '#374151', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.75, border: '1px solid #ede9fe', fontFamily: 'monospace' }}>
{`1. What does JVM stand for?
A) Java Virtual Machine
B) Java Visual Mode
C) Just Virtual Module
D) Java Version Manager
Answer: A

2. Which keyword creates an object?
A) class
B) new
C) this
D) void
Answer: B`}
                                            </pre>
                                        </div>

                                        {/* Rules */}
                                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.625rem', padding: '0.75rem' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', marginBottom: '0.4rem' }}>✅ Requirements</div>
                                            {[
                                                'Each question must start with a number — 1. 2. 3. or Q1. Q2.',
                                                'All four options A) B) C) D) are required per question',
                                                'Every question must end with an answer line — Answer: A (or B / C / D)',
                                                'Questions and options spanning multiple pages are supported',
                                            ].map((r, i) => (
                                                <div key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.73rem', color: '#15803d', marginBottom: i < 3 ? '0.25rem' : 0, lineHeight: 1.4 }}>
                                                    <span style={{ flexShrink: 0 }}>✓</span><span>{r}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Don'ts */}
                                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.625rem', padding: '0.75rem' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b91c1c', marginBottom: '0.4rem' }}>❌ Common Issues to Avoid</div>
                                            {[
                                                'Missing "Answer:" line — questions without it will be skipped',
                                                'Fewer than 4 options — all of A, B, C, and D must be present',
                                                'Image or table-based questions — only plain text questions are supported',
                                                'Scanned / image PDFs — upload text-based PDFs created from Word or Google Docs',
                                            ].map((r, i) => (
                                                <div key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.73rem', color: '#991b1b', marginBottom: i < 3 ? '0.25rem' : 0, lineHeight: 1.4 }}>
                                                    <span style={{ flexShrink: 0 }}>✗</span><span>{r}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Result banner */}
                                        {qbPdfResult && (
                                            <div style={{
                                                borderRadius: '0.625rem', padding: '0.75rem 1rem',
                                                background: qbPdfResult.type === 'success' ? '#f0fdf4' : '#fef2f2',
                                                border: `1px solid ${qbPdfResult.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                                                display: 'flex', flexDirection: 'column', gap: '0.4rem',
                                            }}>
                                                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                                                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                                                        {qbPdfResult.type === 'success' ? '✅' : '❌'}
                                                    </span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: qbPdfResult.type === 'success' ? '#15803d' : '#b91c1c', marginBottom: '0.15rem' }}>
                                                            {qbPdfResult.type === 'success' ? 'Upload Successful' : 'PDF Rejected — Not Uploaded'}
                                                        </div>
                                                        {qbPdfResult.type === 'success' ? (
                                                            <div style={{ fontSize: '0.73rem', color: '#166534', lineHeight: 1.5 }}>{qbPdfResult.msg}</div>
                                                        ) : (
                                                            qbPdfResult.msg.split('\n').filter(Boolean).map((line, i) => (
                                                                <div key={i} style={{ fontSize: '0.73rem', color: '#991b1b', lineHeight: 1.6,
                                                                    fontWeight: line.startsWith('•') ? 400 : i === 0 ? 600 : 400,
                                                                    marginTop: line.startsWith('•') ? '0.1rem' : i === 0 ? 0 : '0.3rem',
                                                                }}>
                                                                    {line}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                    <button onClick={() => setQbPdfResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1rem', flexShrink: 0, lineHeight: 1 }}>×</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Upload button */}
                                        <div>
                                            <label style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                padding: '0.875rem', borderRadius: '0.625rem',
                                                border: `2px dashed ${qbTestId ? '#a855f7' : '#d1d5db'}`,
                                                background: qbTestId ? 'rgba(168,85,247,0.05)' : '#fafafa',
                                                cursor: qbTestId ? 'pointer' : 'not-allowed',
                                                color: qbTestId ? C.primary : '#9ca3af',
                                                fontWeight: 600, fontSize: '0.85rem',
                                                opacity: qbTestId ? 1 : 0.6,
                                                transition: 'all 0.2s',
                                            }}>
                                                {qbPdfUploading ? <><Spinner /> Extracting questions…</> : <><Upload size={16} /> Choose PDF to Upload</>}
                                                <input type="file" accept=".pdf" style={{ display: 'none' }} disabled={!qbTestId || qbPdfUploading} onChange={handleQbPdfUpload} />
                                            </label>
                                            {!qbTestId && <p style={{ fontSize: '0.73rem', color: '#f59e0b', margin: '0.4rem 0 0' }}>⚠ Please select a test above before uploading.</p>}
                                        </div>
                                    </div>

                                    <div className="glass-card" style={{ padding: '1.25rem', maxHeight: 480, display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700 }}>
                                            Existing Questions {qbTestId && <span style={{ color: C.primary }}>({qbQuestions.length})</span>}
                                        </h3>
                                        {!qbTestId ? (
                                            <p style={{ color: '#9ca3af', fontSize: '0.82rem' }}>Select a test to view questions.</p>
                                        ) : qbLoading ? (
                                            <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner /></div>
                                        ) : qbQuestions.length === 0 ? (
                                            <p style={{ color: '#9ca3af', fontSize: '0.82rem' }}>No questions yet.</p>
                                        ) : (
                                            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {qbQuestions.map((q, i) => (
                                                    <div key={q.id} style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '0.6rem 0.9rem', border: '1px solid #e5e7eb', position: 'relative' }}>
                                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.25rem', fontFamily: 'monospace', paddingRight: '1.5rem' }}>
                                                            <span style={{ color: '#9ca3af', marginRight: '0.3rem' }}>Q{i + 1}.</span>{q.question_text}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>Ans: {q.correct_option}</div>
                                                        <button onClick={() => handleDeleteQbQuestion(q.id)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.6 }}>
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

            </div>

            {/* ================================================================
                MODALS
            ================================================================ */}

            {/* Create Test */}
            {showCreateTest && (
                <Overlay onClose={() => setShowCreateTest(false)}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Plus size={20} color="var(--primary)" /> Define New Assessment</h2>
                            <button className="btn btn-icon" onClick={() => setShowCreateTest(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateTest}>
                            <Field label="Assessment Title">
                                <input className="input-field" value={newTest.title} onChange={e => setNewTest({ ...newTest, title: e.target.value })} placeholder="e.g. Java Developer MCQ" required />
                            </Field>
                            <Field label="Brief Description">
                                <textarea className="input-field" style={{ height: '56px', resize: 'vertical' }} value={newTest.description} onChange={e => setNewTest({ ...newTest, description: e.target.value })} placeholder="Scope of this assessment…" />
                            </Field>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Field label="Category">
                                    <select className="input-field" value={newTest.category} onChange={e => setNewTest({ ...newTest, category: e.target.value })}>
                                        {['Technical', 'Aptitude', 'HR Round'].map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </Field>
                                <Field label="Passing Score (%)">
                                    <input type="number" min="0" max="100" className="input-field" value={newTest.passing_score} onChange={e => setNewTest({ ...newTest, passing_score: +e.target.value })} />
                                </Field>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Field label="Duration (mins)">
                                    <input type="number" min="1" className="input-field" value={newTest.duration_minutes} onChange={e => setNewTest({ ...newTest, duration_minutes: +e.target.value })} required />
                                </Field>
                                <Field label="Time / Question (sec)">
                                    <input type="number" min="10" className="input-field" value={newTest.time_per_question_seconds} onChange={e => setNewTest({ ...newTest, time_per_question_seconds: +e.target.value })} required />
                                </Field>
                            </div>
                            <Field label="Question Limit (0 = all)">
                                <input type="number" min="0" className="input-field" value={newTest.total_questions_limit} onChange={e => setNewTest({ ...newTest, total_questions_limit: +e.target.value })} />
                            </Field>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowCreateTest(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                                    {submitting ? <Spinner /> : 'Publish Assessment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Overlay>
            )}

            {/* Edit Test */}
            {editingTest && (
                <Overlay onClose={() => setEditingTest(null)}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Edit2 size={18} color="var(--primary)" /> Edit Assessment</h2>
                            <button className="btn btn-icon" onClick={() => setEditingTest(null)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleUpdateTest}>
                            <Field label="Assessment Title">
                                <input className="input-field" value={editTestForm.title || ''} onChange={e => setEditTestForm({ ...editTestForm, title: e.target.value })} required />
                            </Field>
                            <Field label="Description">
                                <textarea className="input-field" style={{ height: '70px', resize: 'vertical' }} value={editTestForm.description || ''} onChange={e => setEditTestForm({ ...editTestForm, description: e.target.value })} />
                            </Field>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Field label="Category">
                                    <select className="input-field" value={editTestForm.category || 'Technical'} onChange={e => setEditTestForm({ ...editTestForm, category: e.target.value })}>
                                        {['Technical', 'Aptitude', 'HR Round'].map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </Field>
                                <Field label="Passing Score (%)">
                                    <input type="number" min="0" max="100" className="input-field" value={editTestForm.passing_score ?? 60} onChange={e => setEditTestForm({ ...editTestForm, passing_score: +e.target.value })} />
                                </Field>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Field label="Duration (mins)">
                                    <input type="number" min="1" className="input-field" value={editTestForm.duration_minutes || 30} onChange={e => setEditTestForm({ ...editTestForm, duration_minutes: +e.target.value })} required />
                                </Field>
                                <Field label="Time / Question (sec)">
                                    <input type="number" min="10" className="input-field" value={editTestForm.time_per_question_seconds || 60} onChange={e => setEditTestForm({ ...editTestForm, time_per_question_seconds: +e.target.value })} required />
                                </Field>
                            </div>
                            <Field label="Question Limit (0 = all)">
                                <input type="number" min="0" className="input-field" value={editTestForm.total_questions_limit ?? 0} onChange={e => setEditTestForm({ ...editTestForm, total_questions_limit: +e.target.value })} />
                            </Field>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setEditingTest(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                                    {submitting ? <Spinner /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Overlay>
            )}

            {/* Create Candidate */}
            {showCreateUser && (
                <Overlay onClose={() => setShowCreateUser(false)}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Users size={18} color="var(--primary)" /> Register Candidate</h2>
                            <button className="btn btn-icon" onClick={() => setShowCreateUser(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateUser}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <Field label="Full Name">
                                    <input className="input-field" value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} placeholder="Full name" required />
                                </Field>
                                <Field label="Username (unique)">
                                    <input className="input-field" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} placeholder="unique_username" required />
                                </Field>
                            </div>
                            <Field label="Password">
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPwCreate ? "text" : "password"}
                                        className="input-field"
                                        style={{ paddingRight: '2.5rem' }}
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwCreate(!showPwCreate)}
                                        style={{
                                            position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                                        }}
                                    >
                                        {showPwCreate ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </Field>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <Field label="Email">
                                    <input type="email" className="input-field" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="john@example.com" />
                                </Field>
                                <Field label="Phone">
                                    <PhoneInput
                                        country="in" value={newUser.phone}
                                        onChange={val => setNewUser({ ...newUser, phone: '+' + val })}
                                        inputStyle={{ width: '100%', height: '36px', fontSize: '0.875rem', border: '1.5px solid var(--border)', borderRadius: '0.5rem', background: '#fafafa' }}
                                        buttonStyle={{ border: '1.5px solid var(--border)', borderRight: 'none', borderRadius: '0.5rem 0 0 0.5rem', background: '#fafafa' }}
                                        containerStyle={{ width: '100%' }}
                                    />
                                </Field>
                            </div>
                            <Field label="College / Company">
                                <input className="input-field" value={newUser.college_or_company} onChange={e => setNewUser({ ...newUser, college_or_company: e.target.value })} placeholder="e.g. University / Company name" />
                            </Field>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <Field label="Experience Level">
                                    <select className="input-field" value={newUser.experience_level} onChange={e => setNewUser({ ...newUser, experience_level: e.target.value })}>
                                        {['Fresher', '1-3yr', '3-5yr', '5+yr'].map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </Field>
                                <Field label="Skills (comma-separated)">
                                    <input className="input-field" value={newUser.skills} onChange={e => setNewUser({ ...newUser, skills: e.target.value })} placeholder="React, Node, Python" />
                                </Field>
                            </div>
                            <Field label="Applied For (Job Opening — optional)">
                                <select className="input-field" value={newUser.applied_for_job} onChange={e => setNewUser({ ...newUser, applied_for_job: e.target.value })}>
                                    <option value="">— None —</option>
                                    {jobs.filter(j => j.status === 'open').map(j => (
                                        <option key={j.id} value={j.id}>{j.title}{j.department ? ` · ${j.department}` : ''}</option>
                                    ))}
                                </select>
                            </Field>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowCreateUser(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                                    {submitting ? <Spinner /> : 'Create Candidate'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Overlay>
            )}

            {/* Edit Candidate */}
            {editingUser && (
                <Overlay onClose={() => setEditingUser(null)}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Edit2 size={18} color="var(--primary)" /> Edit Candidate</h2>
                            <button className="btn btn-icon" onClick={() => setEditingUser(null)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleUpdateUser}>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>Username: <code>{editingUser.username}</code> (cannot be changed)</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <Field label="Full Name">
                                    <input className="input-field" value={editUserForm.full_name || ''} onChange={e => setEditUserForm({ ...editUserForm, full_name: e.target.value })} required />
                                </Field>
                                <Field label="New Password (blank = keep)">
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPwEdit ? "text" : "password"}
                                            className="input-field"
                                            style={{ paddingRight: '2.5rem' }}
                                            value={editUserForm.password || ''}
                                            onChange={e => setEditUserForm({ ...editUserForm, password: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPwEdit(!showPwEdit)}
                                            style={{
                                                position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                                            }}
                                        >
                                            {showPwEdit ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </Field>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <Field label="Email">
                                    <input type="email" className="input-field" value={editUserForm.email || ''} onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })} placeholder="john@example.com" />
                                </Field>
                                <Field label="Phone">
                                    <PhoneInput
                                        country="in" value={editUserForm.phone || ''}
                                        onChange={val => setEditUserForm({ ...editUserForm, phone: '+' + val })}
                                        inputStyle={{ width: '100%', height: '36px', fontSize: '0.875rem', border: '1.5px solid var(--border)', borderRadius: '0.5rem', background: '#fafafa' }}
                                        buttonStyle={{ border: '1.5px solid var(--border)', borderRight: 'none', borderRadius: '0.5rem 0 0 0.5rem', background: '#fafafa' }}
                                        containerStyle={{ width: '100%' }}
                                    />
                                </Field>
                            </div>
                            <Field label="College / Company">
                                <input className="input-field" value={editUserForm.college_or_company || ''} onChange={e => setEditUserForm({ ...editUserForm, college_or_company: e.target.value })} placeholder="e.g. University / Company name" />
                            </Field>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <Field label="Experience Level">
                                    <select className="input-field" value={editUserForm.experience_level || 'Fresher'} onChange={e => setEditUserForm({ ...editUserForm, experience_level: e.target.value })}>
                                        {['Fresher', '1-3yr', '3-5yr', '5+yr'].map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </Field>
                                <Field label="Skills (comma-separated)">
                                    <input className="input-field" value={editUserForm.skills || ''} onChange={e => setEditUserForm({ ...editUserForm, skills: e.target.value })} placeholder="React, Node, Python" />
                                </Field>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setEditingUser(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                                    {submitting ? <Spinner /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Overlay>
            )}

            {/* Assign Test modal */}
            {assigningUser && (
                <Overlay onClose={() => setAssigningUser(null)}>
                    <div className="glass-card" style={{ padding: '1.5rem', maxWidth: '480px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ClipboardList size={18} color="var(--primary)" /> Assign Test to {assigningUser.full_name}
                            </h2>
                            <button className="btn btn-icon" onClick={() => setAssigningUser(null)}><X size={18} /></button>
                        </div>

                        <form onSubmit={handleCreateAssignment}>
                            <Field label="Select Test">
                                <select
                                    className="input-field"
                                    value={assignForm.test_id}
                                    onChange={e => setAssignForm({ ...assignForm, test_id: e.target.value })}
                                    required
                                >
                                    <option value="">— Choose a test —</option>
                                    {tests.map(t => (
                                        <option key={t.id} value={t.id}>{t.title} ({t.questions?.length || 0} Qs)</option>
                                    ))}
                                </select>
                            </Field>

                            {/* Time Window Card */}
                            <div style={{ borderRadius: '10px', border: '1px solid rgba(99,102,241,0.25)', marginBottom: '1rem', overflow: 'hidden' }}>
                                {/* Header */}
                                <div style={{ padding: '0.65rem 0.9rem', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.82rem', color: 'var(--primary)' }}>
                                        <Clock size={14} /> Login Time Window
                                        <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.72rem' }}>(optional)</span>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.12)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', padding: '0.15rem 0.5rem', fontWeight: 600 }}>
                                        🔒 Server enforced
                                    </span>
                                </div>

                                <div style={{ padding: '0.9rem', background: 'rgba(99,102,241,0.04)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <p style={{ fontSize: '0.71rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                                        Candidate can only login between these times. Leave blank to allow login anytime.
                                    </p>

                                    {/* START datetime */}
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                                            ▶ Test Start — Date &amp; Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={assignForm.login_start || ''}
                                            onChange={e => setAssignForm({ ...assignForm, login_start: e.target.value })}
                                            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '2px solid rgba(16,185,129,0.4)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box', cursor: 'pointer' }}
                                            onClick={e => e.target.showPicker?.()}
                                        />
                                    </div>

                                    {/* divider */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>to</span>
                                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                                    </div>

                                    {/* END datetime */}
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                                            ■ Test End — Date &amp; Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={assignForm.login_end || ''}
                                            onChange={e => setAssignForm({ ...assignForm, login_end: e.target.value })}
                                            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '2px solid rgba(239,68,68,0.4)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box', cursor: 'pointer' }}
                                            onClick={e => e.target.showPicker?.()}
                                        />
                                    </div>

                                    {/* Live preview */}
                                    {(assignForm.login_start || assignForm.login_end) && (
                                        <div style={{ padding: '0.55rem 0.75rem', borderRadius: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', fontSize: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--text)' }}>Window:</span>
                                            <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                                                {assignForm.login_start ? new Date(assignForm.login_start).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)' }}>→</span>
                                            <span style={{ color: 'var(--error)', fontWeight: 600 }}>
                                                {assignForm.login_end ? new Date(assignForm.login_end).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setAssigningUser(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                                    {submitting ? <Spinner /> : 'Assign Test'}
                                </button>
                            </div>
                        </form>

                        {/* Existing assignments for this user */}
                        {assignments.filter(a => a.user_id === assigningUser.id).length > 0 && (
                            <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>Current Assignments</div>
                                {assignments.filter(a => a.user_id === assigningUser.id).map(a => (
                                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', marginBottom: '0.35rem' }}>
                                        <div style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>{a.test_title}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                            {a.login_start ? new Date(a.login_start).toLocaleString() : 'Any time'}
                                            {a.login_end ? ` → ${new Date(a.login_end).toLocaleString()}` : ''}
                                        </div>
                                        <button onClick={() => handleDeleteAssignment(a.id)} className="btn btn-icon" style={{ color: 'var(--error)', opacity: 0.7, padding: '0.15rem' }}>
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Overlay>
            )}

            {/* PDF Append / Replace modal */}
            {pdfUploadTarget && (
                <Overlay onClose={() => setPdfUploadTarget(null)}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <FileUp size={22} color="var(--primary)" />
                            <h3 style={{ margin: 0 }}>PDF Already Uploaded</h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            <strong>{pdfUploadTarget.test.title}</strong> already has {pdfUploadTarget.test.uploaded_pdfs?.length} PDF(s) with questions.
                            How should the new PDF "<strong>{pdfUploadTarget.file.name}</strong>" be handled?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => doUploadPdf(pdfUploadTarget.test.id, pdfUploadTarget.file, 'append')}
                            >
                                Append Questions
                                <span style={{ fontSize: '0.78rem', opacity: 0.7, marginLeft: '0.5rem' }}>— keep existing questions, add new ones</span>
                            </button>
                            <button
                                className="btn"
                                style={{ border: '1px solid var(--error)', color: 'var(--error)', background: 'rgba(239,68,68,0.08)' }}
                                onClick={() => doUploadPdf(pdfUploadTarget.test.id, pdfUploadTarget.file, 'replace')}
                            >
                                Replace All Questions
                                <span style={{ fontSize: '0.78rem', opacity: 0.7, marginLeft: '0.5rem' }}>— delete existing PDFs &amp; questions first</span>
                            </button>
                            <button className="btn" onClick={() => setPdfUploadTarget(null)}>Cancel</button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* Confirm delete modal */}
            {confirm && (
                <ConfirmModal
                    message={confirm.message}
                    detail={confirm.detail}
                    isPdfDelete={confirm.isPdfDelete || false}
                    questionsExtracted={confirm.questionsExtracted || 0}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(null)}
                />
            )}

            {/* Schedule / Edit Interview Modal */}
            {showInterviewForm && (
                <Overlay onClose={() => setShowInterviewForm(false)}>
                    <div className="glass-card" style={{ padding: '1.5rem 2rem', maxWidth: '500px', width: '100%', maxHeight: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CalendarDays size={18} color="var(--primary)" />
                                {editingInterview ? 'Edit Interview' : 'Schedule Interview'}
                            </h2>
                            <button className="btn btn-icon" onClick={() => setShowInterviewForm(false)}><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSaveInterview} className="modal-form-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.75rem' }}>
                            {/* Candidate */}
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Candidate</label>
                                <select
                                    className="input-field"
                                    value={interviewForm.user_id}
                                    onChange={e => setInterviewForm({ ...interviewForm, user_id: e.target.value })}
                                    required
                                    disabled={!!editingInterview}
                                >
                                    <option value="">— Select candidate —</option>
                                    {candidates.map(c => (
                                        <option key={c.id} value={c.id}>{c.full_name} (@{c.username})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Interviewer */}
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Interviewer Name</label>
                                <input
                                    className="input-field"
                                    placeholder="Interviewer full name"
                                    value={interviewForm.interviewer_name}
                                    onChange={e => setInterviewForm({ ...interviewForm, interviewer_name: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Date & Time */}
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                                    📅 Interview Date &amp; Time
                                </label>
                                <input
                                    type="datetime-local"
                                    className="input-field"
                                    value={interviewForm.interview_date}
                                    onChange={e => setInterviewForm({ ...interviewForm, interview_date: e.target.value })}
                                    style={{ colorScheme: 'dark', cursor: 'pointer' }}
                                    onClick={e => e.target.showPicker?.()}
                                    required
                                />
                            </div>

                            {/* Meeting URL */}
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Link size={13} /> Meeting URL <span style={{ fontWeight: 400 }}>(optional)</span></span>
                                </label>
                                <input
                                    className="input-field"
                                    placeholder="https://meet.google.com/..."
                                    value={interviewForm.meeting_url}
                                    onChange={e => setInterviewForm({ ...interviewForm, meeting_url: e.target.value })}
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Status</label>
                                <select
                                    className="input-field"
                                    value={interviewForm.status}
                                    onChange={e => setInterviewForm({ ...interviewForm, status: e.target.value })}
                                >
                                    <option value="pending">⏳ Pending</option>
                                    <option value="attended">✅ Attended</option>
                                    <option value="shortlisted">🏆 Shortlisted</option>
                                    <option value="rejected">👎 Rejected</option>
                                    <option value="absent">❌ Absent</option>
                                    <option value="rescheduled">🔄 Rescheduled</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Notes <span style={{ fontWeight: 400 }}>(optional)</span></label>
                                <textarea
                                    className="input-field"
                                    placeholder="Any special instructions or notes..."
                                    rows={2}
                                    value={interviewForm.notes}
                                    onChange={e => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', position: 'sticky', bottom: 0, background: 'var(--surface)', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowInterviewForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                                    {submitting ? <Spinner /> : editingInterview ? 'Save Changes' : 'Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Overlay>
            )}

            {/* Job Form Modal */}
            {showJobForm && (
                <Overlay onClose={() => setShowJobForm(false)}>
                    <div className="glass-card" style={{ padding: '1.5rem 2rem', maxWidth: '580px', width: '100%', maxHeight: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Briefcase size={18} color="var(--primary)" />
                                {editingJob ? 'Edit Job Opening' : 'Post New Job Opening'}
                            </h2>
                            <button className="btn btn-icon" onClick={() => setShowJobForm(false)}><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSaveJob} className="modal-form-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', overflowY: 'auto', paddingRight: '0.75rem' }}>
                            {/* Row 1 — Title */}
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Job Title *</label>
                                <input className="input-field" placeholder="e.g. Senior Developer" value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} required />
                            </div>

                            {/* Row 2 — Department + Location */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}><Building2 size={12} /> Department</label>
                                    <input className="input-field" placeholder="e.g. Engineering, Sales, HR" value={jobForm.department} onChange={e => setJobForm({ ...jobForm, department: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}><MapPin size={12} /> Location</label>
                                    <input className="input-field" placeholder="e.g. Remote / City name" value={jobForm.location} onChange={e => setJobForm({ ...jobForm, location: e.target.value })} />
                                </div>
                            </div>

                            {/* Row 3 — Job Type + Experience Level */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Job Type</label>
                                    <select className="input-field" value={jobForm.job_type} onChange={e => setJobForm({ ...jobForm, job_type: e.target.value })}>
                                        {['Full-Time', 'Part-Time', 'Contract', 'Internship', 'Freelance'].map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}><GraduationCap size={12} /> Experience Level</label>
                                    <select className="input-field" value={jobForm.experience_level} onChange={e => setJobForm({ ...jobForm, experience_level: e.target.value })}>
                                        {['Fresher', '0-1 yrs', '1-3 yrs', '3-5 yrs', '5-8 yrs', '8+ yrs', 'Any'].map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Row 4 — Min Exp + Max Exp + Vacancies */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Min Exp (yrs)</label>
                                    <input type="number" min="0" className="input-field" value={jobForm.min_experience_years} onChange={e => setJobForm({ ...jobForm, min_experience_years: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Max Exp (yrs)</label>
                                    <input type="number" min="0" className="input-field" placeholder="optional" value={jobForm.max_experience_years} onChange={e => setJobForm({ ...jobForm, max_experience_years: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Vacancies</label>
                                    <input type="number" min="1" className="input-field" value={jobForm.vacancies} onChange={e => setJobForm({ ...jobForm, vacancies: e.target.value })} />
                                </div>
                            </div>

                            {/* Row 5 — Salary + Status */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}><DollarSign size={12} /> Salary Range</label>
                                    <input className="input-field" placeholder="e.g. 6L – 12L / Negotiable" value={jobForm.salary_range} onChange={e => setJobForm({ ...jobForm, salary_range: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Status</label>
                                    <select className="input-field" value={jobForm.status} onChange={e => setJobForm({ ...jobForm, status: e.target.value })}>
                                        <option value="open">🟢 Open</option>
                                        <option value="on_hold">🟡 On Hold</option>
                                        <option value="closed">🔴 Closed</option>
                                    </select>
                                </div>
                            </div>

                            {/* Skills */}
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}><Tag size={12} /> Required Skills <span style={{ fontWeight: 400 }}>(comma separated)</span></label>
                                <input className="input-field" placeholder="e.g. Java, Spring Boot, MySQL, REST API" value={jobForm.skills_required} onChange={e => setJobForm({ ...jobForm, skills_required: e.target.value })} />
                            </div>

                            {/* JD */}
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Job Description</label>
                                <textarea className="input-field" rows={4} placeholder="Describe the role, team, and goals..." value={jobForm.jd_description} onChange={e => setJobForm({ ...jobForm, jd_description: e.target.value })} style={{ resize: 'vertical' }} />
                            </div>

                            {/* Responsibilities */}
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Responsibilities</label>
                                <textarea className="input-field" rows={3} placeholder="• Build and maintain APIs&#10;• Code reviews&#10;• Collaborate with team" value={jobForm.responsibilities} onChange={e => setJobForm({ ...jobForm, responsibilities: e.target.value })} style={{ resize: 'vertical' }} />
                            </div>

                            {/* Qualifications */}
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Qualifications</label>
                                <textarea className="input-field" rows={3} placeholder="• B.E / B.Tech in CS or IT&#10;• Strong OOP concepts" value={jobForm.qualifications} onChange={e => setJobForm({ ...jobForm, qualifications: e.target.value })} style={{ resize: 'vertical' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', position: 'sticky', bottom: 0, background: 'var(--surface)', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowJobForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                                    {submitting ? <Spinner /> : editingJob ? 'Save Changes' : 'Post Job'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Overlay>
            )}

            </div>

            {toast && <Toast key={toast.key} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </div>
    );
};

export default AdminDashboard;
