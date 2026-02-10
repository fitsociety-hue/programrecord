# Setup Guide: Connecting to Google Sheets & GitHub

Follow these steps to connect your project to the provided Google Spreadsheet and GitHub repository.

## 1. Google Sheets Connection (Backend)

We cannot deploy the code automatically for security reasons. You must do this one-time setup:

1. Open your **[Google Spreadsheet](https://docs.google.com/spreadsheets/d/1-PUH4PgC3WvmMDBcMofp9PUV31mdosqHY-zGqQgKDa4/edit)**.
2. Go to **Extensions (확장 프로그램) > Apps Script**.
3. Delete any existing code in the editor.
4. Copy the entire content of **[`Code.gs`](./Code.gs)** from this project.
5. Paste it into the Apps Script editor.
6. Click **Save** (💾).
7. Click **Deploy (배포) > New deployment (새 배포)**.
    * **Select type**: Web app (웹 앱).
    * **Description**: `v1`.
    * **Execute as**: `Me` (나).
    * **Who has access**: `Anyone` (모든 사용자 - *Crucial for the app to work without login prompts*).
8. Click **Deploy**.
9. **Copy the Web App URL** displayed (starts with `https://script.google.com/...`).

## 2. Frontend Connection

1. Open **[`index.html`](./index.html)** in VS Code.
2. Locate the line (around line 203):

    ```javascript
    const API_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
    ```

3. Replace `'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL'` with the URL you copied in Step 1.
4. Save the file.

## 3. GitHub Hosting

Since I have already initialized the repository and pushed the initial code:

1. After updating `index.html`, open the compilation terminal in VS Code (`Ctrl+``).
2. Run these commands to update the live site:

    ```bash
    git add index.html
    git commit -m "Update API URL"
    git push
    ```

3. Your app will be live at: **<https://fitsociety-hue.github.io/programrecord/>**
    *(Note: You may need to enable GitHub Pages in the repository settings first: Settings > Pages > Source: main branch)*.
