export const operationalHarvestColumns = "id,farmer_id,photo_path,vegetable,quantity,unit,destination,status,created_at,field_name,grade,harvest_date,reviewed_at" as const;
export function managementAccess(roles: readonly string[], memberships: readonly { role: string }[]) {
  return roles.includes("ceo") || roles.includes("hq") || memberships.some(m => m.role === "manager");
}
export function canReadFarmFinance(roles: readonly string[], managerOrgs: readonly string[], farmerOrgs: readonly string[]) {
  return roles.includes("ceo") || roles.includes("hq") || managerOrgs.some(org => farmerOrgs.includes(org));
}
export function harvestAlertRecipients(roles: readonly { user_id: string; role: string }[]) {
  return [...new Set(roles.filter(r => r.role === "hq").map(r => r.user_id))];
}