import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, PieChart as PieChartIcon } from 'lucide-react';
import Card from '../components/ui/Card';
import { DashboardStats } from '../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Riga Superiore: Metriche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Totale Candidati" className="flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <Users className="text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total_candidates}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Talenti nel database</p>
            </div>
          </div>
        </Card>

        <Card title="Distribuzione Skill (Top 5)">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.skills_bar.slice(0, 5)}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
                <YAxis stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }}
                  itemStyle={{ color: '#111827' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Stato Candidati">
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.status_pie}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {stats.status_pie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Riga Inferiore: Trend */}
      <Card title="Trend Assunzioni">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Andamento settimanale delle skill richieste</p>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
            <TrendingUp size={16} />
            <span className="text-sm font-medium">+32% vs mese scorso</span>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.skills_bar}>
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
              <YAxis stroke="#9ca3af" fontSize={12} tick={{ fill: '#9ca3af' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }}
                itemStyle={{ color: '#111827' }}
                cursor={{ fill: '#f3f4f6' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};