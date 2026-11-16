import { createFileRoute } from "@tanstack/react-router";
import VisualIntelligence from "@/components/VisualIntelligence";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_authenticated/visual-intelligence")({
  head: () => pageMeta("Visual Intelligence — Imperfect Produce", "Live browser-based produce detection with estimated counts, calibrated sizes and preliminary surface observations."),
  component: VisualIntelligence,
});