export const canCreateOrganization = (roles: readonly string[]) => roles.includes('ceo');
export const canReviewTrade = (membershipRole: string | undefined, requester: string, user: string) => membershipRole === 'manager' && requester !== user;
export const attachmentLimit = 20 * 1024 * 1024;
export const safeAttachment = (file: { size: number; type: string }) => file.size <= attachmentLimit && /^(image\/(jpeg|png|webp|gif)|application\/pdf|text\/plain|text\/csv|application\/vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet))$/.test(file.type);
