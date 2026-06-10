import React from 'react';
import { Users, TrendingUp, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import { DashboardStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Totale Candidati</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_candidates}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Skill Uniche</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.skills_bar.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Scartati</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.status_distribution.rejected || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top Skill Richieste">
          <ResponsiveContainer width="100%" height={300}>
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
        </Card>
        <Card title="Distribuzione Stati">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stats.status_pie} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {stats.status_pie.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};