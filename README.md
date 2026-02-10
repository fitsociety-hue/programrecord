# Business Performance Input App - Deployment Guide

This project provides a mobile-optimized web application for recording business performance data using Google Sheets as a database.

## 1. Google Sheets Setup (Database)

1. Create a new **Google Sheet**.
2. Create 4 sheets (tabs) with the exact following names and header rows (Row 1):

    * **`Staff_DB`**: `ID`, `Name`, `Team`, `Position`, `JoinDate`, `Status`, `Password`
    * **`Program_DB`**: `ID`, `Category`, `Name`, `Target`, `Type`, `Manager`
    * **`User_DB`**: `ID`, `Name`, `Birth`, `Gender`, `Phone`, `DisabilityType`, `DisabilityDegree`
    * **`Performance_DB`**: `Timestamp`, `Date`, `Manager`, `Program`, `User`, `Status`, `Note`, `Qty`

3. Add some dummy data to `Staff_DB` for testing:
    * ID: `S1`, Name: `홍길동`, Team: `건강문화팀`, Position: `팀장`, JoinDate: `2024-01-01`, Status: `재직`, Password: `1234`

## 2. Google Apps Script Setup (Backend)

1. In your Google Sheet, go to **Extensions > Apps Script**.
2. Delete any existing code in `Code.gs`.
3. Copy and paste the content of [Code.gs](./Code.gs) into the script editor.
4. Click **Save** (Floppy disk icon).
5. **Deploy as Web App**:
    * Click **Deploy > New deployment**.
    * Select **Type**: `Web app`.
    * **Description**: `v1`.
    * **Execute as**: `Me` (your email).
    * **Who has access**: `Anyone`. (Important for the frontend to access it without login prompts).
    * Click **Deploy**.
    * **Copy the Web App URL** (e.g., `https://script.google.com/macros/s/.../exec`).

## 3. Frontend Configuration

1. Open [index.html](./index.html) in a text editor.
2. Find the line `const API_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';`.
3. Replace the placeholder with your **copied Web App URL**.
4. Save the file.

## 4. GitHub Pages Hosting

1. Push this project to a GitHub repository.
2. Go to **Settings > Pages**.
3. Select the **Source** (e.g., `main` branch, `/` root folder).
4. Click **Save**.
5. Your app will be live at `https://<username>.github.io/<repo-name>/`.

## Features

* **Mobile-First Design**: Optimized for smartphone usage.
* **Offline-Ready UI**: Single HTML file with CDN dependencies.
* **Real-time Sync**: Data is saved directly to Google Sheets.
