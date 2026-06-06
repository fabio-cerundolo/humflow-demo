import React from 'react';
import { Candidate } from '../types';
import Card from '../components/ui/Card';

interface PipelineViewProps {
  candidates: Candidate[];
  updateStatus: (id: number, status: string) => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({ candidates, updateStatus }) => {
  const statuses = [
    { id: 'new', label: '📥 Nuovi', color: 'border-blue-200 dark:border-blue-800' },
    { id: 'reviewed', label: '🔍 Revisionati', color: 'border-yellow-200 dark:border-yellow-800' },
    { id: 'shortlisted', label: '⭐ Selezionati', color: 'border-emerald-200 dark:border-emerald-800' },
    { id: 'rejected', label: '❌ Scartati', color: 'border-red-200 dark:border-red-800' }
  ];

  const getNextStatus = (current: string) => {
    if (current === 'new') return 'reviewed';
    if (current === 'reviewed') return 'shortlisted';
    if (current === 'shortlisted') return 'rejected';
    return 'new';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statuses.map(status => {
        const candidatesInStatus = candidates.filter(c => c.status === status.id);
        return (
          <Card key={status.id} title={`${status.label} (${candidatesInStatus.length})`} className="h-full">
            <div className="space-y-3">
              {candidatesInStatus.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  Nessun candidato
                </div>
              ) : (
                candidatesInStatus.map(c => (
                  <div key={c.id} className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border ${status.color} hover:shadow-md transition-all group`}>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{c.name || 'Anonimo'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{c.email}</div>
                    <button
                      onClick={() => updateStatus(c.id, getNextStatus(c.status))}
                      className="mt-3 w-full text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      Avanza stato →
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};