import { Router } from "express";
import { PROVINCES } from "../data/provinces.js";

export const citiesRouter = Router();

citiesRouter.get("/", (_req, res) => {
  res.json({ provinces: PROVINCES });
});
