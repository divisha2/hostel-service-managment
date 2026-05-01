USE hsrms;

DELIMITER $$

-- ──────────────────────────────────────────────────────────────
-- Trigger 1: AuditStatusChange
-- Purpose : Auto-logs every status change into Audit_Log
--           Only fires when status column actually changes
-- Fires   : AFTER UPDATE on Service_Request
-- ──────────────────────────────────────────────────────────────
CREATE TRIGGER AuditStatusChange
AFTER UPDATE ON Service_Request
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO Audit_Log (request_id, old_status, new_status, changed_at)
        VALUES (NEW.request_id, OLD.status, NEW.status, NOW());
    END IF;
END$$


-- ──────────────────────────────────────────────────────────────
-- Trigger 2: PreventDuplicateAssignment
-- Purpose : Blocks INSERT if request is already assigned
--           DB-level guard on top of the UNIQUE(request_id) constraint
-- Fires   : BEFORE INSERT on Assignment
-- ──────────────────────────────────────────────────────────────
CREATE TRIGGER PreventDuplicateAssignment
BEFORE INSERT ON Assignment
FOR EACH ROW
BEGIN
    DECLARE v_existing INT;

    SELECT COUNT(*) INTO v_existing
    FROM Assignment
    WHERE request_id = NEW.request_id;

    IF v_existing > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'This request is already assigned to a staff member';
    END IF;
END$$


-- ──────────────────────────────────────────────────────────────
-- Trigger 3: SetCompletionDate
-- Purpose : Auto-fills completion_date on Assignment when
--           Service_Request status is set to Completed
--           No manual update needed from backend
-- Fires   : AFTER UPDATE on Service_Request
-- ──────────────────────────────────────────────────────────────
CREATE TRIGGER SetCompletionDate
AFTER UPDATE ON Service_Request
FOR EACH ROW
BEGIN
    IF OLD.status != 'Completed' AND NEW.status = 'Completed' THEN
        UPDATE Assignment
        SET completion_date = NOW()
        WHERE request_id    = NEW.request_id
          AND completion_date IS NULL;
    END IF;
END$$

DELIMITER ;


-- ──────────────────────────────────────────────────────────────
-- Tests — run each block separately in Workbench
-- ──────────────────────────────────────────────────────────────

-- Test 1: AuditStatusChange
-- UPDATE Service_Request SET status = 'Completed' WHERE request_id = 1;
-- SELECT * FROM Audit_Log;
-- Expected: 1 new row, old_status='Pending', new_status='Completed'

-- Test 2: PreventDuplicateAssignment
-- INSERT INTO Assignment (request_id, staff_id) VALUES (2, 1);
-- Expected error: 'This request is already assigned to a staff member'

-- Test 3: SetCompletionDate
-- UPDATE Service_Request SET status = 'Completed' WHERE request_id = 2;
-- SELECT completion_date FROM Assignment WHERE request_id = 2;
-- Expected: completion_date is now populated with a timestamp