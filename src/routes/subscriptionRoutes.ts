import express from "express";
import {
  createSubscription,
  getSubscriptionById,
  cancelSubscription,
  updateSubscriptionPlan,
  getUserSubscriptions,
  startTrial,
  renewSubscription,
  getActiveSubscriptions,
} from "../controllers/subscriptionController";

const router = express.Router();

router.post("/create", createSubscription);
router.get("/active", getActiveSubscriptions);
router.get("/:id", getSubscriptionById);
router.patch("/:id/cancel", cancelSubscription);
router.patch("/:id/update-plan", updateSubscriptionPlan);
router.get("/user/:userId", getUserSubscriptions);
router.patch("/:id/start-trial", startTrial);
router.patch("/:id/renew", renewSubscription);

export default router;
