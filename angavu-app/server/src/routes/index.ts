import { Router } from "express";
import healthRouter from "./health";
import angavuRouter from "./angavu";

const router = Router();

router.use(healthRouter);
router.use(angavuRouter);

export default router;
