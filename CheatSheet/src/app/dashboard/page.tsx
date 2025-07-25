'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import { CourseList } from '@/components/dashboard/CourseList';
import { AssignmentList } from '@/components/dashboard/AssignmentList';
import { useCanvasStore } from '@/stores/canvasStore';
import { LogOut, Settings, Sparkles, BookOpen, Zap, Activity, TrendingUp, Award, Calendar } from 'lucide-react';
import ClientOnlyIcon from '@/components/ui/ClientOnlyIcon';
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";

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

  // Provide context to CopilotKit about available courses and assignments
  useCopilotReadable({
    description: "Available courses from Canvas LMS",
    value: courses.map(course => ({
      id: course.id,
      name: course.name,
      code: course.code,
      term: course.term
    }))
  });

  useCopilotReadable({
    description: "Currently selected course",
    value: selectedCourse ? {
      id: selectedCourse.id,
      name: selectedCourse.name,
      code: selectedCourse.code
    } : null
  });

  // CopilotKit action to help select courses
  useCopilotAction({
    name: "selectCourse",
    description: "Select a course from the available Canvas courses",
    parameters: [
      {
        name: "courseId",
        type: "string",
        description: "The ID of the course to select",
        required: true
      }
    ],
    handler: async ({ courseId }) => {
      const course = courses.find(c => c.id.toString() === courseId);
      if (course) {
        selectCourse(course);
        return `Selected course: ${course.name}`;
      }
      return "Course not found";
    }
  });

  // CopilotKit action to launch missions
  useCopilotAction({
    name: "launchMission",
    description: "Launch an AI mission for a specific assignment",
    parameters: [
      {
        name: "assignmentId",
        type: "string", 
        description: "The ID of the assignment to work on",
        required: true
      }
    ],
    handler: async ({ assignmentId }) => {
      // This would navigate to the mission workspace
      window.location.href = `/mission/${assignmentId}`;
      return `Launching mission for assignment ${assignmentId}`;
    }
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20 animate-gradient-shift" />
        <div className="text-center z-10">
          <div className="loader mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4 text-gradient-animate">CheatSheet</h1>
          <p className="text-gray-400 text-lg">Initializing your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <CopilotSidebar
      defaultOpen={false}
      clickOutsideToClose={true}
      className="glass-sidebar backdrop-blur-xl"
      labels={{
        title: "CheatSheet AI Assistant",
        initial: "👋 Hi! I'm your AI academic assistant. I can help you:\n\n• Select courses and assignments\n• Launch AI missions for assignments\n• Navigate your academic workspace\n• Answer questions about your courses\n\nWhat would you like to do?",
        placeholder: "Ask me anything about your courses..."
      }}
      instructions={`You are the CheatSheet AI Assistant, an expert academic helper integrated into an AI-powered academic workspace.

CONTEXT: The user is in their dashboard where they can view Canvas LMS courses and assignments, and launch AI missions to automatically complete academic work.

KEY CAPABILITIES:
- Help select courses using the selectCourse action
- Launch AI missions for assignments using the launchMission action  
- Provide guidance on using the academic workspace
- Answer questions about courses and assignments
- Suggest optimal workflows for academic success

PERSONALITY: Be encouraging, helpful, and focused on academic success. Use academic terminology appropriately and maintain a professional yet friendly tone.`}
    >
      <div className="min-h-screen relative">
        {/* Enhanced Background Effects */}
        <div className="fixed inset-0 -z-10">
          {/* Base gradient */}
          <div className="absolute inset-0 gradient-mesh" />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 grid-pattern opacity-30" />
          
          {/* Floating orbs */}
          <div className="floating-orb orb-purple w-96 h-96 top-10 -left-20 animate-float" />
          <div className="floating-orb orb-indigo w-[32rem] h-[32rem] top-20 -right-32 animate-float" style={{ animationDelay: '3s' }} />
          <div className="floating-orb orb-pink w-80 h-80 bottom-20 left-1/4 animate-float" style={{ animationDelay: '6s' }} />
          <div className="floating-orb orb-purple w-72 h-72 bottom-40 right-1/3 animate-float" style={{ animationDelay: '9s' }} />
          
          {/* Aurora effect */}
          <div className="aurora-bg absolute top-1/4 left-1/4 w-[800px] h-[600px] rounded-full" />
        </div>

        {/* Header */}
        <header className="glass border-b border-white/10 sticky top-0 z-50 safe-top">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-primary">
                  <ClientOnlyIcon icon={Sparkles} className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gradient-animate">CheatSheet</h1>
                  <p className="text-sm text-gray-400">AI Academic Workspace</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 glass rounded-full px-4 py-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-300">{user?.email}</span>
                </div>
                <button
                  className="btn-glass p-3 rounded-2xl group"
                  aria-label="AI Assistant"
                  title="Open AI Assistant"
                >
                  <ClientOnlyIcon icon={Zap} className="w-5 h-5 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
                </button>
                <button
                  className="btn-glass p-3 rounded-2xl group"
                  aria-label="Settings"
                >
                  <ClientOnlyIcon icon={Settings} className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="btn-glass px-6 py-3 rounded-2xl flex items-center space-x-2 text-red-400 hover:text-red-300 group"
                >
                  <ClientOnlyIcon icon={LogOut} className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span className="hidden sm:inline font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Stats Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="glass-card-sm group hover-lift hover-glow relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 group-hover:from-indigo-500/40 group-hover:to-purple-600/40 transition-all duration-500 shadow-glow">
                    <ClientOnlyIcon icon={BookOpen} className="w-7 h-7 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-white block group-hover:text-gradient transition-all duration-300">{courses.length}</span>
                    <div className="w-8 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mt-2 ml-auto" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Active Courses</h3>
                <p className="text-xs text-gray-500 mt-1">Currently enrolled</p>
              </div>
            </div>

            <div className="glass-card-sm group hover-lift hover-glow relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 group-hover:from-purple-500/40 group-hover:to-pink-600/40 transition-all duration-500 shadow-glow">
                    <ClientOnlyIcon icon={Calendar} className="w-7 h-7 text-purple-300 group-hover:text-purple-200 transition-colors" />
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-white block group-hover:text-gradient transition-all duration-300">12</span>
                    <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mt-2 ml-auto" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Assignments Due</h3>
                <p className="text-xs text-gray-500 mt-1">Next 30 days</p>
              </div>
            </div>

            <div className="glass-card-sm group hover-lift hover-glow relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 group-hover:from-green-500/40 group-hover:to-emerald-600/40 transition-all duration-500 shadow-glow">
                    <ClientOnlyIcon icon={TrendingUp} className="w-7 h-7 text-green-300 group-hover:text-green-200 transition-colors" />
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-white block group-hover:text-gradient transition-all duration-300">94%</span>
                    <div className="w-8 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mt-2 ml-auto" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Success Rate</h3>
                <p className="text-xs text-gray-500 mt-1">AI completions</p>
              </div>
            </div>

            <div className="glass-card-sm group hover-lift hover-glow relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-600/20 group-hover:from-yellow-500/40 group-hover:to-orange-600/40 transition-all duration-500 shadow-glow">
                    <ClientOnlyIcon icon={Award} className="w-7 h-7 text-yellow-300 group-hover:text-yellow-200 transition-colors" />
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-white block group-hover:text-gradient transition-all duration-300">A+</span>
                    <div className="w-8 h-1 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full mt-2 ml-auto" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Average Grade</h3>
                <p className="text-xs text-gray-500 mt-1">All submissions</p>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 safe-bottom">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-400 uppercase tracking-wider">System Online</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gradient-animate mb-4">Mission Control</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Your AI-powered academic command center. Select a course to view assignments and launch autonomous missions for seamless completion.
            </p>
            <div className="flex items-center justify-center space-x-6 mt-8">
              <div className="flex items-center space-x-2 glass rounded-full px-4 py-2">
                <ClientOnlyIcon icon={Zap} className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-300">AI Autonomous</span>
              </div>
              <div className="flex items-center space-x-2 glass rounded-full px-4 py-2">
                <ClientOnlyIcon icon={Activity} className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Real-time Sync</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course List */}
            <div className="lg:col-span-1">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">Your Courses</h3>
                <div className="badge badge-success">
                  <ClientOnlyIcon icon={Activity} className="w-3 h-3 mr-1" />
                  Active
                </div>
              </div>
              <CourseList 
                courses={courses}
                selectedCourseId={selectedCourse?.id}
                onCourseSelect={selectCourse}
              />
            </div>
            
            {/* Assignment List */}
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">
                  {selectedCourse ? `${selectedCourse.name} Assignments` : 'Select a Course'}
                </h3>
                {selectedCourse && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">{selectedCourse.code}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-400">{selectedCourse.term}</span>
                  </div>
                )}
              </div>
              {selectedCourse ? (
                <AssignmentList 
                  courseId={selectedCourse.id}
                  courseName={selectedCourse.name}
                />
              ) : (
                <div className="glass-card h-[500px] flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                      <ClientOnlyIcon icon={BookOpen} className="w-12 h-12 text-indigo-300" />
                    </div>
                    <h4 className="text-2xl font-semibold text-white mb-3">No Course Selected</h4>
                    <p className="text-gray-400 text-lg mb-6">
                      Select a course from the list to view its assignments and launch AI missions
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                      <ClientOnlyIcon icon={Zap} className="w-4 h-4" />
                      <span>AI-powered assignment completion</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </CopilotSidebar>
  );
}