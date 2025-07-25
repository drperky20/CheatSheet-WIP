'use client';

import { useState, useEffect } from 'react';
import { Clock, FileText, AlertCircle, CheckCircle, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Assignment {
  id: string;
  name: string;
  description: string;
  due_at: string | null;
  points_possible: number;
  submission_types: string[];
  has_submitted_submissions: boolean;
  workflow_state: string;
}

interface AssignmentListProps {
  courseId: string;
  courseName?: string;
}

export function AssignmentList({ courseId, courseName }: AssignmentListProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const router = useRouter();

  useEffect(() => {
    // In production, fetch from Canvas API
    // Mock data for now
    const mockAssignments: Assignment[] = [
      {
        id: '1',
        name: 'Research Paper: Quantum Computing',
        description: 'Write a 2500-word research paper on recent advances in quantum computing',
        due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        points_possible: 100,
        submission_types: ['online_upload'],
        has_submitted_submissions: false,
        workflow_state: 'published'
      },
      {
        id: '2',
        name: 'Weekly Quiz: Chapter 5',
        description: 'Complete the quiz on Chapter 5 materials',
        due_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        points_possible: 20,
        submission_types: ['online_quiz'],
        has_submitted_submissions: false,
        workflow_state: 'published'
      }
    ];

    setAssignments(mockAssignments);
    setLoading(false);
  }, [courseId]);

  const getAssignmentIcon = (submissionTypes: string[]) => {
    if (submissionTypes.includes('online_quiz')) return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    if (submissionTypes.includes('online_upload')) return <FileText className="w-5 h-5 text-blue-400" />;
    return <FileText className="w-5 h-5 text-gray-400" />;
  };

  const getTimeRemaining = (dueDate: string | null) => {
    if (!dueDate) return 'No due date';
    
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    
    if (diff < 0) return 'Past due';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    return 'Due soon';
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    
    const now = new Date();
    const dueDate = assignment.due_at ? new Date(assignment.due_at) : null;
    
    if (filter === 'upcoming') {
      return !dueDate || dueDate > now;
    } else {
      return dueDate && dueDate <= now;
    }
  });

  const handleLaunchMission = (assignmentId: string) => {
    router.push(`/mission/${assignmentId}`);
  };

  if (loading) {
    return (
      <div className="glass-card">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-white/10 rounded"></div>
            <div className="h-24 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card h-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Assignments</h2>
        {courseName && <p className="text-sm text-gray-400 mb-4">{courseName}</p>}
        
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'upcoming' 
                ? 'bg-white/20 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'past' 
                ? 'bg-white/20 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all' 
                ? 'bg-white/20 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            All
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAssignments.map(assignment => (
          <div
            key={assignment.id}
            className="glass-panel hover:bg-white/20 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                {getAssignmentIcon(assignment.submission_types)}
                <div className="flex-1">
                  <h3 className="font-medium text-white">{assignment.name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                    {assignment.description}
                  </p>
                </div>
              </div>
              
              {assignment.has_submitted_submissions && (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center text-gray-400">
                  <Clock className="w-4 h-4 mr-1" />
                  {getTimeRemaining(assignment.due_at)}
                </span>
                <span className="text-gray-500">
                  {assignment.points_possible} points
                </span>
              </div>

              <button
                onClick={() => handleLaunchMission(assignment.id)}
                className="glass-button px-4 py-2 text-sm flex items-center space-x-2 text-blue-400 hover:text-blue-300"
              >
                <Rocket className="w-4 h-4" />
                <span>Launch Mission</span>
              </button>
            </div>
          </div>
        ))}

        {filteredAssignments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No {filter !== 'all' ? filter : ''} assignments</p>
          </div>
        )}
      </div>
    </div>
  );
}