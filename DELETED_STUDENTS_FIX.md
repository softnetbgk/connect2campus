# Deleted Students Appearing in Marks Management - FIXED

## Issue
When filtering by class and section in Marks Management, **deleted students** were appearing in the student list, causing marks to be saved for deleted students.

## Root Cause

The system uses **TWO columns** for soft deletes:
1. `status` = 'Deleted'
2. `deleted_at` = timestamp

However, the `getStudents` endpoint was only checking `status` and **NOT** checking `deleted_at`:

```javascript
// OLD - Incomplete filter
WHERE s.school_id = $1 AND (s.status IS NULL OR s.status != 'Deleted')
```

This meant students with `deleted_at IS NOT NULL` were still appearing in the list!

## The Fix

### Backend (`studentController.js` - `getStudents` function)

**Added `deleted_at IS NULL` filter:**

```javascript
// NEW - Complete filter
WHERE s.school_id = $1 
AND (s.status IS NULL OR s.status != 'Deleted')
AND s.deleted_at IS NULL  ← Added this!
```

**Also added logging:**
```javascript
console.log(`[Get Students] Fetching for class_id=${class_id}, section_id=${section_id || 'NULL'}`);
console.log(`[Get Students] Found ${result.rows.length} students`);
```

## How It Works Now

### Before Fix:
```
Query: class_id=11, section_id=4
Filter: status != 'Deleted'
Result: Returns 2 students (including 1 with deleted_at set)
❌ Deleted student appears in marks table
```

### After Fix:
```
Query: class_id=11, section_id=4
Filter: status != 'Deleted' AND deleted_at IS NULL
Result: Returns only 1 active student
✅ Only active students appear
```

## Testing Steps

1. **Reload the page**
2. **Go to:** Academics → Marks
3. **Select:** Class and Section
4. **Check student list:**
   - Only active students should appear
   - Deleted students should NOT appear

5. **Check backend console:**
   ```
   [Get Students] Fetching for class_id=11, section_id=4
   [Get Students] Found 1 students  ← Should match active students only
   ```

## Verify in Database

### Check Student Status:
```sql
SELECT 
    id,
    name,
    class_id,
    section_id,
    status,
    deleted_at
FROM students
WHERE class_id = 11 
AND section_id = 4;
```

**Expected Result:**
- Active students: `status = NULL or 'Active'` AND `deleted_at = NULL`
- Deleted students: `status = 'Deleted'` OR `deleted_at IS NOT NULL`

### Only Active Students Should Appear:
```sql
-- This query matches what the API now uses
SELECT 
    id,
    name,
    class_id,
    section_id
FROM students
WHERE school_id = 1
AND class_id = 11
AND section_id = 4
AND (status IS NULL OR status != 'Deleted')
AND deleted_at IS NULL;
```

## Impact

### ✅ Fixed:
- Deleted students no longer appear in Marks Management
- Only active students show up when filtering by class/section
- Marks can only be entered for active students
- Student count is now accurate

### 📊 Where This Applies:
This fix affects **all places** that call `/api/students`:
- ✅ Marks Management
- ✅ Attendance Management
- ✅ Fee Management
- ✅ Student Lists
- ✅ Any other feature that fetches students

## Why Two Columns?

The system uses both `status` and `deleted_at` for flexibility:

- **`status`**: User-friendly status ('Active', 'Deleted', 'Unassigned')
- **`deleted_at`**: Timestamp for audit trail (when was it deleted?)

**Best Practice:** Always check BOTH when filtering:
```sql
WHERE (status IS NULL OR status != 'Deleted')
AND deleted_at IS NULL
```

## Files Modified

✅ `backend/src/controllers/studentController.js`
- Added `deleted_at IS NULL` filter in `getStudents`
- Added logging for debugging
- Updated count query to match

## Related Fixes

This is related to the previous fix in `marksController.js`:
```javascript
// Also filters deleted students when fetching marks
JOIN students st ON m.student_id = st.id AND st.deleted_at IS NULL
```

Both fixes work together to ensure deleted students are completely filtered out.

## Status: ✅ FIXED

Deleted students will no longer appear in:
- Student lists when filtering by class/section
- Marks Management tables
- Any other student selection interfaces

**Reload the Marks Management page and select a class - only active students should appear now!**
