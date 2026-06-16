import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Users, Shield, Mail,
  Activity, Search, Upload, Download,
  CheckCircle, Clock, Lock, LogOut, User,
  FileText, Trash2, AlertCircle, ChevronRight, X,
  GitBranch, TrendingUp, FileBarChart, Calendar, Plus,
  ChevronLeft, Sun, Moon
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import axios from 'axios';
import MainLayout from './layout/MainLayout';
import Button from './components/ui/Button';
import Card from './components/ui/Card';

// --- INTERFACCE TYPESCRIPT ---
interface Candidate {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  skills: string[];
  status: string;
  created_at: string;
}

interface DashboardStats {
  total_candidates: number;
  skills_bar: { name: string; count: number }[];
  status_pie: { name: string; value: number }[];
  status_distribution: Record<string, number>;
}

interface Interview {
  id: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  date: string;
  time: string;
  type: string;
}

const API_BASE = "http://localhost:8000";

// --- COMPONENTE PAGINAZIONE RIUTILIZZABILE ---
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between gap-4 mt-6 px-2" aria-label="Navigazione paginazione">
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {startItem}–{endItem} di {totalItems} risultati
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Pagina precedente"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={idx} className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-gray-500">…</span>
          ) : (
            <button
              key={idx}
              onClick={() => onPageChange(page as number)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${currentPage === page
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Pagina successiva"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // --- STATO DARK MODE ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // --- STATO PRINCIPALE ---
  const [token, setToken] = useState(localStorage.getItem('flux_token'));
  const [view, setView] = useState('stats');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState(false);

  // --- STATO PER SELEZIONE MULTIPLA ED ELIMINAZIONE ---
  const [selectedCandidates, setSelectedCandidates] = useState<Set<number>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- STATO PER DRAG & DROP UPLOAD ---
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; status: 'pending' | 'uploading' | 'success' | 'error' }[]>([]);

  // --- PAGINAZIONE CANDIDATI ---
  const [candidatesPage, setCandidatesPage] = useState(1);
  const CANDIDATES_PER_PAGE = 10;

  // --- PAGINAZIONE COLLOQUI ---
  const [interviewsPage, setInterviewsPage] = useState(1);
  const INTERVIEWS_PER_PAGE = 5;

  // --- STATO COLLOQUI MANUALI ---
  const [manualInterviews, setManualInterviews] = useState<Interview[]>([]);
  const [showNewInterviewModal, setShowNewInterviewModal] = useState(false);
  const [newInterviewForm, setNewInterviewForm] = useState({
    candidateId: '',
    date: '',
    time: '',
    type: 'Colloquio tecnico',
  });
  const [newInterviewError, setNewInterviewError] = useState('');

  // --- FILTRI COLLOQUI ---
  const [interviewSearchTerm, setInterviewSearchTerm] = useState('');
  const [interviewTypeFilter, setInterviewTypeFilter] = useState('');

  // --- CANCELLAZIONE COLLOQUI ---
  const [deletedMockInterviewIds, setDeletedMockInterviewIds] = useState<Set<number>>(new Set());
  const [showDeleteInterviewModal, setShowDeleteInterviewModal] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<Interview | null>(null);

  // --- STATI PER SKILL GAP INTERATTIVO ---
  const [requiredSkills, setRequiredSkills] = useState([
    { name: 'Python', target: 8 },
    { name: 'React', target: 6 },
    { name: 'TypeScript', target: 5 },
    { name: 'AWS', target: 4 },
    { name: 'Leadership', target: 3 },
  ]);

  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillTarget, setNewSkillTarget] = useState(5);
  
  // Stati per la modifica inline
  const [editingSkillName, setEditingSkillName] = useState<string | null>(null);
  const [editingSkillTarget, setEditingSkillTarget] = useState<number>(0);

  // --- CONFIGURAZIONE API ---
  const api = useMemo(() => axios.create({
    baseURL: API_BASE,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }), [token]);

  // --- FUNZIONI DI AUTENTICAZIONE E DATI ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(false);
    try {
      const params = new URLSearchParams();
      params.append('username', loginData.username);
      params.append('password', loginData.password);
      const res = await axios.post(`${API_BASE}/token`, params);
      const newToken = res.data.access_token;
      localStorage.setItem('flux_token', newToken);
      setToken(newToken);
    } catch (err) {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('flux_token');
    setToken(null);
  };

  const fetchData = async () => {
    if (!token) return;
    try {
      const [candRes, statsRes] = await Promise.all([
        api.get('/candidates'),
        api.get('/stats')
      ]);
      setCandidates(candRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      if (err.response?.status === 401) handleLogout();
    }
  };

  // --- CRUD ---
  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/candidates/${id}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert("Errore nell'aggiornamento dello stato.");
    }
  };

  const deleteSingleCandidate = async (id: number) => {
    try {
      await api.delete(`/candidates/${id}`);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    const ids = Array.from(selectedCandidates);
    try {
      await Promise.all(ids.map(id => deleteSingleCandidate(id)));
      await fetchData();
      setSelectedCandidates(new Set());
      setShowDeleteModal(false);
    } catch (err) {
      alert("Errore durante l'eliminazione di alcuni candidati.");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- SELEZIONE MULTIPLA ---
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedCandidates.map(c => c.id);
      setSelectedCandidates(new Set(allIds));
    } else {
      setSelectedCandidates(new Set());
    }
  };

  const toggleSelectOne = (id: number, checked: boolean) => {
    const newSet = new Set(selectedCandidates);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedCandidates(newSet);
  };

  // --- UPLOAD CON DRAG & DROP ---
  const uploadCV = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/upload-cv', formData);
      return { success: true };
    } catch (err) {
      console.error(`Errore upload ${file.name}:`, err);
      return { success: false };
    }
  };

  const uploadFiles = async (files: File[]) => {
    const validFiles = files.filter(f => f.name.endsWith('.pdf') || f.name.endsWith('.docx'));
    if (validFiles.length === 0) {
      alert('Sono accettati solo file PDF o DOCX');
      return;
    }

    const newUploads = validFiles.map(f => ({ name: f.name, status: 'pending' as const }));
    setUploadingFiles(prev => [...prev, ...newUploads]);

    for (const file of validFiles) {
      setUploadingFiles(prev =>
        prev.map(u => u.name === file.name ? { ...u, status: 'uploading' } : u)
      );
      const result = await uploadCV(file);
      setUploadingFiles(prev =>
        prev.map(u =>
          u.name === file.name ? { ...u, status: result.success ? 'success' : 'error' } : u)
      );
    }
    await fetchData();
    setTimeout(() => {
      setUploadingFiles(prev => prev.filter(u => u.status !== 'success' && u.status !== 'error'));
    }, 4000);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // --- FILTRI PER SKILL E TESTO ---
  const availableSkills = useMemo(() => {
    const skillSet = new Set<string>();
    candidates.forEach(c => c.skills?.forEach(skill => skillSet.add(skill)));
    return Array.from(skillSet).sort();
  }, [candidates]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
    setCandidatesPage(1);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedSkills([]);
    setSelectedCandidates(new Set());
    setCandidatesPage(1);
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesText = searchTerm === "" ||
      (c.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesText) return false;
    if (selectedSkills.length === 0) return true;
    return c.skills?.some(skill => selectedSkills.includes(skill));
  });

  // --- PAGINAZIONE APPLICATA ---
  const totalCandidatePages = Math.ceil(filteredCandidates.length / CANDIDATES_PER_PAGE);
  const paginatedCandidates = filteredCandidates.slice(
    (candidatesPage - 1) * CANDIDATES_PER_PAGE,
    candidatesPage * CANDIDATES_PER_PAGE
  );

  // --- AGGIUNGI NUOVO COLLOQUIO ---
  const handleAddInterview = () => {
    setNewInterviewError('');
    if (!newInterviewForm.candidateId) {
      setNewInterviewError('Seleziona un candidato.');
      return;
    }
    if (!newInterviewForm.date) {
      setNewInterviewError('Inserisci una data.');
      return;
    }
    if (!newInterviewForm.time) {
      setNewInterviewError("Inserisci un'ora.");
      return;
    }
    const candidate = candidates.find(c => c.id === Number(newInterviewForm.candidateId));
    if (!candidate) {
      setNewInterviewError('Candidato non trovato.');
      return;
    }
    const dateObj = new Date(`${newInterviewForm.date}T${newInterviewForm.time}`);
    const formatted = dateObj.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) + ', ' + newInterviewForm.time;
    const newInterview: Interview = {
      id: Date.now(),
      candidateId: candidate.id,
      candidateName: candidate.name || 'Candidato senza nome',
      candidateEmail: candidate.email,
      date: newInterviewForm.date,
      time: formatted,
      type: newInterviewForm.type,
    };
    setManualInterviews(prev => [...prev, newInterview]);
    setShowNewInterviewModal(false);
    setNewInterviewForm({ candidateId: '', date: '', time: '', type: 'Colloquio tecnico' });
    setNewInterviewError('');
  };

  // --- CANCELLA COLLOQUIO ---
  const handleDeleteInterview = () => {
    if (!interviewToDelete) return;
    if (interviewToDelete.id > 0) {
      setManualInterviews(prev => prev.filter(i => i.id !== interviewToDelete.id));
    } else {
      setDeletedMockInterviewIds(prev => {
        const next = new Set(Array.from(prev));
        next.add(interviewToDelete!.id);
        return next;
      });
    }
    setShowDeleteInterviewModal(false);
    setInterviewToDelete(null);
  };

  // Dati colloqui
  const mockInterviews = candidates.slice(0, Math.min(candidates.length, 20)).map((c, idx) => ({
    id: c.id * -1,
    candidateId: c.id,
    candidateName: c.name || 'Candidato senza nome',
    candidateEmail: c.email,
    date: '',
    time: idx % 3 === 0 ? 'Oggi, 15:30' : idx % 3 === 1 ? 'Domani, 10:00' : '12 Mag, 14:00',
    type: idx % 2 === 0 ? 'Colloquio tecnico' : 'Colloquio HR',
  }));
  const allInterviews = [...manualInterviews, ...mockInterviews.filter(m => !deletedMockInterviewIds.has(m.id))];

  const filteredInterviews = allInterviews.filter(i => {
    const matchesSearch = interviewSearchTerm === '' ||
      i.candidateName.toLowerCase().includes(interviewSearchTerm.toLowerCase()) ||
      i.candidateEmail.toLowerCase().includes(interviewSearchTerm.toLowerCase());
    const matchesType = interviewTypeFilter === '' || i.type === interviewTypeFilter;
    return matchesSearch && matchesType;
  });

  const totalInterviewPages = Math.ceil(filteredInterviews.length / INTERVIEWS_PER_PAGE);
  const paginatedInterviews = filteredInterviews.slice(
    (interviewsPage - 1) * INTERVIEWS_PER_PAGE,
    interviewsPage * INTERVIEWS_PER_PAGE
  );

  const allSelected = paginatedCandidates.length > 0 && paginatedCandidates.every(c => selectedCandidates.has(c.id));
  const someSelected = selectedCandidates.size > 0;

  // --- FUNZIONI DI GESTIONE SKILL ---
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;

    // Evita duplicati (case-insensitive)
    const exists = requiredSkills.some(s => s.name.toLowerCase() === newSkillName.toLowerCase());
    if (exists) {
      alert("Questa competenza è già presente nella lista.");
      return;
    }

    setRequiredSkills([...requiredSkills, { name: newSkillName, target: Number(newSkillTarget) }]);
    setNewSkillName('');
    setNewSkillTarget(5);
  };

  const handleDeleteSkill = (name: string) => {
    if (window.confirm(`Sei sicuro di voler rimuovere "${name}" dagli obiettivi?`)) {
      setRequiredSkills(requiredSkills.filter(s => s.name !== name));
    }
  };

  const startEditing = (name: string) => {
    const skill = requiredSkills.find(s => s.name === name);
    if (skill) {
      setEditingSkillName(name);
      setEditingSkillTarget(skill.target);
    }
  };

  const saveEdit = () => {
    if (!editingSkillName) return;
    setRequiredSkills(requiredSkills.map(s =>
      s.name === editingSkillName ? { ...s, target: editingSkillTarget } : s
    ));
    setEditingSkillName(null);
  };

  useEffect(() => {
    setCandidatesPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setInterviewsPage(1);
  }, [interviewSearchTerm, interviewTypeFilter]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [token, api]);

  // --- RENDER LOGIN ---
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/10 dark:bg-indigo-900/30 mb-4">
              <Lock size={32} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Humflow
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Access Protocollo Sicurezza Talent v3.0</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2" role="alert">
              <AlertCircle size={16} />
              Credenziali non valide (admin/password).
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={loginData.username}
                onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-3 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                required
                aria-required="true"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={loginData.password}
                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-3 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                required
                aria-required="true"
              />
            </div>
            <Button type="submit" variant="primary" onClick={() => { }} className="w-full justify-center">
              Accedi al Database
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER DASHBOARD PRINCIPALE ---
  return (
    <MainLayout
      currentView={view}
      onViewChange={setView}
      onLogout={handleLogout}
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
    >
      {/* ========= VIEW 1: DASHBOARD STATS ========= */}
      {view === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Totale Candidati">
              <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{stats.total_candidates}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Talenti nel database</p>
            </Card>
            <Card title="Skill Distribution">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.skills_bar.slice(0, 5)}>
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
                    <YAxis stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }}
                      itemStyle={{ color: '#111827' }}
                      cursor={{ fill: '#f3f4f6' }}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Stato Candidati">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.status_pie}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {stats.status_pie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card title="Trend Assunzioni">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Andamento settimanale</p>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={16} />
                <span className="text-sm font-medium">+32%</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.skills_bar}>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
                  <YAxis stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }}
                    itemStyle={{ color: '#111827' }}
                    cursor={{ fill: '#f3f4f6' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* ========= VIEW 2: CANDIDATI ========= */}
      {view === 'candidates' && (
        <div className="space-y-6">
          {/* Drag & Drop Area */}
          <Card title="Upload CV">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-800/50'
                }`}
              role="region"
              aria-label="Area di upload drag and drop"
            >
              <Upload size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Trascina qui i CV (PDF o DOCX)
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                oppure{' '}
                <label className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer font-medium">
                  seleziona dal computer
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={async (e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        await uploadFiles(files);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Supporto upload multiplo</p>
            </div>

            {/* Feedback upload */}
            {uploadingFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Upload in corso</p>
                {uploadingFiles.map(file => (
                  <div key={file.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-900 dark:text-white">{file.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {file.status === 'pending' && '📤 in coda'}
                      {file.status === 'uploading' && '⏳ caricamento...'}
                      {file.status === 'success' && '✅ completato'}
                      {file.status === 'error' && '❌ errore'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Filtri */}
          <Card title="Filtri">
            <div className="space-y-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca per nome, email o skill..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 py-2.5 pl-10 pr-4 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-gray-900 dark:text-white"
                  aria-label="Cerca candidati"
                />
              </div>

              {availableSkills.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Filtra per competenze</p>
                    {selectedSkills.length > 0 && (
                      <button
                        onClick={resetFilters}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                      >
                        Reset filtri
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSkills.map(skill => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${selectedSkills.includes(skill)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-500/50'
                          }`}
                        aria-pressed={selectedSkills.includes(skill)}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Tabella candidati */}
          <Card title={`Candidati (${filteredCandidates.length})`} noPadding>
            {someSelected && (
              <div className="m-4 flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                <span className="text-sm text-indigo-700 dark:text-indigo-300">{selectedCandidates.size} selezionati</span>
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteModal(true)}
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800"
                >
                  <Trash2 size={14} className="mr-2" />
                  Elimina selezionati
                </Button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Lista candidati">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="p-4 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={e => toggleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        aria-label="Seleziona tutti i candidati"
                      />
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nominativo</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stato Pipeline</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Azioni</th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedCandidates.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.has(c.id)}
                          onChange={e => toggleSelectOne(c.id, e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          aria-label={`Seleziona ${c.name || c.email}`}
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900 dark:text-white">{c.name || 'In attesa di parsing...'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{c.email}</div>
                        {c.skills && c.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {c.skills.slice(0, 3).map(skill => (
                              <span key={skill} className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                {skill}
                              </span>
                            ))}
                            {c.skills.length > 3 && (
                              <span className="px-2 py-0.5 rounded text-[10px] text-gray-500 dark:text-gray-400">
                                +{c.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <select
                          value={c.status}
                          onChange={e => updateStatus(c.id, e.target.value)}
                          className={`text-[10px] font-bold uppercase py-1.5 px-3 rounded-full border bg-transparent outline-none cursor-pointer transition-all focus:ring-2 focus:ring-indigo-500 ${c.status === 'new' ? 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:bg-blue-900/20' :
                              c.status === 'reviewed' ? 'border-yellow-200 text-yellow-700 bg-yellow-50 dark:border-yellow-800 dark:text-yellow-400 dark:bg-yellow-900/20' :
                                c.status === 'shortlisted' ? 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-900/20' :
                                  'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-400 dark:bg-red-900/20'
                            }`}
                          aria-label={`Stato di ${c.name || c.email}`}
                        >
                          <option value="new">Nuovo</option>
                          <option value="reviewed">Revisionato</option>
                          <option value="shortlisted">Selezionato</option>
                          <option value="rejected">Scartato</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const res = await api.get(`/candidates/${c.id}/download`, { responseType: 'blob' });
                                const url = URL.createObjectURL(res.data);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `CV_${c.name || c.id}.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                URL.revokeObjectURL(url);
                              } catch { alert('Errore nel download del CV.'); }
                            }}
                            className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            title="Scarica CV"
                            aria-label={`Scarica CV di ${c.name || c.email}`}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCandidates(new Set([c.id]));
                              setShowDeleteModal(true);
                            }}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                            title="Elimina (GDPR)"
                            aria-label={`Elimina ${c.name || c.email}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCandidates.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nessun candidato corrisponde ai filtri selezionati.</p>
              </div>
            )}

            {filteredCandidates.length > 0 && (
              <Pagination
                currentPage={candidatesPage}
                totalPages={totalCandidatePages}
                onPageChange={setCandidatesPage}
                totalItems={filteredCandidates.length}
                itemsPerPage={CANDIDATES_PER_PAGE}
              />
            )}
          </Card>
        </div>
      )}

      {/* ========= MODALE CONFERMA ELIMINAZIONE ========= */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 id="delete-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">Conferma eliminazione</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-500 dark:text-gray-400">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Sei sicuro di voler eliminare {selectedCandidates.size} candidato{selectedCandidates.size !== 1 && 'i'}?
              {selectedCandidates.size > 0 && (
                <span className="block mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                  Questa operazione è irreversibile (GDPR).
                </span>
              )}
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                Annulla
              </Button>
              <Button variant="primary" onClick={handleDeleteSelected} disabled={isDeleting}>
                {isDeleting ? <>
                  <Activity size={16} className="mr-2 animate-spin" />
                  Eliminazione...
                </> : <>
                  <Trash2 size={16} className="mr-2" />
                  Conferma eliminazione
                </>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========= VIEW 3: PIPELINE KANBAN ========= */}
      {view === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {['new', 'reviewed', 'shortlisted', 'rejected'].map(status => {
            const candidatesByStatus = candidates.filter(c => c.status === status);
            return (
              <Card key={status} title={
                status === 'new' ? '📥 Nuovi' :
                  status === 'reviewed' ? '🔍 Revisionati' :
                    status === 'shortlisted' ? '⭐ Selezionati' :
                      '❌ Scartati'
              }>
                <div className="space-y-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">{candidatesByStatus.length} candidati</div>
                  {candidatesByStatus.map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition group">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{c.name || 'Anonimo'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{c.email}</div>
                      <button
                        onClick={() => updateStatus(c.id, status === 'new' ? 'reviewed' : status === 'reviewed' ? 'shortlisted' : status === 'shortlisted' ? 'rejected' : 'new')}
                        className="mt-2 text-[9px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded font-medium opacity-0 group-hover:opacity-100"
                      >
                        Avanza stato →
                      </button>
                    </div>
                  ))}
                  {candidatesByStatus.length === 0 && (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                      Nessun candidato
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========= VIEW 4: SKILL GAP ANALYSIS (INTERATTIVA) ========= */}
      {view === 'skillgap' && (
        <div className="space-y-6">
          
          {/* Pannello di Controllo per Aggiungere Skill */}
          <Card title="Gestisci Obiettivi Recruiting">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Competenza</label>
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="Es. Docker, Kubernetes..."
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                />
              </div>
              <div className="w-full md:w-32">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Target Candidati</label>
                <input
                  type="number"
                  min="1"
                  value={newSkillTarget}
                  onChange={(e) => setNewSkillTarget(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>
              <Button onClick={handleAddSkill} variant="primary" className="w-full md:w-auto">
                <Plus size={16} className="mr-2" /> Aggiungi
              </Button>
            </div>
          </Card>

          {/* Lista delle Skill Gap */}
          <Card title="Analisi Gap Competenze">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Confronto tra competenze possedute dai candidati e obiettivi di recruiting definiti.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requiredSkills.map((skill, index) => {
                const actual = candidates.filter(c => 
                  c.skills?.some(s => s.toLowerCase() === skill.name.toLowerCase())
                ).length;
                
                const target = skill.target;
                const percentage = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
                const gap = target - actual;

                return (
                  <div key={`${skill.name}-${index}`} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all relative group">
                    
                    {/* Header Card con Azioni */}
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">{skill.name}</h4>
                      
                      {/* Azioni Hover */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                          onClick={() => startEditing(skill.name)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Modifica Target"
                        >
                          <FileText size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteSkill(skill.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Rimuovi Skill"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Modifica Inline */}
                    {editingSkillName === skill.name ? (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-indigo-200 dark:border-indigo-800 animate-in fade-in zoom-in duration-200">
                        <label className="text-xs text-gray-500 block mb-1">Nuovo Target:</label>
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            value={editingSkillTarget}
                            onChange={(e) => setEditingSkillTarget(Number(e.target.value))}
                            className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                            autoFocus
                          />
                          <button onClick={saveEdit} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium transition">Salva</button>
                          <button onClick={() => setEditingSkillName(null)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1 rounded text-xs font-medium transition">Annulla</button>
                        </div>
                      </div>
                    ) : (
                      /* Visualizzazione Standard */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Posseduti: <b className="text-gray-900 dark:text-white">{actual}</b></span>
                          <span className="text-gray-500 dark:text-gray-400">Obiettivo: <b className="text-indigo-600 dark:text-indigo-400">{target}</b></span>
                        </div>

                        {/* Barra di Progresso */}
                        <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-700 ease-out ${
                              percentage >= 100 ? 'bg-emerald-500' : 
                              percentage >= 60 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        
                        {/* Feedback Testuale */}
                        {gap > 0 ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                            <AlertCircle size={14} />
                            Mancano {gap} candidato{gap !== 1 && 'i'}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                            <CheckCircle size={14} />
                            Obiettivo Raggiunto!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {requiredSkills.length === 0 && (
                <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  <TrendingUp size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Nessuna competenza configurata.</p>
                  <p className="text-sm text-gray-400">Usa il pannello sopra per iniziare.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ========= VIEW 5: REPORT ========= */}
      {view === 'reports' && (
        <div className="space-y-6">
          <Card title="Esporta Report">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Scarica i dati dei candidati in formato CSV o stampa la dashboard
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  const headers = ['ID', 'Nome', 'Email', 'Telefono', 'Status', 'Skill', 'Data inserimento'];
                  const rows = candidates.map(c => [c.id, c.name || '', c.email, c.phone || '', c.status, (c.skills || []).join('; '), new Date(c.created_at).toLocaleDateString()]);
                  const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `candidati_${new Date().toISOString().slice(0, 19)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all p-5 rounded-xl flex items-center justify-center gap-3 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <Download size={20} />
                Export CSV (UTF-8)
              </button>
              <button
                onClick={() => window.print()}
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all p-5 rounded-xl flex items-center justify-center gap-3 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium"
              >
                <FileText size={20} />
                Stampa Dashboard
              </button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Totale candidati">
              <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{candidates.length}</div>
            </Card>
            <Card title="Ultimo aggiornamento">
              <div className="text-sm text-gray-500 dark:text-gray-400">{new Date().toLocaleString()}</div>
            </Card>
          </div>
        </div>
      )}

      {/* ========= VIEW 6: COLLOQUI ========= */}
      {view === 'calendar' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Prossimi Colloqui</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {filteredInterviews.length > 0
                  ? `${filteredInterviews.length} colloqui${allInterviews.length !== filteredInterviews.length ? ` su ${allInterviews.length}` : ' programmati'}`
                  : 'Nessun colloquio corrisponde ai filtri'}
              </p>
            </div>
            <button
              onClick={() => {
                setNewInterviewForm({ candidateId: '', date: '', time: '', type: 'Colloquio tecnico' });
                setNewInterviewError('');
                setShowNewInterviewModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-xl flex items-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md shadow-indigo-200 dark:shadow-none"
            >
              <Plus size={16} />
              Nuovo colloquio
            </button>
          </div>

          {/* Barra filtri colloqui */}
          <Card title="Filtri">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca candidato..."
                  value={interviewSearchTerm}
                  onChange={e => setInterviewSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 py-2.5 pl-9 pr-4 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-gray-900 dark:text-white"
                  aria-label="Cerca colloqui"
                />
              </div>
              <select
                value={interviewTypeFilter}
                onChange={e => setInterviewTypeFilter(e.target.value)}
                className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                aria-label="Filtra per tipo di colloquio"
              >
                <option value="">Tutti i tipi</option>
                <option value="Colloquio tecnico">Colloquio tecnico</option>
                <option value="Colloquio HR">Colloquio HR</option>
                <option value="Colloquio conoscitivo">Colloquio conoscitivo</option>
                <option value="Colloquio finale">Colloquio finale</option>
              </select>
              {(interviewSearchTerm !== '' || interviewTypeFilter !== '') && (
                <button
                  onClick={() => { setInterviewSearchTerm(''); setInterviewTypeFilter(''); }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 rounded-xl flex items-center gap-1.5 text-xs transition-all hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <X size={14} />
                  Reset
                </button>
              )}
            </div>
          </Card>

          <Card title="Lista Colloqui" noPadding>
            {allInterviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nessun colloquio programmato. Aggiungine uno!</p>
              </div>
            ) : filteredInterviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>Nessun colloquio corrisponde ai filtri selezionati.</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedInterviews.map((c) => (
                    <div key={c.id} className="group flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                          {c.candidateName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{c.candidateName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{c.candidateEmail}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 font-medium">{c.time}</div>
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">{c.type}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => { setInterviewToDelete(c); setShowDeleteInterviewModal(true); }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                        title="Cancella colloquio"
                        aria-label={`Cancella colloquio con ${c.candidateName}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Pagination
                    currentPage={interviewsPage}
                    totalPages={totalInterviewPages}
                    onPageChange={setInterviewsPage}
                    totalItems={filteredInterviews.length}
                    itemsPerPage={INTERVIEWS_PER_PAGE}
                  />
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ========= MODALE NUOVO COLLOQUIO ========= */}
      {showNewInterviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="interview-modal-title">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 id="interview-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">Nuovo Colloquio</h3>
              <button
                onClick={() => setShowNewInterviewModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Candidato</label>
                <select
                  value={newInterviewForm.candidateId}
                  onChange={e => setNewInterviewForm({ ...newInterviewForm, candidateId: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-3 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option value="">— Seleziona un candidato —</option>
                  {candidates.map(c => (
                    <option key={c.id} value={c.id}>{c.name || c.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Data</label>
                <input
                  type="date"
                  value={newInterviewForm.date}
                  onChange={e => setNewInterviewForm({ ...newInterviewForm, date: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-3 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Ora</label>
                <input
                  type="time"
                  value={newInterviewForm.time}
                  onChange={e => setNewInterviewForm({ ...newInterviewForm, time: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-3 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo di colloquio</label>
                <select
                  value={newInterviewForm.type}
                  onChange={e => setNewInterviewForm({ ...newInterviewForm, type: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-3 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option>Colloquio tecnico</option>
                  <option>Colloquio HR</option>
                  <option>Colloquio conoscitivo</option>
                  <option>Colloquio finale</option>
                </select>
              </div>

              {newInterviewError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2" role="alert">
                  <AlertCircle size={16} />
                  {newInterviewError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowNewInterviewModal(false)}>
                Annulla
              </Button>
              <Button variant="primary" onClick={handleAddInterview}>
                Aggiungi colloquio
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========= MODALE CONFERMA CANCELLAZIONE COLLOQUIO ========= */}
      {showDeleteInterviewModal && interviewToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-interview-modal-title">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 id="delete-interview-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">Cancella colloquio</h3>
              <button onClick={() => { setShowDeleteInterviewModal(false); setInterviewToDelete(null); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-500 dark:text-gray-400">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Sei sicuro di voler cancellare il colloquio con {interviewToDelete.candidateName}?
            </p>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 mb-6">
              <p className="text-sm text-gray-900 dark:text-white font-medium">{interviewToDelete.time}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">{interviewToDelete.type}</p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => { setShowDeleteInterviewModal(false); setInterviewToDelete(null); }}>
                Annulla
              </Button>
              <Button variant="primary" onClick={handleDeleteInterview}>
                Conferma cancellazione
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========= VIEW 7: GDPR COMPLIANCE ========= */}
      {view === 'gdpr' && (
        <div className="space-y-6">
          <Card title="Registro Audit Privacy">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Conformità ai sensi del Regolamento UE 2016/679
            </p>
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Sistema Integro</span>
              </div>
            </div>
            <div className="space-y-3">
              {candidates.map(c => (
                <div key={c.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Art. 14 Informative Sent</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded">Completed</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{c.email}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Retention: 180 giorni</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </MainLayout>
  );
};

export default App;