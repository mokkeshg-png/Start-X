export async function generatePromptAndData(
  analysisType: string,
  teamId: string,
  studentId: string,
  inputData: any,
  supabase: any
) {
  let systemPrompt = "";
  let userMessage = "";
  let inputReference = "";

  switch (analysisType) {
    case "skill_analysis": {
      // Module 1: Student Profile & Skill Analysis
      const { data: profile } = await supabase.from('students').select('*').eq('student_id', studentId).single();
      const { data: projects } = await supabase.from('team_members').select('team_id, role, teams(projects(*))').eq('student_id', studentId);

      const rawData = { profile, projects };
      inputReference = `student:${studentId}`;
      
      systemPrompt = `You are an AI assistant for a college project platform. 
Your task is to analyze a student's profile and skills.
Return ONLY structured JSON matching this schema:
{
  "student_id": "string",
  "skills": [{"skill": "string", "evidence": "string", "confidence": "number (0-1)"}],
  "projects": ["string"],
  "strengths": ["string"],
  "missing_evidence": ["string"],
  "summary": "string"
}
Rules:
- Do not invent evidence.
- Use only supplied project data.
- Clearly distinguish evidence from inference.
- If information is insufficient, say so.
- Do NOT claim that a student has a skill solely because they typed it in their profile without evidence.`;
      
      userMessage = `Analyze this student data:\n${JSON.stringify(rawData, null, 2)}`;
      break;
    }
    
    case "team_formation": {
      // Module 2: AI Team Formation
      const { data: project } = await supabase.from('projects').select('*').eq('project_id', inputData.projectId).single();
      const { data: students } = await supabase.from('students').select('*');
      
      const rawData = { project, candidateStudents: students };
      inputReference = `project:${inputData.projectId}`;
      
      systemPrompt = `You are an AI assistant for team formation. Match students with project requirements.
Return JSON:
{
  "project_id": "string",
  "recommended_students": [{"student_id": "string", "matched_skills": ["string"], "matching_reasons": ["string"], "potential_gaps": ["string"]}],
  "summary": "string"
}
Rules:
- Match only on relevant project criteria (skills, interests, experience).
- Do not make decisions on sensitive characteristics.
- Return top 3-5 candidates.`;
      
      userMessage = `Project and candidate data:\n${JSON.stringify(rawData, null, 2)}`;
      break;
    }

    case "discussion_analysis": {
      // Module 3: Collaborative Discussion Analysis
      const { data: discussions } = await supabase.from('discussions').select('*').eq('team_id', teamId).order('created_at', { ascending: false }).limit(50);
      
      const rawData = { discussions };
      inputReference = `team:${teamId}:discussions`;
      
      systemPrompt = `You are an AI analyzing team discussion messages.
Return JSON:
{
  "topics": ["string"],
  "questions": ["string"],
  "decisions": ["string"],
  "action_items": ["string"],
  "unresolved_issues": ["string"],
  "blockers": ["string"],
  "summary": "string"
}
Rules: Use only supplied messages. Do not invent context.`;
      
      userMessage = `Discussions:\n${JSON.stringify(rawData, null, 2)}`;
      break;
    }

    case "contribution_analysis": {
      // Module 4: Individual Contribution Analysis
      const { data: member } = await supabase.from('team_members').select('*').eq('team_id', teamId).eq('student_id', studentId).single();
      const { data: tasks } = await supabase.from('tasks').select('*').eq('team_id', teamId).eq('assignee_id', studentId);
      
      const rawData = { member, tasks };
      inputReference = `team:${teamId}:student:${studentId}`;
      
      systemPrompt = `You are an AI analyzing individual contribution.
Return JSON:
{
  "role": "string",
  "completed_responsibilities": ["string"],
  "incomplete_responsibilities": ["string"],
  "evidence": ["string"],
  "blockers": ["string"],
  "next_action": "string",
  "summary": "string"
}
Rules:
- Do NOT produce an unsupported productivity score.
- Use evidence-based indicators.`;
      
      userMessage = `Student activity:\n${JSON.stringify(rawData, null, 2)}`;
      break;
    }

    case "knowledge_exchange": {
      // Module 5: Knowledge Exchange Mapping
      const { data: discussions } = await supabase.from('discussions').select('*').eq('team_id', teamId).limit(100);
      
      const rawData = { discussions };
      inputReference = `team:${teamId}:knowledge`;
      
      systemPrompt = `You are an AI mapping knowledge exchange among team members.
Return JSON:
{
  "knowledge_flows": [{"from_student": "string", "to_student": "string", "topic": "string", "evidence": "string"}],
  "knowledge_gaps": ["string"],
  "summary": "string"
}
Rules: Identify who shared information, what knowledge was shared, and who received it.`;
      
      userMessage = `Discussions:\n${JSON.stringify(rawData, null, 2)}`;
      break;
    }

    case "document_intelligence": {
      // Module 6: Shared Document Intelligence
      const rawData = { text: inputData.documentText, fileName: inputData.fileName };
      inputReference = `document:${inputData.fileName}`;
      
      systemPrompt = `You are an AI analyzing project documentation.
Return JSON:
{
  "main_concepts": ["string"],
  "requirements": ["string"],
  "technologies": ["string"],
  "decisions": ["string"],
  "risks": ["string"],
  "missing_information": ["string"],
  "summary": "string"
}`;
      
      userMessage = `Document Content:\n${JSON.stringify(rawData, null, 2)}`;
      break;
    }

    case "progress_analysis": {
      // Module 7: Task & Progress Analysis
      const { data: tasks } = await supabase.from('tasks').select('*').eq('team_id', teamId);
      
      const rawData = { tasks };
      inputReference = `team:${teamId}:tasks`;
      
      systemPrompt = `You are an AI analyzing task progress.
Return JSON:
{
  "completed_work": ["string"],
  "active_work": ["string"],
  "blocked_work": ["string"],
  "dependencies": ["string"],
  "risks": ["string"],
  "summary": "string",
  "next_actions": ["string"]
}
Rules: Do NOT ask AI to calculate simple percentages. Use AI to interpret patterns and dependencies.`;
      
      userMessage = `Tasks:\n${JSON.stringify(rawData, null, 2)}`;
      break;
    }

    case "collective_insight": {
      // Module 8: Collective Insight Generation
      const { data: team } = await supabase.from('teams').select('*, projects(*)').eq('team_id', teamId).single();
      const { data: tasks } = await supabase.from('tasks').select('*').eq('team_id', teamId);
      
      const rawData = { team, tasks };
      inputReference = `team:${teamId}:insights`;
      
      systemPrompt = `You are an AI generating collective project-level intelligence.
Return JSON:
{
  "project_status": "string",
  "major_progress": ["string"],
  "important_decisions": ["string"],
  "current_blockers": ["string"],
  "team_strengths": ["string"],
  "risks": ["string"],
  "next_steps": ["string"],
  "summary": "string"
}`;
      
      userMessage = `Project Data:\n${JSON.stringify(rawData, null, 2)}`;
      break;
    }

    case "collaboration_gap": {
      // Module 9: Collaboration Gap Detection
      const { data: tasks } = await supabase.from('tasks').select('*').eq('team_id', teamId);
      
      const rawData = { tasks };
      inputReference = `team:${teamId}:gaps`;
      
      systemPrompt = `You are an AI detecting collaboration gaps.
Return JSON:
{
  "gaps": [{"type": "string", "students": ["string"], "description": "string", "evidence": "string", "impact": "string"}],
  "summary": "string"
}
Rules: Detect communication gaps, technical issues, dependencies, and role coordination issues. Do not infer personal characteristics.`;
      
      userMessage = `Data:\n${JSON.stringify(rawData, null, 2)}`;
      break;
    }

    case "collaboration_recommendation": {
      // Module 10: AI Collaboration Recommendations
      const { data: team } = await supabase.from('teams').select('*').eq('team_id', teamId).single();
      
      const rawData = { team, inputData }; // Provide gaps/progress via inputData if needed
      inputReference = `team:${teamId}:recommendations`;
      
      systemPrompt = `You are an AI generating actionable collaboration recommendations.
Return JSON:
{
  "recommendations": [{"priority": "high|medium|low", "reason": "string", "action": "string", "related_students": ["string"]}],
  "summary": "string"
}
Rules: Recommendations must be directly connected to detected evidence.`;
      
      userMessage = `Context:\n${JSON.stringify(rawData, null, 2)}`;
      break;
    }

    default:
      throw new Error(`Unsupported analysisType: ${analysisType}`);
  }

  return { systemPrompt, userMessage, inputReference };
}
