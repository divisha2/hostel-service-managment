use hsrms;


DELIMITER $$

-- ──────────────────────────────────────────────────────────────
-- Procedure 1: RaiseRequest
-- Purpose : Student submits a new service request
-- Validates: student exists, category exists, description length
-- Called by: Backend POST /api/student/requests
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
END$$


-- ──────────────────────────────────────────────────────────────
-- Procedure 2: AssignStaff
-- Purpose :assigns a staff member to a pending request
-- Validates: request is Pending, not already assigned,
--            staff specialization matches request category
-- Called by: Backend POST /api/warden/assignments
-- ──────────────────────────────────────────────────────────────

delimiter $$ 
CREATE PROCEDURE AssignStaff(
    IN  p_request_id    INT,
    IN  p_staff_id      INT,
    OUT p_assignment_id INT
)
BEGIN
    DECLARE v_category_name  VARCHAR(50);
    DECLARE v_specialization VARCHAR(50);

    IF NOT EXISTS (
        SELECT 1 FROM Service_Request
        WHERE request_id = p_request_id AND status = 'Pending'
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Request not found or not in Pending status';
    END IF;

    IF EXISTS (SELECT 1 FROM Assignment WHERE request_id = p_request_id) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Request is already assigned to a staff member';
    END IF;

    SELECT sc.name INTO v_category_name
    FROM Service_Request sr
    JOIN Service_Category sc ON sr.category_id = sc.category_id
    WHERE sr.request_id = p_request_id;

    SELECT specialization INTO v_specialization
    FROM Staff WHERE staff_id = p_staff_id;

    IF v_category_name != v_specialization THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Staff specialization does not match request category';
    END IF;

    INSERT INTO Assignment (request_id, staff_id, assigned_date)
    VALUES (p_request_id, p_staff_id, NOW());

    SET p_assignment_id = LAST_INSERT_ID();

    UPDATE Service_Request
    SET status = 'Assigned'
    WHERE request_id = p_request_id;
END$$

DELIMITER ;


-- ──────────────────────────────────────────────────────────────
-- Test calls (uncomment one at a time in Workbench)
-- ──────────────────────────────────────────────────────────────

-- Test RaiseRequest:
-- CALL RaiseRequest(1003, 2, 'Water tap broken in room bathroom', @new_id);
-- SELECT @new_id;

-- Test AssignStaff (request 1 is Plumbing, staff 3 is R. Gupta - Plumber):
-- CALL AssignStaff(1, 3, @new_asgn);
-- SELECT @new_asgn;

-- Test specialization mismatch error (staff 1 is Electrician, request 1 is Plumbing):
-- CALL AssignStaff(1, 1, @new_asgn);
-- Should throw: 'Staff specialization does not match request category'