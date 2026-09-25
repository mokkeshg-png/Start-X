/**
 * writers/index.ts
 * Routes to the correct writer based on analysisType.
 * Each writer validates the AI JSON and inserts into dedicated DB tables.
 * Uses the service-role client (bypasses RLS) for all writes.
 */

import { writeDiscussionAnalysis } from "./discussionWriter.ts";
import { writeContributionAnalysis } from "./contributionWriter.ts";
import { writeDocumentAnalysis } from "./documentWriter.ts";
import { writeProgressAnalysis } from "./progressWriter.ts";
import { writeCollectiveInsight } from "./collectiveInsightWriter.ts";
import { writeCollaborationGap } from "./collaborationGapWriter.ts";
import { writeRecommendations } from "./recommendationWriter.ts";
import { writeSkillAnalysis } from "./skillWriter.ts";
import { writeTeamFormation } from "./teamFormationWriter.ts";
import { writeKnowledgeExchange } from "./knowledgeExchangeWriter.ts";

export interface WriterContext {
  teamId?: string;
  studentId?: string;
  discussionId?: string;
  documentId?: string;
  contributionId?: string;
  supabase: unknown; // service-role admin client
}

export async function writeResults(
  analysisType: string,
  resultJson: Record<string, unknown>,
  ctx: WriterContext
): Promise<Record<string, unknown>> {
  switch (analysisType) {
    case "discussion_analysis":
      return writeDiscussionAnalysis(resultJson, ctx);
    case "contribution_analysis":
      return writeContributionAnalysis(resultJson, ctx);
    case "document_intelligence":
      return writeDocumentAnalysis(resultJson, ctx);
    case "progress_analysis":
      return writeProgressAnalysis(resultJson, ctx);
    case "collective_insight":
      return writeCollectiveInsight(resultJson, ctx);
    case "collaboration_gap":
      return writeCollaborationGap(resultJson, ctx);
    case "collaboration_recommendation":
      return writeRecommendations(resultJson, ctx);
    case "skill_analysis":
      return writeSkillAnalysis(resultJson, ctx);
    case "team_formation":
      return writeTeamFormation(resultJson, ctx);
    case "knowledge_exchange":
      return writeKnowledgeExchange(resultJson, ctx);
    default:
      throw new Error(`No writer for analysisType: ${analysisType}`);
  }
}
