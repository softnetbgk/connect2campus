-- 1. Create Schools Table
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_email VARCHAR(255) NOT NULL,
    subscription_status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    school_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    logo TEXT,
    contact_number VARCHAR(20),
    status VARCHAR(50) DEFAULT 'ACTIVE'
);

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(200) NOT NULL, 
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_session_token TEXT,
    must_change_password BOOLEAN DEFAULT FALSE,
    fcm_token TEXT,
    reset_password_token TEXT,
    reset_password_expires BIGINT
);

-- 3. Create Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    subject_specialization VARCHAR(255),
    gender VARCHAR(10),
    join_date DATE DEFAULT CURRENT_DATE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    employee_id VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100)
);

-- 4. Create Students Table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    admission_no VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(100),
    gender VARCHAR(10),
    join_date DATE DEFAULT CURRENT_DATE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    employee_id VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100)
);

-- 6. Create Academic Years Table
CREATE TABLE IF NOT EXISTS academic_years (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    year_label VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_school_year UNIQUE(school_id, year_label),
    CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- 7. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create School Holidays Table
CREATE TABLE IF NOT EXISTS school_holidays (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(255) NOT NULL,
    is_paid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, holiday_date)
);

CREATE INDEX IF NOT EXISTS idx_school_holidays_school_date 
ON school_holidays(school_id, holiday_date);
