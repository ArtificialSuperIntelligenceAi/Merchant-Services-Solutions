# AWS Setup Checklist

Use this checklist as you go through the setup process. Check off each item as you complete it.

## Pre-Setup
- [ ] AWS account created and logged in
- [ ] All app files ready on computer (`index.html`, `admin.html`, `app.js`, `admin.js`)
- [ ] `solutions.json` file ready
- [ ] `lambda-function.js` file ready (from this repo)

## Part 1: Website S3 Bucket
- [ ] Navigated to S3 service
- [ ] Created bucket with unique name (e.g., `merchant-solutions-app-steve`)
- [ ] Unchecked all 4 "Block public access" boxes
- [ ] Enabled static website hosting
- [ ] Set index document to `index.html`
- [ ] Set error document to `index.html`
- [ ] **Copied website endpoint URL** (save this!)
- [ ] Created bucket policy for public read access
- [ ] Verified bucket policy saved

## Part 2: Data S3 Bucket
- [ ] Created second bucket for data (e.g., `merchant-solutions-data-steve`)
- [ ] Kept all "Block public access" boxes checked (private bucket)
- [ ] Created `data` folder in bucket
- [ ] Uploaded `solutions.json` to `data/solutions.json`
- [ ] Verified file is in correct location

## Part 3: Lambda Function
- [ ] Navigated to Lambda service
- [ ] Created function named `merchant-solutions-api`
- [ ] Selected Node.js 20.x runtime
- [ ] Deleted default code
- [ ] Pasted code from `lambda-function.js`
- [ ] Clicked "Deploy"
- [ ] Added environment variable: `DATA_BUCKET` = your data bucket name
- [ ] Added environment variable: `DATA_KEY` = `data/solutions.json`
- [ ] Clicked on execution role name
- [ ] Created inline policy with S3 permissions
- [ ] Saved policy

## Part 4: API Gateway
- [ ] Navigated to API Gateway service
- [ ] Created REST API named `merchant-solutions-api`
- [ ] Created resource `/solutions`
- [ ] Enabled CORS on resource
- [ ] Created PUT method on `/solutions`
- [ ] Connected to Lambda function `merchant-solutions-api`
- [ ] Enabled CORS again (via Actions menu)
- [ ] Deployed API to `prod` stage
- [ ] **Copied API endpoint URL** (save this!)
- [ ] Full endpoint: `https://...execute-api...amazonaws.com/prod/solutions`

## Part 5: Upload Files
- [ ] Uploaded `index.html` to website bucket
- [ ] Uploaded `admin.html` to website bucket
- [ ] Uploaded `app.js` to website bucket
- [ ] Uploaded `admin.js` to website bucket
- [ ] Verified all files are in bucket root (not in folders)

## Part 6: Update Code
- [ ] Opened `admin.js` on computer
- [ ] Updated `API_ENDPOINT` with actual API Gateway URL
- [ ] Saved `admin.js`
- [ ] Opened `app.js` on computer
- [ ] Updated `DATA_URL` with actual S3 data bucket URL
- [ ] Saved `app.js`
- [ ] Re-uploaded updated `admin.js` to S3
- [ ] Re-uploaded updated `app.js` to S3

## Part 7: Testing
- [ ] Opened website URL in browser
- [ ] Verified main app loads correctly
- [ ] Verified data displays (solutions show up)
- [ ] Navigated to `/admin.html`
- [ ] Entered admin password
- [ ] Made a test change (e.g., edited a solution name)
- [ ] Clicked "Save All"
- [ ] Saw success message "✅ Saved successfully!"
- [ ] Refreshed main app
- [ ] Verified changes appear immediately

## URLs to Save

Write down these URLs here:

**Website URL:**
```
http://________________________.s3-website-________.amazonaws.com
```

**API Endpoint:**
```
https://________________________.execute-api.________.amazonaws.com/prod/solutions
```

**Data URL:**
```
https://________________________.s3.________.amazonaws.com/data/solutions.json
```

## Bucket Names

**Website Bucket:**
```
________________________
```

**Data Bucket:**
```
________________________
```

## AWS Region

**Region Used:**
```
________________________
```

---

## If Something Doesn't Work

1. **Website won't load:**
   - [ ] Check bucket policy allows public read
   - [ ] Verify "Block public access" is unchecked
   - [ ] Check static website hosting is enabled

2. **Admin save fails:**
   - [ ] Verify API endpoint URL in `admin.js` is correct
   - [ ] Check Lambda function has IAM permissions
   - [ ] Look at CloudWatch logs for errors

3. **Data won't load:**
   - [ ] Verify DATA_URL in `app.js` is correct
   - [ ] Check `solutions.json` is in data bucket at `data/solutions.json`
   - [ ] Verify bucket name and region

4. **CORS errors:**
   - [ ] Make sure CORS is enabled in API Gateway
   - [ ] Verify API is deployed
   - [ ] Check browser console for specific error

---

## Success! 🎉

Once everything is checked off and working:
- [ ] Bookmark your website URL
- [ ] Save this checklist for reference
- [ ] Consider setting up CloudFront for HTTPS (optional)
- [ ] Consider adding API authentication (optional)

