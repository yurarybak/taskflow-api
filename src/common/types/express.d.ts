// Augments Express so middleware can read the authenticated user (set by
// JwtStrategy) and the correlation id (set by RequestIdMiddleware).
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
    }

    interface Request {
      id: string;
    }
  }
}

export {};
