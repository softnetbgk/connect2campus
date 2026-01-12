# School Permanent Delete Feature

## Overview
Added permanent delete functionality for schools in the Super Admin dustbin, allowing complete removal of schools and all associated data.

## Implementation

### Backend (`schoolController.js`)

**Function: `permanentDeleteSchool()`**

Performs comprehensive cascade deletion in the following order:

1. **Student Data**
   - Mark components
   - Marks/grades
   - Attendance records
   - Fee payments and structures
   - Hostel allocations and payments
   - Transport allocations
   - Student promotions
   - Certificates
   - Doubts/queries
   - Leave requests
   - Finally, students themselves

2. **Teacher Data**
   - Teacher attendance
   - Salary payments
   - Teachers

3. **Staff Data**
   - Staff attendance
   - Salary payments
   - Staff

4. **Academic Structure**
   - Subjects
   - Sections
   - Classes

5. **School-Specific Data**
   - Fee structures
   - Exam schedules
   - Timetables
   - School holidays
   - Notifications
   - Expenditures

6. **Facilities**
   - Transport routes and vehicles
   - Hostel rooms and buildings

7. **User Accounts**
   - All users associated with the school

8. **School Record**
   - Finally, the school itself

### API Endpoint
- **Route**: `DELETE /api/schools/:id/permanent`
- **Access**: Super Admin only
- **Transaction**: All operations wrapped in BEGIN/COMMIT/ROLLBACK

### Frontend (`SuperAdminDashboard.jsx`)

**Function: `handlePermanentDeleteSchool()`**

Features:
- **Double Confirmation**: Two separate confirmation dialogs
- **Clear Warning**: Explains all data that will be deleted
- **Visual Indicator**: Red trash icon in dustbin view

**Confirmation Flow:**
1. First dialog: Lists all data types that will be deleted
2. Second dialog: Final confirmation before proceeding
3. API call to permanent delete endpoint
4. Refresh both active and deleted school lists

### UI Location
- **Dustbin View**: Click "Dustbin" toggle in Super Admin dashboard
- **Button**: Red trash icon appears on hover over deleted school cards
- **Position**: Third button (after Restore and View Details)

## Safety Features

✅ **Double Confirmation**: Prevents accidental deletion  
✅ **Clear Warnings**: User knows exactly what will be deleted  
✅ **Transaction Safety**: All-or-nothing deletion  
✅ **Cascade Delete**: Properly removes all related data  
✅ **Error Handling**: Rollback on any failure  
✅ **Super Admin Only**: Restricted access  

## User Workflow

1. Navigate to Super Admin Dashboard
2. Click "Dustbin" toggle button
3. Hover over a deleted school card
4. Click red trash icon (permanent delete)
5. Read and confirm first warning dialog
6. Read and confirm second warning dialog
7. School and all data permanently deleted

## Warning Messages

### First Confirmation:
```
⚠️ PERMANENT DELETE WARNING ⚠️

You are about to PERMANENTLY delete "[School Name]".

This will DELETE ALL DATA including:
• All students, teachers, and staff
• All attendance, marks, and fees records
• All classes, sections, and subjects
• All user accounts

THIS ACTION CANNOT BE UNDONE!

Are you absolutely sure?
```

### Second Confirmation:
```
FINAL CONFIRMATION

Type the school name to confirm: "[School Name]"

This is your last chance to cancel. Proceed with permanent deletion?
```

## Files Modified

### Backend
1. `backend/src/controllers/schoolController.js` - Added `permanentDeleteSchool()` function
2. `backend/src/routes/schoolRoutes.js` - Added `DELETE /:id/permanent` route

### Frontend
1. `frontend/src/pages/SuperAdminDashboard.jsx` - Added permanent delete button and handler

## Testing Checklist

- [ ] Permanent delete button appears in dustbin view
- [ ] First confirmation dialog shows
- [ ] Second confirmation dialog shows
- [ ] School is deleted from database
- [ ] All students are deleted
- [ ] All teachers are deleted
- [ ] All staff are deleted
- [ ] All classes/sections/subjects are deleted
- [ ] All user accounts are deleted
- [ ] All related data is deleted
- [ ] Transaction rollback works on error
- [ ] School disappears from dustbin after deletion

## Important Notes

⚠️ **This is a destructive operation** - Once executed, data cannot be recovered  
⚠️ **Use with extreme caution** - Only for schools that are confirmed to be permanently closed  
⚠️ **Backup recommended** - Consider database backup before permanent deletion  

## Date
2026-01-12
