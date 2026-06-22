export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Candidate {
  [x: string]: null;
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  skills: string[];
  status: 'new' | 'reviewed' | 'shortlisted' | 'rejected';
  rejection_reason: string | null;
  cv_filename: string | null;
  created_at: string;
}

export interface Stats {
  total_candidates: number;
  skills_bar: { name: string; count: number }[];
  status_pie: { name: string; value: number }[];
  status_distribution: {
    new?: number;
    reviewed?: number;
    shortlisted?: number;
    rejected?: number;
  };
}

const getHeaders = (token: string | null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  login: async (username: string, password: string) => {
    const res = await fetch(`${API_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      throw new Error('Credenziali non valide o server non raggiungibile');
    }
    return res.json(); // { access_token, token_type }
  },

  getStats: async (token: string | null): Promise<Stats> => {
    const res = await fetch(`${API_URL}/stats`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      throw new Error('Impossibile caricare le statistiche');
    }
    return res.json();
  },

  getCandidates: async (token: string | null): Promise<Candidate[]> => {
    const res = await fetch(`${API_URL}/candidates`, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      throw new Error('Impossibile caricare i candidati');
    }
    return res.json();
  },

  updateStatus: async (token: string | null, id: number, status: string) => {
    const res = await fetch(`${API_URL}/candidates/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error('Impossibile aggiornare lo stato del candidato');
    }
    return res.json();
  },

  deleteCandidate: async (token: string | null, id: number) => {
    const res = await fetch(`${API_URL}/candidates/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    if (!res.ok) {
      throw new Error('Impossibile eliminare il candidato');
    }
    return res.json();
  },

  deleteAllCandidates: async (token: string | null) => {
    // Usa POST /candidates/bulk-delete-all come da correzione nel backend
    const res = await fetch(`${API_URL}/candidates/bulk-delete-all`, {
      method: 'POST',
      headers: getHeaders(token),
    });
    if (!res.ok) {
      throw new Error("Impossibile eliminare tutti i candidati");
    }
    return res.json();
  },

  downloadCv: async (token: string | null, candidateId: number, fileName?: string) => {
    const response = await fetch(`${API_URL}/api/candidates/${candidateId}/cv`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Errore nel download del CV');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `CV_${candidateId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  uploadCv: async (token: string | null, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/upload-cv`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || 'Errore nel caricamento del CV');
    }
    return res.json();
  },
};
