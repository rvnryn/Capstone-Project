# Copilot Instructions for Capstone-Project

## Architecture Overview

- **Monorepo**: Contains both `frontend` (Next.js/React/TypeScript) and `backend` (FastAPI/Python) directories, plus shared `Database` and documentation.
- **Frontend**: Built with Next.js (React), using TypeScript, Tailwind CSS, Chart.js, and Axios. Organized by features (e.g., `Features/Report`, `Features/Dashboard`). Uses custom hooks for API data fetching.
- **Backend**: FastAPI app with modular routes (e.g., `routes/dashboard.py`, `routes/sales_report.py`). Uses async SQLAlchemy for DB access, and integrates with Supabase for storage/auth. ML forecasting uses scikit-learn.
- **Database**: PostgreSQL, schema in `Database/schema.sql`. Some scripts for data migration and test data.

## Code Quality Requirements

- **Backend**: All backend code must be fully optimized for performance and scalability. Use efficient queries, async patterns, and avoid unnecessary computation or blocking calls. Profile and refactor for speed and resource usage.

- **Frontend**: All frontend code must be fully responsive (works on all device sizes) and use semantic HTML wherever possible. Follow accessibility best practices and ensure layouts adapt smoothly. Optimize frontend performance by minimizing render cycles, reducing bundle size, lazy-loading assets, and ensuring fast load times.

- **All Code**: Maintain clean code throughout the project. Use clear naming, modular structure, and remove dead or duplicate code. Follow established linting and formatting rules for both Python and TypeScript/JavaScript.

- **Code Integrity**:

- Never push or commit code that breaks existing functionality.

- Run tests locally and ensure all pass before submitting changes.

- No “quick fixes” that cause regressions or unstable behavior.

- All changes must go through peer review (if team-based) before merging.

- Use automated tests and continuous integration (CI) pipelines to prevent broken code from being deployed.

- **Safe Changes**:

- Maintain backward compatibility unless intentionally refactoring.

- Clearly document significant changes and update related files.

- Avoid introducing errors that affect other parts of the system.

- Test across different environments (development, staging, production) to ensure stability.

## Key Patterns & Conventions

- **API Design**: RESTful endpoints, e.g., `/dashboard/low-stock`, `/weekly-sales-forecast`. ML endpoints return both historical and predicted data.
- **Data Flow**: Frontend fetches data via Axios or custom hooks, displays in tables/charts. Backend returns JSON, often with both actual and predicted fields.
- **Testing**: Python tests in backend root (e.g., `test_menu_update.py`). Frontend likely uses Jest (not shown explicitly).
- **Styling**: Tailwind CSS for all UI. Responsive layouts are a priority.
- **Authentication**: Supabase and OAuth (Google) for user management.
- **Rate Limiting**: SlowAPI used on backend endpoints; always include `request: Request` in limited routes.

## Developer Workflows

- **Backend**: Run with `uvicorn app.main:app --reload` from the backend directory. Install dependencies via `pip install -r requirements.txt`.
- **Frontend**: Start with `npm run dev` in the frontend directory. Uses Next.js conventions for routing and page structure.
- **Database**: Apply schema from `Database/schema.sql`. Use provided SQL scripts for test data.
- **ML Forecasting**: See `routes/sales_report.py` for logic. Uses linear regression, holidays, and seasonality.

## Integration Points

- **Supabase**: Used for auth and possibly storage. Credentials in `credentials.json` (backend/app/).
- **Chart.js**: Used for all analytics/forecast charts in frontend.
- **Custom Hooks**: Frontend data fetching is abstracted into hooks (e.g., `useSimpleSalesReport.ts`).

## Project-Specific Tips

- When adding new backend endpoints, follow the async/await and dependency injection patterns.
- For new frontend features, use the `Features/` directory and match the existing component/hook structure.
- Always update both frontend and backend when changing data contracts (API response shapes).
- Use Tailwind for all new UI; avoid inline styles.
- For rate-limited endpoints, always add the `request` parameter and import it from FastAPI.

## Key Files/Directories

- `backend/app/routes/` — All backend API endpoints
- `frontend/app/Features/` — Main frontend features/components
- `frontend/app/Features/Report/Report_Sales/hooks/useSimpleSalesReport.ts` — Example of data fetching hook
- `Database/schema.sql` — Main DB schema
- `backend/app/routes/sales_report.py` — ML forecasting logic

---

For more, see the main `README.md` in the project root and each subdirectory.
