import { useState, useEffect, useCallback, useMemo } from 'react';
import axios, { AxiosInstance } from 'axios';
import { Candidate, DashboardStats } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useCandidates = (token: string | null) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; status: 'pending' | 'uploading' | 'success' | 'error' }[]>([]);

  const [selectedCandidates, setSelectedCandidates] = useState<Set<number>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [candidatesPage, setCandidatesPage] = useState(1);
  const itemsPerPage = 10;

  const api: AxiosInstance = useMemo<AxiosInstance>(() => axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }), [token]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [candidatesRes, statsRes] = await Promise.all([
        api.get('/candidates'),
        api.get('/stats')
      ]);
      setCandidates(candidatesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
    } finally {
      setLoading(false);
    }
  }, [api, token]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  useEffect(() => {
    if (!token) return;
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [token, fetchData]);

  const availableSkills = useMemo(() => {
    return Array.from(new Set(candidates.flatMap(c => c.skills || []))).sort();
  }, [candidates]);

  // 🔥 CORREZIONE: Ora la ricerca controlla anche le skill
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const lowerSearch = searchTerm.toLowerCase();

      const matchesSearch =
        c.name?.toLowerCase().includes(lowerSearch) ||
        c.email.toLowerCase().includes(lowerSearch) ||
        (c.skills && c.skills.some(skill => skill.toLowerCase().includes(lowerSearch))); // <-- AGGIUNTO

      const matchesSkills =
        selectedSkills.length === 0 ||
        selectedSkills.every(skill => c.skills?.includes(skill));

      return matchesSearch && matchesSkills;
    });
  }, [candidates, searchTerm, selectedSkills]);

  const totalCandidatePages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice(
    (candidatesPage - 1) * itemsPerPage,
    candidatesPage * itemsPerPage
  );

  useEffect(() => {
    setCandidatesPage(1);
  }, [searchTerm, selectedSkills]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSkills([]);
  };

  const uploadFiles = async (files: File[]) => {
    const newUploadingFiles = files.map(file => ({ name: file.name, status: 'pending' as const }));
    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        setUploadingFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'uploading' } : f));
        await api.post('/upload-cv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setUploadingFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'success' } : f));
      } catch (error) {
        console.error(`Errore upload ${file.name}:`, error);
        setUploadingFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'error' } : f));
      }
    }
    await fetchData();
    setTimeout(() => setUploadingFiles([]), 3000);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedCandidates(checked ? new Set(paginatedCandidates.map(c => c.id)) : new Set());
  };

  const toggleSelectOne = (id: number, checked: boolean) => {
    const newSet = new Set(selectedCandidates);
    checked ? newSet.add(id) : newSet.delete(id);
    setSelectedCandidates(newSet);
  };

  const allSelected = paginatedCandidates.length > 0 && paginatedCandidates.every(c => selectedCandidates.has(c.id));
  const someSelected = selectedCandidates.size > 0 && !allSelected;

  const handleDeleteSelected = async () => {
    if (selectedCandidates.size === 0) return;
    setIsDeleting(true);
    try {
      await Promise.all(Array.from(selectedCandidates).map(id => api.delete(`/candidates/${id}`)));
      setSelectedCandidates(new Set());
      setShowDeleteModal(false);
      await fetchData();
    } catch (error) {
      console.error('Errore eliminazione:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteCandidate = async (id: number) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo candidato?")) return;
    try {
      await api.delete(`/candidates/${id}`);
      await fetchData();
    } catch (error) {
      console.error("Errore eliminazione candidato:", error);
    }
  };

  const deleteAllCandidates = async () => {
    if (!window.confirm("⚠️ ATTENZIONE: Stai per eliminare TUTTI i candidati. Questa azione è IRREVERSIBILE. Continuare?")) return;
    if (!window.confirm("🚨 CONFERMA FINALE: Sei assolutamente sicuro di voler eliminare TUTTI i candidati?")) return;
    try {
      await api.delete('/candidates/bulk-delete-all');
      setSelectedCandidates(new Set());
      await fetchData();
    } catch (error) {
      console.error("Errore eliminazione totale:", error);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/candidates/${id}/status`, { status: newStatus });
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      await fetchData();
    } catch (error) {
      console.error('Errore aggiornamento stato:', error);
    }
  };

  return {
    candidates, stats, loading, fetchData, api,
    searchTerm, setSearchTerm, selectedSkills, setSelectedSkills, availableSkills, toggleSkill, resetFilters,
    isDragging, setIsDragging, handleDrop, uploadingFiles, uploadFiles,
    filteredCandidates, paginatedCandidates, totalCandidatePages, candidatesPage, setCandidatesPage,
    selectedCandidates, setSelectedCandidates, toggleSelectAll, toggleSelectOne, allSelected, someSelected,
    showDeleteModal, setShowDeleteModal, isDeleting, handleDeleteSelected, updateStatus,
    deleteCandidate, deleteAllCandidates
  };
};