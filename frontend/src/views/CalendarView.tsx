import React from 'react';
import { Search, Plus, X, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import { NewInterviewModal } from '../components/modals/NewInterviewModal';
import { DeleteInterviewModal } from '../components/modals/DeleteInterviewModal';
import { Candidate, Interview } from '../types';

interface CalendarViewProps {
  candidates: Candidate[];
  filteredInterviews: Interview[];
  paginatedInterviews: Interview[];
  totalInterviewPages: number;
  interviewsPage: number;
  setInterviewsPage: (v: number) => void;
  interviewSearchTerm: string;
  setInterviewSearchTerm: (v: string) => void;
  interviewTypeFilter: string;
  setInterviewTypeFilter: (v: string) => void;
  showNewInterviewModal: boolean;
  setShowNewInterviewModal: (v: boolean) => void;
  newInterviewForm: { candidateId: string; date: string; time: string; type: string };
  setNewInterviewForm: (v: any) => void;
  newInterviewError: string;
  handleAddInterview: () => void;
  showDeleteInterviewModal: boolean;
  setShowDeleteInterviewModal: (v: boolean) => void;
  interviewToDelete: Interview | null;
  handleDeleteInterview: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  candidates, filteredInterviews, paginatedInterviews, totalInterviewPages, interviewsPage, setInterviewsPage,
  interviewSearchTerm, setInterviewSearchTerm, interviewTypeFilter, setInterviewTypeFilter,
  showNewInterviewModal, setShowNewInterviewModal, newInterviewForm, setNewInterviewForm, newInterviewError, handleAddInterview,
  showDeleteInterviewModal, setShowDeleteInterviewModal, interviewToDelete, handleDeleteInterview
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Prossimi Colloqui</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredInterviews.length > 0 ? `${filteredInterviews.length} colloqui programmati` : 'Nessun colloquio corrisponde ai filtri'}
          </p>
        </div>
        <Button onClick={() => setShowNewInterviewModal(true)} variant="primary">
          <Plus size={16} className="mr-2" /> Nuovo colloquio
        </Button>
      </div>

      <Card title="Filtri">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca candidato..."
              value={interviewSearchTerm}
              onChange={e => setInterviewSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 py-2.5 pl-9 pr-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
          <select
            value={interviewTypeFilter}
            onChange={e => setInterviewTypeFilter(e.target.value)}
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 py-2.5 px-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tutti i tipi</option>
            <option value="Colloquio tecnico">Colloquio tecnico</option>
            <option value="Colloquio HR">Colloquio HR</option>
            <option value="Colloquio conoscitivo">Colloquio conoscitivo</option>
            <option value="Colloquio finale">Colloquio finale</option>
          </select>
          {(interviewSearchTerm || interviewTypeFilter) && (
            <button onClick={() => { setInterviewSearchTerm(''); setInterviewTypeFilter(''); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 px-3 rounded-xl flex items-center gap-1.5 text-xs transition-all">
              <X size={14} /> Reset
            </button>
          )}
        </div>
      </Card>

      <Card title="Lista Colloqui" noPadding>
        {filteredInterviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nessun colloquio trovato.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedInterviews.map((c) => (
                <div key={c.id} className="group flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                      {c.candidateName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{c.candidateName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{c.candidateEmail}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 font-medium">{c.time}</div>
                      <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">{c.type}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteInterviewModal(true)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label={`Cancella colloquio con ${c.candidateName}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination currentPage={interviewsPage} totalPages={totalInterviewPages} onPageChange={setInterviewsPage} totalItems={filteredInterviews.length} itemsPerPage={5} />
            </div>
          </>
        )}
      </Card>

      {/* Modali Integrati */}
      <NewInterviewModal
        isOpen={showNewInterviewModal}
        onClose={() => setShowNewInterviewModal(false)}
        candidates={candidates}
        formData={newInterviewForm}
        setFormData={setNewInterviewForm}
        error={newInterviewError}
        onSubmit={handleAddInterview}
      />

      {interviewToDelete && (
        <DeleteInterviewModal
          isOpen={showDeleteInterviewModal}
          onClose={() => setShowDeleteInterviewModal(false)}
          candidateName={interviewToDelete.candidateName}
          interviewTime={interviewToDelete.time}
          interviewType={interviewToDelete.type}
          onConfirm={handleDeleteInterview}
        />
      )}
    </div>
  );
};