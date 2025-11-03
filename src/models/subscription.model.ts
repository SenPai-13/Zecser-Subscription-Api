import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  userId: string;
  plan: string;
  duration: "monthly" | "yearly";
  status: "active" | "canceled" | "paused" | "expired";
  isTrial: boolean;
  isActive: boolean;
  startedAt: Date;
  nextBillingDate: Date;
  canceledAt?: Date;
}

const SubscriptionSchema: Schema = new Schema({
  userId: { type: String, required: true },
  plan: { type: String, required: true },
  duration: { type: String, enum: ["monthly", "yearly"], required: true },
  status: {
    type: String,
    enum: ["active", "canceled", "paused", "expired"],
    default: "active",
  },
  isTrial: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  startedAt: { type: Date, default: Date.now },
  nextBillingDate: { type: Date, required: true },
  canceledAt: { type: Date },
});

export default mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema
);
