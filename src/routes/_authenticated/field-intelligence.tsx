import {createFileRoute} from '@tanstack/react-router';
import {FieldIntelligence,fieldQuery} from '@/components/FieldIntelligence';
import {pageMeta} from '@/lib/page-meta';
export const Route=createFileRoute('/_authenticated/field-intelligence')({head:()=>pageMeta('Field Intelligence — Imperfect Produce','Organization-scoped farm maps, field observations, evidence and traceable agricultural investigations.'),loader:({context})=>context.queryClient.ensureQueryData(fieldQuery),component:FieldIntelligence});