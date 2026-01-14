# Duplicate Records Fix - Student Overall Results & Topper List

## Issue
Both the **Student Overall Results** and **Topper List** were showing duplicate records - each subject appearing twice (or more) in the results.

### Example of the Problem:
A student with marks in 3 subjects would see:
```
Math: 70/80
Science: 90/100
English: 50/60
Math: 70/80        ❌ DUPLICATE
Science: 90/100    ❌ DUPLICATE
English: 50/60     ❌ DUPLICATE
```

---

## Root Cause
When we added the `LEFT JOIN` with `exam_schedules` to fetch actual max_marks, the join was creating duplicate rows when:
1. **Multiple sections** have the same subject scheduled (e.g., Math for Section A and Section B)
2. **Multiple schedule entries** exist for the same subject

The LEFT JOIN was matching multiple rows from `exam_schedules`, causing each mark to appear multiple times.

### Example:
```sql
-- If exam_schedules has:
-- Math, Class 10, Section A, Max Marks: 80
-- Math, Class 10, Section B, Max Marks: 80

-- The LEFT JOIN would return BOTH rows for a student in Section A
-- Result: Math appears twice in the results
```

---

## Solution
Added `DISTINCT ON (m.id)` to both queries to ensure only **one row per mark entry**, regardless of how many matching schedule entries exist.

### Key Changes:

1. **Added DISTINCT ON clause**:
   ```sql
   SELECT DISTINCT ON (m.id)  -- ✅ Ensures one row per mark
   ```

2. **Improved JOIN conditions** to handle NULL sections:
   ```sql
   AND (es.section_id = m.section_id OR es.section_id IS NULL)
   ```

3. **Added proper ORDER BY** for DISTINCT ON:
   ```sql
   ORDER BY m.id, et.id, sub.name
   ```

---

## Files Modified

### 1. Student Overall Results
**File**: `backend/src/controllers/marksController.js`  
**Function**: `getStudentAllMarks` (lines 776-794)

**Before**:
```sql
SELECT m.marks_obtained, sub.name as subject_name, et.name as exam_name, 
       COALESCE(es.max_marks, et.max_marks, 100) as max_marks
FROM marks m
JOIN subjects sub ON m.subject_id = sub.id
JOIN exam_types et ON m.exam_type_id = et.id
LEFT JOIN exam_schedules es ON es.subject_id = m.subject_id 
   AND es.exam_type_id = m.exam_type_id 
   AND es.class_id = m.class_id 
   AND es.school_id = m.school_id
WHERE m.student_id = $1 AND m.school_id = $2
ORDER BY et.id, sub.name
```

**After**:
```sql
SELECT DISTINCT ON (m.id)  -- ✅ ADDED
       m.marks_obtained, sub.name as subject_name, et.name as exam_name, 
       COALESCE(es.max_marks, et.max_marks, 100) as max_marks
FROM marks m
JOIN subjects sub ON m.subject_id = sub.id
JOIN exam_types et ON m.exam_type_id = et.id
LEFT JOIN exam_schedules es ON es.subject_id = m.subject_id 
   AND es.exam_type_id = m.exam_type_id 
   AND es.school_id = m.school_id
   AND (es.class_id = m.class_id OR es.class_id IS NULL)  -- ✅ IMPROVED
   AND (es.section_id = m.section_id OR es.section_id IS NULL)  -- ✅ ADDED
WHERE m.student_id = $1 AND m.school_id = $2
ORDER BY m.id, et.id, sub.name  -- ✅ UPDATED
```

### 2. Topper List
**File**: `backend/src/controllers/marksController.js`  
**Function**: `getToppers` (lines 688-703)

Applied the same fix with `DISTINCT ON (m.id)`.

---

## How DISTINCT ON Works

`DISTINCT ON (m.id)` in PostgreSQL:
1. Groups rows by `m.id` (the marks table primary key)
2. For each group, keeps only the **first row** based on the ORDER BY clause
3. Discards all other duplicate rows

Since `m.id` is unique for each mark entry, this ensures we get **exactly one row per mark**, even if the LEFT JOIN matches multiple schedule entries.

---

## Testing Steps

### Test Student Overall Results:
1. Go to **Student Overall Result** page
2. Enter a student's admission number
3. Click Search
4. **Verify**: Each subject appears only **once** (not duplicated)
5. **Verify**: Totals and percentages are correct

### Test Topper List:
1. Go to **Topper List** page
2. Select class, section, and exam
3. **Verify**: Each student's subjects appear only **once**
4. **Verify**: Rankings and percentages are correct

---

## Why This Happened

This issue was introduced when we fixed the max_marks calculation. The original queries didn't join with `exam_schedules`, so they never had duplicates. When we added the LEFT JOIN to get actual max_marks, we inadvertently created the duplicate issue.

**Timeline**:
1. ✅ **First fix**: Added LEFT JOIN to get actual max_marks (correct max marks, but duplicates)
2. ✅ **Second fix**: Added DISTINCT ON to remove duplicates (correct max marks, no duplicates)

---

## Impact
This fix ensures that:
- ✅ **No duplicate records** in student overall results
- ✅ **No duplicate records** in topper list
- ✅ **Correct max marks** are still used (from exam_schedules)
- ✅ **Correct percentages** are calculated
- ✅ **Performance is maintained** (DISTINCT ON is efficient in PostgreSQL)

---

## Status: ✅ FIXED

Both the Student Overall Results and Topper List now show each subject **exactly once** with the correct max marks and percentages.
