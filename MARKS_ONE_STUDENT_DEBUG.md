# Marks Loading Only for One Student - Debug Guide

## Issue
- **Saved:** 12 marks (2 students × 6 subjects)
- **Loaded:** 6 marks (only 1 student)

## Console Logs Analysis

```
✅ Sending marks to backend: Array(12)
✅ Total marks to save: 12
✅ [Marks Save] Successfully saved 12 marks

❌ [Fetch Marks] Received: 6 marks  ← Should be 12!
❌ [Fetch Marks] Loaded into state: 6 marks
```

## Possible Causes

### 1. **Deleted Student** (Most Likely)
One of the students might be marked as deleted (`deleted_at IS NOT NULL`).

**Fix Applied:**
```sql
-- OLD
JOIN students st ON m.student_id = st.id

-- NEW
JOIN students st ON m.student_id = st.id AND st.deleted_at IS NULL
```

### 2. **Wrong Section ID**
One student might be in a different section.

### 3. **Database Constraint Issue**
The marks table might have a unique constraint preventing duplicate entries.

### 4. **Year Mismatch**
One student's marks might be saved with a different year.

## Debug Steps

### Step 1: Check Backend Console
After clicking "Reload Marks", check for:

```
[Get Marks] Fetching marks for class_id=11, section_id=4, exam_type_id=23, year=2026
[Get Marks] SQL Query: SELECT m.*, ... FROM marks m ...
[Get Marks] Params: [school_id, 11, 23, 4, 2026]
[Get Marks] Found 6 marks  ← Should be 12
[Get Marks] Unique students: 1 (IDs: 123)  ← Should be 2
```

**What to look for:**
- ✅ SQL query looks correct
- ❌ Only finding 6 marks instead of 12
- ❌ Only 1 unique student instead of 2

### Step 2: Check Database Directly

Run this SQL query in your database:

```sql
-- Check all marks for this class/exam
SELECT 
    m.id,
    m.student_id,
    st.name as student_name,
    st.deleted_at,
    m.subject_id,
    sub.name as subject_name,
    m.marks_obtained,
    m.section_id,
    m.year
FROM marks m
LEFT JOIN students st ON m.student_id = st.id
LEFT JOIN subjects sub ON m.subject_id = sub.id
WHERE m.class_id = 11 
AND m.exam_type_id = 23 
AND m.section_id = 4
AND m.year = 2026
ORDER BY m.student_id, sub.name;
```

**Expected Result:**
- 12 rows (2 students × 6 subjects)
- 2 different student_ids
- Both students should have `deleted_at = NULL`

**If you see:**
- ✅ 12 rows but only 1 student has `deleted_at = NULL` → **Student is deleted**
- ✅ 12 rows with 2 students, both `deleted_at = NULL` → **Different issue**
- ❌ Only 6 rows → **Marks weren't saved for second student**

### Step 3: Check Student Status

```sql
-- Check if students are deleted
SELECT 
    id,
    name,
    class_id,
    section_id,
    deleted_at
FROM students
WHERE class_id = 11 
AND section_id = 4;
```

**What to check:**
- Are there 2 students?
- Is `deleted_at` NULL for both?
- Do the student IDs match the ones in marks table?

### Step 4: Check Marks Saved

```sql
-- Count marks per student
SELECT 
    student_id,
    COUNT(*) as mark_count
FROM marks
WHERE class_id = 11 
AND exam_type_id = 23 
AND section_id = 4
AND year = 2026
GROUP BY student_id;
```

**Expected:**
```
student_id | mark_count
-----------|----------
123        | 6
124        | 6
```

**If you see:**
```
student_id | mark_count
-----------|----------
123        | 6
```
→ Only one student's marks were saved!

## Solutions

### Solution 1: Student is Deleted
**If one student is marked as deleted:**

```sql
-- Restore the student
UPDATE students 
SET deleted_at = NULL 
WHERE id = [student_id];
```

Then reload marks.

### Solution 2: Marks Not Saved for Second Student
**If marks weren't saved:**

1. Check browser console when saving
2. Look for errors in the save request
3. Verify all 12 marks are in the array being sent
4. Check backend logs for save errors

### Solution 3: Section Mismatch
**If student is in wrong section:**

```sql
-- Check student's section
SELECT id, name, section_id FROM students WHERE id = [student_id];

-- Update if needed
UPDATE students SET section_id = 4 WHERE id = [student_id];
```

## Enhanced Logging

### Backend Now Logs:
```
[Get Marks] Fetching marks for class_id=11, section_id=4, ...
[Get Marks] SQL Query: SELECT m.*, ...
[Get Marks] Params: [1, 11, 23, 4, 2026]
[Get Marks] Found 6 marks
[Get Marks] Unique students: 1 (IDs: 123)
```

### Frontend Logs:
```
[Fetch Marks] Requesting: /marks?class_id=11&exam_type_id=23&year=2026&section_id=4
[Fetch Marks] Received: 6 marks
[Fetch Marks] Loaded into state: 6 marks
```

## Next Steps

1. **Reload the page** and click "Reload Marks"
2. **Check backend console** for the new detailed logs
3. **Note the student IDs** shown in the logs
4. **Run the SQL queries** above to investigate
5. **Report back** with:
   - How many students are in the class?
   - Are any students deleted?
   - How many marks are actually in the database?

## Quick Fix

If one student is deleted, run:

```sql
-- Find deleted students in this class
SELECT id, name, deleted_at 
FROM students 
WHERE class_id = 11 
AND section_id = 4 
AND deleted_at IS NOT NULL;

-- Restore them
UPDATE students 
SET deleted_at = NULL 
WHERE class_id = 11 
AND section_id = 4 
AND deleted_at IS NOT NULL;
```

Then reload marks in the UI.

## Files Modified

✅ `backend/src/controllers/marksController.js`
- Added `st.deleted_at IS NULL` filter
- Added SQL query logging
- Added unique student count logging

## Status: 🔍 INVESTIGATING

The enhanced logging will help identify exactly why only 6 marks are being returned instead of 12.

**Check the backend console after reloading marks to see the detailed logs!**
