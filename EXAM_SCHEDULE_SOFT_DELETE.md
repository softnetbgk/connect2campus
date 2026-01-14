# Exam Schedule Soft Delete Implementation

## ✅ Feature Implemented

Implemented a **Soft Delete** mechanism for Exam Schedules to preserve historical data.

### 🛑 The Problem
Previously, when you saved an exam schedule, the system would **Delete** existing entries and replace them.
- If you had entered marks for an exam, deleting the schedule could break the link to "Max Marks" or "Exam Date".
- If the database protected against this (Restrict Delete), you simply couldn't update the schedule if marks existed.

### ✨ The Solution (Soft Delete)

We changed the "Save" logic to be smarter:

1.  **Smart Update (Upsert)**:
    - If a subject is still in the schedule, we **Update** the existing record (preserving its ID).
    - If it was previously deleted, we **Restore** it.

2.  **Soft Delete**:
    - If a subject is removed from the schedule, we mark it as **Deleted** (`deleted_at` timestamp).
    - We **Do Not** permanently delete the row.

3.  **Report Consistency**:
    - **Marks Reports**, **Topper Lists**, and **Overall Results** will still function correctly for deleted exams.
    - They will find the "Soft Deleted" schedule to fetch Max Marks and other settings.

4.  **UI Cleanliness**:
    - The **Exam Schedule** page and **Marks Entry** page will hide deleted exams.
    - You won't see "Ghost" exams in your daily work, but the data remains safe in the background.

## 🛠 Technical Details

### `saveExamSchedule` Logic:
```javascript
// Old Logic
DELETE FROM exam_schedules WHERE ...
INSERT INTO exam_schedules ...

// New Logic
FETCH existing_ids
FOR EACH subject IN new_schedule:
    IF exists: UPDATE (set deleted_at = NULL)
    ELSE: INSERT
FOR EACH subject IN existing_ids BUT NOT IN new_schedule:
    UPDATE SET deleted_at = NOW() (Soft Delete)
```

### `getExamSchedule` Logic:
```sql
SELECT ... FROM exam_schedules WHERE deleted_at IS NULL
```
*This ensures the UI looks clean.*

## ✅ Verification

1.  **Create specific exam schedule.**
2.  **Enter marks** for a student for this exam.
3.  **Go to settings** and remove that subject from the schedule.
4.  **Save.** (System will now Soft Delete instead of failing or breaking links).
5.  **Check Reports:** The student's marks should still appear with the total/percentage calculated correctly (using the hidden schedule's max marks).
6.  **Check Schedule UI:** The subject should be gone.

This ensures **Data Integrity** while maintaining **User Flexibility**.
