# GitHub Actions CI/CD Setup Instructions

## 🔑 Step 1: Create Google Cloud Service Account

Run these commands to create a service account for GitHub Actions:

```bash
# Set your project ID
PROJECT_ID="super-flashcards-475210"

# Create service account
gcloud iam service-accounts create github-actions \
    --display-name="GitHub Actions Deployment" \
    --project=$PROJECT_ID

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/cloudbuild.builds.builder"

# Create and download the key
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account=github-actions@${PROJECT_ID}.iam.gserviceaccount.com
```

This will create a file called `github-actions-key.json` in your current directory.

## 🔐 Step 2: Add Secret to GitHub

1. **Open the key file:**
   - Open `github-actions-key.json` in a text editor
   - Copy the **entire contents** of the file

2. **Go to GitHub Settings:**
   - Navigate to: https://github.com/coreyprator/Super-Flashcards/settings/secrets/actions
   - Click **"New repository secret"**

3. **Add the secret:**
   - **Name:** `GCP_SA_KEY`
   - **Value:** Paste the entire JSON contents from `github-actions-key.json`
   - Click **"Add secret"**

4. **Delete the local key file (security):**
   ```bash
   rm github-actions-key.json
   ```

## ✅ Step 3: Test the Workflow

Once the secret is added:

1. Commit and push the `.github/workflows/deploy.yml` file:
   ```bash
   git add .github/
   git commit -m "Add GitHub Actions CI/CD workflow"
   git push origin main
   ```

2. Watch the deployment:
   - Go to: https://github.com/coreyprator/Super-Flashcards/actions
   - You'll see the workflow running
   - Click on it to see live logs

## 🎉 How It Works Now

From now on:
1. You make changes locally
2. Commit: `git commit -m "Your message"`
3. Push: `git push origin main`
4. **GitHub Actions automatically deploys to Cloud Run!**
5. Check deployment status at: https://github.com/coreyprator/Super-Flashcards/actions

## 🔧 Manual Deployment Trigger

You can also trigger deployment manually:
1. Go to: https://github.com/coreyprator/Super-Flashcards/actions
2. Click "Deploy to Google Cloud Run" workflow
3. Click "Run workflow" button
4. Select branch and click "Run workflow"

## 🚨 Troubleshooting

**If deployment fails:**
1. Check the Actions logs: https://github.com/coreyprator/Super-Flashcards/actions
2. Verify the `GCP_SA_KEY` secret is set correctly
3. Ensure service account has all necessary permissions

**To update the service account key:**
1. Create a new key using the commands above
2. Update the `GCP_SA_KEY` secret in GitHub
3. Delete the old key in Google Cloud Console

## 📝 Notes

- The workflow runs on every push to `main` branch
- Deployment takes ~2-3 minutes
- Service account key should be kept secret (never commit it!)
- You can add deployment to staging environment later
