import { createFileRoute } from '@tanstack/react-router';
import { TradeRequests } from '@/components/TradeRequests';
import { communicationQuery } from '@/lib/communication-query';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/_authenticated/requests')({head:()=>pageMeta('Import-export requests — Imperfect Produce','Submit and review organization import-export requests with organization-scoped review.'),loader:({context})=>context.queryClient.ensureQueryData(communicationQuery()),component:TradeRequests});
