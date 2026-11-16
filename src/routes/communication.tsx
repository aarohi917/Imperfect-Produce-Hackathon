import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route=createFileRoute('/communication')({beforeLoad:()=>{throw redirect({to:'/demo'});}});