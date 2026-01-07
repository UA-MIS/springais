# BLOCK N: Skills Integration - TASKS

**Block:** BLOCK-N-SKILLS-INTEGRATION
**Total Tasks:** 8
**Completed:** 0/8 (0%)

---

## ⚠️ IMPORTANT: Update Instructions

**When you complete a task:**
1. Check the box: `- [x] Task name`
2. Update the "Completed" count at the top
3. Update `PROJECT-STATUS.md`:
   - Find "Block N" row in Step 3 table
   - Update Progress column (e.g., "3/8 tasks")

**When ALL tasks complete:**
1. ✅ Run all verification steps in `VERIFICATION.md`
2. ✅ Change status in `PROJECT-STATUS.md` from ⏸️ to ✅
3. ✅ Update Progress to "8/8 tasks (100%)"
4. ✅ Update "Overall Progress" section
5. ✅ After verification passes, commit changes (do NOT commit until verification is complete)

See `CONTEXT.md` section "Update Instructions (For AI)" for full details.

---

## Progress Tracker

### Phase 1: Backend Skills API (Tasks 1-2)

- [ ] **Task 1:** Implement skills extraction endpoint
  - [ ] Create `backend/app/routes/skills.py`
  - [ ] Implement POST `/api/skills/extract` endpoint
  - [ ] Add file upload handling (PDF, DOCX, TXT)
  - [ ] Integrate with Block G skill extraction service
  - [ ] Parse resume content (use pypdf2 for PDF, python-docx for DOCX)
  - [ ] Call GPT-4 extraction with resume text
  - [ ] Store extracted skills in UserSkills table
  - [ ] Return structured JSON: skills, categories, total_count
  - [ ] Add authentication requirement (Depends on get_current_user_from_token)
  - [ ] Handle errors (invalid file type, extraction failure, GPT-4 timeout)

- [ ] **Task 2:** Implement skills retrieval and analysis endpoints
  - [ ] Implement GET `/api/skills/` endpoint (get user's skills)
  - [ ] Query UserSkills table by current user ID
  - [ ] Return most recent extraction with categories
  - [ ] Implement GET `/api/skills/gap-analysis?job_id={id}` endpoint
  - [ ] Fetch user skills and job requirements from database
  - [ ] Integrate with Block D vector embeddings for similarity
  - [ ] Calculate matching skills (similarity > 0.8)
  - [ ] Identify missing skills (gaps)
  - [ ] Generate skill recommendations
  - [ ] Implement GET `/api/skills/similar?skill={name}&limit={n}` endpoint
  - [ ] Use Block D find_similar_skills() function
  - [ ] Return similar skills with similarity scores
  - [ ] Add authentication to all endpoints
  - [ ] Register skills router in `main.py`

### Phase 2: Database Schema (Task 3)

- [ ] **Task 3:** Create UserSkills database model
  - [ ] Create `backend/app/models/user_skills.py`
  - [ ] Define UserSkills table with columns:
    - id (Integer, primary key)
    - user_id (Integer, foreign key to users)
    - skills (JSON array of all skills)
    - technical_skills (JSON array)
    - soft_skills (JSON array)
    - domain_skills (JSON array)
    - extracted_at (DateTime)
  - [ ] Add relationship to User model
  - [ ] Create Alembic migration
  - [ ] Run migration: `alembic upgrade head`
  - [ ] Verify table created in database
  - [ ] Add indexes for user_id and extracted_at

### Phase 3: Frontend Skills Dashboard (Tasks 4-6)

- [ ] **Task 4:** Update Skills Dashboard page with real API
  - [ ] Update `frontend/src/pages/SkillsDashboard.tsx`
  - [ ] Remove mock data, add state management
  - [ ] Add useEffect to load user skills on mount
  - [ ] Implement loadUserSkills(): call `api.get('/api/skills/')`
  - [ ] Add loading state while fetching
  - [ ] Add error state for failed requests
  - [ ] Display skills by category (Technical, Soft, Domain)
  - [ ] Show empty state if no skills extracted yet
  - [ ] Display "last updated" timestamp
  - [ ] Add refresh button to reload skills

- [ ] **Task 5:** Implement resume upload functionality
  - [ ] Update `frontend/src/components/skills/ResumeUpload.tsx`
  - [ ] Replace mock with real file upload
  - [ ] Implement drag-and-drop file upload
  - [ ] Validate file type (PDF, DOCX, TXT only)
  - [ ] Validate file size (max 10MB)
  - [ ] Create FormData with file
  - [ ] Implement handleResumeUpload(): POST to `/api/skills/extract`
  - [ ] Add Authorization header with token
  - [ ] Show uploading progress/spinner
  - [ ] Handle upload errors (invalid file, server error)
  - [ ] Update skills state with extraction results
  - [ ] Show success message after extraction

- [ ] **Task 6:** Implement skill gap analysis component
  - [ ] Create `frontend/src/components/skills/SkillGapAnalysis.tsx`
  - [ ] Accept job_id as prop
  - [ ] Call `api.get(\`/api/skills/gap-analysis?job_id=\${jobId}\`)`
  - [ ] Display matching skills (green badges)
  - [ ] Display missing skills (red badges)
  - [ ] Show match percentage (circular progress)
  - [ ] Render recommendations panel
  - [ ] Add "Add to Profile" button for missing skills
  - [ ] Integrate SkillGapChart component from Block I
  - [ ] Add to Match Results page (Block O will use this)

### Phase 4: Testing & Validation (Tasks 7-8)

- [ ] **Task 7:** Write integration tests
  - [ ] Backend: Test `/api/skills/extract` with sample PDF
  - [ ] Backend: Verify skills stored in database after extraction
  - [ ] Backend: Test `/api/skills/` returns user's skills
  - [ ] Backend: Test gap analysis with mock user and job
  - [ ] Backend: Test similar skills endpoint
  - [ ] Backend: Test authentication requirement (401 without token)
  - [ ] Frontend: Test resume upload flow
  - [ ] Frontend: Test skills display after extraction
  - [ ] Frontend: Test error handling (invalid file, network error)
  - [ ] Run all tests, ensure passing

- [ ] **Task 8:** End-to-end verification
  - [ ] Manual test: Upload real resume PDF
  - [ ] Verify GPT-4 extracts skills correctly
  - [ ] Verify skills saved to database
  - [ ] Verify skills displayed in dashboard
  - [ ] Test skill gap analysis with real job posting
  - [ ] Verify vector similarity search works
  - [ ] Test with DOCX and TXT files
  - [ ] Test error scenarios (corrupted file, invalid format)
  - [ ] Test loading states and error messages
  - [ ] Verify authentication on all endpoints

---

## Acceptance Criteria

All tasks must be complete AND:
- [ ] User can upload resume (PDF, DOCX, TXT) via dashboard
- [ ] Skills extracted using GPT-4 and displayed in dashboard
- [ ] Skills categorized into Technical, Soft, Domain
- [ ] User skills persisted in UserSkills database table
- [ ] Skills displayed after upload (no page refresh needed)
- [ ] Skill gap analysis works for any job posting
- [ ] Missing skills identified and recommended
- [ ] Match percentage calculated correctly
- [ ] Similar skills search returns relevant results
- [ ] All API endpoints require authentication
- [ ] Loading states shown during extraction
- [ ] Error messages clear and helpful
- [ ] All backend tests pass
- [ ] All frontend tests pass
- [ ] Manual E2E test successful

---

## Dependencies

**This block depends on:**
- ✅ Block D (Vector Embeddings) - Similarity search
- ✅ Block G (Skill Extraction) - GPT-4 extraction
- ✅ Block I (Skills Dashboard UI) - Frontend components
- ✅ Block M (Core Integration) - Authentication

**This block enables:**
- Block O (Matching Integration) - Uses skill data for matching
- Block Q (E2E Testing) - Includes skills flow

**Critical files:**
- `backend/app/routes/skills.py` - Skills API endpoints
- `backend/app/models/user_skills.py` - UserSkills database model
- `backend/app/services/skill_extraction.py` (from Block G)
- `backend/app/services/embeddings.py` (from Block D)
- `frontend/src/pages/SkillsDashboard.tsx` - Skills dashboard page
- `frontend/src/components/skills/ResumeUpload.tsx` - Upload component
- `frontend/src/components/skills/SkillGapAnalysis.tsx` - Gap analysis

---

## Troubleshooting

### Issue: "GPT-4 extraction timeout"

**Symptom:** Resume upload takes too long, times out

**Solution:**
- Check OpenAI API key in `.env`
- Verify OpenAI account has credits
- Reduce resume length (split large resumes)
- Add timeout handling (30 second max)
- Consider caching extraction results

### Issue: "File upload fails"

**Symptom:** Resume upload returns 400 or 500 error

**Solution:**
- Check file size (max 10MB)
- Verify file type (PDF, DOCX, TXT only)
- Check CORS allows multipart/form-data
- Verify FastAPI UploadFile handling
- Check backend logs for parsing errors

### Issue: "Skills not displaying after upload"

**Symptom:** Upload succeeds but dashboard shows empty

**Solution:**
- Check database: SELECT * FROM user_skills WHERE user_id = X
- Verify frontend state updates after upload
- Check API response format matches frontend expectations
- Verify skills array is not empty in database
- Check browser console for JavaScript errors

### Issue: "Skill gap analysis returns no results"

**Symptom:** Gap analysis endpoint returns empty or error

**Solution:**
- Verify user has skills in database
- Verify job has required_skills in database
- Check vector embeddings are generated (Block D)
- Verify similarity threshold not too high
- Check database relationships (user_id, job_id)

---

**Last Updated:** 2026-01-06
**Status:** Not Started
