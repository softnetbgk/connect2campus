# School Soft Delete & Dustbin Feature

## Overview
Implemented soft delete functionality for schools in the Super Admin dashboard, allowing schools to be moved to a dustbin instead of being permanently deleted. Schools can be restored from the dustbin if needed.

## Features Implemented

### Backend Changes

#### 1. **Controller Functions** (`backend/src/controllers/schoolController.js`)
Added three new functions:

- **`deleteSchool()`**: Soft deletes a school by setting `status = 'Deleted'`
- **`restoreSchool()`**: Restores a deleted school by setting `status = 'Active'`
- **`getDeletedSchools()`**: Fetches all schools with `status = 'Deleted'`

#### 2. **Updated Queries**
Modified `getSchools()` to exclude deleted schools:
```sql
WHERE s.status != 'Deleted' OR s.status IS NULL
```

#### 3. **Routes** (`backend/src/routes/schoolRoutes.js`)
Added new endpoints:
- `GET /schools/deleted/all` - Get all deleted schools
- `DELETE /schools/:id` - Soft delete a school
- `PUT /schools/:id/restore` - Restore a deleted school

### Frontend Changes

#### 1. **State Management** (`frontend/src/pages/SuperAdminDashboard.jsx`)
Added new state variables:
- `deletedSchools` - Stores deleted schools
- `viewMode` - Toggles between 'active' and 'deleted' views

#### 2. **New Functions**
- `fetchDeletedSchools()` - Fetches deleted schools from API
- `handleDeleteSchool()` - Soft deletes a school
- `handleRestoreSchool()` - Restores a school from dustbin

#### 3. **UI Enhancements**

**Toggle Buttons:**
- Active Schools button (shows count)
- Dustbin button (shows count of deleted schools)

**School Cards:**
- **Active View**: Shows Edit, View Details, and Delete buttons
- **Deleted View**: Shows Restore and View Details buttons

**Dynamic Title:**
- "Registered Schools" for active view
- "Deleted Schools (Dustbin)" for deleted view

## User Workflow

### Deleting a School
1. Navigate to Super Admin Dashboard
2. Hover over a school card
3. Click the red **Delete** button (trash icon)
4. Confirm the deletion
5. School is moved to dustbin

### Viewing Deleted Schools
1. Click the **Dustbin** toggle button at the top
2. View all deleted schools with their statistics
3. Schools retain all their data (students, teachers, staff counts)

### Restoring a School
1. Switch to Dustbin view
2. Hover over a deleted school card
3. Click the green **Restore** button (rotate icon)
4. Confirm the restoration
5. School is moved back to active list

## Database Schema
The `schools` table uses a `status` column:
- `'Active'` or `NULL` - Active school
- `'Deleted'` - Soft deleted school

## Benefits
✅ **Data Safety**: Schools are not permanently deleted  
✅ **Easy Recovery**: Restore schools with one click  
✅ **Audit Trail**: Maintain history of deleted schools  
✅ **Consistent UX**: Similar to student deletion workflow  
✅ **Member Counts**: Deleted schools still show accurate statistics

## Technical Notes
- Soft deletion prevents data loss
- All related data (students, teachers, staff) remains intact
- Member counts exclude deleted students but include all teachers/staff
- Deleted schools are completely hidden from the active view

## Files Modified
1. `backend/src/controllers/schoolController.js`
2. `backend/src/routes/schoolRoutes.js`
3. `frontend/src/pages/SuperAdminDashboard.jsx`

## Date
2026-01-12
