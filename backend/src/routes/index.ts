import { Router } from "express";

import healthRoutes from "./health.routes";
import systemRoutes from "./system.routes";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import usersRoutes from "./users.routes";
import studentsRoutes from "./students.routes";
import staffRoutes from "./staff.routes";
import teamsRoutes from "./teams.routes";
import discussionsRoutes from "./discussions.routes";
import contributionsRoutes from "./contributions.routes";
import knowledgeRoutes from "./knowledge.routes";
import documentsRoutes from "./documents.routes";
import tasksRoutes from "./tasks.routes";
import insightsRoutes from "./insights.routes";
import gapsRoutes from "./gaps.routes";
import collaborationRoutes from "./collaboration.routes";
import notificationsRoutes from "./notifications.routes";

const router = Router();

// Health & database health
router.use("/", healthRoutes);

// System info
router.use("/system", systemRoutes);

// Authentication (real implementation)
router.use("/auth", authRoutes);

// Admin — authorized email management (real implementation)
router.use("/admin", adminRoutes);

// Module routes (Supabase-direct on frontend; these mirror the data for server-side use)
router.use("/users", usersRoutes);
router.use("/students", studentsRoutes);
router.use("/staff", staffRoutes);
router.use("/teams", teamsRoutes);
router.use("/discussions", discussionsRoutes);
router.use("/contributions", contributionsRoutes);
router.use("/knowledge", knowledgeRoutes);
router.use("/documents", documentsRoutes);
router.use("/tasks", tasksRoutes);
router.use("/insights", insightsRoutes);
router.use("/gaps", gapsRoutes);
router.use("/collaboration", collaborationRoutes);
router.use("/notifications", notificationsRoutes);

export default router;
