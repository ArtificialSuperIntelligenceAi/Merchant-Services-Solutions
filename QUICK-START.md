# Quick Start Guide - AWS Migration

This is a simplified guide to get you up and running quickly. For detailed explanations, see `AWS-SETUP-GUIDE.md`.

## Prerequisites
- AWS account
- Your app files ready to upload

## Option 1: Manual Setup (Recommended for Learning)

Follow the step-by-step guide in `AWS-SETUP-GUIDE.md`. This will help you understand each component.

## Option 2: CloudFormation (Faster, but less learning)

1. **Prepare your files:**
   - Make sure all your HTML, JS, and CSS files are ready
   - Have your `data/solutions.json` file ready

2. **Deploy CloudFormation stack:**
   ```bash
   aws cloudformation create-stack \
     --stack-name merchant-solutions-app \
     --template-body file://cloudformation-template.yaml \
     --parameters ParameterKey=WebsiteBucketName,ParameterValue=YOUR-UNIQUE-BUCKET-NAME \
                  ParameterKey=DataBucketName,ParameterValue=YOUR-UNIQUE-DATA-BUCKET-NAME
   ```

3. **Wait for stack creation** (check in AWS Console → CloudFormation)

4. **Get your endpoints:**
   - Check CloudFormation Outputs tab for:
     - WebsiteURL
     - APIEndpoint

5. **Upload your files:**
   - Upload website files to the website bucket
   - Upload `data/solutions.json` to the data bucket at `data/solutions.json`

6. **Update your code:**
   - In `admin.js`, set `API_ENDPOINT` to the APIEndpoint from outputs
   - In `app.js`, set `DATA_URL` to your S3 data URL

## Configuration After Setup

### Update admin.js
```javascript
const API_ENDPOINT = "https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/solutions";
```

### Update app.js
```javascript
const DATA_URL = "https://YOUR-DATA-BUCKET.s3.us-east-1.amazonaws.com/data/solutions.json";
```

Or if using the website bucket:
```javascript
const DATA_URL = "https://YOUR-WEBSITE-BUCKET.s3-website.us-east-1.amazonaws.com/data/solutions.json";
```

## Testing

1. Visit your website URL
2. Test the main app loads correctly
3. Go to admin panel (`/admin.html`)
4. Make a test change
5. Click "Save All"
6. Refresh the main app - changes should appear!

## Troubleshooting

**"Failed to save to AWS"**
- Check API endpoint URL is correct
- Check Lambda function has proper IAM permissions
- Check CloudWatch logs for Lambda errors

**"Failed to load data"**
- Check S3 bucket policy allows public read
- Check data file path is correct
- Check CORS settings if using API Gateway

**CORS errors in browser console**
- Ensure API Gateway has CORS enabled
- Check API Gateway deployment is active

## Next Steps

1. Set up CloudFront for HTTPS and better performance
2. Add API authentication (API keys or Cognito)
3. Set up monitoring and alerts
4. Configure custom domain

