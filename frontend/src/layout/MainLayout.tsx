import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, GitBranch, TrendingUp, 
  FileBarChart, Calendar, Shield, LogOut, Moon, Sun, Menu, X 
} from 'lucide-react';
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
  // Stato per controllare la visibilità della sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
      
      {/* Backdrop per mobile quando la sidebar è aperta */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Collassabile */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out md:relative overflow-hidden ${
          isSidebarOpen 
            ? 'translate-x-0 md:w-64' 
            : '-translate-x-full md:w-0 md:border-none'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header Sidebar con pulsante di chiusura (solo mobile) */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
              <img src={LogoSvg} alt="Humflow Logo" className="h-10 w-auto shrink-0" />
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Humflow</h1>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              aria-label="Chiudi menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-2 custom-scrollbar">
            {menuItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    // Su mobile, chiudi la sidebar dopo aver selezionato una voce
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap overflow-hidden ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'
                  }`}
                >
                  <item.icon size={20} className={`shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer Sidebar */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap overflow-hidden"
            >
              <LogOut size={20} className="shrink-0" />
              <span className="truncate">Esci</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 shrink-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-4">
            {/* Pulsante Hamburger */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={isSidebarOpen ? "Chiudi menu" : "Apri menu"}
            >
              <Menu size={24} />
            </button>
            
            <h2 className="text-lg font-semibold text-gray-800 capitalize dark:text-gray-100 truncate">
              {currentView === 'stats' ? 'Panoramica' : 
               currentView === 'candidates' ? 'Gestione Candidati' : 
               currentView === 'pipeline' ? 'Pipeline Recruiting' : 
               currentView === 'skillgap' ? 'Analisi Competenze' : 
               currentView === 'reports' ? 'Reportistica' : 
               currentView === 'calendar' ? 'Calendario Colloqui' : 
               'Compliance GDPR'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            {/* Toggle Dark Mode */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Cambia tema"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Sistema Online
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs dark:bg-gray-700 dark:text-gray-300 shrink-0">
              AD
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;