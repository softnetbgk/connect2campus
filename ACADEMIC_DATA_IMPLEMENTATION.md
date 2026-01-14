# Academic Data Preservation - Implementation Summary

## Current Situation
✅ **Good News**: The `marks` table already has a `year` column for academic year tracking!  
❌ **Problem**: Foreign key constraints will delete marks if exam types are deleted  
❌ **Problem**: Exam schedules are hard-deleted, losing configuration history  

## What We Need to Do

### Phase 1: Database Protection (CRITICAL - Do First)
Run the migration script to prevent data loss:

```bash
node backend/src/scripts/migrate_academic_data_preservation.js
```

This will:
1. ✅ Change `marks.exam_type_id` foreign key from CASCADE to RESTRICT
2. ✅ Add `academic_year` column to `exam_schedules`
3. ✅ Add `deleted_at` column to `exam_schedules` for soft delete
4. ✅ Set current year for all existing schedules
5. ✅ Add performance indexes

**Result**: Marks can no longer be accidentally deleted when exam types are removed.

---

### Phase 2: Update Exam Schedule Deletion (Backend)

#### File: `backend/src/controllers/examScheduleController.js`

**Current delete logic** (in `saveExamSchedule` function):
```javascript
// Lines 69-86: Hard delete
if (delete_existing) {
    const keys = new Set(schedules.map(s => `${s.class_id}-${s.section_id || 'NULL'}-${s.exam_type_id}`));
    for (const key of keys) {
        const [cid, sid, eid] = key.split('-');
        const sectionId = sid === 'NULL' ? null : sid;

        let deleteQuery = `DELETE FROM exam_schedules WHERE school_id = $1 AND class_id = $2 AND exam_type_id = $4`;
        const params = [school_id, cid, sectionId, eid];

        if (sectionId) {
            deleteQuery += ` AND section_id = $3`;
        } else {
            deleteQuery += ` AND section_id IS NULL`;
        }

        await client.query(deleteQuery, params);
    }
}
```

**Change to soft delete**:
```javascript
if (delete_existing) {
    const keys = new Set(schedules.map(s => `${s.class_id}-${s.section_id || 'NULL'}-${s.exam_type_id}`));
    for (const key of keys) {
        const [cid, sid, eid] = key.split('-');
        const sectionId = sid === 'NULL' ? null : sid;

        // SOFT DELETE: Mark as deleted instead of removing
        let updateQuery = `UPDATE exam_schedules 
                          SET deleted_at = CURRENT_TIMESTAMP 
                          WHERE school_id = $1 AND class_id = $2 AND exam_type_id = $4 
                          AND deleted_at IS NULL`;
        const params = [school_id, cid, sectionId, eid];

        if (sectionId) {
            updateQuery += ` AND section_id = $3`;
        } else {
            updateQuery += ` AND section_id IS NULL`;
        }

        await client.query(updateQuery, params);
    }
}
```

---

### Phase 3: Update Queries to Filter Deleted Schedules

All queries fetching exam schedules should add:
```sql
WHERE deleted_at IS NULL
```

**Files to update**:
1. `backend/src/controllers/examScheduleController.js` - `getExamSchedule` function
2. `backend/src/controllers/marksController.js` - All queries joining exam_schedules

**Example**:
```javascript
// OLD
let query = `
    SELECT es.*, sub.name as subject_name, c.name as class_name, s.name as section_name, et.name as exam_type_name
    FROM exam_schedules es
    ...
    WHERE es.school_id = $1
`;

// NEW
let query = `
    SELECT es.*, sub.name as subject_name, c.name as class_name, s.name as section_name, et.name as exam_type_name
    FROM exam_schedules es
    ...
    WHERE es.school_id = $1 AND es.deleted_at IS NULL
`;
```

---

### Phase 4: Prevent Exam Type Deletion if Marks Exist

#### File: `backend/src/controllers/marksController.js`

**Current delete logic** (in `deleteExamType` function, lines 109-143):
```javascript
exports.deleteExamType = async (req, res) => {
    const client = await pool.connect();
    try {
        const school_id = req.user.schoolId;
        const { id } = req.params;

        await client.query('BEGIN');

        // Delete related schedules
        await client.query('DELETE FROM exam_schedules WHERE exam_type_id = $1 AND school_id = $2', [id, school_id]);

        // Delete related marks
        await client.query('DELETE FROM marks WHERE exam_type_id = $1 AND school_id = $2', [id, school_id]);

        // Delete related exam components
        await client.query('DELETE FROM exam_components WHERE exam_type_id = $1', [id]);

        // Delete the type
        const result = await client.query('DELETE FROM exam_types WHERE id = $1 AND school_id = $2 RETURNING *', [id, school_id]);
        
        // ... rest of code
    }
};
```

**Change to prevent deletion if marks exist**:
```javascript
exports.deleteExamType = async (req, res) => {
    const client = await pool.connect();
    try {
        const school_id = req.user.schoolId;
        const { id } = req.params;

        await client.query('BEGIN');

        // CHECK if marks exist for this exam type
        const marksCheck = await client.query(
            'SELECT COUNT(*) as count FROM marks WHERE exam_type_id = $1 AND school_id = $2',
            [id, school_id]
        );

        if (parseInt(marksCheck.rows[0].count) > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                message: `Cannot delete exam type. ${marksCheck.rows[0].count} marks records exist. Please archive instead of deleting to preserve academic history.` 
            });
        }

        // Soft delete related schedules instead of hard delete
        await client.query(
            'UPDATE exam_schedules SET deleted_at = CURRENT_TIMESTAMP WHERE exam_type_id = $1 AND school_id = $2', 
            [id, school_id]
        );

        // Delete related exam components (safe - no data loss)
        await client.query('DELETE FROM exam_components WHERE exam_type_id = $1', [id]);

        // Delete the type (only if no marks exist)
        const result = await client.query('DELETE FROM exam_types WHERE id = $1 AND school_id = $2 RETURNING *', [id, school_id]);
        
        // ... rest of code
    }
};
```

---

## Testing Checklist

After implementing changes, test:

1. ✅ **Create exam schedule** → Save marks → Delete schedule → Verify marks still exist
2. ✅ **View student overall results** → Should show all historical marks
3. ✅ **View topper list** → Should work with current year data
4. ✅ **Try to delete exam type with marks** → Should be prevented with error message
5. ✅ **Delete exam type without marks** → Should work normally
6. ✅ **Create new academic year schedule** → Should not interfere with old year

---

## Benefits After Implementation

✅ **Data Safety**: Marks are never lost when schedules are deleted  
✅ **Historical Access**: All past academic records are preserved  
✅ **Clean Separation**: Each academic year's schedules are isolated  
✅ **Audit Trail**: Know when schedules were deleted and by whom  
✅ **Rollback**: Can restore soft-deleted schedules if needed  
✅ **Compliance**: Meet data retention requirements  

---

## Quick Start

1. **Run migration** (5 minutes):
   ```bash
   cd backend
   node src/scripts/migrate_academic_data_preservation.js
   ```

2. **Update deletion logic** (15 minutes):
   - Modify `examScheduleController.js` - soft delete
   - Modify `marksController.js` - prevent deletion

3. **Add filters** (10 minutes):
   - Add `deleted_at IS NULL` to all exam_schedule queries

4. **Test** (20 minutes):
   - Test all scenarios in checklist

**Total Time**: ~50 minutes

---

## Status: 🚀 READY TO IMPLEMENT

All code is prepared. Just need to:
1. Run the migration script
2. Apply the code changes
3. Test thoroughly
