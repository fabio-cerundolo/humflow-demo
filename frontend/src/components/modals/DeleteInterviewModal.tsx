import React from 'react';
import Button from '../ui/Button';
import { X, Trash2 } from 'lucide-react';

interface DeleteInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  interviewTime: string;
  interviewType: string;
  onConfirm: () => void;
}

export const DeleteInterviewModal: React.FC<DeleteInterviewModalProps> = ({
  isOpen, onClose, candidateName, interviewTime, interviewType, onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-interview-title">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 id="delete-interview-title" className="text-xl font-bold text-gray-900 dark:text-white">Cancella colloquio</h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500" 
            aria-label="Chiudi modale"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Sei sicuro di voler cancellare il colloquio con <span className="font-semibold text-gray-900 dark:text-white">{candidateName}</span>?
        </p>
        
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 mb-6">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{interviewTime}</p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">{interviewType}</p>
        </div>
        
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Annulla</Button>
          <Button 
            variant="primary" 
            onClick={onConfirm} 
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-red-200 dark:shadow-none"
          >
            <Trash2 size={16} className="mr-2" />
            Conferma cancellazione
          </Button>
        </div>
      </div>
    </div>
  );
};