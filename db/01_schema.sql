
CREATE DATABASE IF NOT EXISTS hsrms;
USE hsrms;

-- 1. Hostel (no dependencies)
CREATE TABLE Hostel (
    hostel_id   INT          AUTO_INCREMENT PRIMARY KEY,
    hostel_name VARCHAR(100) NOT NULL
);

-- 2. Room (depends on Hostel)
CREATE TABLE Room (
    room_id     INT         AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(10) NOT NULL,
    hostel_id   INT         NOT NULL,
    FOREIGN KEY (hostel_id) REFERENCES Hostel(hostel_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE (room_number, hostel_id)
);

-- 3. Student (depends on Room)
CREATE TABLE Student (
    student_id INT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    phone      VARCHAR(15),
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    room_id    INT          NOT NULL,
    FOREIGN KEY (room_id) REFERENCES Room(room_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 4. Warden (depends on Hostel)
CREATE TABLE Warden (
    warden_id INT          AUTO_INCREMENT PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    phone     VARCHAR(15),
    email     VARCHAR(100) NOT NULL UNIQUE,
    password  VARCHAR(255) NOT NULL,
    hostel_id INT          NOT NULL,
    FOREIGN KEY (hostel_id) REFERENCES Hostel(hostel_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 5. Staff (no dependencies)
CREATE TABLE Staff (
    staff_id       INT          AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    phone          VARCHAR(15),
    email          VARCHAR(100) NOT NULL UNIQUE,
    password       VARCHAR(255) NOT NULL,
    specialization VARCHAR(50)  NOT NULL,
    CONSTRAINT chk_specialization
        CHECK (specialization IN ('Electrical','Plumbing','Carpentry','Housekeeping','Civil'))
);

-- 6. Service_Category (no dependencies)
CREATE TABLE Service_Category (
    category_id INT          AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- 7. Service_Request (depends on Student, Service_Category)
CREATE TABLE Service_Request (
    request_id   INT          AUTO_INCREMENT PRIMARY KEY,
    student_id   INT          NOT NULL,
    category_id  INT          NOT NULL,
    description  VARCHAR(500) NOT NULL,
    status       ENUM('Pending','Assigned','Accepted','Completed','Rejected')
                 NOT NULL DEFAULT 'Pending',
    date_raised  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id)  REFERENCES Student(student_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Service_Category(category_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_description
        CHECK (CHAR_LENGTH(description) >= 10)
);

-- 8. Assignment (depends on Service_Request, Staff)
CREATE TABLE Assignment (
    assignment_id   INT      AUTO_INCREMENT PRIMARY KEY,
    request_id      INT      NOT NULL,
    staff_id        INT      NOT NULL,
    assigned_date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completion_date DATETIME,
    FOREIGN KEY (request_id) REFERENCES Service_Request(request_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (staff_id)   REFERENCES Staff(staff_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE (request_id)
);




-- 9. Audit_Log (depends on Service_Request)
CREATE TABLE Audit_Log (
    log_id      INT      AUTO_INCREMENT PRIMARY KEY,
    request_id  INT      NOT NULL,
    old_status  VARCHAR(20) NOT NULL,
    new_status  VARCHAR(20) NOT NULL,
    changed_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES Service_Request(request_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);


-- 10. Admin
CREATE TABLE Admin (
    admin_id INT          AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(100) NOT NULL,
    email    VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);
