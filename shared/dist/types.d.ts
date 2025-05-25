export interface User {
    id: string;
    email: string;
    name: string;
    picture?: string | null;
    hasSubscription?: boolean;
    stripeCustomerId?: string;
    isWaitlisted?: boolean;
    tokenVersion?: number;
}
//# sourceMappingURL=types.d.ts.map