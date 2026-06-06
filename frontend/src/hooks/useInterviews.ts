import { useState, useMemo, useEffect } from 'react';
import { Candidate, Interview } from '../types';

const INTERVIEWS_PER_PAGE = 5;

export const useInterviews = (candidates: Candidate[]) => {
  // --- STATO ---
  const [manualInterviews, setManualInterviews] = useState<Interview[]>([]);
  const [showNewInterviewModal, setShowNewInterviewModal] = useState(false);
  const [newInterviewForm, setNewInterviewForm] = useState({
    candidateId: '',
    date: '',
    time: '',
    type: 'Colloquio tecnico',
  });
  const [newInterviewError, setNewInterviewError] = useState('');

  // Filtri Colloqui
  const [interviewSearchTerm, setInterviewSearchTerm] = useState('');
  const [interviewTypeFilter, setInterviewTypeFilter] = useState('');

  // Cancellazione
  const [deletedMockInterviewIds, setDeletedMockInterviewIds] = useState<Set<number>>(new Set());
  const [showDeleteInterviewModal, setShowDeleteInterviewModal] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<Interview | null>(null);

  // Paginazione
  const [interviewsPage, setInterviewsPage] = useState(1);

  // Reset pagina quando cambiano i filtri
  useEffect(() => {
    setInterviewsPage(1);
  }, [interviewSearchTerm, interviewTypeFilter]);

  // --- DERIVATI ---
  const mockInterviews = useMemo(() => {
    return candidates.slice(0, Math.min(candidates.length, 20)).map((c, idx) => ({
      id: c.id * -1,
      candidateId: c.id,
      candidateName: c.name || 'Candidato senza nome',
      candidateEmail: c.email,
      date: '',
      time: idx % 3 === 0 ? 'Oggi, 15:30' : idx % 3 === 1 ? 'Domani, 10:00' : '12 Mag, 14:00',
      type: idx % 2 === 0 ? 'Colloquio tecnico' : 'Colloquio HR',
    }));
  }, [candidates]);

  const allInterviews = useMemo(() => {
    return [
      ...manualInterviews, 
      ...mockInterviews.filter(m => !deletedMockInterviewIds.has(m.id))
    ];
  }, [manualInterviews, mockInterviews, deletedMockInterviewIds]);

  const filteredInterviews = useMemo(() => {
    return allInterviews.filter(i => {
      const matchesSearch = interviewSearchTerm === '' ||
        i.candidateName.toLowerCase().includes(interviewSearchTerm.toLowerCase()) ||
        i.candidateEmail.toLowerCase().includes(interviewSearchTerm.toLowerCase());
      const matchesType = interviewTypeFilter === '' || i.type === interviewTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [allInterviews, interviewSearchTerm, interviewTypeFilter]);

  const totalInterviewPages = Math.ceil(filteredInterviews.length / INTERVIEWS_PER_PAGE);
  
  const paginatedInterviews = useMemo(() => {
    return filteredInterviews.slice(
      (interviewsPage - 1) * INTERVIEWS_PER_PAGE,
      interviewsPage * INTERVIEWS_PER_PAGE
    );
  }, [filteredInterviews, interviewsPage]);

  // --- AZIONI ---
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
  };

  const handleDeleteInterview = () => {
    if (!interviewToDelete) return;
    
    if (interviewToDelete.id > 0) {
      // È un colloquio manuale
      setManualInterviews(prev => prev.filter(i => i.id !== interviewToDelete!.id));
    } else {
      // È un colloquio mock
      setDeletedMockInterviewIds(prev => {
        const next = new Set(Array.from(prev));
        next.add(interviewToDelete!.id);
        return next;
      });
    }
    
    setShowDeleteInterviewModal(false);
    setInterviewToDelete(null);
  };

  return {
    manualInterviews, setManualInterviews,
    showNewInterviewModal, setShowNewInterviewModal,
    newInterviewForm, setNewInterviewForm,
    newInterviewError, setNewInterviewError,
    interviewSearchTerm, setInterviewSearchTerm,
    interviewTypeFilter, setInterviewTypeFilter,
    deletedMockInterviewIds, setDeletedMockInterviewIds,
    showDeleteInterviewModal, setShowDeleteInterviewModal,
    interviewToDelete, setInterviewToDelete,
    interviewsPage, setInterviewsPage,
    allInterviews, filteredInterviews, paginatedInterviews, totalInterviewPages,
    handleAddInterview, handleDeleteInterview
  };
};