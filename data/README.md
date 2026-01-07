# Data Dumps Branch

This branch (`data-dumps`) is dedicated to storing SQL dumps and synthetic data files.

## Purpose

- Store large SQL dump files without bloating the main branch
- Share synthetic employee data between team members
- Keep data separate from application code

## Usage

When you generate synthetic data (Block A) or scrape job postings (Block B):

1. Switch to this branch: `git checkout data-dumps`
2. Add your SQL dump: `git add data/your_dump.sql`
3. Commit: `git commit -m "Add synthetic employees data"`
4. Push: `git push origin data-dumps`

## Important

- **NEVER merge this branch to main**
- Only store `.sql` files here
- Keep file sizes reasonable (compress if needed)
- Update this README when adding new data files

## Current Data Files

_(List will be updated as data files are added)_
