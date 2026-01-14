# Topper List Percentage Calculation Fix

## Issue
The percentage calculation in the topper list was incorrect because it was using a hardcoded value of **100** as the max marks for every subject, regardless of the actual configured max marks.

### Example of the Problem:
- **Subject A**: Max Marks = 80, Student scored 70
- **Subject B**: Max Marks = 100, Student scored 90
- **Subject C**: Max Marks = 60, Student scored 50

**Incorrect Calculation** (before fix):
```
Total Obtained = 70 + 90 + 50 = 210
Total Max = 100 + 100 + 100 = 300  ❌ WRONG
Percentage = (210 / 300) × 100 = 70%  ❌ INCORRECT
```

**Correct Calculation** (after fix):
```
Total Obtained = 70 + 90 + 50 = 210
Total Max = 80 + 100 + 60 = 240  ✅ CORRECT
Percentage = (210 / 240) × 100 = 87.5%  ✅ CORRECT
```

---

## Root Cause
In `backend/src/controllers/marksController.js`, the `getToppers` function was hardcoding the max marks:

```javascript
// OLD CODE (Line 709)
totalMaxMarks += 100; // Default to 100 since max_marks column missing in this DB version
```

This comment was outdated - the `max_marks` column **does exist** in the `exam_schedules` table, but the query wasn't fetching it.

---

## Solution
Updated the SQL query to:
1. **JOIN with `exam_schedules`** table to get the configured `max_marks` for each subject
2. **Fallback to `exam_types.max_marks`** if no schedule exists
3. **Final fallback to 100** if neither exists

### Updated Query:
```sql
SELECT m.marks_obtained, sub.name as subject_name, 
       COALESCE(es.max_marks, et.max_marks, 100) as max_marks
FROM marks m
JOIN subjects sub ON m.subject_id = sub.id
LEFT JOIN exam_schedules es ON es.subject_id = m.subject_id 
   AND es.exam_type_id = m.exam_type_id 
   AND es.class_id = m.class_id 
   AND es.school_id = m.school_id
LEFT JOIN exam_types et ON et.id = m.exam_type_id
WHERE m.student_id = $1 AND m.exam_type_id = $2 AND m.school_id = $3
```

### Updated Calculation:
```javascript
marksResult.rows.forEach(mark => {
    marks[mark.subject_name] = parseFloat(mark.marks_obtained || 0);
    totalMarks += parseFloat(mark.marks_obtained || 0);
    totalMaxMarks += parseFloat(mark.max_marks || 100); // ✅ Use actual max_marks
});
```

---

## Files Modified
- `backend/src/controllers/marksController.js` (lines 687-711)

---

## Testing Steps

1. **Create an exam schedule** with different max marks for different subjects:
   - Math: 80 marks
   - Science: 100 marks
   - English: 60 marks

2. **Enter marks** for multiple students

3. **View the Topper List**:
   - Go to the topper list page
   - Verify that percentages are calculated correctly based on the actual max marks
   - Example: If a student scored 70/80, 90/100, 50/60, the percentage should be 87.5% (not 70%)

4. **Compare with manual calculation**:
   - Total obtained: 70 + 90 + 50 = 210
   - Total max: 80 + 100 + 60 = 240
   - Percentage: (210 / 240) × 100 = 87.5% ✅

---

## Impact
This fix ensures that:
- ✅ Topper lists show **accurate percentages**
- ✅ Rankings are based on **correct calculations**
- ✅ Students with different subject configurations are **fairly compared**
- ✅ Works with **custom max marks** configured in exam schedules

---

## Status: ✅ FIXED

The backend has been updated and automatically reloaded. The topper list will now calculate percentages correctly based on the actual configured max marks for each subject.
