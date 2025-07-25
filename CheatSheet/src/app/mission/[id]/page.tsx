'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EnhancedMissionWorkspace } from '@/components/mission/EnhancedMissionWorkspace';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { type Assignment } from '@/lib/supabase/services';
import ClientOnlyIcon from '@/components/ui/ClientOnlyIcon';

export default function MissionPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;
  
  const [, setUser] = useState<{ id: string; email?: string } | null>(null); // user not directly used in render but needed for auth
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializePage = async () => {
      // Check authentication
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      setUser(user);
      
      // Mock assignment data - in production, fetch from Canvas API
      const mockAssignment: Assignment = {
        id: assignmentId,
        course_id: 'course-123',
        name: 'Research Paper: Quantum Computing',
        description: 'Write a comprehensive 2500-word research paper on recent advances in quantum computing, including current applications and future implications.',
        due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        points_possible: 100,
        submission_types: ['online_text_entry'],
        has_submitted_submissions: false,
        workflow_state: 'published',
        days_until_due: 7,
        is_overdue: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setAssignment(mockAssignment);
      setLoading(false);
    };

    initializePage();
  }, [assignmentId, router]);

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <ClientOnlyIcon icon={Sparkles} className="w-12 h-12 text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-white text-lg">Initializing mission...</p>
          <p className="text-gray-400 text-sm mt-2">Setting up your workspace</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="glass-card">
            <h2 className="text-xl font-semibold text-white mb-2">Assignment Not Found</h2>
            <p className="text-gray-400 mb-4">The requested assignment could not be loaded.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="glass-button flex items-center space-x-2 mx-auto"
            >
              <ClientOnlyIcon icon={ArrowLeft} className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 to-black overflow-hidden">
      {/* Header */}
      <header className="glass-effect border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="glass-button p-2"
              aria-label="Back to dashboard"
            >
              <ClientOnlyIcon icon={ArrowLeft} className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white line-clamp-1">
                {assignment.name}
              </h1>
              <p className="text-sm text-gray-400">
                Mission ID: {assignmentId}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>Due:</span>
            <span className="text-yellow-400">
              {assignment.due_at 
                ? new Date(assignment.due_at).toLocaleDateString()
                : 'No due date'
              }
            </span>
          </div>
        </div>
      </header>

      {/* Mission Workspace */}
      <main className="h-[calc(100vh-80px)]">
        <EnhancedMissionWorkspace 
          assignmentId={assignmentId}
          assignment={assignment}
        />
      </main>
    </div>
  );
}