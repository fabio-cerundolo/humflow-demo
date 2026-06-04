import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const CandidateDetail = () => {
  return (
    <div>
      <nav className="text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
        <a href="/" className="hover:underline">Home</a> 
        <span className="mx-2">/</span> 
        <span className="font-semibold text-gray-800">Dettaglio Candidato</span>
      </nav>

      <Card title="Profilo Candidato">
        <p className="text-gray-700 mb-4">Qui verranno mostrati i dettagli del candidato, il punteggio e le competenze estratte dall'AI.</p>
        <div className="flex gap-4">
          <Button variant="primary">Scarica CV</Button>
          <Button variant="secondary">Torna alla Dashboard</Button>
        </div>
      </Card>
    </div>
  );
};

export default CandidateDetail;