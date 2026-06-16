import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const Upload = () => {
  return (
    <div>
      <nav className="text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
        <a href="/" className="hover:underline">Home</a> 
        <span className="mx-2">/</span> 
        <span className="font-semibold text-gray-800">Carica CV</span>
      </nav>

      <Card title="Carica un nuovo Curriculum">
        <div className="mb-4">
          <label htmlFor="cv-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Seleziona file (PDF, DOCX)
          </label>
          <input 
            id="cv-upload"
            type="file" 
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <Button variant="primary" type="submit">Avvia Analisi</Button>
      </Card>
    </div>
  );
};

export default Upload;