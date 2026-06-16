import React from 'react';
import Button from '../ui/Button';
import { X, AlertCircle } from 'lucide-react';
import { Candidate } from '../../types';

interface NewInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  formData: { candidateId: string; date: string; time: string; type: string };
  setFormData: (data: { candidateId: string; date: string; time: string; type: string }) => void;
  error: string;
  onSubmit: () => void;
}

export const NewInterviewModal: React.FC<NewInterviewModalProps> = ({
  isOpen, onClose, candidates, formData, setFormData, error, onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="new-interview-title">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 id="new-interview-title" className="text-xl font-bold text-gray-900 dark:text-white">Nuovo Colloquio</h3>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            aria-label="Chiudi modale"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Candidato</label>
            <select
              value={formData.candidateId}
              onChange={e => setFormData({ ...formData, candidateId: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-3 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option value="">— Seleziona un candidato —</option>
              {candidates.map(c => (
                <option key={c.id} value={c.id}>{c.name || c.email}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Data</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-3 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Ora</label>
              <input
                type="time"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-3 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo di colloquio</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-3 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option>Colloquio tecnico</option>
              <option>Colloquio HR</option>
              <option>Colloquio conoscitivo</option>
              <option>Colloquio finale</option>
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2" role="alert">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>Annulla</Button>
          <Button variant="primary" onClick={onSubmit}>Aggiungi colloquio</Button>
        </div>
      </div>
    </div>
  );
};