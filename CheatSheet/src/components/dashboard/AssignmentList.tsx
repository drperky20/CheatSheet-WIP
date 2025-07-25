'use client';

import { useState, useEffect } from 'react';
import { Clock, FileText, AlertCircle, CheckCircle, Zap, Calendar, Award, ArrowRight, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ClientOnlyIcon from '@/components/ui/ClientOnlyIcon';

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

export function AssignmentList({ courseId }: AssignmentListProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const router = useRouter();

  useEffect(() => {
    // In production, fetch from Canvas API
    const mockAssignments: Assignment[] = [
      {
        id: '1',
        name: 'Research Paper: Machine Learning Ethics',
        description: 'Write a comprehensive analysis of ethical considerations in ML development',
        due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        points_possible: 100,
        submission_types: ['online_text_entry', 'online_upload'],
        has_submitted_submissions: false,
        workflow_state: 'published'
      },
      {
        id: '2',
        name: 'Lab Report: Quantum Computing Simulation',
        description: 'Complete the quantum circuit simulation and document your findings',
        due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        points_possible: 75,
        submission_types: ['online_upload'],
        has_submitted_submissions: false,
        workflow_state: 'published'
      },
      {
        id: '3',
        name: 'Final Project: AI Application Development',
        description: 'Build a complete AI application with documentation and presentation',
        due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        points_possible: 200,
        submission_types: ['online_upload', 'online_url'],
        has_submitted_submissions: false,
        workflow_state: 'published'
      },
      {
        id: '4',
        name: 'Case Study: Data Privacy in Healthcare',
        description: 'Analyze HIPAA compliance and data privacy measures in modern healthcare systems',
        due_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        points_possible: 50,
        submission_types: ['online_text_entry'],
        has_submitted_submissions: true,
        workflow_state: 'published'
      }
    ];
    
    setTimeout(() => {
      setAssignments(mockAssignments);
      setLoading(false);
    }, 800);
  }, [courseId]);

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusInfo = (assignment: Assignment) => {
    const days = getDaysUntilDue(assignment.due_at);
    
    if (assignment.has_submitted_submissions) {
      return {
        label: 'Submitted',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        icon: CheckCircle,
        urgency: 0
      };
    }
    
    if (days === null) {
      return {
        label: 'No due date',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20',
        borderColor: 'border-gray-500/30',
        icon: Calendar,
        urgency: 1
      };
    }
    
    if (days < 0) {
      return {
        label: `${Math.abs(days)} days overdue`,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        icon: AlertCircle,
        urgency: 5
      };
    }
    
    if (days <= 3) {
      return {
        label: `${days} ${days === 1 ? 'day' : 'days'} left`,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        icon: Clock,
        urgency: 4
      };
    }
    
    return {
      label: `${days} days left`,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      icon: Clock,
      urgency: 2
    };
  };

  const handleLaunchMission = (assignmentId: string) => {
    router.push(`/mission/${assignmentId}`);
  };

  const filteredAssignments = assignments.filter(assignment => {
    const days = getDaysUntilDue(assignment.due_at);
    
    if (filter === 'upcoming') {
      return days !== null && days >= 0 && !assignment.has_submitted_submissions;
    } else if (filter === 'past') {
      return assignment.has_submitted_submissions || (days !== null && days < 0);
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-6 bg-white/10 rounded-lg w-3/4 mb-3" />
                <div className="h-4 bg-white/10 rounded-lg w-1/2 mb-4" />
                <div className="flex items-center space-x-4">
                  <div className="h-5 bg-white/10 rounded-full w-24" />
                  <div className="h-5 bg-white/10 rounded-full w-20" />
                </div>
              </div>
              <div className="h-10 bg-white/10 rounded-xl w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
            filter === 'all' 
              ? 'glass bg-gradient-to-r from-indigo-500/20 to-purple-600/20 text-white' 
              : 'glass text-gray-400 hover:text-white'
          }`}
        >
          All Tasks
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
            filter === 'upcoming' 
              ? 'glass bg-gradient-to-r from-indigo-500/20 to-purple-600/20 text-white' 
              : 'glass text-gray-400 hover:text-white'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
            filter === 'past' 
              ? 'glass bg-gradient-to-r from-indigo-500/20 to-purple-600/20 text-white' 
              : 'glass text-gray-400 hover:text-white'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Assignment Cards */}
      <div className="space-y-4">
        {filteredAssignments.sort((a, b) => {
          const statusA = getStatusInfo(a);
          const statusB = getStatusInfo(b);
          return statusB.urgency - statusA.urgency;
        }).map((assignment) => {
          const status = getStatusInfo(assignment);
          const StatusIcon = status.icon;
          
          return (
            <div 
              key={assignment.id} 
              className="glass-card-sm group hover-lift hover-glow transition-all duration-500 border-gradient relative overflow-hidden"
            >
              {/* Background overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/3 to-purple-600/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-start space-x-5">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 group-hover:from-indigo-500/40 group-hover:to-purple-600/40 transition-all duration-500 shadow-soft">
                      <ClientOnlyIcon icon={FileText} className="w-7 h-7 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xl font-bold text-white mb-3 group-hover:text-gradient transition-all duration-300 line-clamp-2">
                        {assignment.name}
                      </h4>
                      <p className="text-base text-gray-300 mb-6 line-clamp-2 leading-relaxed">
                        {assignment.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4">
                        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${status.bgColor} border-2 ${status.borderColor} shadow-soft`}>
                          <ClientOnlyIcon icon={StatusIcon} className={`w-4 h-4 ${status.color}`} />
                          <span className={`text-sm font-semibold ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 glass rounded-full px-4 py-2">
                          <ClientOnlyIcon icon={Award} className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-white font-semibold">
                            {assignment.points_possible} points
                          </span>
                        </div>

                        {assignment.due_at && (
                          <div className="flex items-center space-x-2 glass rounded-full px-4 py-2">
                            <ClientOnlyIcon icon={Calendar} className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-gray-300 font-medium">
                              Due {new Date(assignment.due_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-4 min-w-0">
                  {!assignment.has_submitted_submissions && (
                    <button
                      onClick={() => handleLaunchMission(assignment.id)}
                      className="btn-primary flex items-center space-x-3 text-base hover:glow-primary group/btn shadow-glow"
                    >
                      <ClientOnlyIcon icon={Zap} className="w-5 h-5" />
                      <span className="font-semibold">Launch Mission</span>
                      <ClientOnlyIcon icon={ArrowRight} className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  )}
                  
                  {assignment.has_submitted_submissions && (
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-2 badge badge-success text-base px-4 py-2">
                        <ClientOnlyIcon icon={TrendingUp} className="w-4 h-4" />
                        <span className="font-bold">95% Score</span>
                      </div>
                      <div className="flex items-center space-x-2 glass rounded-full px-3 py-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-green-400 font-medium">Completed</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredAssignments.length === 0 && (
          <div className="glass-card h-[300px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-500/20 to-slate-600/20 flex items-center justify-center">
                <ClientOnlyIcon icon={FileText} className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-white mb-2">No Assignments Found</p>
              <p className="text-sm text-gray-400">
                {filter === 'upcoming' ? 'No upcoming assignments' : 
                 filter === 'past' ? 'No completed assignments' : 
                 'No assignments in this course'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}