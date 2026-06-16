import React from 'react';
import { Plus, FileText, Trash2, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Candidate } from '../types';

interface Props {
  candidates: Candidate[];
  skills: { name: string; target: number }[];
  newName: string; setNewName: (v: string) => void;
  newTarget: number; setNewTarget: (v: number) => void;
  editingName: string | null; setEditingName: (v: string | null) => void;
  editingTarget: number; setEditingTarget: (v: number) => void;
  add: () => void; remove: (n: string) => void; startEdit: (n: string) => void; saveEdit: () => void;
}

export const SkillGapView: React.FC<Props> = ({ candidates, skills, newName, setNewName, newTarget, setNewTarget, editingName, setEditingName, editingTarget, setEditingTarget, add, remove, startEdit, saveEdit }) => {
  return (
    <div className="space-y-6">
      <Card title="Gestisci Obiettivi Recruiting">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Competenza</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Es. Docker..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" onKeyDown={(e) => e.key === 'Enter' && add()} />
          </div>
          <div className="w-full md:w-32">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Target</label>
            <input type="number" min="1" value={newTarget} onChange={(e) => setNewTarget(Number(e.target.value))} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" />
          </div>
          <Button onClick={add} variant="primary" className="w-full md:w-auto"><Plus size={16} className="mr-2" /> Aggiungi</Button>
        </div>
      </Card>

      <Card title="Analisi Gap Competenze">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill, idx) => {
            const actual = candidates.filter(c => c.skills?.some(s => s.toLowerCase() === skill.name.toLowerCase())).length;
            const pct = skill.target > 0 ? Math.min(100, (actual / skill.target) * 100) : 0;
            const gap = skill.target - actual;
            return (
              <div key={`${skill.name}-${idx}`} className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm group relative hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">{skill.name}</h4>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(skill.name)} className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"><FileText size={16} /></button>
                    <button onClick={() => remove(skill.name)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={16} /></button>
                  </div>
                </div>
                {editingName === skill.name ? (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <label className="text-xs text-gray-500 block mb-1">Nuovo Target:</label>
                    <div className="flex gap-2">
                      <input type="number" value={editingTarget} onChange={(e) => setEditingTarget(Number(e.target.value))} className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" autoFocus />
                      <button onClick={saveEdit} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium">Salva</button>
                      <button onClick={() => setEditingName(null)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1 rounded text-xs font-medium">Annulla</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Posseduti: <b className="text-gray-900 dark:text-white">{actual}</b></span><span className="text-gray-500 dark:text-gray-400">Obiettivo: <b className="text-indigo-600 dark:text-indigo-400">{skill.target}</b></span></div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className={`h-full transition-all duration-700 ease-out ${pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} /></div>
                    {gap > 0 ? <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg"><AlertCircle size={14} />Mancano {gap} candidato{gap !== 1 && 'i'}</div> : <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg"><CheckCircle size={14} />Obiettivo Raggiunto!</div>}
                  </div>
                )}
              </div>
            );
          })}
          {skills.length === 0 && <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl"><TrendingUp size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" /><p className="text-gray-500 dark:text-gray-400">Nessuna competenza configurata.</p></div>}
        </div>
      </Card>
    </div>
  );
};