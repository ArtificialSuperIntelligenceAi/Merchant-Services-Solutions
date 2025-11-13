# AWS Migration Guide for Merchant Services Solutions App

This guide will walk you through migrating your app from GitHub Pages to AWS S3 with real-time admin updates.

## Overview

The solution uses:
- **S3**: Static website hosting + data storage
- **Lambda**: Backend API to handle admin updates
- **API Gateway**: REST API endpoint for the Lambda function
- **IAM**: Security roles and permissions

## Prerequisites

- AWS account with appropriate permissions
- AWS CLI installed (optional, but helpful)
- Basic understanding of AWS Console

## Step 1: Create S3 Bucket for Website Hosting

1. Go to AWS Console → S3
2. Click "Create bucket"
3. Bucket name: `merchant-solutions-app` (or your preferred name, must be globally unique)
4. **Uncheck** "Block all public access" (we need public read access)
5. Enable "Bucket Versioning" (optional, for backup)
6. Click "Create bucket"

### Configure Bucket for Static Website Hosting

1. Click on your bucket
2. Go to "Properties" tab
3. Scroll to "Static website hosting"
4. Click "Edit"
5. Enable static website hosting
6. Index document: `index.html`
7. Error document: `index.html` (for SPA routing)
8. Click "Save changes"
9. **Note the "Bucket website endpoint" URL** - you'll need this later

### Set Bucket Policy for Public Read Access

1. Go to "Permissions" tab
2. Click "Bucket policy"
3. Add this policy (replace `YOUR-BUCKET-NAME`):

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

## Step 2: Create S3 Bucket for Data Storage

1. Create another S3 bucket: `merchant-solutions-data` (or similar)
2. **Keep this bucket private** (don't uncheck "Block all public access")
3. We'll use this to store `solutions.json` securely

## Step 3: Create Lambda Function

1. Go to AWS Console → Lambda
2. Click "Create function"
3. Choose "Author from scratch"
4. Function name: `merchant-solutions-api`
5. Runtime: `Node.js 20.x` (or latest)
6. Architecture: `x86_64`
7. Click "Create function"

### Add Lambda Code

1. In the function, scroll to "Code source"
2. Replace the default code with the contents of `lambda-function.js` (provided in this repo)
3. Click "Deploy"

### Configure Environment Variables

1. Go to "Configuration" → "Environment variables"
2. Add:
   - `DATA_BUCKET`: `merchant-solutions-data` (your data bucket name)
   - `DATA_KEY`: `data/solutions.json` (the path in S3)

### Create IAM Role for Lambda

1. Go to "Configuration" → "Permissions"
2. Click on the execution role name
3. In IAM, click "Add permissions" → "Create inline policy"
4. Use JSON editor and paste:

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
      "Resource": "arn:aws:s3:::merchant-solutions-data/data/*"
    }
  ]
}
```

5. Name it `LambdaS3Access` and create

## Step 4: Create API Gateway

1. Go to AWS Console → API Gateway
2. Click "Create API"
3. Choose "REST API" → "Build"
4. Protocol: REST
5. Create new API: New API
6. API name: `merchant-solutions-api`
7. Endpoint type: Regional
8. Click "Create API"

### Create Resource and Method

1. Click "Actions" → "Create Resource"
2. Resource name: `solutions`
3. Resource path: `solutions`
4. Enable CORS: Yes
5. Click "Create Resource"

6. With `/solutions` selected, click "Actions" → "Create Method"
7. Choose `PUT`
8. Integration type: Lambda Function
9. Use Lambda Proxy integration: Yes
10. Lambda function: `merchant-solutions-api`
11. Click "Save" → "OK" (when prompted to give API Gateway permission)

### Enable CORS

1. Select the `/solutions` resource
2. Click "Actions" → "Enable CORS"
3. Leave defaults, click "Enable CORS and replace existing CORS headers"

### Deploy API

1. Click "Actions" → "Deploy API"
2. Deployment stage: `prod` (or create new)
3. Description: "Production deployment"
4. Click "Deploy"
5. **Note the "Invoke URL"** - you'll need this for the admin panel

## Step 5: Upload Your Files to S3

### Upload Website Files

1. Go to your website bucket (`merchant-solutions-app`)
2. Click "Upload"
3. Upload all files:
   - `index.html`
   - `admin.html`
   - `app.js`
   - `admin.js`
   - Create `data/` folder and upload `solutions.json` there (initial version)

### Upload Initial Data File

1. Go to your data bucket (`merchant-solutions-data`)
2. Create folder `data/`
3. Upload `solutions.json` to `data/solutions.json`

## Step 6: Update Your Code

### Update `admin.js`

1. Open `admin.js`
2. Find the `saveAllBtn` event listener
3. Replace the download logic with API call (see updated `admin.js` in repo)
4. Add the API endpoint URL at the top of the file:

```javascript
const API_ENDPOINT = 'https://YOUR-API-GATEWAY-ID.execute-api.REGION.amazonaws.com/prod/solutions';
```

### Update `app.js`

1. Open `app.js`
2. Update the data URL to point to your S3 bucket:

```javascript
const DATA_URL = 'https://merchant-solutions-data.s3.REGION.amazonaws.com/data/solutions.json';
```

Or use the public website endpoint if you put data in the website bucket.

## Step 7: Test Everything

1. Visit your website: `http://merchant-solutions-app.s3-website-REGION.amazonaws.com`
2. Test the main app loads data correctly
3. Go to admin panel
4. Make a test change
5. Click "Save All"
6. Verify the main app shows the update (may need to refresh)

## Step 8: Set Up Custom Domain (Optional)

1. Go to Route 53 (or your DNS provider)
2. Create a CNAME record pointing to your S3 website endpoint
3. Or use CloudFront for HTTPS and custom domain

## Troubleshooting

### Lambda Errors
- Check CloudWatch Logs in Lambda console
- Verify IAM permissions are correct
- Check environment variables

### CORS Issues
- Ensure API Gateway has CORS enabled
- Check browser console for CORS errors

### S3 Access Denied
- Verify bucket policies are set correctly
- Check IAM permissions for Lambda

## Security Considerations

1. **API Gateway Authentication**: Consider adding API keys or Cognito authentication
2. **Rate Limiting**: Set up throttling in API Gateway
3. **HTTPS**: Use CloudFront for SSL/TLS
4. **Admin Password**: Keep the password in `admin.js` secure (consider environment-based config)

## Cost Estimate

- S3 Storage: ~$0.023 per GB/month (very cheap for static sites)
- Lambda: First 1M requests free, then $0.20 per 1M requests
- API Gateway: First 1M requests free, then $3.50 per 1M requests
- Data Transfer: First 1GB free, then varies by region

For a small app like this, expect **<$1/month** in most cases.

## Next Steps

1. Set up CloudFront for better performance and HTTPS
2. Add monitoring with CloudWatch
3. Set up automated backups of your data file
4. Consider adding authentication to the admin API

