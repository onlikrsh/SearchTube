# 🔍 SearchTube

A distraction-free YouTube search experience. No recommendations, no sidebar — just search and watch.

## ✨ Features

- Search videos, playlists, and channels
- Filter by type, sort by relevance/date/views/rating
- In-app video player with no distractions
- Responsive dark/light theme
- **Zero Login Required:** Publicly accessible search via YouTube Data API.

## 🛠 Tech Stack

Vanilla HTML, CSS, JavaScript.

- No front-end frameworks
- 1 Vercel Serverless Function (`api/env.js`) for secure API Key injection

## 💻 Local Development

1. Get a [YouTube Data API v3 key](https://console.cloud.google.com/).
2. Create `config.js` in the project root:

   ```js
   const config = { api_key: "YOUR_YOUTUBE_DATA_API_V3_KEY" };
   ```

3. Open `index.html` in your browser.
