"use client";

// import { CopilotSidebar } from "@copilotkit/react-ui"; // Not used in this redirect-only component
import { useEffect } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        redirect('/auth/login');
      } else {
        redirect('/dashboard');
      }
    };
    
    checkAuth();
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">CheatSheet</h1>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
