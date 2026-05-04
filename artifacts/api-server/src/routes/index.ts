import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import keysRouter from "./keys";
import logsRouter from "./logs";
import statsRouter from "./stats";
import publicRouter from "./public";
import verifyRouter from "./verify";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/admin", adminRouter);
router.use("/stats", statsRouter);
router.use("/keys", keysRouter);
router.use("/logs", logsRouter);
router.use("/public", publicRouter);
router.use("/verify", verifyRouter);

export default router;
