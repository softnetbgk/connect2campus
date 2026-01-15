# AWS Production Migration Plan 🚀

This plan outlines the steps to move the **School Management System** from Render/Vercel/Supabase to a professional, managed **AWS Architecture**.

## 🏗️ Architecture Overview
*   **Frontend**: AWS Amplify (CDN + CI/CD)
*   **Backend**: AWS App Runner (Auto-scaling Container Service)
*   **Database**: AWS RDS PostgreSQL (Managed High-Availability DB)
*   **Storage**: AWS S3 (Secure File Storage)

---

## 🛠️ Step-By-Step Checklist

### 1. Database Migration (Supabase → AWS RDS)
1.  **Create RDS Instance**: 
    *   Select **PostgreSQL**.
    *   Choose **Free Tier** (if eligible) or **Dev/Test**.
    *   **Public Access**: Set to "Yes" (initially) to allow migration.
    *   **Security Group**: Allow your IP on port 5432.
2.  **Export Data from Supabase**:
    ```bash
    pg_dump -h db.supabase.co -U postgres -d postgres > supabase_dump.sql
    ```
3.  **Import Data to AWS RDS**:
    ```bash
    psql -h your-rds-endpoint.aws.com -U your_username -d schooldb < supabase_dump.sql
    ```

### 2. Backend Deployment (GitHub → AWS App Runner)
1.  **GitHub Repo**: Ensure the `backend/Dockerfile` I created is pushed to your repo.
2.  **App Runner Service**:
    *   **Source**: Repository (GitHub).
    *   **Branch**: `main`.
    *   **Build Settings**: Use Configuration File (or pick "Dockerfile").
    *   **Port**: `5000`.
    *   **Environment Variables**: Add all your `.env` variables:
        *   `DATABASE_URL`: `postgresql://user:pass@rds-endpoint:5432/schooldb?ssl=true`
        *   `JWT_SECRET`: (Your secret)
        *   `PORT`: `5000`

### 3. Frontend Deployment (GitHub → AWS Amplify)
1.  **Create Amplify App**:
    *   Connect your GitHub repository.
    *   **Mono-repo Support**: Point it to the `frontend` folder.
2.  **Environment Variables**:
    *   `VITE_API_URL`: (The URL provided by App Runner, e.g., `https://xxxxxx.us-east-1.awsapprunner.com/api`)
3.  **Build Settings**:
    ```yaml
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm install
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
    ```

---

## 🔒 Security Best Practices
1.  **SSL/TLS**: Both Amplify and App Runner provide automatic SSL certificates.
2.  **RDS Isolation**: Once the app is running, change RDS "Public Access" to "No" and only allow the App Runner Security Group to connect.
3.  **Secrets**: For added security, use **AWS Secrets Manager**, but `.env` variables in App Runner are secure for now.

## 🚀 Final Verification
1.  Check Super Admin Login: `/super-admin-login`.
2.  Check data persistence (verify records migrated from Supabase).
3.  Verify Image Uploads (ensure S3 is configured if used).
