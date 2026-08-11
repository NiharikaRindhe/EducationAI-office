export type Role = 'student' | 'teacher' | 'school_admin' | 'lab_incharge' | 'super_admin';

export interface AuthUser {
  id: string;
  email: string | null;
  role: Role;
  schoolId: string | null;
}

// Augmenting Express's own types is only possible through its namespace —
// `declare module` cannot reach `Express.Request`. The rule's preference for
// ES module syntax does not apply to third-party namespace augmentation.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      accessToken?: string;
    }
  }
}
