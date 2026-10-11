import { Router } from "express";

const router = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "healthy" });
});

export default router;
