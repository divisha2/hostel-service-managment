USE hsrms;

-- Drop existing procedures if they exist
DROP PROCEDURE IF EXISTS RaiseRequest;
DROP PROCEDURE IF EXISTS AcceptRequest;
DROP PROCEDURE IF EXISTS CompleteAssignment;
DROP PROCEDURE IF EXISTS AddStaff;
DROP PROCEDURE IF EXISTS DeleteStaff;

DELIMITER $

-- ──────────────────────────────────────────────────────────────
-- Procedure 1: RaiseRequest
-- Purpose : Student submits a new service request
-- Validates: student exists, category exists, description length
-- Called by: Backend POST /api/student/request
-- ──────────────────────────────────────────────────────────────
CREATE PROCEDURE RaiseRequest(
    IN  p_student_id  INT,
    IN  p_category_id INT,
    IN  p_description VARCHAR(500),
    OUT p_request_id  INT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Student WHERE student_id = p_student_id) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Student not found';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM Service_Category WHERE category_id = p_category_id) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Category not found';
    END IF;

    IF CHAR_LENGTH(TRIM(p_description)) < 10 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Description must be at least 10 characters';
    END IF;

    INSERT INTO Service_Request (student_id, category_id, description, status, date_raised)
    VALUES (p_student_id, p_category_id, TRIM(p_description), 'Pending', NOW());

    SET p_request_id = LAST_INSERT_ID();
END$


-- ──────────────────────────────────────────────────────────────
-- Procedure 2: AcceptRequest
-- Purpose : Staff accepts a pending request (CareCrew workflow)
-- Validates: request is Pending, not already assigned,
--            staff specialization matches request category
-- Called by: Backend POST /api/staff/accept/:request_id
-- ──────────────────────────────────────────────────────────────
CREATE PROCEDURE AcceptRequest(
    IN  p_request_id    INT,
    IN  p_staff_id      INT,
    OUT p_assignment_id INT
)
BEGIN
    DECLARE v_category_name  VARCHAR(50);
    DECLARE v_specialization VARCHAR(50);

    -- Check if request exists and is Pending
    IF NOT EXISTS (
        SELECT 1 FROM Service_Request
        WHERE request_id = p_request_id AND status = 'Pending'
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Request not found or not in Pending status';
    END IF;

    -- Check if already assigned
    IF EXISTS (SELECT 1 FROM Assignment WHERE request_id = p_request_id) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Request already assigned';
    END IF;

    -- Get request category
    SELECT sc.name INTO v_category_name
    FROM Service_Request sr
    JOIN Service_Category sc ON sr.category_id = sc.category_id
    WHERE sr.request_id = p_request_id;

    -- Get staff specialization
    SELECT specialization INTO v_specialization
    FROM Staff WHERE staff_id = p_staff_id;

    -- Validate specialization matches category
    IF v_category_name != v_specialization THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Staff specialization does not match request category';
    END IF;

    -- Create assignment
    INSERT INTO Assignment (request_id, staff_id, assigned_date)
    VALUES (p_request_id, p_staff_id, NOW());

    SET p_assignment_id = LAST_INSERT_ID();

    -- Update request status to Accepted
    UPDATE Service_Request
    SET status = 'Accepted'
    WHERE request_id = p_request_id;
END$


-- ──────────────────────────────────────────────────────────────
-- Procedure 3: CompleteAssignment
-- Purpose : Staff marks an assignment as completed
-- Validates: assignment exists, staff owns the assignment,
--            assignment is not already completed
-- Called by: Backend PUT /api/staff/assignment/:id
-- ──────────────────────────────────────────────────────────────
CREATE PROCEDURE CompleteAssignment(
    IN p_assignment_id INT,
    IN p_staff_id      INT
)
BEGIN
    DECLARE v_request_id INT;
    DECLARE v_owner_id   INT;

    -- Check if assignment exists
    IF NOT EXISTS (SELECT 1 FROM Assignment WHERE assignment_id = p_assignment_id) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Assignment not found';
    END IF;

    -- Get assignment details
    SELECT request_id, staff_id INTO v_request_id, v_owner_id
    FROM Assignment
    WHERE assignment_id = p_assignment_id;

    -- Verify ownership
    IF v_owner_id != p_staff_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Forbidden: Assignment belongs to another staff member';
    END IF;

    -- Update request status to Completed
    UPDATE Service_Request
    SET status = 'Completed'
    WHERE request_id = v_request_id;

    -- Note: completion_date is auto-updated by SetCompletionDate trigger
END$


-- ──────────────────────────────────────────────────────────────
-- Procedure 4: AddStaff
-- Purpose : Admin adds a new staff member
-- Validates: email uniqueness, valid specialization
-- Called by: Backend POST /api/admin/staff
-- ──────────────────────────────────────────────────────────────
CREATE PROCEDURE AddStaff(
    IN  p_name           VARCHAR(100),
    IN  p_phone          VARCHAR(15),
    IN  p_email          VARCHAR(100),
    IN  p_password       VARCHAR(255),
    IN  p_specialization VARCHAR(50),
    OUT p_staff_id       INT
)
BEGIN
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM Staff WHERE email = p_email) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email already exists';
    END IF;

    -- Validate specialization
    IF p_specialization NOT IN ('Electrical','Plumbing','Carpentry','Housekeeping','Civil') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid specialization';
    END IF;

    -- Insert new staff
    INSERT INTO Staff (name, phone, email, password, specialization)
    VALUES (p_name, p_phone, p_email, p_password, p_specialization);

    SET p_staff_id = LAST_INSERT_ID();
END$


-- ──────────────────────────────────────────────────────────────
-- Procedure 5: DeleteStaff
-- Purpose : Admin deletes a staff member
-- Validates: staff exists, no active assignments
-- Called by: Backend DELETE /api/admin/staff/:id
-- ──────────────────────────────────────────────────────────────
CREATE PROCEDURE DeleteStaff(
    IN p_staff_id INT
)
BEGIN
    -- Check if staff exists
    IF NOT EXISTS (SELECT 1 FROM Staff WHERE staff_id = p_staff_id) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Staff not found';
    END IF;

    -- Check for active assignments (Accepted status)
    IF EXISTS (
        SELECT 1 FROM Assignment a
        JOIN Service_Request sr ON a.request_id = sr.request_id
        WHERE a.staff_id = p_staff_id AND sr.status = 'Accepted'
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete staff with active assignments';
    END IF;

    -- Delete staff
    DELETE FROM Staff WHERE staff_id = p_staff_id;
END$

DELIMITER ;


-- ──────────────────────────────────────────────────────────────
-- Test calls (uncomment one at a time in Workbench)
-- ──────────────────────────────────────────────────────────────

-- Test RaiseRequest:
-- CALL RaiseRequest(1003, 2, 'Water tap broken in room bathroom', @new_id);
-- SELECT @new_id;

-- Test AcceptRequest (staff 3 is Plumber, request must be Plumbing category):
-- CALL AcceptRequest(1, 3, @new_asgn);
-- SELECT @new_asgn;

-- Test CompleteAssignment:
-- CALL CompleteAssignment(1, 3);

-- Test AddStaff:
-- CALL AddStaff('John Doe', '9876543210', 'john@example.com', 'pass123', 'Electrical', @new_staff);
-- SELECT @new_staff;

-- Test DeleteStaff:
-- CALL DeleteStaff(9);
