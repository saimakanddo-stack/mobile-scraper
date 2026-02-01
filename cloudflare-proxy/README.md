# ☁️ Cloudflare Worker Proxy Setup

This folder contains the code for a **Cloudflare Worker** that acts as a CORS proxy for your Mobile Scraper. This allows you to use the app on your phone without needing your PC.

## 🚀 Deployment Instructions

1. **Log in to Cloudflare**:
   Go to [dash.cloudflare.com](https://dash.cloudflare.com/) and log in (or sign up for free).

2. **Create a Worker**:
   - Go to **Compute (Workers & Pages)** > **Create** > **Worker**.
   - Input a name like `mobile-scraper-proxy`.
   - Click **Deploy**.

3. **Paste the Code**:
   - Click **Edit Code** in the Worker dashboard.
   - Delete any existing code in the editor.
   - Open [worker.js](file:///C:/Users/DM%20Expert%20Saim/Web%20Scraper%20Fixed/Mobile%20Tools/cloudflare-proxy/worker.js) from this folder, copy all the code, and paste it into the Cloudflare editor.
   - Click **Save and Deploy**.

4. **Get your Worker URL**:
   After deployment, you will get a URL like:
   `https://mobile-scraper-proxy.[your-subdomain].workers.dev/`

## ⚙️ App Configuration

Once your Worker is live:

1. Open the Mobile Scraper app on your phone.
2. Go to the **Settings** tab.
3. In the **Proxy URL** field, enter your Worker URL with the parameter:
   `https://your-worker-name.workers.dev/?url=`
4. Click **Save Settings**.

## 💡 Benefits

- **Zero Cost**: Cloudflare's free tier allows up to 100,000 requests per day.
- **Portability**: Works anywhere (Mobile Data, Wi-Fi, etc.) without your PC.
- **Fast**: Runs on Cloudflare's edge network for low latency.
