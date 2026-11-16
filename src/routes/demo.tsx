import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';
import { useMe } from '@/lib/auth';

export const Route=createFileRoute('/demo')({component:DemoEntry});

function DemoEntry() {
  const { data: me, isPending } = useMe();
  if (isPending) return null;
  if (me) return <Navigate to={me.isManagement ? '/dashboard' : '/overview'} replace />;
  return <Outlet/>;
}