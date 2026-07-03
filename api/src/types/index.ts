export type Role = 'student' | 'teacher' | 'school_admin' | 'lab_incharge' | 'super_admin';

export interface AuthUser {
  id: string;
  email: string | null;
  role: Role;
  schoolId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      accessToken?: string;
    }
  }
}
