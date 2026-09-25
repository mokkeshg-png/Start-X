import { supabase } from '../lib/supabase';
import { AIAnalysisResult } from '../types';

export interface AIAnalysisRequest {
  analysisType: 
    | 'skill_analysis' 
    | 'team_formation' 
    | 'discussion_analysis'
    | 'contribution_analysis'
    | 'knowledge_exchange'
    | 'document_intelligence'
    | 'progress_analysis'
    | 'collective_insight'
    | 'collaboration_gap'
    | 'collaboration_recommendation';
  teamId?: string;
  studentId?: string;
  inputData?: any;
}

class AIAnalysisService {
  async runAnalysis(request: AIAnalysisRequest): Promise<any> {
    const { data, error } = await supabase.functions.invoke('ai-analyze', {
      body: request,
    });

    if (error) {
      console.error('AI Analysis Edge Function Error:', error);
      throw new Error(`AI Analysis failed: ${error.message || 'Unknown error'}`);
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to process AI analysis');
    }

    return data.data; // Returns the row from ai_analysis table
  }

  // Caching mechanism: Fetch existing analysis if it exists and is recent
  async getExistingAnalysis(
    analysisType: string,
    teamId?: string,
    studentId?: string,
    inputReference?: string,
    maxAgeHours: number = 24
  ): Promise<any | null> {
    let query = supabase
      .from('ai_analysis')
      .select('*')
      .eq('analysis_type', analysisType)
      .order('created_at', { ascending: false })
      .limit(1);

    if (teamId) query = query.eq('team_id', teamId);
    if (studentId) query = query.eq('student_id', studentId);
    if (inputReference) query = query.eq('input_reference', inputReference);

    const { data, error } = await query;
    if (error || !data || data.length === 0) return null;

    const analysis = data[0];
    const createdTime = new Date(analysis.created_at).getTime();
    const now = new Date().getTime();
    const ageHours = (now - createdTime) / (1000 * 60 * 60);

    if (ageHours > maxAgeHours) {
      return null; // Too old, needs refresh
    }

    return analysis;
  }
}

export const aiAnalysisService = new AIAnalysisService();
