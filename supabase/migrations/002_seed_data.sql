-- ============================================================================
-- SEED DATA FOR DELIVERY DASHBOARD
-- ============================================================================

-- Insert Delivery Managers
INSERT INTO delivery_managers (id, name, email) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Diego', 'diego@company.com'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Hernan', 'hernan@company.com'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Ivan', 'ivan@company.com'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Tavo', 'tavo@company.com'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Leo', 'leo@company.com'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Orenday', 'orenday@company.com');

-- Insert Accounts
INSERT INTO accounts (id, name, manager_id, people, satisfaction_score_q1, satisfaction_score_q2, satisfaction_score_q3, satisfaction_score_q4, quarterly_comment_q1, quarterly_comment_q2, quarterly_comment_q3, quarterly_comment_q4) VALUES
  (
    '650e8400-e29b-41d4-a716-446655440001',
    'BBroker',
    '550e8400-e29b-41d4-a716-446655440001',
    1,
    8, 7, 8, NULL,
    'Good progress',
    'Some delays',
    'Back on track',
    ''
  ),
  (
    '650e8400-e29b-41d4-a716-446655440002',
    'GTR',
    '550e8400-e29b-41d4-a716-446655440001',
    1,
    9, 9, 9, NULL,
    'Excellent',
    'Continued excellence',
    'Outstanding',
    ''
  ),
  (
    '650e8400-e29b-41d4-a716-446655440003',
    'Figo',
    '550e8400-e29b-41d4-a716-446655440003',
    1,
    8, 5, 4, NULL,
    'Strong start',
    'Technical issues',
    'Critical blockers',
    ''
  );

-- Insert Weekly Statuses
INSERT INTO weekly_statuses (account_id, week, status, people) VALUES
  -- BBroker statuses
  ('650e8400-e29b-41d4-a716-446655440001', '2025-08-04', 'attention', 1),
  ('650e8400-e29b-41d4-a716-446655440001', '2025-08-11', 'attention', 1),
  ('650e8400-e29b-41d4-a716-446655440001', '2025-08-18', 'attention', 2),
  ('650e8400-e29b-41d4-a716-446655440001', '2025-08-25', 'attention', 2),
  -- Figo statuses
  ('650e8400-e29b-41d4-a716-446655440003', '2025-08-04', 'critical', 1),
  ('650e8400-e29b-41d4-a716-446655440003', '2025-08-11', 'critical', 1),
  ('650e8400-e29b-41d4-a716-446655440003', '2025-08-18', 'critical', 2),
  ('650e8400-e29b-41d4-a716-446655440003', '2025-08-25', 'critical', 3);

-- Insert Action Items
INSERT INTO action_items (account_id, manager_id, description, due_date, completed, priority, created_date) VALUES
  (
    '650e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Review Q3 deliverables',
    '2025-08-25',
    false,
    'high',
    '2025-08-15'
  ),
  (
    '650e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440003',
    'Escalate technical blockers',
    '2025-08-21',
    false,
    'high',
    '2025-08-18'
  );
