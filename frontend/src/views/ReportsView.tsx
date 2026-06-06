import React from 'react';
import { Download, FileText, Users, Clock } from 'lucide-react';
import Card from '../components/ui/Card';
import { Candidate } from '../types';

interface ReportsViewProps {
  candidates: Candidate[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ candidates }) => {
  const handleExportCSV = () => {
    const headers = ['ID', 'Nome', 'Email', 'Telefono', 'Status', 'Skill', 'Data inserimento'];
    const rows = candidates.map(c => [
      c.id, 
      c.name || '', 
      c.email, 
      c.phone || '', 
      c.status, 
      (c.skills || []).join('; '), 
      new Date(c.created_at).toLocaleDateString('it-IT')
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `humflow_candidati_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card title="Esporta e Stampa">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Scarica i dati dei candidati in formato CSV o stampa la reportistica attuale.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-3 p-5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Download size={20} />
            Export CSV (UTF-8)
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-3 p-5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <FileText size={20} />
            Stampa Dashboard
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Totale Candidati nel Report">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <Users className="text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{candidates.length}</div>
          </div>
        </Card>
        <Card title="Ultimo Aggiornamento">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
              <Clock className="text-gray-600 dark:text-gray-300" size={24} />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {new Date().toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'short' })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};