// auth.config.ts
import type { NextAuthConfig } from 'next-auth';

// Notice this is just an object, not a function call
export const authConfig = {
  // You can define custom pages for sign-in, sign-out, error, etc.
  pages: {
    signIn: '/login', // Example: create a custom login page at /login
  },
  providers: [
    // Providers are added here.
    // Leave it empty for now to make sure the core setup works.
    // We will add Google back in the next step.
  ],
  callbacks: {
    // This callback is used to control access to pages.
    // It's called before a request is completed.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/trial'); // Example protected route

      if (isOnDashboard) {
        if (isLoggedIn) return true; // Allow access if logged in
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        // If the user is logged in and tries to access a page like /login,
        // redirect them to a dashboard page.
        // Remove this if you don't have a custom login page.
        return Response.redirect(new URL('/trial', nextUrl));
      }
      return true; // Allow all other routes
    },
  },
} satisfies NextAuthConfig;