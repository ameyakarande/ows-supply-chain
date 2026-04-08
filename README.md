# Marine Vender Quotation App

This is a production-ready Web App for marine/procurement use. It replicates the UI and workflow of traditional ERP quotation entry pages, emphasizing strict data tables, grey/white structure, and operational efficiency.

## 🚀 Setup & Execution

### Prerequisites
You need **Node.js** and **npm** installed on your system. If you do not have them installed, download them from [nodejs.org](https://nodejs.org/).

### 1. Install Dependencies
Run this command from within the project folder:
```bash
npm install
```

### 2. Run Locally (Development server)
```bash
npm run dev
```
Open the provided `http://localhost:3000` link in your browser to preview the app. 

* The app utilizes Vite for lightning-fast module replacement and uses standard React functionality.

### 2a. Outlook Email Integration
To enable the in-app Vendor Mail page with live Outlook sending, add these values to `.env.local`:
```bash
VITE_OUTLOOK_CLIENT_ID=your-azure-app-client-id
VITE_OUTLOOK_TENANT_ID=common
VITE_OUTLOOK_REDIRECT_PATH=/outlook-auth-callback.html
```

Your Azure App Registration should include:
- A `Single-page application` redirect URI pointing to `http://localhost:3000/outlook-auth-callback.html`
- Microsoft Graph delegated permissions for `User.Read`, `Mail.ReadWrite`, and `Mail.Send`
- User consent for the selected tenant or the `common` tenant flow

### 3. Modifying Mock Data
To test different scenarios or add your own items, simply edit `src/data/mockData.ts`. It contains all reference data arrays (suppliers, vessels, taxes) and an `initialQuotations` object.

### 4. Deploying to Vercel
Vercel has zero-configuration support for Vite projects. 
1. Initialize a git repository with `git init`, `git add .`, `git commit -m "Init"`.
2. Push your code to a GitHub, GitLab, or BitBucket repository.
3. Import the project in Vercel. Standard build command `npm run build` and output directory `dist` will be auto-detected. Deploy.

### 5. Connecting a Real Database
To make the application save data persistently:
1. Create an API (e.g. Node.js + Express, or Next.js route handlers) communicating with a database like PostgreSQL or MongoDB.
2. In `src/App.tsx`, inside `handleSaveQuotation`, replace the local `setQuotations(prev => ...)` array update with a standard `fetch` or `axios.post` call to your backend.
3. Replace the `useEffect` initial load in `QuotationEntry.tsx` with a `fetch` request calling your API's GET endpoint.

## ✨ Features Highlight
- **Responsive & Compact UI:** Emulates traditional ERP forms per your specific requirements.
- **Auto-calculating Math:** Instantly calculates line totals, total discounts (flat or percent), taxable subtotals, extra delivery charges, and gross/overall totals.
- **Deep Typescript Integration:** Enforces data integrity around Quote state logic.
- **Print Version Ready:** Specific `@media print` directives format it accurately and clean for PDF generation/printing.
