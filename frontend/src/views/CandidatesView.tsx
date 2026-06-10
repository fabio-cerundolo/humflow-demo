import React from 'react';
import { Search, Upload, Download, Trash2, Users, X, Filter, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import DeleteCandidateModal from '../components/modals/DeleteCandidateModal';
import { Candidate } from '../types';

interface CandidatesViewProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedSkills: string[];
  toggleSkill: (s: string) => void;
  resetFilters: () => void;
  availableSkills: string[];
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  handleDrop: (e: React.DragEvent) => void;
  uploadFiles: (files: File[]) => void;
  uploadingFiles: { name: string; status: 'pending' | 'uploading' | 'success' | 'error' }[];
  filteredCandidates: Candidate[];
  paginatedCandidates: Candidate[];
  totalCandidatePages: number;
  candidatesPage: number;
  setCandidatesPage: (v: number) => void;
  allSelected: boolean;
  someSelected: boolean;
  selectedCandidates: Set<number>;
  setSelectedCandidates: (v: Set<number>) => void;
  toggleSelectAll: (v: boolean) => void;
  toggleSelectOne: (id: number, v: boolean) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (v: boolean) => void;
  isDeleting: boolean;
  handleDeleteSelected: () => void;
  updateStatus: (id: number, status: string) => void;
  api: any;
}

export const CandidatesView: React.FC<CandidatesViewProps> = ({
  searchTerm, setSearchTerm, selectedSkills, toggleSkill, resetFilters, availableSkills,
  isDragging, setIsDragging, handleDrop, uploadFiles, uploadingFiles,
  filteredCandidates, paginatedCandidates, totalCandidatePages, candidatesPage, setCandidatesPage,
  allSelected, someSelected, selectedCandidates, setSelectedCandidates, toggleSelectAll, toggleSelectOne,
  showDeleteModal, setShowDeleteModal, isDeleting, handleDeleteSelected, updateStatus, api
}) => {
  
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await uploadFiles(Array.from(e.target.files));
      e.target.value = ''; 
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'reviewed': return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'shortlisted': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <aside className="w-full md:w-72 shrink-0 sticky top-24 self-start space-y-4">
        <Card title="Filtri e Ricerca" className="shadow-sm flex flex-col">
          <div className="space-y-5 flex-1">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Cerca</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nome, email o skill..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 py-2 pl-9 pr-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                  aria-label="Cerca candidati"
                />
              </div>
            </div>

            {availableSkills.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Competenze</label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {availableSkills.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-1.5 ${
                        selectedSkills.includes(skill)
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      aria-pressed={selectedSkills.includes(skill)}
                    >
                      {skill}
                      {selectedSkills.includes(skill) && <X size={12} className="opacity-70" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(searchTerm || selectedSkills.length > 0) && (
            <div className="pt-4 mt-5 border-t border-gray-100 dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={resetFilters} 
                className="w-full text-xs py-2.5 justify-center font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
              >
                Resetta filtri
              </Button>
            </div>
          )}
        </Card>

        <Card title="Carica Nuovi CV" className="shadow-sm">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-800/50'
            }`}
            role="region"
            aria-label="Area di upload drag and drop"
          >
            <Upload size={24} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Trascina i file qui o{' '}
              <label className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                sfoglia
                <input type="file" multiple accept=".pdf,.docx" className="hidden" onChange={handleFileInput} />
              </label>
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">PDF, DOCX • Upload multiplo</p>
          </div>

          {uploadingFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">In caricamento</p>
              {uploadingFiles.map(file => (
                <div key={file.name} className="flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <span className="text-[11px] text-gray-700 dark:text-gray-200 truncate max-w-[120px]">
                    {file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}
                  </span>
                  <span className="text-xs">
                    {file.status === 'pending' && '📤'}
                    {file.status === 'uploading' && <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse inline-block" />}
                    {file.status === 'success' && <span className="text-emerald-500">✅</span>}
                    {file.status === 'error' && <span className="text-red-500">❌</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <Filter size={18} />
            <span className="text-sm font-semibold">Risultati</span>
          </div>
          <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">
            {filteredCandidates.length}
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
            su {paginatedCandidates.length} in pagina
          </p>
        </div>
      </aside>

      <div className="flex-1 min-w-0 w-full">
        {someSelected && (
          <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 animate-in fade-in slide-in-from-top-2">
            <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">{selectedCandidates.size} selezionati</span>
            <Button variant="secondary" onClick={() => setShowDeleteModal(true)} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800 text-xs py-2">
              <Trash2 size={14} className="mr-2" /> Elimina selezionati
            </Button>
          </div>
        )}

        <Card title={`Candidati (${filteredCandidates.length})`} noPadding className="shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Lista candidati">
              <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-left w-12">
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
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Data</th>
                  <th className="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Note / Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedCandidates.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
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
                            <span className="px-2 py-0.5 rounded text-[10px] text-gray-500 dark:text-gray-400">+{c.skills.length - 3}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <select
                        value={c.status}
                        onChange={e => updateStatus(c.id, e.target.value)}
                        className={`text-[10px] font-bold uppercase py-1.5 px-3 rounded-full border bg-transparent outline-none cursor-pointer transition-all focus:ring-2 focus:ring-indigo-500 ${getStatusColor(c.status)}`}
                        aria-label={`Cambia stato di ${c.name || c.email}`}
                      >
                        <option value="new">Nuovo</option>
                        <option value="reviewed">Revisionato</option>
                        <option value="shortlisted">Selezionato</option>
                        <option value="rejected">Scartato</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {/* LOGICA DOWNLOAD REALE */}
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
                            } catch { 
                              alert('Errore nel download del CV.'); 
                            }
                          }}
                          className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          title="Scarica CV"
                        >
                          <Download size={16} />
                        </button>
                        
                        {/* LOGICA ELIMINAZIONE REALE */}
                        <button
                          onClick={() => {
                            setSelectedCandidates(new Set([c.id]));
                            setShowDeleteModal(true);
                          }}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                          title="Elimina (GDPR)"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">
                      {new Date(c.created_at).toLocaleDateString('it-IT')}
                    </td>
                    <td className="p-4">
                      {c.status === 'rejected' && c.rejection_reason ? (
                        <span className="text-[10px] text-red-500 dark:text-red-400 flex items-start gap-1 font-medium">
                          <AlertCircle size={12} className="mt-0.5 shrink-0" /> 
                          {c.rejection_reason}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCandidates.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-medium">Nessun candidato corrisponde ai filtri selezionati.</p>
              <button onClick={resetFilters} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2">Cancella tutti i filtri</button>
            </div>
          )}

          {filteredCandidates.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
              <Pagination
                currentPage={candidatesPage}
                totalPages={totalCandidatePages}
                onPageChange={setCandidatesPage}
                totalItems={filteredCandidates.length}
                itemsPerPage={10}
              />
            </div>
          )}
        </Card>
      </div>

      <DeleteCandidateModal 
        isOpen={showDeleteModal}
        count={selectedCandidates.size}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteSelected}
        isDeleting={isDeleting}
      />
    </div>
  );
};