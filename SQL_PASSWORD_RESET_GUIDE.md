# Cloud SQL Password Reset Guide

## The Problem
Login failed for user 'flashcards_user' - password has changed or been reset.

## Solution: Reset Password via Google Cloud Console

### Step 1: Open Cloud SQL in Browser

Go to: **https://console.cloud.google.com/sql/instances**

Or navigate:
1. Go to https://console.cloud.google.com
2. Click the hamburger menu (☰) top left
3. Find **SQL** under "Databases" section
4. Click on your instance: **super-flashcards-db**

### Step 2: View Users

1. In the Cloud SQL instance page, click the **"USERS"** tab (top navigation)
2. You should see a list of database users
3. Look for: **flashcards_user**

### Step 3: Reset the Password

**Option A: Change Password (Recommended)**
1. Find `flashcards_user` in the users list
2. Click the **3-dot menu** (⋮) on the right side of the row
3. Select **"Change password"**
4. Enter a new password (or use the suggested strong password)
5. **IMPORTANT**: Copy the password immediately!
6. Click **"OK"** or **"Change password"**

**Option B: Delete and Recreate User**
1. Click the **3-dot menu** (⋮) next to `flashcards_user`
2. Select **"Delete"**
3. Confirm deletion
4. Click **"ADD USER ACCOUNT"** button at the top
5. Username: `flashcards_user`
6. Password: Create a strong password
7. **IMPORTANT**: Copy the password!
8. Click **"ADD"**

### Step 4: Update Local Files

Once you have the new password, update these files:

**File 1: `MIGRATION_GUIDE_v2.6.29.md`**
```
Password: [YOUR_NEW_PASSWORD]
```

**File 2: `TESTING_v2.6.29.md`**
```
User: flashcards_user
Password: [YOUR_NEW_PASSWORD]
```

**File 3: Backend deployment secrets** (if password is stored in Cloud Run)
Go to: https://console.cloud.google.com/run/detail/us-central1/super-flashcards-app/yaml
Check if there are any database password environment variables.

### Step 5: Test the New Password

Run in PowerShell:
```powershell
sqlcmd -S 35.224.242.223,1433 -U flashcards_user -P "YOUR_NEW_PASSWORD" -d LanguageLearning -Q "SELECT 'Connected successfully!' AS Status"
```

If successful, you should see:
```
Status
----------------------------
Connected successfully!
```

### Step 6: Run the Migration

Once login works, run the migration:
```powershell
sqlcmd -S 35.224.242.223,1433 -U flashcards_user -P "YOUR_NEW_PASSWORD" -d LanguageLearning -i backend/migrations/create_api_debug_logs_table.sql
```

## Alternative: Check if Backend App Can Connect

The backend application might be using a different credential. To check:

1. Go to: https://console.cloud.google.com/run/detail/us-central1/super-flashcards-app/yaml
2. Look for environment variables like:
   - `DATABASE_URL`
   - `DB_PASSWORD`
   - `SQL_PASSWORD`
3. Or check the Cloud SQL connection string

The app might use:
- Built-in authentication (service account)
- Cloud SQL Proxy
- A different username (like `sqlserver` or `postgres`)

## If Nothing Works: Create New Admin User

1. Go to Cloud SQL → Users
2. Click **"ADD USER ACCOUNT"**
3. Username: `admin_user` or your name
4. Create a strong password
5. **Grant SQL Server authentication** (not Windows)
6. Use this new account for the migration

## Need Help?

If you're still stuck:
1. Take a screenshot of the Cloud SQL Users page
2. Check Cloud SQL logs: https://console.cloud.google.com/sql/instances/super-flashcards-db/logs
3. Verify the instance is running and accepting connections
4. Check firewall rules allow your IP

---

**Quick Links:**
- Cloud SQL Instances: https://console.cloud.google.com/sql/instances
- Cloud SQL Users: https://console.cloud.google.com/sql/instances/super-flashcards-db/users
- Cloud Run Config: https://console.cloud.google.com/run/detail/us-central1/super-flashcards-app/yaml
