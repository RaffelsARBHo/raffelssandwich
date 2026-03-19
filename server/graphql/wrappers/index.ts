export const adminOnly =
  (fn: (parent: unknown, args: any, context: unknown) => void) =>
  (parent: unknown, args: unknown, context: unknown) => {
    const { isAdmin } = context as any;
    if (!isAdmin) {
      throw new Error('Only Admins can perform this action');
    }
    return fn(parent, args, context);
  };

export const isLoggedIn =
  (fn: (parent: unknown, args: any, context: any) => void) =>
  (parent: unknown, args: unknown, context: any) => {
    const { user } = context as any;
    if (!user) {
      throw new Error('Login to continue');
    }
    return fn(parent, args, context);
  };
