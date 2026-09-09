# DLIF Database Schema

## 1. Identity & Access

### users

Core application user record.

- id
- email
- full_name
- role
- status
- created_at
- updated_at

Roles:

- ADMIN
- STUDENT
- MENTOR
- INSTITUTION
- COMPANY

---

### auth_accounts

External authentication provider information.

- id
- user_id
- provider
- provider_user_id
- created_at

---

### audit_logs

Tracks important application actions.

- id
- actor_user_id
- action
- entity_type
- entity_id
- old_value
- new_value
- ip_address
- user_agent
- created_at


## 2. Institutions & Cohorts

### institutions

- id
- name
- code
- status
- created_at
- updated_at

---

### cohorts

A fellowship batch belonging to an institution.

- id
- institution_id
- name
- academic_year
- start_date
- end_date
- status
- created_at
- updated_at

---

### enrollments

Connects students to cohorts.

- id
- user_id
- cohort_id
- enrollment_status
- enrolled_at
- completed_at


## 3. Student Profile

### student_profiles

- id
- user_id
- institution_id
- student_id
- phone
- date_of_birth
- course
- branch
- graduation_year
- created_at
- updated_at

---

### student_documents

Metadata for uploaded student documents.

- id
- student_id
- document_type
- storage_path
- file_name
- mime_type
- file_size
- uploaded_at

Binary files must NOT be stored directly in PostgreSQL.


## 4. Teams

### teams

- id
- cohort_id
- name
- status
- created_at
- updated_at

---

### team_members

- id
- team_id
- student_id
- role
- joined_at
- left_at


## 5. Mentors

### mentors

- id
- user_id
- expertise
- bio
- status
- created_at
- updated_at

---

### mentor_assignments

- id
- mentor_id
- team_id
- assigned_at
- ended_at


## 6. Industry Challenges

### challenges

- id
- title
- company_name
- description
- problem_statement
- expected_outcome
- difficulty
- status
- created_at
- updated_at

---

### challenge_resources

- id
- challenge_id
- title
- resource_type
- storage_path
- external_url
- created_at

---

### challenge_assignments

Connects a challenge to a team.

- id
- challenge_id
- team_id
- assigned_at
- status


## 7. Discover Sessions

### sessions

Represents each Discover session.

- id
- cohort_id
- week_number
- session_number
- title
- description
- scheduled_at
- duration_minutes
- status
- meeting_url
- created_at
- updated_at

---

### session_resources

- id
- session_id
- title
- resource_type
- storage_path
- external_url
- created_at

---

### session_tasks

- id
- session_id
- title
- description
- task_type
- required
- due_at
- created_at


## 8. Attendance

### attendance

- id
- session_id
- student_id
- joined_at
- left_at
- duration_minutes
- status
- source
- created_at


## 9. Session Recordings

### recordings

- id
- session_id
- provider
- external_meeting_id
- external_file_id
- recording_url
- started_at
- ended_at
- created_at

---

### transcripts

- id
- recording_id
- external_file_id
- transcript_url
- created_at


## 10. Submissions

### submissions

Represents a student's/team's submission for a task.

- id
- task_id
- team_id
- submitted_by
- status
- submitted_at
- created_at
- updated_at

---

### submission_versions

Every revision is preserved.

- id
- submission_id
- version_number
- content
- created_by
- created_at

Never overwrite an existing submission version.

---

### submission_files

- id
- submission_version_id
- file_name
- storage_path
- mime_type
- file_size
- created_at


## 11. Feedback

### feedback

- id
- submission_id
- reviewer_id
- feedback_text
- score
- created_at
- updated_at

---

### evaluation_criteria

- id
- name
- description
- weight
- created_at


## 12. Notifications

### notifications

- id
- user_id
- title
- message
- type
- read_at
- created_at


## 13. Progress

### student_progress

- id
- student_id
- cohort_id
- current_week
- current_session
- completion_percentage
- last_activity_at
- updated_at