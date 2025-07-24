-- Canvas LMS Integration Functions
-- ==================================

-- Function to sync courses from Canvas
CREATE OR REPLACE FUNCTION sync_canvas_courses(
  p_user_id UUID,
  p_courses JSONB
)
RETURNS TABLE(
  courses_synced INTEGER,
  courses_updated INTEGER,
  courses_created INTEGER
) AS $$
DECLARE
  course_record JSONB;
  courses_created_count INTEGER := 0;
  courses_updated_count INTEGER := 0;
  total_courses INTEGER := 0;
BEGIN
  -- Loop through provided courses
  FOR course_record IN SELECT * FROM jsonb_array_elements(p_courses) LOOP
    total_courses := total_courses + 1;
    
    -- Insert or update course
    INSERT INTO courses (
      id,
      user_id,
      name,
      code,
      term,
      enrollment_state,
      student_count,
      canvas_data,
      created_at,
      updated_at
    ) VALUES (
      (course_record->>'id')::TEXT,
      p_user_id,
      course_record->>'name',
      course_record->>'course_code',
      course_record->>'term',
      COALESCE(course_record->>'workflow_state', 'active'),
      (course_record->>'total_students')::INTEGER,
      course_record,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      code = EXCLUDED.code,
      term = EXCLUDED.term,
      enrollment_state = EXCLUDED.enrollment_state,
      student_count = EXCLUDED.student_count,
      canvas_data = EXCLUDED.canvas_data,
      updated_at = NOW();
    
    -- Count if it was an insert or update
    IF FOUND THEN
      courses_updated_count := courses_updated_count + 1;
    ELSE
      courses_created_count := courses_created_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT total_courses, courses_updated_count, courses_created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync assignments for a course
CREATE OR REPLACE FUNCTION sync_canvas_assignments(
  p_user_id UUID,
  p_course_id TEXT,
  p_assignments JSONB
)
RETURNS TABLE(
  assignments_synced INTEGER,
  assignments_updated INTEGER,
  assignments_created INTEGER
) AS $$
DECLARE
  assignment_record JSONB;
  assignments_created_count INTEGER := 0;
  assignments_updated_count INTEGER := 0;
  total_assignments INTEGER := 0;
BEGIN
  -- Loop through provided assignments
  FOR assignment_record IN SELECT * FROM jsonb_array_elements(p_assignments) LOOP
    total_assignments := total_assignments + 1;
    
    -- Insert or update assignment
    INSERT INTO assignments (
      id,
      course_id,
      user_id,
      name,
      description,
      due_at,
      points_possible,
      submission_types,
      has_submitted_submissions,
      workflow_state,
      canvas_data,
      created_at,
      updated_at
    ) VALUES (
      (assignment_record->>'id')::TEXT,
      p_course_id,
      p_user_id,
      assignment_record->>'name',
      assignment_record->>'description',
      CASE 
        WHEN assignment_record->>'due_at' IS NOT NULL 
        THEN (assignment_record->>'due_at')::TIMESTAMPTZ 
        ELSE NULL 
      END,
      (assignment_record->>'points_possible')::DECIMAL,
      ARRAY(SELECT jsonb_array_elements_text(assignment_record->'submission_types')),
      COALESCE((assignment_record->>'has_submitted_submissions')::BOOLEAN, false),
      COALESCE(assignment_record->>'workflow_state', 'published'),
      assignment_record,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      due_at = EXCLUDED.due_at,
      points_possible = EXCLUDED.points_possible,
      submission_types = EXCLUDED.submission_types,
      has_submitted_submissions = EXCLUDED.has_submitted_submissions,
      workflow_state = EXCLUDED.workflow_state,
      canvas_data = EXCLUDED.canvas_data,
      updated_at = NOW();
    
    -- Count if it was an insert or update
    IF FOUND THEN
      assignments_updated_count := assignments_updated_count + 1;
    ELSE
      assignments_created_count := assignments_created_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT total_assignments, assignments_updated_count, assignments_created_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's courses with assignment counts
CREATE OR REPLACE FUNCTION get_user_courses_with_assignments(p_user_id UUID)
RETURNS TABLE(
  id TEXT,
  name TEXT,
  code TEXT,
  term TEXT,
  enrollment_state TEXT,
  student_count INTEGER,
  assignment_count BIGINT,
  upcoming_assignments BIGINT,
  past_due_assignments BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.code,
    c.term,
    c.enrollment_state,
    c.student_count,
    COUNT(a.id) as assignment_count,
    COUNT(a.id) FILTER (WHERE a.due_at > NOW()) as upcoming_assignments,
    COUNT(a.id) FILTER (WHERE a.due_at < NOW() AND NOT a.has_submitted_submissions) as past_due_assignments,
    c.created_at,
    c.updated_at
  FROM courses c
  LEFT JOIN assignments a ON c.id = a.course_id
  WHERE c.user_id = p_user_id
  GROUP BY c.id, c.name, c.code, c.term, c.enrollment_state, c.student_count, c.created_at, c.updated_at
  ORDER BY c.enrollment_state DESC, c.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get assignments for a course with filtering
CREATE OR REPLACE FUNCTION get_course_assignments(
  p_user_id UUID,
  p_course_id TEXT,
  p_filter TEXT DEFAULT 'all' -- 'all', 'upcoming', 'past', 'submitted'
)
RETURNS TABLE(
  id TEXT,
  course_id TEXT,
  name TEXT,
  description TEXT,
  due_at TIMESTAMPTZ,
  points_possible DECIMAL,
  submission_types TEXT[],
  has_submitted_submissions BOOLEAN,
  workflow_state TEXT,
  days_until_due INTEGER,
  is_overdue BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.course_id,
    a.name,
    a.description,
    a.due_at,
    a.points_possible,
    a.submission_types,
    a.has_submitted_submissions,
    a.workflow_state,
    CASE 
      WHEN a.due_at IS NOT NULL 
      THEN EXTRACT(DAYS FROM (a.due_at - NOW()))::INTEGER
      ELSE NULL 
    END as days_until_due,
    CASE 
      WHEN a.due_at IS NOT NULL AND a.due_at < NOW() AND NOT a.has_submitted_submissions
      THEN true 
      ELSE false 
    END as is_overdue,
    a.created_at,
    a.updated_at
  FROM assignments a
  WHERE a.user_id = p_user_id 
    AND a.course_id = p_course_id
    AND (
      p_filter = 'all' OR
      (p_filter = 'upcoming' AND a.due_at > NOW()) OR
      (p_filter = 'past' AND a.due_at < NOW()) OR
      (p_filter = 'submitted' AND a.has_submitted_submissions)
    )
  ORDER BY 
    CASE 
      WHEN a.due_at IS NULL THEN 2
      WHEN a.due_at > NOW() THEN 1
      ELSE 3
    END,
    a.due_at ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update Canvas credentials securely
CREATE OR REPLACE FUNCTION update_canvas_credentials(
  p_user_id UUID,
  p_canvas_domain TEXT,
  p_encrypted_token TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update user preferences with Canvas credentials
  INSERT INTO user_preferences (user_id, canvas_domain, encrypted_canvas_token, updated_at)
  VALUES (p_user_id, p_canvas_domain, p_encrypted_token, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    canvas_domain = EXCLUDED.canvas_domain,
    encrypted_canvas_token = EXCLUDED.encrypted_canvas_token,
    updated_at = NOW();
  
  -- Also update profiles table for backward compatibility
  UPDATE profiles 
  SET 
    canvas_domain = p_canvas_domain,
    encrypted_canvas_token = p_encrypted_token,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get Canvas credentials
CREATE OR REPLACE FUNCTION get_canvas_credentials(p_user_id UUID)
RETURNS TABLE(
  canvas_domain TEXT,
  encrypted_canvas_token TEXT,
  has_credentials BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.canvas_domain,
    up.encrypted_canvas_token,
    (up.canvas_domain IS NOT NULL AND up.encrypted_canvas_token IS NOT NULL) as has_credentials
  FROM user_preferences up
  WHERE up.user_id = p_user_id;
  
  -- If no record found, return empty
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::TEXT, NULL::TEXT, false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;