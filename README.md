# DegreeLabs DLIF Platform

Production-grade platform for the DegreeLabs Impact Fellowship (DLIF).

## Scope

Initial platform scope:

- Student onboarding
- Admin management
- Discover Phase
- Cohort management
- Team management
- Company challenges
- Sessions
- Google Classroom / Google Meet integration
- Session recordings
- Resources
- Tasks
- Submissions
- Mentor feedback
- Progress tracking
- Notifications
- Audit logs

## Discover Journey

Enrollment
→ Onboarding
→ Team
→ Challenge
→ Sessions
→ Work
→ Submission
→ Feedback
→ Revision
→ Final Review

## Technology

### Frontend
Next.js + TypeScript

### Backend
FastAPI + Python

### Database
PostgreSQL

### Authentication
Supabase Auth

### Storage
Object Storage

## Project Structure

apps/
- web/ - Student and Admin frontend
- api/ - Backend API

packages/
- shared types and validation

infrastructure/
- Docker
- Terraform
- Deployment configuration

docs/
- Architecture
- Database
- API
- Technical decisions

scripts/
- Development and deployment scripts