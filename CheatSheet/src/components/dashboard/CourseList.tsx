'use client';

import { useState } from 'react';
import { ChevronRight, BookOpen, Users, Calendar } from 'lucide-react';
import { type Course } from '@/lib/supabase/services';

interface CourseListProps {
  courses: Course[];
  selectedCourseId?: string;
  onCourseSelect: (course: Course) => void;
}

export function CourseList({ courses, selectedCourseId, onCourseSelect }: CourseListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCourses = filteredCourses.filter(c => c.enrollment_state === 'active');
  const pastCourses = filteredCourses.filter(c => c.enrollment_state !== 'active');

  return (
    <div className="glass-card h-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Your Courses</h2>
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="glass-input w-full"
        />
      </div>

      <div className="space-y-4">
        {activeCourses.length > 0 && (
          <div>
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-2">Active</h3>
            <div className="space-y-2">
              {activeCourses.map(course => (
                <button
                  key={course.id}
                  onClick={() => onCourseSelect(course)}
                  className={`w-full text-left glass-panel hover:bg-white/20 transition-all ${
                    selectedCourseId === course.id ? 'ring-2 ring-white/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="font-medium text-white">{course.code}</p>
                        <p className="text-sm text-gray-400 line-clamp-1">{course.name}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {course.term}
                    </span>
                    {course.student_count && (
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {course.student_count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {pastCourses.length > 0 && (
          <div>
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-2">Past</h3>
            <div className="space-y-2 opacity-60">
              {pastCourses.map(course => (
                <button
                  key={course.id}
                  onClick={() => onCourseSelect(course)}
                  className={`w-full text-left glass-panel hover:bg-white/20 transition-all ${
                    selectedCourseId === course.id ? 'ring-2 ring-white/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-300">{course.code}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{course.name}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredCourses.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No courses found</p>
          </div>
        )}
      </div>
    </div>
  );
}