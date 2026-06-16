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
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <Shield className="text-emerald-600 dark:text-emerald-400" size={24} />
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-200">Sistema Conforme</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Tutti i dati sono gestiti secondo le normative vigenti.</p>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-sm text-gray-700 dark:text-gray-300">Candidati totali gestiti: <strong>{candidates.length}</strong></p>
        </div>
      </Card>
    </div>
  );
};