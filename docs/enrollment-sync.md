# Enrollment synchronization

The browser never reads an Excel workbook directly. An administrator uploads a
workbook to the API, the API stores the workbook at `ENROLLMENT_UPLOAD_SOURCE`,
and the background synchronization process validates and upserts its rows into
the database. Admin and student screens then read the database through
authorized API endpoints.

## Student workbook

Student uploads must contain the configured student worksheet and map these
required values (case, spaces, and common aliases are normalized):

- full name (`full_name`, `student_name`, or `name`)
- email (`email`, `email_address`, or `student_email`)
- student ID (`student_id`, `student_id_roll_no`, `student_roll_number`,
  `roll_number`, `roll_no`, or `roll_no_id`)
- an institution code or name matching an existing institution exactly after
  normalization

Optional values include course, branch, graduation year, phone, and status.
The sync is idempotent: a repeated row updates the existing student only when
its mapped values change. Unknown institutions and invalid rows are skipped and
recorded on the sync run with their worksheet row number.

## Running a student sync

1. As an admin, open **Enrolled Students** and upload the `.xlsx` file.
2. Wait for the queued run to finish. The page polls the entity-specific run
   and refreshes the student directory and totals automatically.
3. Later, **Sync Now** reuses the last saved `ENROLLMENT_UPLOAD_SOURCE` file.
   It never uses the mentor Google Form/Sheet source for students.

Mentor and student runs are isolated. A student-only run does not create,
update, reconcile, or email mentors.

## Deployment note

The local file path used by `ENROLLMENT_UPLOAD_SOURCE` is suitable for local
development. Production deployments must persist uploads in durable object
storage and have a worker consume that stored object. Do not rely on a
container-local filesystem or an in-process FastAPI background task for durable
production jobs.
