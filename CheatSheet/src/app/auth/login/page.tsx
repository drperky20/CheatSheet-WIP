import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="glass-card max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to CheatSheet</h1>
        <p className="text-gray-300 mb-8">Your autonomous academic workspace</p>
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}