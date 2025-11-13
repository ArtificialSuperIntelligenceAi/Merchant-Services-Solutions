# AWS Step-by-Step Walkthrough - Complete Guide

This guide will walk you through every click, every setting, and every file upload in AWS. Follow along step by step.

## Prerequisites

- AWS account (if you don't have one, go to aws.amazon.com and sign up)
- Your app files ready on your computer
- About 30-45 minutes

---

## PART 1: Create S3 Bucket for Website Hosting

### Step 1.1: Navigate to S3

1. Log into AWS Console: https://console.aws.amazon.com
2. In the top search bar, type "S3" and click on "S3" service
3. You should see the S3 dashboard

### Step 1.2: Create Website Bucket

1. Click the orange **"Create bucket"** button (top right)
2. **Bucket name**: Enter something unique like `merchant-solutions-app-YOURNAME` (replace YOURNAME with your name/initials)
   - Must be globally unique (all lowercase, no spaces)
   - Example: `merchant-solutions-app-steve`
3. **AWS Region**: Choose closest to you (e.g., `us-east-1` for US East)
4. **Object Ownership**: Leave default "ACLs disabled"
5. **Block Public Access settings**: 
   - ⚠️ **UNCHECK all 4 boxes** (we need public access for website)
   - Uncheck: "Block all public access"
   - Uncheck: "Block public access to buckets and objects granted through new access control lists (ACLs)"
   - Uncheck: "Block public access to buckets and objects granted through any access control lists (ACLs)"
   - Uncheck: "Block public access to buckets and objects granted through new public bucket or access point policies"
   - Check the acknowledgment box that appears
6. **Bucket Versioning**: Enable (optional, for backups)
7. **Default encryption**: Leave default
8. Click **"Create bucket"** at bottom

### Step 1.3: Enable Static Website Hosting

1. Click on your newly created bucket name
2. Click the **"Properties"** tab (top of page)
3. Scroll down to **"Static website hosting"** section
4. Click **"Edit"** button
5. **Static website hosting**: Select **"Enable"**
6. **Hosting type**: "Host a static website"
7. **Index document**: Type `index.html`
8. **Error document**: Type `index.html` (for single-page app routing)
9. Click **"Save changes"** at bottom
10. **IMPORTANT**: Note the "Bucket website endpoint" URL - it looks like:
    `http://your-bucket-name.s3-website-us-east-1.amazonaws.com`
    - Copy this URL somewhere safe - you'll need it!

### Step 1.4: Set Bucket Policy (Allow Public Read)

1. Still in your bucket, click the **"Permissions"** tab
2. Scroll to **"Bucket policy"** section
3. Click **"Edit"** button
4. Click **"Policy generator"** link (opens in new tab) OR paste this JSON directly:

**Option A - Use Policy Generator:**
1. In Policy Generator:
   - Type: "S3 Bucket Policy"
   - Effect: "Allow"
   - Principal: `*` (asterisk)
   - Actions: Select "GetObject"
   - Amazon Resource Name (ARN): `arn:aws:s3:::YOUR-BUCKET-NAME/*`
     (Replace YOUR-BUCKET-NAME with your actual bucket name)
2. Click "Add Statement"
3. Click "Generate Policy"
4. Copy the JSON
5. Go back to bucket policy editor
6. Paste the JSON
7. Click "Save changes"

**Option B - Paste Directly:**
Paste this (replace `YOUR-BUCKET-NAME` with your bucket name):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

---

## PART 2: Create S3 Bucket for Data Storage

### Step 2.1: Create Data Bucket

1. Go back to S3 dashboard (click "Buckets" in left sidebar)
2. Click **"Create bucket"** again
3. **Bucket name**: `merchant-solutions-data-YOURNAME` (must be unique)
4. **AWS Region**: Same region as before
5. **Block Public Access**: 
   - ✅ **KEEP ALL 4 BOXES CHECKED** (this bucket stays private)
6. **Bucket Versioning**: Enable (optional)
7. Click **"Create bucket"**

### Step 2.2: Upload Initial Data File

1. Click on your data bucket name
2. Click **"Create folder"** button
3. Folder name: `data` (lowercase)
4. Click "Create folder"
5. Click into the `data` folder
6. Click **"Upload"** button
7. Click **"Add files"** or drag and drop your `solutions.json` file
8. Click **"Upload"** at bottom
9. Wait for upload to complete
10. Verify file is at path: `data/solutions.json`

---

## PART 3: Create Lambda Function

### Step 3.1: Navigate to Lambda

1. In AWS Console search bar, type "Lambda" and click on it
2. You should see Lambda dashboard

### Step 3.2: Create Function

1. Click **"Create function"** button (orange, top right)
2. **Function name**: `merchant-solutions-api`
3. **Runtime**: Select `Node.js 20.x` (or latest available)
4. **Architecture**: `x86_64`
5. Click **"Create function"** at bottom
6. Wait for function to be created (takes ~30 seconds)

### Step 3.3: Add Lambda Code

1. In the function page, scroll to **"Code source"** section
2. You'll see a file editor with `index.mjs` or `index.js`
3. **Delete all the default code**
4. Open the `lambda-function.js` file from this repo on your computer
5. Copy ALL the code from `lambda-function.js`
6. Paste it into the Lambda code editor
7. Click **"Deploy"** button (top right of code editor)

### Step 3.4: Set Environment Variables

1. Click the **"Configuration"** tab (top of page)
2. Click **"Environment variables"** in left sidebar
3. Click **"Edit"** button
4. Click **"Add environment variable"**
5. **Key**: `DATA_BUCKET`
   **Value**: Your data bucket name (e.g., `merchant-solutions-data-steve`)
6. Click **"Add environment variable"** again
7. **Key**: `DATA_KEY`
   **Value**: `data/solutions.json`
8. Click **"Save"** at bottom

### Step 3.5: Set Up IAM Permissions

1. Still in Configuration tab, click **"Permissions"** in left sidebar
2. Under "Execution role", click on the role name (it's a link)
3. This opens IAM in a new tab
4. Click **"Add permissions"** dropdown
5. Select **"Create inline policy"**
6. Click **"JSON"** tab
7. Delete the default JSON
8. Paste this (replace `YOUR-DATA-BUCKET-NAME` with your data bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::YOUR-DATA-BUCKET-NAME/data/*"
    }
  ]
}
```

9. Click **"Next"** button
10. **Policy name**: `LambdaS3Access`
11. Click **"Create policy"**
12. Close the IAM tab and go back to Lambda

---

## PART 4: Create API Gateway

### Step 4.1: Navigate to API Gateway

1. In AWS Console search bar, type "API Gateway" and click on it
2. You should see API Gateway dashboard

### Step 4.2: Create REST API

1. Click **"Create API"** button
2. Under "REST API", click **"Build"** button
3. **Protocol**: REST (should be selected)
4. **Create new API**: Select "New API"
5. **API name**: `merchant-solutions-api`
6. **Endpoint Type**: Regional
7. Click **"Create API"** at bottom

### Step 4.3: Create Resource

1. In the left sidebar, you'll see your API name
2. Click the **"Actions"** dropdown (top left, next to your API name)
3. Select **"Create Resource"**
4. **Resource Name**: `solutions`
5. **Resource Path**: `solutions` (auto-filled)
6. **Enable API Gateway CORS**: ✅ Check this box
7. Click **"Create Resource"** at bottom

### Step 4.4: Create Method (PUT)

1. Make sure `/solutions` is selected in left sidebar (click it if not)
2. Click **"Actions"** dropdown again
3. Select **"Create Method"**
4. A dropdown appears under `/solutions` - select **"PUT"**
5. Click the checkmark ✓ next to it
6. **Integration type**: Lambda Function
7. **Use Lambda Proxy integration**: ✅ Check this box
8. **Lambda Region**: Select your region
9. **Lambda Function**: Start typing `merchant-solutions-api` and select it
10. Click **"Save"** button
11. A popup appears asking to give API Gateway permission - click **"OK"**

### Step 4.5: Enable CORS (Again)

1. With `/solutions` selected, click **"Actions"** dropdown
2. Select **"Enable CORS"**
3. Leave all defaults as-is
4. Click **"Enable CORS and replace existing CORS headers"** at bottom
5. Confirm by clicking **"Yes, replace existing values"**

### Step 4.6: Deploy API

1. Click **"Actions"** dropdown
2. Select **"Deploy API"**
3. **Deployment stage**: Select **"New Stage"** (or use existing "prod" if available)
4. **Stage name**: `prod`
5. **Stage description**: `Production deployment`
6. Click **"Deploy"** button
7. **IMPORTANT**: Note the "Invoke URL" - it looks like:
    `https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod`
    - Copy this FULL URL - you'll need it!
    - Your full endpoint will be: `https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/solutions`

---

## PART 5: Upload Website Files to S3

### Step 5.1: Prepare Files

Make sure you have these files ready:
- `index.html`
- `admin.html`
- `app.js`
- `admin.js`
- Any other assets (images, CSS, etc.)

### Step 5.2: Upload to Website Bucket

1. Go back to S3 (search "S3" in console)
2. Click on your **website bucket** (the first one you created)
3. You should see it's empty (or has a folder)
4. Click **"Upload"** button
5. Click **"Add files"** or drag and drop:
   - `index.html`
   - `admin.html`
   - `app.js`
   - `admin.js`
   - Any other files (but NOT `solutions.json` - that goes in data bucket)
6. Click **"Upload"** at bottom
7. Wait for upload to complete

### Step 5.3: Verify Files

1. You should see all your files listed in the bucket
2. Make sure `index.html` is at the root level (not in a folder)

---

## PART 6: Update Your Code with AWS URLs

### Step 6.1: Get Your URLs

You need:
1. **API Endpoint**: From API Gateway (Step 4.6)
   - Format: `https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/solutions`
2. **Data URL**: Your data bucket URL
   - Format: `https://merchant-solutions-data-steve.s3.us-east-1.amazonaws.com/data/solutions.json`
   - OR if using website bucket: `https://merchant-solutions-app-steve.s3-website-us-east-1.amazonaws.com/data/solutions.json`

### Step 6.2: Update admin.js

1. Open `admin.js` on your computer
2. Find line 7 (the `API_ENDPOINT` line)
3. Replace the placeholder with your actual API endpoint:
   ```javascript
   const API_ENDPOINT = "https://YOUR-ACTUAL-API-ID.execute-api.us-east-1.amazonaws.com/prod/solutions";
   ```
4. Save the file

### Step 6.3: Update app.js

1. Open `app.js` on your computer
2. Find line 162 (the `DATA_URL` line)
3. Replace with your data bucket URL:
   ```javascript
   const DATA_URL = "https://merchant-solutions-data-steve.s3.us-east-1.amazonaws.com/data/solutions.json";
   ```
   (Replace with your actual bucket name and region)

### Step 6.4: Re-upload Updated Files

1. Go back to S3 → your website bucket
2. Click **"Upload"** again
3. Upload the updated `admin.js` and `app.js` files
4. When prompted about overwriting, click **"Upload"** to replace

---

## PART 7: Test Everything

### Step 7.1: Test Website

1. Go to your website bucket in S3
2. Click **"Properties"** tab
3. Scroll to "Static website hosting"
4. Click the **"Bucket website endpoint"** link
5. Your website should open!
6. Test that it loads and shows data

### Step 7.2: Test Admin Panel

1. In your browser, go to: `YOUR-WEBSITE-URL/admin.html`
2. Enter the admin password (from `admin.js`)
3. Make a small test change (e.g., edit a solution name)
4. Click **"Save All"** button
5. You should see "Saving to AWS..." then "✅ Saved successfully!"
6. If you see an error, check the browser console (F12) for details

### Step 7.3: Verify Changes Are Live

1. Go back to main app (refresh the page)
2. Your changes should appear immediately!
3. If not, try hard refresh (Ctrl+F5 or Cmd+Shift+R)

---

## Troubleshooting Common Issues

### Issue: "Access Denied" when viewing website
**Solution**: 
- Check bucket policy is set correctly (Part 1.4)
- Verify "Block public access" is unchecked (Part 1.2)

### Issue: "Failed to save to AWS" in admin panel
**Solution**:
- Check API endpoint URL is correct in `admin.js`
- Verify Lambda function has IAM permissions (Part 3.5)
- Check Lambda function code is deployed (Part 3.3)
- Look at CloudWatch logs: Lambda → Your function → Monitor → View logs

### Issue: "Failed to load data" in main app
**Solution**:
- Check DATA_URL in `app.js` is correct
- Verify `solutions.json` is uploaded to data bucket at `data/solutions.json`
- Check bucket name and region are correct

### Issue: CORS errors in browser console
**Solution**:
- Make sure CORS is enabled in API Gateway (Part 4.5)
- Verify API is deployed (Part 4.6)
- Check Lambda returns CORS headers (should be in the code)

### Issue: Lambda function not found in API Gateway
**Solution**:
- Make sure Lambda function name matches exactly: `merchant-solutions-api`
- Check you're in the same AWS region for both

---

## Quick Reference: Where to Find Things

- **S3 Buckets**: AWS Console → Search "S3"
- **Lambda Functions**: AWS Console → Search "Lambda"
- **API Gateway**: AWS Console → Search "API Gateway"
- **CloudWatch Logs**: Lambda → Your function → Monitor tab → View logs
- **IAM Roles**: AWS Console → Search "IAM" → Roles

---

## Next Steps After Setup

1. **Test thoroughly** - Make sure everything works
2. **Set up CloudFront** (optional) - For HTTPS and better performance
3. **Add API authentication** (optional) - Secure your admin endpoint
4. **Set up monitoring** - CloudWatch alarms for errors
5. **Custom domain** (optional) - Use your own domain name

---

## Cost Check

After setup, check your AWS billing:
1. Go to AWS Console → Search "Billing"
2. Click "Bills" in left sidebar
3. You should see minimal charges (<$1/month for this setup)

---

## Need Help?

If you get stuck:
1. Check the error message carefully
2. Look at CloudWatch logs for Lambda errors
3. Check browser console (F12) for JavaScript errors
4. Verify all URLs and bucket names are correct
5. Make sure you're in the same AWS region for all services

Good luck! 🚀

