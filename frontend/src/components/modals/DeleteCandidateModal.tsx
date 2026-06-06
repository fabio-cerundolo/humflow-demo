import React from 'react';
import Button from '../ui/Button';
import { X, Trash2, Activity } from 'lucide-react';
interface Props { isOpen: boolean; count: number; onClose: () => void; onConfirm: () => void; isDeleting: boolean; }
const DeleteCandidateModal = ({ isOpen, count, onClose, onConfirm, isDeleting }: Props) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Conferma eliminazione</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"><X size={20} /></button>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Sei sicuro di voler eliminare {count} candidato{count !== 1 && 'i'}?<span className="block mt-2 text-sm text-red-600 dark:text-red-400">Operazione irreversibile (GDPR).</span></p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>Annulla</Button>
          <Button variant="primary" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? <><Activity size={16} className="mr-2 animate-spin" />Eliminazione...</> : <><Trash2 size={16} className="mr-2" />Conferma</>}
          </Button>
        </div>
      </div>
    </div>
  );
};
export default DeleteCandidateModal;