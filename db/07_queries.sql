USE hsrms;


-- Query 1: Simple SELECT with JOIN
-- All students with their room number and hostel name
SELECT
    s.student_id,
    s.name        AS student_name,
    s.phone,
    r.room_number,
    h.hostel_name
FROM Student s
JOIN Room   r ON s.room_id   = r.room_id
JOIN Hostel h ON r.hostel_id = h.hostel_id
ORDER BY h.hostel_name, r.room_number;


-- Query 2: Filter + JOIN
-- All Pending requests with student name, room, and category
SELECT
    sr.request_id,
    s.name        AS student_name,
    r.room_number,
    sc.name       AS category,
    sr.description,
    sr.date_raised
FROM Service_Request sr
JOIN Student          s  ON sr.student_id  = s.student_id
JOIN Room             r  ON s.room_id      = r.room_id
JOIN Service_Category sc ON sr.category_id = sc.category_id
WHERE sr.status = 'Pending'
ORDER BY sr.date_raised ASC;


-- Query 3: GROUP BY + aggregate
-- Request count per category broken down by status
SELECT
    sc.name                            AS category,
    COUNT(*)                           AS total_requests,
    SUM(sr.status = 'Pending')         AS pending,
    SUM(sr.status = 'Assigned')        AS assigned,
    SUM(sr.status = 'Accepted')        AS accepted,
    SUM(sr.status = 'Completed')       AS completed
FROM Service_Request sr
JOIN Service_Category sc ON sr.category_id = sc.category_id
GROUP BY sc.category_id, sc.name
ORDER BY total_requests DESC;


-- Query 4: GROUP BY + HAVING
-- Staff assigned to more than 1 request
SELECT
    st.staff_id,
    st.name                        AS staff_name,
    st.specialization,
    COUNT(a.assignment_id)         AS total_assignments
FROM Staff      st
JOIN Assignment  a ON st.staff_id = a.staff_id
GROUP BY st.staff_id, st.name, st.specialization
HAVING COUNT(a.assignment_id) > 1
ORDER BY total_assignments DESC;


-- Query 5: LEFT JOIN — find unassigned requests
-- Requests with no entry in Assignment table
SELECT
    sr.request_id,
    s.name        AS student_name,
    r.room_number,
    sc.name       AS category,
    sr.status,
    sr.date_raised
FROM Service_Request sr
JOIN Student          s  ON sr.student_id  = s.student_id
JOIN Room             r  ON s.room_id      = r.room_id
JOIN Service_Category sc ON sr.category_id = sc.category_id
LEFT JOIN Assignment   a ON sr.request_id  = a.request_id
WHERE a.assignment_id IS NULL
ORDER BY sr.date_raised ASC;


-- Query 6: Subquery
-- Students who raised more requests than the average student
SELECT
    s.student_id,
    s.name                   AS student_name,
    r.room_number,
    COUNT(sr.request_id)     AS request_count
FROM Student         s
JOIN Room            r  ON s.room_id    = r.room_id
JOIN Service_Request sr ON s.student_id = sr.student_id
GROUP BY s.student_id, s.name, r.room_number
HAVING COUNT(sr.request_id) > (
    SELECT AVG(cnt)
    FROM (
        SELECT COUNT(*) AS cnt
        FROM Service_Request
        GROUP BY student_id
    ) AS avg_table
)
ORDER BY request_count DESC;


-- Query 7: Multi-table JOIN
-- Completed requests with student, staff, and resolution time in hours
SELECT
    sr.request_id,
    s.name          AS student_name,
    r.room_number,
    sc.name         AS category,
    st.name         AS staff_name,
    st.specialization,
    a.assigned_date,
    a.completion_date,
    TIMESTAMPDIFF(HOUR, a.assigned_date, a.completion_date) AS hours_to_complete
FROM Service_Request sr
JOIN Student          s  ON sr.student_id  = s.student_id
JOIN Room             r  ON s.room_id      = r.room_id
JOIN Service_Category sc ON sr.category_id = sc.category_id
JOIN Assignment        a ON sr.request_id  = a.request_id
JOIN Staff            st ON a.staff_id     = st.staff_id
WHERE sr.status = 'Completed'
ORDER BY a.completion_date DESC;


-- Query 8: Using a View
-- All requests in Kaveri Block via WardenOversightView
SELECT
    request_id,
    student_name,
    room_number,
    category,
    status,
    staff_name,
    date_raised
FROM WardenOversightView
WHERE hostel_id = 1
ORDER BY date_raised DESC;


-- Query 9: Using Functions
-- Pending count and completion rate per hostel
SELECT
    h.hostel_id,
    h.hostel_name,
    GetPendingCount(h.hostel_id)   AS pending_requests,
    GetCompletionRate(h.hostel_id) AS completion_rate_pct
FROM Hostel h
ORDER BY h.hostel_id;


-- Query 10: Audit Log with full context
-- Full status change history joined with request and student details
SELECT
    al.log_id,
    al.request_id,
    s.name     AS student_name,
    sc.name    AS category,
    al.old_status,
    al.new_status,
    al.changed_at
FROM Audit_Log       al
JOIN Service_Request sr ON al.request_id  = sr.request_id
JOIN Student          s ON sr.student_id  = s.student_id
JOIN Service_Category sc ON sr.category_id = sc.category_id
ORDER BY al.changed_at DESC;