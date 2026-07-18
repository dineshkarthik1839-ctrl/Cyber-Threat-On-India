import api from "./api";

export interface InvestigationNote {
  id: number;
  content: string;
  author: string;
  timestamp: string;
}

export interface Investigation {
  id: number;
  attack_id: number;
  created_at: string;
  updated_at: string;
  status: string;
  analyst_id: number | null;
  ai_analysis: any;
  notes: InvestigationNote[];
  attack: any;
}

export const investigationService = {
  getInvestigation: async (id: number): Promise<Investigation> => {
    const response = await api.get(`/investigations/${id}`);
    return response.data;
  },

  createInvestigation: async (attackId: number, aiAnalysis: any = null): Promise<Investigation> => {
    const response = await api.post("/investigations", { attack_id: attackId, ai_analysis: aiAnalysis });
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<Investigation> => {
    const response = await api.patch(`/investigations/${id}/status`, { status });
    return response.data;
  },

  addNote: async (id: number, content: string): Promise<InvestigationNote> => {
    const response = await api.post(`/investigations/${id}/notes`, { content });
    return response.data;
  },

  getIocs: async (id: number): Promise<any[]> => {
    const response = await api.get(`/investigations/${id}/iocs`);
    return response.data;
  },

  getTimeline: async (id: number): Promise<any[]> => {
    const response = await api.get(`/investigations/${id}/timeline`);
    return response.data;
  }
};
