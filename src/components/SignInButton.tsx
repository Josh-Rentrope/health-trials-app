'use client';

import { signIn } from 'next-auth/react';

export function SignIn() {
  return <button onClick={() => signIn('google')}>Sign in with Google</button>;
}