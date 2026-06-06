import React, { useState, useEffect } from 'react';
import MainLayout from './layout/MainLayout';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useCandidates } from './hooks/useCandidates';
import { useInterviews } from './hooks/useInterviews';
import { useSkillGap } from './hooks/useSkillGap';

// Views
import { DashboardView } from './views/DashboardView';
import { CandidatesView } from './views/CandidatesView';
import { PipelineView } from './views/PipelineView';
import { SkillGapView } from './views/SkillGapView';
import { ReportsView } from './views/ReportsView';
import { CalendarView } from './views/CalendarView';
import { GdprView } from './views/GdprView';

const App: React.FC = () => {
  // 1. Tema
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // 2. Inizializzazione Hooks
  const { token, loginData, setLoginData, loginError, handleLogin, handleLogout } = useAuth();
  
  const candidatesLogic = useCandidates(token);
  const { view, setView, candidates, stats, /* ... destruttura il resto ... */ } = candidatesLogic;
  
  const interviewsLogic = useInterviews(candidates);
  const skillGapLogic = useSkillGap();

  // 3. Render Login
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Humflow</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Access Protocollo Sicurezza Talent v3.0</p>
          </div>
          {loginError && <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">Credenziali non valide.</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Username" value={loginData.username} onChange={e => setLoginData({ ...loginData, username: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" required />
            <input type="password" placeholder="Password" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" required />
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors">Accedi</button>
          </form>
        </div>
      </div>
    );
  }

  // 4. Render Applicazione (Orchestratore)
  return (
    <MainLayout 
      currentView={view} 
      onViewChange={setView} 
      onLogout={handleLogout} 
      isDarkMode={isDarkMode} 
      toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
    >
      {view === 'stats' && <DashboardView stats={stats} />}
      {view === 'candidates' && <CandidatesView {...candidatesLogic} />}
      {view === 'pipeline' && <PipelineView candidates={candidates} updateStatus={candidatesLogic.updateStatus} />}
      {view === 'skillgap' && <SkillGapView candidates={candidates} {...skillGapLogic} />}
      {view === 'reports' && <ReportsView candidates={candidates} />}
      {view === 'calendar' && <CalendarView candidates={candidates} {...interviewsLogic} />}
      {view === 'gdpr' && <GdprView candidates={candidates} />}
    </MainLayout>
  );
};

export default App;