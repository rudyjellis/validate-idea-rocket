# Netlify Serverless Functions - Deployment Guide

## 🎉 Security Upgrade Complete!

Your API key is now **secure** and will never be exposed in the browser.

## What Changed?

### Before (Insecure ❌):
```
Browser → Anthropic API (with exposed key)
```
- API key visible in browser DevTools
- Anyone could steal your key
- Security risk in production

### After (Secure ✅):
```
Browser → Netlify Function → Anthropic API
         (API key hidden)
```
- API key stored server-side only
- Never exposed to users
- Production-ready and secure

## Files Created

### 1. Netlify Configuration
- `netlify.toml` - Netlify build and function settings

### 2. Serverless Functions
- `netlify/functions/upload-video.js` - Handles video upload to Anthropic
- `netlify/functions/generate-mvp.js` - Generates MVP document with Claude

### 3. Updated Frontend
- `src/services/anthropic.ts` - Now calls Netlify functions instead of Anthropic directly

## Deployment Steps

### Step 1: Push to GitHub

```bash
git add .
git commit -m "feat: implement secure Netlify serverless functions for Anthropic API"
git push origin main
```

### Step 2: Configure Netlify Environment Variable

1. Go to your Netlify dashboard: https://app.netlify.com/
2. Select your site
3. Go to **Site Settings** → **Environment Variables**
4. Click **Add a variable**
5. Add:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: `your_anthropic_api_key_here` (get from https://console.anthropic.com/)
   - **Scopes**: All (Production, Deploy Previews, Branch Deploys)
6. Click **Create variable**

### Step 3: Redeploy

After adding the environment variable:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete

### Step 4: Test

1. Visit your deployed site
2. Record a video
3. Click the orange Upload button
4. Verify it uploads and generates MVP document

## Local Development

### Option 1: Netlify CLI (Recommended)

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site
netlify link

# Run dev server with functions
netlify dev
```

This will:
- Run your app on http://localhost:8888
- Run Netlify functions locally
- Load environment variables from Netlify

### Option 2: Manual Setup

1. Create `.env` file (already done):
   ```
   ANTHROPIC_API_KEY=your_key_here
   ```

2. Run regular dev server:
   ```bash
   npm run dev
   ```

Note: Functions won't work locally without Netlify CLI, but you can still develop the UI.

## Verification

### Check API Key is NOT Exposed

1. Open browser DevTools (F12)
2. Go to Console
3. Type: `import.meta.env.VITE_ANTHROPIC_API_KEY`
4. Should return: `undefined` ✅

The key is now only on the server!

### Check Functions Work

1. Record a video
2. Click Upload button
3. Check Network tab in DevTools
4. Should see requests to:
   - `/.netlify/functions/upload-video`
   - `/.netlify/functions/generate-mvp`

## Troubleshooting

### Functions Not Found (404)

- Make sure you've pushed to GitHub
- Verify `netlify.toml` is in the root
- Check Netlify build logs for errors
- Redeploy the site

### API Key Error

- Verify environment variable is set in Netlify dashboard
- Check the variable name is exactly: `ANTHROPIC_API_KEY`
- Make sure you redeployed after adding the variable

### Upload Fails

- Check Netlify function logs in dashboard
- Verify API key is valid at https://console.anthropic.com/
- Check file size (must be < 30MB)

## Cost & Limits

### Netlify Functions (Free Tier)
- 125,000 function requests/month
- 100 hours runtime/month
- More than enough for testing and small-scale use

### Anthropic API
- Charges based on tokens used
- Check your usage at https://console.anthropic.com/

## Security Benefits

✅ **API Key Protected** - Never exposed to browser
✅ **Server-Side Only** - Runs in secure Netlify environment  
✅ **Rate Limiting** - Can add rate limiting to functions
✅ **User Tracking** - Can track usage per user
✅ **Production Ready** - Safe to deploy publicly

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Add environment variable in Netlify
3. ✅ Redeploy site
4. ✅ Test upload functionality
5. ✅ Monitor function logs in Netlify dashboard

## Files to Commit

```
netlify.toml
netlify/functions/upload-video.js
netlify/functions/generate-mvp.js
src/services/anthropic.ts (updated)
.env.example (updated)
package.json (updated with dependencies)
```

## Files to NOT Commit (Already Gitignored)

```
.env
.env.local
```

Your API key is now secure! 🔒
