import { useState } from 'react';
export const useSkillGap = () => {
  const [skills, setSkills] = useState([{ name: 'Python', target: 8 }, { name: 'React', target: 6 }, { name: 'TypeScript', target: 5 }, { name: 'AWS', target: 4 }, { name: 'Leadership', target: 3 }]);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState(5);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<number>(0);

  const add = () => { if (!newName.trim()) return; if (skills.some(s => s.name.toLowerCase() === newName.toLowerCase())) return alert("Esistente"); setSkills([...skills, { name: newName, target: Number(newTarget) }]); setNewName(''); setNewTarget(5); };
  const remove = (n: string) => { if (window.confirm(`Rimuovere "${n}"?`)) setSkills(skills.filter(s => s.name !== n)); };
  const startEdit = (n: string) => { const s = skills.find(x => x.name === n); if (s) { setEditingName(n); setEditingTarget(s.target); } };
  const saveEdit = () => { if (!editingName) return; setSkills(skills.map(s => s.name === editingName ? { ...s, target: editingTarget } : s)); setEditingName(null); };
  return { skills, newName, setNewName, newTarget, setNewTarget, editingName, setEditingName, editingTarget, setEditingTarget, add, remove, startEdit, saveEdit };
};