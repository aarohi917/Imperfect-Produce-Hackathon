import { createFileRoute } from '@tanstack/react-router';
import { PublicDemo } from '@/components/PublicDemo';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/demo/')({head:()=>pageMeta('Farm demonstration — Imperfect Produce','Explore fictional harvest records and farm tools without registration; private farm records remain protected.'),component:()=> <PublicDemo/>});