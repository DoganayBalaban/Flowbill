export interface PlanLimits {
  clients: number;        // -1 = unlimited
  activeProjects: number; // -1 = unlimited
  invoicesPerMonth: number; // -1 = unlimited; free uses total cap instead
  invoicesTotalCap: number; // only used for free plan (-1 = no cap)
  expenseTracking: boolean;
  clientPortal: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    clients: 3,
    activeProjects: -1,
    invoicesPerMonth: 10,
    invoicesTotalCap: -1,
    expenseTracking: false,
    clientPortal: true,
  },
  starter: {
    clients: 10,
    activeProjects: -1,
    invoicesPerMonth: -1,
    invoicesTotalCap: -1,
    expenseTracking: false,
    clientPortal: true,
  },
  pro: {
    clients: -1,
    activeProjects: -1,
    invoicesPerMonth: -1,
    invoicesTotalCap: -1,
    expenseTracking: true,
    clientPortal: true,
  },
  agency: {
    clients: -1,
    activeProjects: -1,
    invoicesPerMonth: -1,
    invoicesTotalCap: -1,
    expenseTracking: true,
    clientPortal: true,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

export function isUnlimited(n: number): boolean {
  return n === -1;
}
