-- Find all foreign key constraints referencing the students table
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_name IN (
      SELECT constraint_name
      FROM information_schema.constraint_column_usage
      WHERE table_name = 'students'
  )
ORDER BY tc.table_name;
