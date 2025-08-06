// auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({

    }),
    Credentials({
      // You can add your own logic for basic authentication here.
      // This is where you would handle username/password login
      // and could add a 2FA check.
      async authorize(credentials) {
        // Add your user validation logic here.
        // For example, checking against a database.
        // If the user is valid, return the user object.
        // Otherwise, return null.
        return null
      },
    }),
  ],
})