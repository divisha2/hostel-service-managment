USE hsrms;

DELIMITER $$

-- ──────────────────────────────────────────────────────────────
-- Function 1: GetPendingCount
-- Purpose : Returns number of Pending requests for a given hostel
-- Called by: Backend GET /api/warden/stats
-- ──────────────────────────────────────────────────────────────
CREATE FUNCTION GetPendingCount(p_hostel_id INT)
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_count INT;

    SELECT COUNT(*) INTO v_count
    FROM Service_Request sr
    JOIN Student s ON sr.student_id = s.student_id
    JOIN Room    r ON s.room_id     = r.room_id
    WHERE r.hostel_id = p_hostel_id
      AND sr.status   = 'Pending';

    RETURN v_count;
END$$


-- ──────────────────────────────────────────────────────────────
-- Function 2: GetCompletionRate
-- Purpose : Returns completion % for a given hostel (0.00–100.00)
-- Called by: Warden stats bar, Query 9
-- ──────────────────────────────────────────────────────────────
CREATE FUNCTION GetCompletionRate(p_hostel_id INT)
RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_total     INT;
    DECLARE v_completed INT;

    SELECT COUNT(*) INTO v_total
    FROM Service_Request sr
    JOIN Student s ON sr.student_id = s.student_id
    JOIN Room    r ON s.room_id     = r.room_id
    WHERE r.hostel_id = p_hostel_id;

    IF v_total = 0 THEN
        RETURN 0.00;
    END IF;

    SELECT COUNT(*) INTO v_completed
    FROM Service_Request sr
    JOIN Student s ON sr.student_id = s.student_id
    JOIN Room    r ON s.room_id     = r.room_id
    WHERE r.hostel_id = p_hostel_id
      AND sr.status   = 'Completed';

    RETURN ROUND((v_completed / v_total) * 100, 2);
END$$

DELIMITER ;


-- ──────────────────────────────────────────────────────────────
-- Test calls (uncomment to run in Workbench)
-- ──────────────────────────────────────────────────────────────
-- SELECT GetPendingCount(1);       -- pending count for Kaveri Block
-- SELECT GetPendingCount(2);       -- pending count for Godavari Block
-- SELECT GetCompletionRate(1);     -- completion % for Kaveri Block
-- SELECT GetCompletionRate(2);     -- completion % for Godavari Block