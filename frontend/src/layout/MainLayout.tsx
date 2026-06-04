import React from 'react';
import { LayoutDashboard, Users, GitBranch, TrendingUp, FileBarChart, Calendar, Shield, LogOut, Moon, Sun } from 'lucide-react';
import LogoSvg from '../assets/logo.svg'; 

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  currentView, 
  onViewChange, 
  onLogout, 
  isDarkMode, 
  toggleDarkMode 
}) => {
  const menuItems = [
    { id: 'stats', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'candidates', icon: Users, label: 'Candidati' },
    { id: 'pipeline', icon: GitBranch, label: 'Pipeline' },
    { id: 'skillgap', icon: TrendingUp, label: 'Skill Gap' },
    { id: 'reports', icon: FileBarChart, label: 'Report' },
    { id: 'calendar', icon: Calendar, label: 'Colloqui' },
    { id: 'gdpr', icon: Shield, label: 'Privacy' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0 z-20 dark:bg-gray-800 dark:border-gray-700">
        <div className="p-6 flex items-center gap-3">
          {/* LOGO SVG */}
          <img 
            src={LogoSvg} 
            alt="Humflow Logo" 
            className="h-10 w-auto" 
          />
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Humflow</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={20} />
            Esci
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shrink-0 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 capitalize dark:text-gray-100">
            {currentView === 'stats' ? 'Panoramica' : 
             currentView === 'candidates' ? 'Gestione Candidati' : 
             currentView === 'pipeline' ? 'Pipeline Recruiting' : 
             currentView === 'skillgap' ? 'Analisi Competenze' : 
             currentView === 'reports' ? 'Reportistica' : 
             currentView === 'calendar' ? 'Calendario Colloqui' : 
             'Compliance GDPR'}
          </h2>
          
          <div className="flex items-center gap-4">
            {/* Toggle Dark Mode */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
              aria-label="Cambia tema"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Sistema Online
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs dark:bg-gray-700 dark:text-gray-300">
              AD
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;