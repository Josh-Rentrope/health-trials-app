import { auth } from '@/auth'; // Adjust the import path if needed
import { SignIn } from './SignInButton';
import { SignOut } from './SignOutButton';

export async function AuthStatus() {
  const session = await auth(); // Get session data on the server

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <p>
          Signed in as <strong>{session.user.name}</strong>
        </p>
        <SignOut />
      </div>
    );
  }

  return <SignIn />;
}