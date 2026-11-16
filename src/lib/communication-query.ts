import { queryOptions } from '@tanstack/react-query';
import { loadCommunication } from './communication.functions';
export const communicationQuery = (orgId?: string, conversationId?: string, search?: string) => queryOptions({
  queryKey: ['communication', orgId, conversationId, search],
  queryFn: () => loadCommunication({data:{orgId, conversationId, search}}),
  refetchInterval: 5000,
});