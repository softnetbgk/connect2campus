# Academic Year Management System - Implementation Plan

## Overview
A comprehensive academic year management system that:
- Allows setting academic year start and end dates
- Tracks all data (attendance, marks, fees, salary, expenditures) by academic year
- Shows days remaining/completed in dashboard
- Alerts when 30 days remain to set new academic year
- Automatically associates all new data with current academic year

## Features

### 1. Academic Year Settings (in School Settings)
- **Start Date**: Academic year start (e.g., April 1, 2025)
- **End Date**: Academic year end (e.g., March 31, 2026)
- **Year Label**: Display name (e.g., "2025-2026")
- **Status**: Active/Completed/Upcoming

### 2. Dashboard Display
- Current academic year label
- Progress bar showing completion
- Days completed / Total days
- Days remaining
- Alert when < 30 days remaining

### 3. Data Association
All data automatically tagged with academic year:
- ✅ Marks (already has `year` column)
- ✅ Attendance
- ✅ Fees
- ✅ Salary
- ✅ Expenditures
- ✅ Exam Schedules

### 4. Year Transition
When academic year ends:
- Prompt to create new academic year
- Archive current year data
- Set new year as active
- All new data uses new year

## Database Schema

### New Table: academic_years
```sql
CREATE TABLE academic_years (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    year_label VARCHAR(20) NOT NULL,  -- "2025-2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, upcoming
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_school_year UNIQUE(school_id, year_label)
);
```

### Update Existing Tables
Add `academic_year_id` to:
- attendance
- marks (already has year, but add academic_year_id for consistency)
- fee_payments
- salary_payments
- expenditures
- exam_schedules

## Implementation Steps

### Phase 1: Database Setup
1. Create `academic_years` table
2. Add `academic_year_id` columns to existing tables
3. Create migration to populate existing data

### Phase 2: Backend API
1. Academic year CRUD endpoints
2. Get current academic year
3. Get academic year statistics
4. Transition to new year endpoint

### Phase 3: Frontend Components
1. Academic Year Settings component
2. Dashboard year display widget
3. Year selector for historical data
4. New year creation wizard

### Phase 4: Data Integration
1. Update all data creation to include academic_year_id
2. Add year filtering to all queries
3. Add year selector to reports

## API Endpoints

### Academic Year Management
```
GET    /api/academic-years              - List all years
GET    /api/academic-years/current      - Get current active year
GET    /api/academic-years/:id          - Get specific year
POST   /api/academic-years              - Create new year
PUT    /api/academic-years/:id          - Update year
DELETE /api/academic-years/:id          - Delete year (if no data)
GET    /api/academic-years/:id/stats    - Get year statistics
POST   /api/academic-years/:id/complete - Mark year as completed
```

## Dashboard Widget Design

```
┌─────────────────────────────────────────┐
│  📅 Academic Year 2025-2026             │
│                                         │
│  ████████████░░░░░░░░░░░░ 65%          │
│                                         │
│  📊 237 days completed                  │
│  ⏰ 128 days remaining                  │
│                                         │
│  ⚠️  30 days left - Set up new year!   │
│                                         │
│  [View Details] [Set New Year]         │
└─────────────────────────────────────────┘
```

## Alerts & Notifications

### 30 Days Remaining
- Show banner in dashboard
- Send notification to admin
- Highlight "Set New Year" button

### 7 Days Remaining
- Urgent banner
- Daily reminder
- Email to admin

### Year Ended
- Block new data entry (optional)
- Force new year creation
- Show transition wizard

## Data Migration Strategy

### For Existing Data
1. Create default academic year based on current date
2. Assign all existing data to this year
3. Allow admin to adjust dates if needed

### Example Migration
```sql
-- Create default year for existing schools
INSERT INTO academic_years (school_id, year_label, start_date, end_date, status)
SELECT 
    id,
    '2025-2026',
    '2025-04-01',
    '2026-03-31',
    'active'
FROM schools;

-- Update existing data
UPDATE marks SET academic_year_id = (
    SELECT id FROM academic_years 
    WHERE school_id = marks.school_id AND status = 'active'
);
```

## Benefits

✅ **Clear Data Separation**: Each year's data is isolated
✅ **Historical Access**: Easy to view past years
✅ **Automatic Tracking**: All data auto-tagged with year
✅ **Progress Monitoring**: See year completion in real-time
✅ **Smooth Transitions**: Guided process for new year setup
✅ **Compliance**: Meet academic record-keeping requirements

## User Flow

### Setting Up New Academic Year
1. Admin goes to School Settings
2. Clicks "Academic Year" tab
3. Clicks "Create New Academic Year"
4. Enters:
   - Year label (e.g., "2026-2027")
   - Start date (e.g., April 1, 2026)
   - End date (e.g., March 31, 2027)
5. System validates dates
6. Creates new year with "upcoming" status
7. When current year ends, new year becomes "active"

### Viewing Historical Data
1. User selects "View Historical Data"
2. Dropdown shows all academic years
3. Select year to view
4. All reports filter by selected year

## Technical Considerations

### Performance
- Index on `academic_year_id` in all tables
- Cache current academic year
- Efficient date range queries

### Data Integrity
- Prevent deletion of years with data
- Validate date ranges (no overlaps)
- Ensure one active year per school

### Flexibility
- Support different year formats (April-March, Jan-Dec, etc.)
- Allow mid-year corrections
- Support multiple schools with different calendars

## Timeline

**Week 1**: Database schema + migration
**Week 2**: Backend API + business logic
**Week 3**: Frontend components
**Week 4**: Integration + testing

**Total**: 4 weeks for complete implementation

## Status: 📋 READY TO IMPLEMENT

This is a comprehensive plan. Shall I start implementing the database schema and backend API?
