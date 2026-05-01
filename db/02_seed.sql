USE hsrms;

-- 1. Hostel
INSERT INTO Hostel (hostel_name) VALUES
('Kaveri Block' ),
('Godavari Block'),
('Yamuna Block');

-- 2. Room
INSERT INTO Room (room_number, hostel_id) VALUES
('101', 1),
('102', 1),
('103', 1),
('201', 1),
('202', 1),
('101', 2),
('102', 2),
('101', 3),
('102', 3);

-- 3. Student
INSERT INTO Student (student_id, name, phone, email, password, room_id) VALUES
(1,'Priya Sharma',  '9876543210', 'priya@hostel.in',   'pass123', 1),
(2,'Rahul Kumar',   '9876543211', 'rahul@hostel.in',   'pass123', 2),
(3, 'Ananya Joshi',  '9876543212', 'ananya@hostel.in',  'pass123', 3),
(4, 'Vikram Singh',  '9876543213', 'vikram@hostel.in',  'pass123', 4),
(5, 'Meera Nair',    '9876543214', 'meera@hostel.in',   'pass123', 5),
(6,'Arjun Das',     '9876543215', 'arjun@hostel.in',   'pass123', 6),
(7,'Sneha Patel',   '9876543216', 'sneha@hostel.in',   'pass123', 7),
(8, 'Karan Mehta',   '9876543217', 'karan@hostel.in',   'pass123', 8),
(9,'Divya Reddy',   '9876543218', 'divya@hostel.in',   'pass123', 9);

-- 4. Warden
INSERT INTO Warden (name, phone, email, password, hostel_id) VALUES
('Dr. R. Mehta',  '9811111111', 'mehta@hostel.in',  'pass123', 1),
('Dr. K. Iyer',   '9822222222', 'iyer@hostel.in',   'pass123', 2),
('Dr. S. Bose',   '9833333330', 'bose@hostel.in',   'pass123', 3);

-- 5. Staff
INSERT INTO Staff (name, phone, email, password, specialization) VALUES
('S. Verma',   '9833333331', 'sverma@hostel.in',   'pass123', 'Electrical'),
('P. Tiwari',  '9833333332', 'ptiwari@hostel.in',  'pass123', 'Electrical'),
('R. Gupta',   '9833333333', 'rgupta@hostel.in',   'pass123', 'Plumbing'),
('M. Yadav',   '9833333334', 'myadav@hostel.in',   'pass123', 'Plumbing'),
('D. Patel',   '9833333335', 'dpatel@hostel.in',   'pass123', 'Carpentry'),
('A. Khan',    '9833333336', 'akhan@hostel.in',    'pass123', 'Housekeeping'),
('B. Mishra',  '9833333337', 'bmishra@hostel.in',  'pass123', 'Civil'),
('C. Sharma',  '9833333338', 'csharma@hostel.in',  'pass123', 'Electrical');

-- 6. Service_Category
INSERT INTO Service_Category (name, description) VALUES
('Electrical',   'Wiring, switches, fans, lights, power issues'),
('Plumbing',     'Taps, pipes, drainage, water supply problems'),
('Carpentry',    'Doors, windows, furniture, locks, hinges'),
('Housekeeping', 'Cleaning, waste disposal, common area upkeep'),
('Civil',        'Walls, flooring, ceiling, structural concerns');

-- ──────────────────────────────────────────
-- 7. Service_Request
INSERT INTO Service_Request (student_id, category_id, description, status, date_raised) VALUES
(1, 2, 'Bathroom tap leaking continuously, water pooling on floor',     'Pending',  '2025-06-12 09:14:00'),
(2, 1, 'Room light fuse blown, entire room without power since morning', 'Assigned','2025-06-13 08:30:00'),
(3, 3, 'Door hinge broken, door does not close properly at all',         'Completed',  '2025-06-08 11:00:00'),
(4, 4, 'Common bathroom not cleaned for three consecutive days',         'Pending', '2025-06-14 07:45:00'),
(5, 1, 'Fan speed regulator appears burnt, fan completely not working',  'Accepted','2025-06-14 10:20:00'),
(6, 2, 'Washroom flush not working in ground floor common bathroom',     'Pending', '2025-06-14 14:00:00'),
(7, 5, 'Crack appearing in room wall near the window frame',             'Pending','2025-06-15 09:00:00'),
(1, 3, 'Wardrobe lock broken, unable to secure personal belongings',     'Completed','2025-06-05 10:30:00'),
(8, 1, 'Switchboard sparking when plugging in charger, dangerous',       'Pending',  '2025-06-15 11:00:00'),
(9, 4, 'Dustbin in corridor overflowing, not emptied in two days',       'Completed', '2025-06-10 08:00:00'),
(2, 2, 'Hot water not coming from geyser in attached bathroom',          'Rejected', '2025-06-11 07:00:00'),
(5, 3, 'Study table leg broken, table wobbling dangerously',             'Pending', '2025-06-15 15:00:00');

-- 8. Assignment
INSERT INTO Assignment (request_id, staff_id, assigned_date, completion_date) VALUES
(2,  1, '2025-06-13 11:00:00', NULL),                     -- Electrical → S. Verma
(3,  5, '2025-06-08 13:00:00', '2025-06-10 15:30:00'),    -- Carpentry → D. Patel (completed)
(5,  1, '2025-06-14 11:00:00', NULL),                     -- Electrical → S. Verma
(8,  5, '2025-06-05 12:00:00', '2025-06-07 10:00:00'),    -- Carpentry → D. Patel (completed)
(10, 6, '2025-06-10 09:00:00', '2025-06-10 12:00:00');    -- Housekeeping → A. Khan (completed)


-- 9. Admin
INSERT INTO Admin (name, email, password) VALUES
('Admin User', 'admin@hostel.in', 'admin123');
