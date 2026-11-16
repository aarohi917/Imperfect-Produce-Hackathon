import { describe,it,expect } from 'vitest';
import { canCreateOrganization,canReviewTrade,safeAttachment } from '@/lib/communication-policy';
describe('Communication permission rules',()=>{
 it('allows CEO-only organization creation',()=>{expect(canCreateOrganization(['ceo'])).toBe(true);expect(canCreateOrganization(['farmer','hq'])).toBe(false);});
 it('requires a different organization manager to review trade requests',()=>{expect(canReviewTrade('manager','requester','reviewer')).toBe(true);expect(canReviewTrade('manager','requester','requester')).toBe(false);expect(canReviewTrade('member','requester','reviewer')).toBe(false);});
 it('rejects executable and oversized private attachments',()=>{expect(safeAttachment({type:'application/pdf',size:100})).toBe(true);expect(safeAttachment({type:'application/pdf',size:20971521})).toBe(false);expect(safeAttachment({type:'text/html',size:100})).toBe(false);});
});
