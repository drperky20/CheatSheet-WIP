'use client';

import { BookOpen, Calendar, ChevronRight, Activity } from 'lucide-react';
import { type Course } from '@/lib/supabase/services';
import ClientOnlyIcon from '@/components/ui/ClientOnlyIcon';

interface CourseListProps {
  courses: Course[];
  selectedCourseId?: string;
  onCourseSelect: (course: Course) => void;
}

export function CourseList({ courses, selectedCourseId, onCourseSelect }: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="glass-card h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
            <ClientOnlyIcon icon={BookOpen} className="w-10 h-10 text-indigo-300" />
          </div>
          <p className="text-lg font-medium text-white mb-2">No Courses Found</p>
          <p className="text-sm text-gray-400">
            Connect your Canvas account to sync courses
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => {
        const isSelected = course.id === selectedCourseId;
        
        return (
          <button
            key={course.id}
            onClick={() => onCourseSelect(course)}
            className={`
              w-full glass-card-sm group hover-lift hover-glow transition-all duration-500 border-gradient relative overflow-hidden
              ${isSelected ? 'ring-2 ring-indigo-400 shadow-glow' : ''}
            `}
          >
            {/* Background overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isSelected ? 'opacity-100' : ''}`} />
            
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className={`
                  p-4 rounded-2xl transition-all duration-500 shadow-soft
                  ${isSelected 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-glow' 
                    : 'bg-gradient-to-br from-indigo-500/20 to-purple-600/20 group-hover:from-indigo-500/40 group-hover:to-purple-600/40'
                  }
                `}>
                  <ClientOnlyIcon 
                    icon={BookOpen} 
                    className={`w-7 h-7 transition-colors duration-300 ${isSelected ? 'text-white' : 'text-indigo-300 group-hover:text-indigo-200'}`} 
                  />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h4 className="font-bold text-white text-xl mb-2 group-hover:text-gradient transition-all duration-300 truncate">
                    {course.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex items-center space-x-1.5 glass rounded-full px-3 py-1">
                      <ClientOnlyIcon icon={Calendar} className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-300 font-medium">{course.term}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 glass rounded-full px-3 py-1">
                      <span className="text-sm text-gray-300 font-medium">{course.code}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${course.enrollment_state === 'active' ? 'bg-green-400' : 'bg-gray-400'}`} />
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        {course.enrollment_state === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="badge badge-success">
                      <ClientOnlyIcon icon={Activity} className="w-3 h-3 mr-1.5" />
                      <span className="font-semibold">12 tasks</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-500
                ${isSelected ? 'opacity-100 bg-indigo-500/20' : 'opacity-0 group-hover:opacity-100 group-hover:bg-gray-500/10'}
              `}>
                <ClientOnlyIcon 
                  icon={ChevronRight} 
                  className={`w-5 h-5 transition-all duration-300 ${isSelected ? 'text-indigo-400 transform translate-x-1' : 'text-gray-400'}`} 
                />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}