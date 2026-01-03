# Components That Need Year Dropdowns for Historical Data

## ✅ Already Fixed:
1. **Marks Management** - Has year dropdown (2026-2020)
2. **Expenditure Management** - Has year dropdown (2026-2020)

## 🔧 Need Year Dropdowns:

### 1. **College Calendar / Events**
- Location: `frontend/src/components/dashboard/academics/CollegeCalendar.jsx`
- Add year dropdown to view past year events

### 2. **Student Attendance Reports**
- Location: `frontend/src/components/dashboard/students/StudentAttendanceReports.jsx`
- Already has year dropdown (need to verify it works)

### 3. **Teacher Attendance Reports**
- Location: `frontend/src/components/dashboard/teachers/TeacherAttendanceReports.jsx`
- Already has year dropdown (need to verify it works)

### 4. **Staff Attendance Reports**
- Location: `frontend/src/components/dashboard/staff/StaffAttendanceReports.jsx`
- Already has year dropdown (need to verify it works)

### 5. **Fee Collection / Reports**
- Location: `frontend/src/components/dashboard/finance/FeeCollection.jsx`
- May need year filter for viewing old fee records

### 6. **Salary Management**
- Location: `frontend/src/components/dashboard/finance/SalaryManagement.jsx`
- May need year/month filter for old salary records

### 7. **Library Records**
- Location: `frontend/src/components/dashboard/library/*`
- May need date filters for old issue/return records

### 8. **Hostel Records**
- Location: `frontend/src/components/dashboard/hostel/*`
- May need filters for old records

## 📋 Action Plan:
1. Check which components already have year dropdowns
2. Add year dropdowns to components that don't have them
3. Ensure all year dropdowns show: Current year + Past years (back to 2020)
4. No future years in any dropdown
