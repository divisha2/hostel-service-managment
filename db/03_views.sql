USE hsrms;

-- ──────────────────────────────────────────────────────────────
-- View 1: StudentRequestView
-- Purpose : Student sees their own requests + assignment info
-- Used by : Student dashboard
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW StudentRequestView AS
SELECT
    sr.request_id,
    sr.student_id,
    sc.name           AS category,
    sr.description,
    sr.status,
    sr.date_raised,
    st.name           AS staff_name,
    a.assigned_date,
    a.completion_date
FROM Service_Request sr
JOIN  Service_Category sc ON sr.category_id = sc.category_id
LEFT JOIN Assignment   a  ON sr.request_id  = a.request_id
LEFT JOIN Staff        st ON a.staff_id     = st.staff_id;


-- ──────────────────────────────────────────────────────────────
-- View 2: StaffAssignmentView
-- Purpose : Staff sees requests assigned to them
-- Used by : Staff dashboard
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW StaffAssignmentView AS
SELECT
    a.assignment_id,
    a.staff_id,
    sr.request_id,
    s.name            AS student_name,
    s.phone           AS student_phone,
    r.room_number,
    sc.name           AS category,
    sr.description,
    sr.status,
    a.assigned_date,
    a.completion_date
FROM Assignment        a
JOIN Service_Request  sr ON a.request_id   = sr.request_id
JOIN Student           s ON sr.student_id  = s.student_id
JOIN Room              r ON s.room_id      = r.room_id
JOIN Service_Category sc ON sr.category_id = sc.category_id;


-- ──────────────────────────────────────────────────────────────
-- View 3: WardenOversightView
-- Purpose : Warden sees all requests in their hostel
-- Used by : Warden dashboard
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW WardenOversightView AS
SELECT
    sr.request_id,
    s.student_id,
    s.name            AS student_name,
    s.phone           AS student_phone,
    s.email           AS student_email,
    r.room_number,
    h.hostel_id,
    h.hostel_name,
    sc.name           AS category,
    sr.description,
    sr.status,
    sr.date_raised,
    st.name           AS staff_name,
    a.assignment_id,
    a.assigned_date,
    a.completion_date
FROM Service_Request  sr
JOIN Student           s ON sr.student_id  = s.student_id
JOIN Room              r ON s.room_id      = r.room_id
JOIN Hostel            h ON r.hostel_id    = h.hostel_id
JOIN Service_Category sc ON sr.category_id = sc.category_id
LEFT JOIN Assignment   a ON sr.request_id  = a.request_id
LEFT JOIN Staff       st ON a.staff_id     = st.staff_id;


-- ──────────────────────────────────────────────────────────────
-- Verify views after running (uncomment to test)
-- ──────────────────────────────────────────────────────────────
-- SELECT * FROM StudentRequestView   WHERE student_id = 1;
-- SELECT * FROM StaffAssignmentView  WHERE staff_id   = 1;
-- SELECT * FROM WardenOversightView  WHERE hostel_id  = 1;