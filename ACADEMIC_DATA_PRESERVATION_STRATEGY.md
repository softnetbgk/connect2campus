# Academic Data Preservation Strategy

## Requirement
When exam schedules are deleted, **marks data must be preserved** for:
- Historical records
- Grade configuration
- Topper lists
- Student overall results
- Academic year separation

## Current Problem
The database has `ON DELETE CASCADE` constraints that will delete marks when:
1. Exam types are deleted
2. Exam schedules are deleted

This causes loss of historical academic data.

## Solution Strategy

### 1. Database Schema Changes

#### Change Foreign Key Constraints
**Current (WRONG)**:
```sql
FOREIGN KEY (exam_type_id) REFERENCES exam_types(id) ON DELETE CASCADE
```

**New (CORRECT)**:
```sql
FOREIGN KEY (exam_type_id) REFERENCES exam_types(id) ON DELETE RESTRICT
```

This prevents deletion of exam types if marks exist, preserving data integrity.

#### Add Academic Year Column
Add `academic_year` column to relevant tables:
- `exam_schedules`
- `marks`
- `exam_types` (optional, for year-specific exam types)

### 2. Soft Delete for Exam Schedules

Instead of hard deleting exam schedules, implement soft delete:

**Add to exam_schedules table**:
```sql
ALTER TABLE exam_schedules 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS academic_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
```

**Modify queries to filter out deleted schedules**:
```sql
WHERE deleted_at IS NULL AND academic_year = $1
```

### 3. Academic Year Management

**Add academic_year to marks table**:
```sql
ALTER TABLE marks 
ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
```

This allows:
- Historical data preservation
- Year-wise filtering
- Academic year rollover without data loss

### 4. Exam Schedule Deletion Logic

**Instead of**:
```sql
DELETE FROM exam_schedules WHERE id = $1
```

**Use**:
```sql
UPDATE exam_schedules 
SET deleted_at = CURRENT_TIMESTAMP 
WHERE id = $1
```

### 5. Query Modifications

All queries fetching exam schedules should filter by:
1. `deleted_at IS NULL` (not deleted)
2. `academic_year = current_year` (current academic year)

**Example**:
```sql
SELECT * FROM exam_schedules 
WHERE school_id = $1 
  AND deleted_at IS NULL 
  AND academic_year = $2
```

## Implementation Steps

### Step 1: Update Database Constraints
Run migration to change CASCADE to RESTRICT for marks table.

### Step 2: Add Academic Year Columns
Add `academic_year` and `deleted_at` columns to exam_schedules.

### Step 3: Update Backend Controllers
Modify exam schedule deletion to use soft delete.

### Step 4: Update Queries
Add academic year filtering to all relevant queries.

### Step 5: Add Academic Year Selector
Add UI component to select academic year for viewing historical data.

## Benefits

✅ **Data Preservation**: Marks are never lost when schedules are deleted  
✅ **Historical Access**: View past academic year results  
✅ **Clean Separation**: Each academic year's data is isolated  
✅ **Audit Trail**: Deleted schedules are tracked with timestamps  
✅ **Rollback Capability**: Soft-deleted schedules can be restored  

## Migration Required

1. **Database Migration**: Change foreign key constraints
2. **Add Columns**: academic_year, deleted_at
3. **Update Existing Data**: Set academic_year for existing records
4. **Update Controllers**: Implement soft delete
5. **Update Queries**: Add year filtering

## Files to Modify

### Backend:
- `backend/src/controllers/examScheduleController.js` - Soft delete logic
- `backend/src/controllers/marksController.js` - Remove cascade delete
- `backend/src/scripts/migrate_academic_year.js` - New migration script

### Frontend:
- Add academic year selector component
- Update exam schedule delete confirmation
- Add "View Historical Data" feature

## Notes

- **Marks table already has `year` column** - Good! This is already implemented
- **Need to add to exam_schedules** - For schedule-specific year tracking
- **Soft delete is safer** - Can be restored if needed
- **RESTRICT prevents accidents** - Can't delete exam type if marks exist

## Status: 📋 PLANNED

This is a comprehensive strategy. Implementation should be done carefully with proper testing.
