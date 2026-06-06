import React from 'react';
import { CheckCircle, Shield } from 'lucide-react';
import Card from '../components/ui/Card';
import { Candidate } from '../types';

interface GdprViewProps {
  candidates: Candidate[];
}

export const GdprView: React.FC<GdprViewProps> = ({ candidates }) => {
  return (
    <div className="space-y-6">
      <Card title="Registro Audit Privacy (GDPR)">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Conformità ai sensi del Regolamento UE 2016/679. Registro delle informative e dei tempi di retention.
        </p>
        
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-6 flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Sistema Integro: Tutte le informative sono state registrate correttamente.</span>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {candidates.map(c => (
            <div key={c.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Art. 14 Informative Sent</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">Completed</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Retention Policy</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">180 giorni dalla creazione</p>
              </div>
            </div>
          ))}
          {candidates.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Shield size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nessun dato presente nel sistema.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default GdprView;