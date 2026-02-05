# How to Write Placeholders in Your DOCX Template

To fill the downloaded `.docx` with data from your table, use placeholders in **double square brackets** in Word: `[[PlaceholderName]]`.

---

## Rule: Placeholder → Table Column

The text inside `[[...]]` is converted to a **column name** like this:

1. **Spaces** → **underscores**
  `Designation Name` → column `designation_name`
2. **Lowercase**
  `Empname` → column `empname`
3. **Special characters removed**
  Only letters, numbers, and underscores are used for the column name.

So in the template you write the column name in a “readable” form (e.g. with spaces and capitals); the app maps it to the actual column in your table.

---

## Examples (template ↔ table column)


| In your DOCX template  | Table column used                                  |
| ---------------------- | -------------------------------------------------- |
| `[[Empname]]`          | `empname` (or `name`, `employee_name` if present)  |
| `[[Designation Name]]` | `designation_name` or `designation`                |
| `[[Present Res No]]`   | `present_res_no` or `present_address` or `address` |
| `[[Date Of Joining]]`  | `date_of_joining` or `joining_date`                |
| `[[Employee Code]]`    | `employee_code` or `emp_code`                      |
| `[[Department]]`       | `department` or `dept`                             |


If the “ideal” column (e.g. `empname`) is missing, the app tries common alternatives (e.g. `name`, `employee_name`) so the placeholder can still be filled.

---

## Step-by-step

1. **Know your table columns**
  e.g. `id`, `name`, `designation`, `present_address`, `joining_date`.
2. **In Word, type the placeholder**
  - For column `name` → type: `[[Name]]` or `[[Empname]]` (both can map to `name`).  
  - For column `designation` → type: `[[Designation]]` or `[[Designation Name]]`.  
  - For column `present_address` → type: `[[Present Address]]` or `[[Present Res No]]`.  
  - For column `joining_date` → type: `[[Joining Date]]` or `[[Date Of Joining]]`.
3. **Use double brackets**
  - Correct: `[[Empname]]`, `[[Designation Name]]`  
  - Wrong: `[Empname]`, `{Empname}`, `((Empname))`
4. **Spelling and spaces**
  - The text between `[[` and `]]` is converted as above.  
  - `[[Empname]]` and `[[empname]]` both map to the same column (`empname`).  
  - `[[Designation Name]]` maps to `designation_name` (or `designation` if that’s what the table has).

---

## If a placeholder is still empty

- Check that your **table** has a column that matches (or is one of the supported alternatives).  
- Column names are case-insensitive; the app tries common variants (e.g. `name`, `empname`, `employee_name` for the “employee name” field).  
- To support a new column, add it (or an alias) in `lib/db-mapper.ts` in `COLUMN_ALTERNATIVES` or `PLACEHOLDER_ALIASES`.

---

## Quick reference

- **Format:** `[[PlaceholderName]]`  
- **Examples:** `[[Empname]]`, `[[Designation Name]]`, `[[Present Res No]]`, `[[Date Of Joining]]`  
- **Column name:** Spaces → underscores, then lowercased (e.g. `Designation Name` → `designation_name`).

