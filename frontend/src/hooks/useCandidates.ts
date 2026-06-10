import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Candidate, DashboardStats } from '../types';

const API_BASE = "http://localhost:8000";
const CANDIDATES_PER_PAGE = 10;

export const useCandidates = (token: string | null) => {
  // --- STATO ---
  const [view, setView] = useState('stats');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Filtri e Ricerca
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  // Selezione multipla ed eliminazione
  const [selectedCandidates, setSelectedCandidates] = useState<Set<number>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Upload Drag & Drop
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; status: 'pending' | 'uploading' | 'success' | 'error' }[]>([]);
  
  // Paginazione
  const [candidatesPage, setCandidatesPage] = useState(1);

  // --- API INSTANCE ---
  const api = useMemo(() => axios.create({
    baseURL: API_BASE,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }), [token]);

  // --- FETCH DATA ---
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
      if (err.response?.status === 401) {
        localStorage.removeItem('flux_token');
        window.location.reload(); // Forza il logout
      }
    }
  };

  // Auto-fetch e polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [token, api]);

  // Reset pagina quando cambia la ricerca
  useEffect(() => {
    setCandidatesPage(1);
  }, [searchTerm, selectedSkills]);

  // --- CRUD & AZIONI ---
  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/candidates/${id}/status`, { status: newStatus });
      fetchData();
    } catch {
      alert("Errore nell'aggiornamento dello stato.");
    }
  };

  const deleteSingleCandidate = async (id: number) => {
    await api.delete(`/candidates/${id}`);
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    const ids = Array.from(selectedCandidates);
    try {
      await Promise.all(ids.map(id => deleteSingleCandidate(id)));
      await fetchData();
      setSelectedCandidates(new Set());
      setShowDeleteModal(false);
    } catch {
      alert("Errore durante l'eliminazione di alcuni candidati.");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- SELEZIONE MULTIPLA ---
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(new Set(paginatedCandidates.map(c => c.id)));
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

  // --- UPLOAD LOGIC ---
  const uploadCV = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/upload-cv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return { success: true };
    } catch {
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
      setUploadingFiles(prev => prev.map(u => u.name === file.name ? { ...u, status: 'uploading' } : u));
      const result = await uploadCV(file);
      setUploadingFiles(prev => prev.map(u => u.name === file.name ? { ...u, status: result.success ? 'success' : 'error' } : u));
    }
    
    await fetchData();
    setTimeout(() => {
      setUploadingFiles(prev => prev.filter(u => u.status !== 'success' && u.status !== 'error'));
    }, 4000);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await uploadFiles(Array.from(e.dataTransfer.files));
  };

  // --- FILTRI ---
  const availableSkills = useMemo(() => {
    const skillSet = new Set<string>();
    candidates.forEach(c => c.skills?.forEach(skill => skillSet.add(skill)));
    return Array.from(skillSet).sort();
  }, [candidates]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedSkills([]);
    setSelectedCandidates(new Set());
    setCandidatesPage(1);
  };

  // --- DERIVATI (Paginazione e Filtri) ---
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesText = searchTerm === "" ||
        (c.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesText) return false;
      if (selectedSkills.length === 0) return true;
      return c.skills?.some(skill => selectedSkills.includes(skill));
    });
  }, [candidates, searchTerm, selectedSkills]);

  const totalCandidatePages = Math.ceil(filteredCandidates.length / CANDIDATES_PER_PAGE);
  
  const paginatedCandidates = useMemo(() => {
    return filteredCandidates.slice(
      (candidatesPage - 1) * CANDIDATES_PER_PAGE,
      candidatesPage * CANDIDATES_PER_PAGE
    );
  }, [filteredCandidates, candidatesPage]);

  const allSelected = paginatedCandidates.length > 0 && paginatedCandidates.every(c => selectedCandidates.has(c.id));
  const someSelected = selectedCandidates.size > 0;

  return {
    view, setView,
    candidates, stats, fetchData,
    searchTerm, setSearchTerm,
    selectedSkills, setSelectedSkills,
    availableSkills, toggleSkill, resetFilters,
    selectedCandidates, setSelectedCandidates,
    showDeleteModal, setShowDeleteModal, isDeleting, handleDeleteSelected,
    toggleSelectAll, toggleSelectOne, allSelected, someSelected,
    isDragging, setIsDragging, handleDrop, uploadingFiles, uploadFiles,
    candidatesPage, setCandidatesPage, filteredCandidates, paginatedCandidates, totalCandidatePages,
    updateStatus,
    api
  };
};