import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { canvasService, type Course, type Assignment } from '@/lib/supabase/services';

// Use imported types from services
// interface Course and Assignment are now imported

interface CanvasState {
  // Data
  courses: Course[];
  assignments: Map<string, Assignment[]>; // courseId -> assignments
  selectedCourse: Course | null;
  
  // Canvas credentials
  canvasDomain: string | null;
  canvasToken: string | null;
  
  // Actions
  setCourses: (courses: Course[]) => void;
  selectCourse: (course: Course | null) => void;
  setAssignments: (courseId: string, assignments: Assignment[]) => void;
  setCanvasCredentials: (domain: string, token: string) => void;
  
  // API calls
  fetchCourses: () => Promise<void>;
  fetchAssignments: (courseId: string) => Promise<void>;
  fetchAssignmentDetails: (courseId: string, assignmentId: string) => Promise<Assignment | null>;
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      courses: [],
      assignments: new Map(),
      selectedCourse: null,
      canvasDomain: null,
      canvasToken: null,
      
      setCourses: (courses) => set({ courses }),
      
      selectCourse: (course) => set({ selectedCourse: course }),
      
      setAssignments: (courseId, assignments) => 
        set((state) => ({
          assignments: new Map(state.assignments).set(courseId, assignments)
        })),
      
      setCanvasCredentials: (domain, token) => 
        set({ canvasDomain: domain, canvasToken: token }),
      
      fetchCourses: async () => {
        try {
          // In development, use mock data first - uncomment the line below for real Canvas integration
          // const courses = await canvasService.getUserCourses();
          // set({ courses });
          // For now, always use mock data
          throw new Error('Using mock data for development');
        } catch {
          console.log('Using mock course data for development');
          // Fall back to mock data for development
          const mockCourses: Course[] = [
            {
              id: '1',
              name: 'Introduction to Computer Science',
              code: 'CS 101',
              term: 'Fall 2024',
              enrollment_state: 'active',
              student_count: 150,
              assignment_count: 8,
              upcoming_assignments: 3,
              past_due_assignments: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              name: 'Data Structures and Algorithms',
              code: 'CS 201',
              term: 'Fall 2024',
              enrollment_state: 'active',
              student_count: 120,
              assignment_count: 12,
              upcoming_assignments: 5,
              past_due_assignments: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          set({ courses: mockCourses });
        }
      },
      
      fetchAssignments: async (courseId: string) => {
        try {
          const assignments = await canvasService.getCourseAssignments(courseId);
          set((state) => ({
            assignments: new Map(state.assignments).set(courseId, assignments)
          }));
        } catch (error) {
          console.error('Failed to fetch assignments:', error);
          // Fall back to mock data for development
          const mockAssignments: Assignment[] = [
            {
              id: '1',
              course_id: courseId,
              name: 'Research Paper: Quantum Computing',
              description: 'Write a 2500-word research paper on recent advances in quantum computing',
              due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              points_possible: 100,
              submission_types: ['online_upload'],
              has_submitted_submissions: false,
              workflow_state: 'published',
              days_until_due: 7,
              is_overdue: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              course_id: courseId,
              name: 'Weekly Quiz: Chapter 5',
              description: 'Complete the quiz on Chapter 5 materials',
              due_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              points_possible: 20,
              submission_types: ['online_quiz'],
              has_submitted_submissions: false,
              workflow_state: 'published',
              days_until_due: 2,
              is_overdue: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          
          set((state) => ({
            assignments: new Map(state.assignments).set(courseId, mockAssignments)
          }));
        }
      },
      
      fetchAssignmentDetails: async (courseId: string, assignmentId: string) => {
        const { assignments } = get();
        
        // Check cache first
        const courseAssignments = assignments.get(courseId);
        const cachedAssignment = courseAssignments?.find(a => a.id === assignmentId);
        
        if (cachedAssignment) {
          return cachedAssignment;
        }
        
        try {
          // If not in cache, fetch all assignments for the course
          await get().fetchAssignments(courseId);
          
          // Check cache again
          const updatedAssignments = get().assignments.get(courseId);
          return updatedAssignments?.find(a => a.id === assignmentId) || null;
        } catch (error) {
          console.error('Failed to fetch assignment details:', error);
          return null;
        }
      }
    }),
    {
      name: 'canvas-storage',
      partialize: (state) => ({
        canvasDomain: state.canvasDomain,
        selectedCourse: state.selectedCourse
      })
    }
  )
);