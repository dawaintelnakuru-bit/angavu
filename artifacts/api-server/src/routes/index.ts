import { Router, type IRouter } from "express";
import angavuRouter from "./angavu";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(angavuRouter);

export default router;
