'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import { CourseList } from '@/components/dashboard/CourseList';
import { AssignmentList } from '@/components/dashboard/AssignmentList';
import { useCanvasStore } from '@/stores/canvasStore';
import { LogOut, Settings, Sparkles, BookOpen } from 'lucide-react';
import ClientOnlyIcon from '@/components/ui/ClientOnlyIcon';

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { 
    courses, 
    selectedCourse, 
    fetchCourses, 
    selectCourse,
    // assignments - not currently used but part of store interface
  } = useCanvasStore();

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        redirect('/auth/login');
      } else {
        setUser(user);
        setLoading(false);
      }
    };

    getUser();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchCourses();
    }
  }, [loading, fetchCourses]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/auth/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gradient">CheatSheet</h1>
          <div className="glass-card inline-block">
            <ClientOnlyIcon icon={Sparkles} className="w-8 h-8 text-purple-400 animate-pulse mx-auto" />
            <p className="text-gray-400 mt-2">Loading your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <header className="glass-effect border-b border-white/10 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <ClientOnlyIcon icon={Sparkles} className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-gradient">CheatSheet</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400 hidden sm:inline">
                {user?.email}
              </span>
              <button
                className="glass-button p-2 rounded-lg"
                aria-label="Settings"
              >
                <ClientOnlyIcon icon={Settings} className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={handleSignOut}
                className="glass-button px-4 py-2 text-sm flex items-center space-x-2 text-red-400 hover:text-red-300"
              >
                <ClientOnlyIcon icon={LogOut} className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8 safe-bottom">
        <div className="py-6">
          <h1 className="text-3xl font-bold text-white mb-2">Mission Hub</h1>
          <p className="text-gray-400 mb-8">
            Select a course and assignment to launch your AI-powered academic mission
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Course List - 1/3 width on desktop */}
            <div className="lg:col-span-1">
              <CourseList 
                courses={courses}
                selectedCourseId={selectedCourse?.id}
                onCourseSelect={selectCourse}
              />
            </div>
            
            {/* Assignment List - 2/3 width on desktop */}
            <div className="lg:col-span-2">
              {selectedCourse ? (
                <AssignmentList 
                  courseId={selectedCourse.id}
                  courseName={selectedCourse.name}
                />
              ) : (
                <div className="glass-card h-full flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <ClientOnlyIcon icon={BookOpen} className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Select a course to view assignments</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Your assignments will appear here
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}