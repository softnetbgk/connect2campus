# Class/Section Deletion with Student Protection Feature

## Overview
Implemented comprehensive class and section deletion functionality for Super Admin, with automatic student protection by moving affected students to an "Unassigned" bin where School Admins can later restore them.

## Problem Solved
Previously, Super Admin could not delete classes or sections because it would cause data loss for students. This feature enables full academic structure management while preserving student data.

## How It Works

### Super Admin Actions

#### 1. **Deleting a Class**
When Super Admin removes a class from a school:
- All students in that class are automatically moved to "Unassigned" status
- Students' `class_name` field is updated to: `"Unassigned - Previously: [ClassName] [SectionName]"`
- Students' `section_name` is set to `"N/A"`
- The class, its sections, and subjects are deleted from the database

#### 2. **Deleting a Section**
When Super Admin removes a section from a class:
- All students in that specific section are moved to "Unassigned" status
- Students retain their class reference but are marked as unassigned
- The section is deleted from the database

#### 3. **Deleting Subjects**
- Subjects can be removed without affecting students
- Only the subject record is deleted

### School Admin Recovery

#### Viewing Unassigned Students
School Admins can access unassigned students via:
- **API Endpoint**: `GET /api/students/unassigned`
- **Status**: `status = 'Unassigned'`
- **Display**: Shows previous class/section information

#### Restoring Students
School Admins can:
1. View the list of unassigned students
2. See their previous class/section in the `class_name` field
3. Reassign them to a new class/section
4. Update their status back to active

## Technical Implementation

### Backend Changes

#### 1. **School Controller** (`schoolController.js`)
Updated `updateSchool()` function:
- Added `allowDeletions` parameter
- Implemented class deletion logic with student migration
- Implemented section deletion logic with student migration
- Implemented subject deletion logic

**Key SQL Operations:**
```sql
-- Move students to unassigned when class is deleted
UPDATE students 
SET status = 'Unassigned', 
    class_name = 'Unassigned - Previously: ' || class_name || ' ' || section_name,
    section_name = 'N/A'
WHERE school_id = $1 AND class_id = $2 AND status != 'Deleted'
```

#### 2. **Student Controller** (`studentController.js`)
Added `getUnassignedStudents()` function:
```javascript
exports.getUnassignedStudents = async (req, res) => {
    // Fetches all students with status = 'Unassigned'
    // Returns student data with previous class/section info
}
```

#### 3. **Routes** (`studentRoutes.js`)
Added new endpoint:
```javascript
router.get('/unassigned', studentController.getUnassignedStudents);
```

### Frontend Changes

#### 1. **Super Admin Dashboard** (`SuperAdminDashboard.jsx`)

**Updated `removeClass()` function:**
- Removed edit mode restriction
- Added confirmation dialog with warning about student impact
- Shows clear message about unassigned bin

**Updated `handleSubmit()`:**
- Sends `allowDeletions: true` flag when editing schools
- Enables backend to process deletions

**Updated UI Messages:**
- Changed from "cannot remove" to "can add or remove"
- Added warning about unassigned bin
- Color-coded info box (indigo with amber warning)

## User Workflow

### Super Admin Workflow

1. **Edit School**
   - Click Edit button on school card
   - Modal opens with current configuration

2. **Remove Class/Section**
   - Click trash icon next to class in the list
   - Confirmation dialog appears with warning:
     ```
     ⚠️ WARNING: Removing "Class 10" will move all students 
     in this class to the Unassigned bin.
     
     School Admin can later restore them by assigning a new class.
     
     Are you sure you want to proceed?
     ```
   - Confirm to proceed

3. **Save Changes**
   - Click "Update School" button
   - Backend processes deletions
   - Students are moved to unassigned bin
   - Success message appears

### School Admin Workflow

1. **View Unassigned Students**
   - Navigate to Students section
   - Access "Unassigned" tab/filter
   - See list of students with previous class info

2. **Restore Students**
   - Select unassigned student
   - Edit student details
   - Assign new class and section
   - Save changes
   - Student status changes back to active

## Database Schema

### Student Status Values
- `NULL` or `'Active'` - Active student
- `'Deleted'` - Soft deleted (in bin)
- `'Unassigned'` - Class/section was deleted

### Student Fields Updated
- `status` - Set to 'Unassigned'
- `class_name` - Updated to show previous class info
- `section_name` - Set to 'N/A'
- `class_id` - Remains unchanged (for reference)
- `section_id` - Remains unchanged (for reference)

## Safety Features

✅ **Confirmation Dialogs**: Clear warnings before deletion  
✅ **Data Preservation**: Students are never permanently deleted  
✅ **Audit Trail**: Previous class/section stored in `class_name`  
✅ **School Admin Control**: Only School Admin can restore students  
✅ **Selective Deletion**: Can delete classes, sections, or subjects independently  
✅ **Transaction Safety**: All operations wrapped in database transactions

## API Endpoints

### Super Admin
- `PUT /api/schools/:id` - Update school (with `allowDeletions: true`)

### School Admin
- `GET /api/students/unassigned` - Get unassigned students
- `PUT /api/students/:id` - Update student (to reassign class)
- `PUT /api/students/:id/restore` - Restore student status

## Benefits

1. **Flexibility**: Super Admin can fully manage school structure
2. **Safety**: No student data is lost
3. **Recovery**: School Admin can restore students easily
4. **Transparency**: Clear tracking of previous assignments
5. **Scalability**: Handles bulk student migrations efficiently

## Example Scenarios

### Scenario 1: Merging Classes
- School decides to merge Class 10-A and Class 10-B into just Class 10
- Super Admin deletes Class 10-B
- All Class 10-B students move to unassigned
- School Admin reassigns them to Class 10-A

### Scenario 2: Restructuring Sections
- School changes from A/B/C sections to X/Y/Z sections
- Super Admin deletes old sections
- Students move to unassigned
- School Admin assigns them to new sections

### Scenario 3: Removing Discontinued Classes
- School stops offering Class 12
- Super Admin removes Class 12
- Students move to unassigned
- School Admin can transfer them or mark as graduated

## Files Modified

### Backend
1. `backend/src/controllers/schoolController.js` - Class/section deletion logic
2. `backend/src/controllers/studentController.js` - Unassigned students endpoint
3. `backend/src/routes/studentRoutes.js` - New route for unassigned students

### Frontend
1. `frontend/src/pages/SuperAdminDashboard.jsx` - UI for deletion and warnings

## Testing Checklist

- [ ] Delete a class with students
- [ ] Verify students appear in unassigned list
- [ ] Check previous class info is preserved
- [ ] Delete a section with students
- [ ] Verify only that section's students are unassigned
- [ ] Restore an unassigned student
- [ ] Verify student status returns to active
- [ ] Delete subjects without students
- [ ] Test transaction rollback on errors

## Date
2026-01-12
