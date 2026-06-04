# Architecture Design: Sales Inventory Analysis and Forecasting System

This document outlines the production-ready architecture and folder structure for the Sales Inventory Analysis and Forecasting System. It follows **Clean Architecture** and **Domain-Driven Design (DDD)** principles to ensure scalability, maintainability, and clear separation of concerns, particularly isolating the machine learning and analytics layers from standard CRUD operations.

## 1. Complete System Folder Structure (Monorepo)

The project uses a monorepo approach to keep frontend, backend, and infrastructure configuration synchronized within the `sales-inventory-analysis` directory.

```text
sales-inventory-analysis/
├── frontend/               # React + Vite Application
├── backend/                # FastAPI Python Application
├── infrastructure/         # Docker Compose, infrastructure config
├── .github/                # CI/CD pipelines
│   └── workflows/
├── .env.example            # Template for environment variables
├── .gitignore
└── README.md
```

## 2. Frontend Folder Structure

The frontend is structured using **Feature-Based Organization**. Instead of grouping by file type (e.g., all components together), files are grouped by the business feature they belong to, making it scalable.

```text
frontend/
├── public/
├── src/
│   ├── assets/             # Static assets (images, fonts, global CSS)
│   ├── components/         # Shared, generic UI components (buttons, modals, charts)
│   │   ├── ui/             # Atomic design elements (Tailwind stylized)
│   │   └── layout/         # Application layout (Sidebar, Header, Navigation)
│   ├── config/             # App configuration, environment variable mappings
│   ├── features/           # Feature modules (Domain-Driven UI)
│   │   ├── auth/           # Authentication (Login, RBAC, Supabase UI integrations)
│   │   ├── inventory/      # Products, Categories, Suppliers, Stock Movement
│   │   ├── sales/          # Transactions, Invoices, Customer Tracking
│   │   ├── dashboard/      # Main Analytics Dashboard views
│   │   ├── forecasting/    # Demand & Requirement Predictions UI
│   │   └── reports/        # Export and Report generation UI
│   ├── hooks/              # Global custom hooks (e.g., useTheme, useWindowSize)
│   ├── lib/                # Pre-configured 3rd-party libraries
│   │   ├── axios.js        # Axios instance with auth interceptors
│   │   ├── supabase.js     # Supabase client initialization
│   │   └── react-query.js  # TanStack Query client setup
│   ├── routes/             # Centralized routing definitions (React Router)
│   ├── store/              # Global UI state (Zustand/Context, TanStack handles server state)
│   ├── utils/              # Helper functions (date formatting, currency formatting)
│   ├── App.jsx             # Root component
│   └── main.jsx            # Application entry point
├── index.html
├── package.json
└── vite.config.js
```

### Feature Module Breakdown (e.g., `src/features/inventory/`)
Inside a feature, everything related to that domain is encapsulated:
*   `api/`: API call definitions using Axios.
*   `components/`: UI components specific to this feature (e.g., `ProductTable.jsx`).
*   `hooks/`: TanStack Query hooks (e.g., `useProducts.js`, `useUpdateStock.js`).
*   `pages/`: Route-level components (e.g., `InventoryPage.jsx`).
*   `utils/`: Specific helpers for this feature.

## 3. Backend Folder Structure

The backend follows **Clean Architecture**, completely separating API routing, business logic, domain models, data access, and machine learning.

```text
backend/
├── app/
│   ├── api/                # Presentation Layer (FastAPI Routers)
│   │   ├── dependencies.py # DI (Database sessions, current user injection via Supabase JWT)
│   │   ├── v1/             # API Version 1
│   │   │   ├── endpoints/  # Route handlers (auth.py, inventory.py, sales.py, analytics.py)
│   │   │   └── router.py   # Main v1 router aggregator
│   ├── core/               # Application-wide configurations
│   │   ├── config.py       # Pydantic BaseSettings for env vars validation
│   │   ├── security.py     # JWT validation, password hashing, RBAC logic
│   │   └── exceptions.py   # Custom application exceptions & error handlers
│   ├── domain/             # Enterprise Business Rules (DDD)
│   │   ├── models/         # Domain models / Pydantic Schemas (Input/Output validation)
│   │   └── interfaces/     # Abstract base classes for repositories/services
│   ├── infrastructure/     # External Systems (Database, Supabase, Cloud Storage)
│   │   ├── database/
│   │   │   ├── session.py  # SQLAlchemy engine and session maker
│   │   │   ├── models/     # SQLAlchemy ORM models (tables)
│   │   │   └── repositories/# SQLAlchemy implementations of domain interfaces
│   │   └── supabase/       # Supabase Admin client wrappers
│   ├── services/           # Application Business Rules (Use Cases)
│   │   ├── inventory_service.py # CRUD and logic for inventory limits, reorder triggers
│   │   └── sales_service.py     # Logic for processing transactions & logging history
│   ├── analytics/          # Data Aggregation & Analytics Layer (See Section 4)
│   ├── ml/                 # Machine Learning Pipeline (See Section 5)
│   ├── reports/            # Report Generation (See Section 7)
│   └── workers/            # Background Tasks (Celery / ARQ / FastAPI BackgroundTasks)
│       └── scheduler.py    # Scheduled cron jobs (e.g., nightly retraining, async report gen)
├── alembic/                # Database migrations
├── notebooks/              # Jupyter Notebooks for EDA
├── requirements.txt
├── main.py                 # FastAPI application entry point
└── Dockerfile
```

## 4. Analytics Folder Structure

Separated from standard CRUD, this layer handles complex data aggregations and metrics. It relies heavily on Pandas and optimized SQL.

```text
backend/app/analytics/
├── queries/                # Complex optimized read-only queries (SQLAlchemy/Raw SQL)
│   ├── sales_trends.py     # Daily/Weekly/Monthly/Yearly aggregations
│   └── inventory_aging.py  # Dead stock, overstock, and stock aging queries
├── processors/             # Pandas/NumPy data transformations
│   ├── profit_analyzer.py  # Calculates margins, COGS, revenue trends
│   └── turnover_calc.py    # Calculates Inventory Turnover Rates over time
└── metrics.py              # Core metric definitions and standardized output formatting
```
**Responsibility:** Provides the heavy-lifting aggregated data consumed by the dashboard APIs without burdening the transactional database models or services.

## 5. Machine Learning Folder Structure

Completely isolated from the API to allow independent scaling, specialized dependencies (SciPy, Scikit-learn, Prophet), and strict separation of concerns.

```text
backend/app/ml/
├── data_pipeline/          # (See Section 6) Data fetching and cleaning
├── features/               # Feature engineering (creating lag features, rolling means, seasonality)
│   └── time_series.py      # Feature extractors for Prophet/Statsmodels
├── models/                 # Model definitions and wrappers
│   ├── sales_forecaster.py # Wrapper around Prophet / ARIMA for future sales
│   └── low_stock_pred.py   # Wrapper around Scikit-learn models for stock requirement prediction
├── training/               # Training routines
│   ├── train_sales.py      # Script to train and persist sales forecaster
│   └── auto_tuner.py       # Hyperparameter tuning logic
├── evaluation/             # Model scoring
│   └── metrics.py          # RMSE, MAE, MAPE calculations for automated model validation
└── registry/               # Local model registry (or pointers to cloud storage)
    └── saved_models/       # .pkl, .joblib, or Prophet JSON files
```
*Note: Exploratory Data Analysis (EDA) is performed in `backend/notebooks/` using Jupyter, completely outside the application runtime environment.*

## 6. Data Processing Pipeline Structure

Handles the ETL (Extract, Transform, Load) aspect specifically tailored for machine learning model ingestion.

```text
backend/app/ml/data_pipeline/
├── extractors/             # Pulls historical data directly from DB/Supabase securely
├── cleaners/               # Handles missing values, outliers, data normalization (Pandas)
│   └── outlier_removal.py
├── preprocessors/          # Scaling, encoding categorical variables (Scikit-learn transformers)
└── loaders/                # Prepares final data formats/arrays for model ingestion
```

## 7. Report Generation Structure

Handles asynchronous or synchronous generation of exportable documents.

```text
backend/app/reports/
├── generators/
│   ├── pdf_generator.py    # Uses ReportLab or WeasyPrint to build PDF documents
│   ├── excel_generator.py  # Uses openpyxl or Pandas ExcelWriter for rich spreadsheets
│   └── csv_generator.py    # Standard Python CSV writer for raw data exports
├── templates/
│   ├── html/               # HTML templates for PDF conversion (Jinja2)
│   │   └── invoice.html
│   └── styles/             # CSS for PDF templates
└── data_providers/         # Interfaces with analytics/services layer to fetch report data
```

## 8. Testing Structure

Robust testing is split between frontend and backend methodologies.

```text
frontend/
├── vitest.config.js
├── src/
│   └── features/
│       └── inventory/
│           └── __tests__/          # Unit tests for components & hooks (Vitest/React Testing Library)
└── cypress/                        # End-to-End Testing (Outside src/)
    └── e2e/
        └── inventory_flow.cy.js    # Tests full user journeys

backend/
├── tests/
│   ├── conftest.py                 # Pytest fixtures (DB setup, mock auth, test clients)
│   ├── unit/                       # Isolated tests
│   │   ├── ml/                     # Test data pipelines and model wrappers
│   │   ├── analytics/              # Test pandas transformations
│   │   └── services/               # Test business logic mocking DB
│   ├── integration/                # Tests for repositories and database interactions
│   └── api/                        # E2E API endpoint tests using FastAPI TestClient
```

## 9. Docker Structure

Multi-container setup for environment parity across local development and production deployment.

```text
sales-inventory-analysis/
├── docker-compose.yml              # Orchestrates Frontend, Backend API, and optional ML Workers
├── frontend/
│   ├── Dockerfile.dev              # Vite dev server with hot-reloading
│   └── Dockerfile.prod             # Multi-stage build serving static files via Nginx
└── backend/
    ├── Dockerfile                  # Python runtime for FastAPI and ML predictions
    └── Dockerfile.worker           # (Optional) Separated runtime for heavy ML training/Celery tasks
```
**Responsibility:** Ensures environment consistency. The API and ML worker can be split into different containers if model retraining requires significantly more RAM/CPU than standard web traffic.

## 10. CI/CD Structure

Using GitHub Actions for continuous integration and automated deployment.

```text
.github/workflows/
├── frontend-ci.yml                 # Runs ESLint, Vitest, and builds React app on PRs
├── backend-ci.yml                  # Runs Ruff/Flake8, Pytest, and checks migrations
├── ml-pipeline-ci.yml              # Runs model validation tests on mock data to ensure pipeline health
└── deploy-prod.yml                 # Builds Docker images and deploys to cloud provider
```

## 11. Environment Variable Strategy

Strict separation of environments (Development, Staging, Production). Environment variables are strongly typed in Python to prevent runtime configuration errors.

**Frontend (`frontend/.env`)**:
*   `VITE_API_URL`: Backend URL (e.g., http://localhost:8000/api/v1)
*   `VITE_SUPABASE_URL`: Supabase project URL
*   `VITE_SUPABASE_ANON_KEY`: Public anon key for Supabase client initialization

**Backend (`backend/.env`)**:
*   `DATABASE_URL`: Supabase PostgreSQL connection string (direct connection for SQLAlchemy/Alembic)
*   `SUPABASE_URL`: Supabase project URL
*   `SUPABASE_SERVICE_ROLE_KEY`: Admin key for backend operations (e.g., verifying tokens, bypassing RLS if needed)
*   `SECRET_KEY`: For application-level cryptographic operations
*   `ENVIRONMENT`: `development` | `staging` | `production`

**Backend Validation (`backend/app/core/config.py`)**:
Uses Pydantic `BaseSettings`. The backend will fail to boot immediately if required variables are missing or incorrectly formatted.

## Summary of Architecture Data Flow

1.  **User interacts with Frontend**: React app built with Vite, styled with Tailwind. State is managed locally where needed, and server state is managed via TanStack Query.
2.  **API Requests**: Axios sends requests to the FastAPI Backend, attaching Supabase JWTs.
3.  **Authentication**: Users authenticate via Supabase Auth on the frontend. The JWT is sent to the backend and validated via FastAPI Dependencies against the Supabase project to enforce RBAC.
4.  **CRUD Operations**: API routers call `Services` (Business Logic), which use `Repositories` to interact with SQLAlchemy ORM and Supabase PostgreSQL.
5.  **Analytics & ML Operations**:
    *   **Analytics**: Dashboard requests hit the `Analytics` layer, utilizing Pandas or complex SQL to calculate turnover, aging, and trends without locking transactional tables.
    *   **ML Background Tasks**: `Workers` run scheduled tasks to fetch data via the `Data Pipeline`, pass it to the `ML Layer`, retrain forecasting models (Prophet/Scikit-learn), and save updated models to the registry.
    *   **ML Inference**: Prediction endpoints load the latest models from the registry to serve real-time demand forecasts to the frontend.
6.  **Reports**: Report generation requests utilize `Report Generators` and the Analytics layer to build PDF/Excel files, either returning them directly or generating them asynchronously and storing them for download.
