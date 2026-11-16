import { createFileRoute, notFound } from '@tanstack/react-router';
import { PublicDemo } from '@/components/PublicDemo';
import { DEMO_SECTIONS, demoSection } from '@/lib/public-demo';
import { pageMeta } from '@/lib/page-meta';
export const Route=createFileRoute('/demo/$section')({
  beforeLoad:({params})=>{if(!DEMO_SECTIONS.some(section=>section===params.section))throw notFound();},
  head:({params})=>pageMeta(`${params.section.replaceAll('-',' ')} demonstration — Imperfect Produce`,`Public ${params.section.replaceAll('-',' ')} with clearly labeled fictional examples, separate from private farm records.`),
  component:Page,
});
function Page(){const {section}=Route.useParams();return <PublicDemo key={section} section={demoSection(section)}/>;}