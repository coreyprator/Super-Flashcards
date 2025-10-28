# Update Cloud Run Database Password

## The Problem
The backend app is using the OLD password. You updated the SQL Server password, but Cloud Run doesn't know about it yet.

## Solution: Update Password in Cloud Run Console

### Step 1: Open Cloud Run Service

Go to: **https://console.cloud.google.com/run/detail/us-central1/super-flashcards-app**

Or navigate:
1. Go to https://console.cloud.google.com
2. Search for "Cloud Run" in the top search bar
3. Click on **super-flashcards-app**

### Step 2: Edit the Service

1. Click the **"EDIT & DEPLOY NEW REVISION"** button at the top
2. This opens the deployment configuration screen

### Step 3: Find the Database Password

Look for one of these locations:

**Option A: Environment Variables (Container tab)**
1. Scroll down to **"Container(s), Volumes, Networking, Security"** section
2. Click to expand it
3. Look in the **"Environment variables"** section
4. Find variables like:
   - `DB_PASSWORD`
   - `SQL_PASSWORD`
   - `DATABASE_PASSWORD`
   - Or check the `DATABASE_URL` (might contain password)

**Option B: Secrets (Container tab)**
1. In the same container configuration section
2. Look for **"Secrets"** subsection
3. There might be a secret named:
   - `db-password`
   - `sql-password`
   - `flashcards-db-password`

### Step 4: Update the Password

**If it's an Environment Variable:**
1. Find the password field
2. Click to edit it
3. Change the value to: `,4V~U\EGTla]X{ed`
4. Scroll to bottom and click **"DEPLOY"**

**If it's a Secret:**
1. Note the secret name (e.g., `db-password`)
2. Cancel out of Cloud Run for now
3. Go to: https://console.cloud.google.com/security/secret-manager
4. Find the secret (e.g., `db-password`)
5. Click on it
6. Click **"NEW VERSION"** button
7. Paste the new password: `,4V~U\EGTla]X{ed`
8. Click **"ADD NEW VERSION"**
9. The Cloud Run service should automatically pick up the new version

### Step 5: Wait for Deployment

- If you clicked "DEPLOY" in Cloud Run, wait 2-3 minutes for the new revision
- If you updated a secret, it might take a minute to propagate
- Check the Cloud Run revisions to see when it's ready

### Step 6: Test the Application

Go to: https://learn.rentyourcio.com

Try to:
1. Browse existing flashcards (should work if database connection works)
2. Generate a new flashcard
3. Check if you still get the authentication error

## Alternative: Check Environment Variables via YAML

1. Go to: https://console.cloud.google.com/run/detail/us-central1/super-flashcards-app/yaml
2. Click the **"YAML"** tab
3. Look for environment variables in the YAML:
   ```yaml
   env:
     - name: DB_PASSWORD
       value: "old_password_here"
   ```
4. Or secrets:
   ```yaml
   env:
     - name: DB_PASSWORD
       valueFrom:
         secretKeyRef:
           name: db-password
           key: latest
   ```

## What to Look For

The database connection string is likely configured as either:

**Option 1: Individual variables**
```
DB_HOST=35.224.242.223
DB_PORT=1433
DB_USER=flashcards_user
DB_PASSWORD=ezihRMX6VAaGd97hAuwW  ← UPDATE THIS
DB_NAME=LanguageLearning
```

**Option 2: Connection string**
```
DATABASE_URL=mssql+pyodbc://flashcards_user:ezihRMX6VAaGd97hAuwW@35.224.242.223:1433/LanguageLearning?driver=ODBC+Driver+17+for+SQL+Server
                                          ↑ UPDATE THIS PASSWORD ↑
```

## If You Can't Find the Password

The password might be hardcoded in the application code. Check:

**File**: `backend/app/database.py`

Look for the database connection configuration. If it's hardcoded, we'll need to update the code and redeploy.

---

**Quick Links:**
- Cloud Run Service: https://console.cloud.google.com/run/detail/us-central1/super-flashcards-app
- Secret Manager: https://console.cloud.google.com/security/secret-manager
- Cloud Run YAML: https://console.cloud.google.com/run/detail/us-central1/super-flashcards-app/yaml

**New Password:** `,4V~U\EGTla]X{ed`
