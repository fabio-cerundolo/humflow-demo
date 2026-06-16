import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Dashboard = () => {
  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
        <span>Home</span> <span className="mx-2">/</span> <span className="font-semibold text-gray-800">Dashboard</span>
      </nav>

      {/* Card riepilogo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card title="Candidati totali">
          <p className="text-3xl font-bold text-blue-600">124</p>
        </Card>
        <Card title="Analisi completate">
          <p className="text-3xl font-bold text-green-600">98</p>
        </Card>
        <Card title="Notifiche in attesa">
          <p className="text-3xl font-bold text-orange-500">7</p>
        </Card>
      </div>

      {/* Tabella candidati */}
      <Card title="Lista Candidati Recenti">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left font-medium text-gray-600 border-b">Nome</th>
                <th className="p-3 text-left font-medium text-gray-600 border-b">Stato</th>
                <th className="p-3 text-left font-medium text-gray-600 border-b">Data</th>
                <th className="p-3 text-left font-medium text-gray-600 border-b">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {/* Esempio di riga */}
              <tr className="hover:bg-gray-50">
                <td className="p-3 border-b text-gray-800">Mario Rossi</td>
                <td className="p-3 border-b">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completato</span>
                </td>
                <td className="p-3 border-b text-gray-600">04/06/2026</td>
                <td className="p-3 border-b">
                  <Button variant="secondary" onClick={() => console.log('View Mario')}>Dettagli</Button>
                </td>
              </tr>
              {/* Loop sui candidati reali... */}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pulsante di azione globale */}
      <div className="mt-6 flex justify-end">
        <Button onClick={() => console.log('Upload new CV')}>
          Carica nuovo CV
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;