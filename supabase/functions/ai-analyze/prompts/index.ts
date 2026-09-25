/**
 * prompts/index.ts
 * Routes to the correct prompt builder based on analysisType.
 * Each module fetches its own data and returns { systemPrompt, userMessage }.
 */

import { buildDiscussionPrompt } from "./discussionAnalysis.ts";
import { buildContributionPrompt } from "./contributionAnalysis.ts";
import { buildDocumentPrompt } from "./documentIntelligence.ts";
import { buildProgressPrompt } from "./progressAnalysis.ts";
import { buildCollectiveInsightPrompt } from "./collectiveInsight.ts";
import { buildCollaborationGapPrompt } from "./collaborationGap.ts";
import { buildRecommendationPrompt } from "./recommendation.ts";
import { buildSkillAnalysisPrompt } from "./skillAnalysis.ts";
import { buildTeamFormationPrompt } from "./teamFormation.ts";
import { buildKnowledgeExchangePrompt } from "./knowledgeExchange.ts";

export interface PromptContext {
  teamId?: string;
  studentId?: string;
  discussionId?: string;
  documentId?: string;
  contributionId?: string;
  inputData?: unknown;
  supabase: unknown;         // authenticated user client (RLS)
  adminSupabase: unknown;    // service-role client (used for joins the user can see)
}

export interface PromptResult {
  systemPrompt: string;
  userMessage: string;
}

export async function buildPrompt(
  analysisType: string,
  ctx: PromptContext
): Promise<PromptResult> {
  switch (analysisType) {
    case "discussion_analysis":
      return buildDiscussionPrompt(ctx);
    case "contribution_analysis":
      return buildContributionPrompt(ctx);
    case "document_intelligence":
      return buildDocumentPrompt(ctx);
    case "progress_analysis":
      return buildProgressPrompt(ctx);
    case "collective_insight":
      return buildCollectiveInsightPrompt(ctx);
    case "collaboration_gap":
      return buildCollaborationGapPrompt(ctx);
    case "collaboration_recommendation":
      return buildRecommendationPrompt(ctx);
    case "skill_analysis":
      return buildSkillAnalysisPrompt(ctx);
    case "team_formation":
      return buildTeamFormationPrompt(ctx);
    case "knowledge_exchange":
      return buildKnowledgeExchangePrompt(ctx);
    default:
      throw new Error(`Unsupported analysisType: ${analysisType}`);
  }
}
