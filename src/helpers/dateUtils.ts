export const calculateNextBillingDate = (
  duration: "monthly" | "yearly"
): Date => {
  const now = new Date();
  if (duration === "monthly") {
    now.setMonth(now.getMonth() + 1);
  } else {
    now.setFullYear(now.getFullYear() + 1);
  }
  return now;
};
