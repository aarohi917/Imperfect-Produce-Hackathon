import { createFileRoute } from "@tanstack/react-router";
import { FarmerOverview, operationsQuery, shipmentsQuery } from "@/components/FarmerOverview";
import { pageMeta } from "@/lib/page-meta";
export const Route=createFileRoute("/_authenticated/overview")({head:()=>pageMeta("Farm overview — Imperfect Produce","Operational harvest records, produce quantities, and authorized import-export updates."),loader:({context})=>Promise.all([context.queryClient.ensureQueryData(operationsQuery),context.queryClient.ensureQueryData(shipmentsQuery)]),component:FarmerOverview});