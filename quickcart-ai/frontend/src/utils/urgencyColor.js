export function getUrgencyLevel(product, intent) {
  const score = product._score || 0;
  const occasionUrgency = intent?.urgency || "medium";
  const tags = product.tags || [];

  // Always critical — regardless of score
  const criticalTags = ["emergency", "baby", "medicine", "fever", "ors", "torch", "candle"];
  if (tags.some((t) => criticalTags.includes(t))) return "critical";

  // High urgency occasion AND high score = critical
  if (occasionUrgency === "high" && score >= 0.65) return "critical";

  // Medium score = helpful
  if (score >= 0.4) return "helpful";

  // Everything else = optional
  return "optional";
}

export const URGENCY_CONFIG = {
  critical: {
    border: "border-l-4 border-l-red-500",
    badge: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
    label: "Critical",
  },
  helpful: {
    border: "border-l-4 border-l-yellow-400",
    badge: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    dot: "bg-yellow-400",
    label: "Helpful",
  },
  optional: {
    border: "border-l-4 border-l-green-400",
    badge: "bg-green-50 text-green-700 border border-green-200",
    dot: "bg-green-400",
    label: "Nice to have",
  },
};
