# ID Format Update - Implementation Summary

## Overview
The ID generation system has been updated to use a new format based on school name and role. This applies to **new users only** - existing users keep their current IDs.

## New ID Formats

### Students
**Format**: `[School First Letter]S[4 digits]`

**Examples**:
- ABC School → `AS1234`, `AS5678`, `AS9012`
- Delhi Public School → `DS1234`, `DS5678`
- Xavier High School → `XS1234`, `XS5678`

**How it works**:
1. Takes first letter of school name (alphabetic characters only)
2. Adds letter 'S' for Student
3. Adds 4 random digits (1000-9999)
4. Ensures uniqueness within the school

### Teachers
**Format**: `[School First Letter]T[4 digits]`

**Examples**:
- ABC School → `AT1234`, `AT5678`, `AT9012`
- Delhi Public School → `DT1234`, `DT5678`
- Xavier High School → `XT1234`, `XT5678`

**How it works**:
1. Takes first letter of school name (alphabetic characters only)
2. Adds letter 'T' for Teacher
3. Adds 4 random digits (1000-9999)
4. Ensures uniqueness within the school

### Staff Members
**Format**: `[School First Letter][Role First Letter][4 digits]`

**Examples**:
- **Driver** at ABC School → `AD1234`, `AD5678`
- **Librarian** at ABC School → `AL1234`, `AL5678`
- **Accountant** at ABC School → `AA1234`, `AA5678`
- **Staff** (generic) at ABC School → `AS1234`, `AS5678`

**How it works**:
1. Takes first letter of school name (alphabetic characters only)
2. Takes first letter of role (D=Driver, L=Librarian, A=Accountant, S=Staff)
3. Adds 4 random digits (1000-9999)
4. Ensures uniqueness within the school

## Implementation Details

### Backend Changes

#### Modified Files:
1. **`src/controllers/studentController.js`**
   - Updated `addStudent` function
   - Changed from 2-letter prefix to 1-letter + 'S'
   - Added uniqueness check loop

2. **`src/controllers/teacherController.js`**
   - Updated `addTeacher` function
   - Changed from 6-digit random to 1-letter + 'T' + 4 digits
   - Added school name lookup

3. **`src/controllers/staffController.js`**
   - Updated `addStaff` function
   - Changed from 6-digit random to 1-letter + role letter + 4 digits
   - Added school name and role-based generation

### Code Logic

#### Student ID Generation:
```javascript
// Get school name
const schoolRes = await client.query('SELECT name FROM schools WHERE id = $1', [school_id]);
const schoolName = schoolRes.rows[0]?.name || 'X';
const firstLetter = schoolName.replace(/[^a-zA-Z]/g, '').substring(0, 1).toUpperCase() || 'X';

// Generate unique ID
let isUnique = false;
let admission_no;
while (!isUnique) {
    const rand4 = Math.floor(1000 + Math.random() * 9000);
    admission_no = `${firstLetter}S${rand4}`;
    const check = await client.query('SELECT id FROM students WHERE admission_no = $1 AND school_id = $2', [admission_no, school_id]);
    if (check.rows.length === 0) isUnique = true;
}
```

#### Teacher ID Generation:
```javascript
// Get school name
const schoolRes = await client.query('SELECT name FROM schools WHERE id = $1', [school_id]);
const schoolName = schoolRes.rows[0]?.name || 'X';
const firstLetter = schoolName.replace(/[^a-zA-Z]/g, '').substring(0, 1).toUpperCase() || 'X';

// Generate unique ID
let isUnique = false;
let employee_id;
while (!isUnique) {
    const rand4 = Math.floor(1000 + Math.random() * 9000);
    employee_id = `${firstLetter}T${rand4}`;
    const check = await client.query('SELECT 1 FROM teachers WHERE employee_id = $1 AND school_id = $2', [employee_id, school_id]);
    if (check.rows.length === 0) isUnique = true;
}
```

#### Staff ID Generation:
```javascript
// Get school name
const schoolRes = await client.query('SELECT name FROM schools WHERE id = $1', [school_id]);
const schoolName = schoolRes.rows[0]?.name || 'X';
const schoolLetter = schoolName.replace(/[^a-zA-Z]/g, '').substring(0, 1).toUpperCase() || 'X';
const roleLetter = (role || 'S').substring(0, 1).toUpperCase();

// Generate unique ID
let isUnique = false;
let employee_id;
while (!isUnique) {
    const rand4 = Math.floor(1000 + Math.random() * 9000);
    employee_id = `${schoolLetter}${roleLetter}${rand4}`;
    const check = await client.query('SELECT 1 FROM staff WHERE employee_id = $1 AND school_id = $2', [employee_id, school_id]);
    if (check.rows.length === 0) isUnique = true;
}
```

## Important Notes

### Existing Users
- **No changes** to existing user IDs
- All existing students, teachers, and staff keep their current IDs
- Old ID formats will continue to work for login and all operations

### New Users (Created After This Update)
- All new users will get IDs in the new format
- IDs are automatically generated during user creation
- Manual ID entry is still supported if provided

### Uniqueness
- IDs are guaranteed unique within each school
- The system checks for duplicates before assigning
- If a collision occurs, a new random number is generated

### Login Compatibility
- Users can still login with their IDs
- The authentication system supports both old and new formats
- No changes needed to login logic

## Benefits

1. **Easier Identification**: IDs now indicate both school and role at a glance
2. **Shorter IDs**: Reduced from 6 digits to 5-6 characters total
3. **Better Organization**: School-specific prefixes help with multi-school management
4. **Role Recognition**: Staff IDs show their role immediately

## Testing Recommendations

### Test New Student Creation
1. Login as School Admin
2. Add a new student
3. Check the generated admission number
4. Verify format: `[School Letter]S[4 digits]`
5. Try logging in with the new ID

### Test New Teacher Creation
1. Login as School Admin
2. Add a new teacher
3. Check the generated employee ID
4. Verify format: `[School Letter]T[4 digits]`
5. Try logging in with the new ID

### Test New Staff Creation
1. Login as School Admin
2. Add a new staff member (try different roles)
3. Check the generated employee ID
4. Verify format: `[School Letter][Role Letter][4 digits]`
5. Examples to test:
   - Driver → `[X]D[####]`
   - Librarian → `[X]L[####]`
   - Accountant → `[X]A[####]`

### Verify Existing Users
1. Confirm existing users can still login
2. Check that their IDs haven't changed
3. Verify all operations work normally

## Rollback Instructions

If you need to revert to the old ID format:

1. **Restore studentController.js**:
   - Revert to 2-letter school prefix + 4 digits
   - Remove uniqueness check loop

2. **Restore teacherController.js**:
   - Revert to 6-digit random generation
   - Remove school name lookup

3. **Restore staffController.js**:
   - Revert to 6-digit random generation
   - Remove role-based generation

## Examples by School

### ABC School
- Students: `AS1234`, `AS5678`, `AS9012`
- Teachers: `AT1234`, `AT5678`, `AT9012`
- Drivers: `AD1234`, `AD5678`
- Librarians: `AL1234`, `AL5678`
- Accountants: `AA1234`, `AA5678`

### Delhi Public School
- Students: `DS1234`, `DS5678`, `DS9012`
- Teachers: `DT1234`, `DT5678`, `DT9012`
- Drivers: `DD1234`, `DD5678`
- Librarians: `DL1234`, `DL5678`
- Accountants: `DA1234`, `DA5678`

### Xavier High School
- Students: `XS1234`, `XS5678`, `XS9012`
- Teachers: `XT1234`, `XT5678`, `XT9012`
- Drivers: `XD1234`, `XD5678`
- Librarians: `XL1234`, `XL5678`
- Accountants: `XA1234`, `XA5678`
