import { Request, Response } from "express";
import Subscription from "../models/subscription.model";
import { calculateNextBillingDate } from "../helpers/dateUtils";

// POST /create
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { userId, plan, duration } = req.body;
    if (!userId || !plan || !duration) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!["monthly", "yearly"].includes(duration)) {
      return res.status(400).json({ error: "Invalid duration" });
    }

    const newSub = await Subscription.create({
      userId,
      plan,
      duration,
      status: "active",
      isTrial: false,
      isActive: true,
      startedAt: new Date(),
      nextBillingDate: calculateNextBillingDate(duration),
    });

    res.status(201).json(newSub);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to create subscription", details: err });
  }
};

// GET /:id
export const getSubscriptionById = async (req: Request, res: Response) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: "Subscription not found" });

    // Lazy evaluation: check expiry
    const now = new Date();
    if (sub.nextBillingDate < now && sub.isActive) {
      sub.isActive = false;
      sub.status = "expired";
      await sub.save();
    }

    res.status(200).json(sub);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error fetching subscription", details: err });
  }
};

// PATCH /:id/cancel
export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: "Subscription not found" });
    if (sub.status === "canceled") {
      return res.status(409).json({ error: "Subscription already canceled" });
    }

    sub.status = "canceled";
    sub.isActive = false;
    sub.canceledAt = new Date();
    await sub.save();

    res.status(200).json(sub);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to cancel subscription", details: err });
  }
};

// PATCH /:id/update-plan
export const updateSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const { plan, duration } = req.body;
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: "Subscription not found" });

    if (plan) sub.plan = plan;
    if (duration) {
      if (!["monthly", "yearly"].includes(duration)) {
        return res.status(400).json({ error: "Invalid duration" });
      }
      sub.duration = duration;
      sub.nextBillingDate = calculateNextBillingDate(duration);
    }

    await sub.save();
    res.status(200).json(sub);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update subscription", details: err });
  }
};

// GET /user/:userId
export const getUserSubscriptions = async (req: Request, res: Response) => {
  try {
    const subs = await Subscription.find({ userId: req.params.userId });
    const now = new Date();

    const updatedSubs = await Promise.all(
      subs.map(async (sub) => {
        if (sub.nextBillingDate < now && sub.isActive) {
          sub.isActive = false;
          sub.status = "expired";
          await sub.save();
        }
        return sub;
      })
    );

    res.status(200).json(updatedSubs);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error fetching user subscriptions", details: err });
  }
};

// PATCH /:id/start-trial
export const startTrial = async (req: Request, res: Response) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: "Subscription not found" });

    sub.isTrial = true;
    sub.status = "active";
    sub.isActive = true;
    sub.startedAt = new Date();
    sub.nextBillingDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day trial
    await sub.save();

    res.status(200).json(sub);
  } catch (err) {
    res.status(500).json({ error: "Failed to start trial", details: err });
  }
};

// PATCH /:id/renew
export const renewSubscription = async (req: Request, res: Response) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: "Subscription not found" });

    sub.nextBillingDate = calculateNextBillingDate(sub.duration);
    sub.status = "active";
    sub.isActive = true;
    sub.isTrial = false;
    await sub.save();

    res.status(200).json(sub);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to renew subscription", details: err });
  }
};

// GET /active
export const getActiveSubscriptions = async (_req: Request, res: Response) => {
  try {
    const subs = await Subscription.find({ isActive: true });
    const now = new Date();

    const filtered = await Promise.all(
      subs.map(async (sub) => {
        if (sub.nextBillingDate < now) {
          sub.isActive = false;
          sub.status = "expired";
          await sub.save();
          return null;
        }
        return sub;
      })
    );

    res.status(200).json(filtered.filter(Boolean));
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error fetching active subscriptions", details: err });
  }
};
