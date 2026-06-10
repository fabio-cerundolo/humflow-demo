export interface Candidate {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  skills: string[];
  status: string;
  created_at: string;
  rejection_reason?: string;
}

export interface DashboardStats {
  total_candidates: number;
  skills_bar: { name: string; count: number }[];
  status_pie: { name: string; value: number }[];
  status_distribution: Record<string, number>;
}

export interface Interview {
  id: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  date: string;
  time: string;
  type: string;
}