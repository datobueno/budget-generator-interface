# Google Integrations Setup

This project includes optional Google integrations for:

- Google Contacts import
- Google Sheets import

Each contributor or deployer should use their own Google Cloud project and their own credentials.

## Security Model

This app runs entirely in the browser. That means:

- `VITE_GOOGLE_CLIENT_ID` is public
- `VITE_GOOGLE_API_KEY` is public
- `VITE_GOOGLE_APP_ID` is public

These are configuration values for browser-side APIs, not server secrets.

Do not use:

- OAuth client secrets
- service-account JSON files
- refresh tokens
- any secret intended only for backend use

## Required Environment Variables

Add these values to `.env.local`:

```dotenv
VITE_GOOGLE_CLIENT_ID=your-web-oauth-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-browser-restricted-api-key
VITE_GOOGLE_APP_ID=your-google-cloud-project-number
```

## APIs to Enable

Enable these APIs in the same Google Cloud project:

- Google People API
- Google Sheets API
- Google Drive API

If your Google Cloud console exposes Google Picker API separately, enable it as well.

## OAuth Consent Screen

Configure an OAuth consent screen in Google Cloud:

1. Choose `External` unless your deployment is limited to a Google Workspace organization.
2. Set the app name and support contact.
3. Add the scopes used by this app:
   - `https://www.googleapis.com/auth/contacts.readonly`
   - `https://www.googleapis.com/auth/contacts.other.readonly`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/spreadsheets.readonly`
4. Add test users if the app remains in testing mode.

## Create the OAuth Client ID

Create an `OAuth 2.0 Client ID` with application type `Web application`.

Authorized JavaScript origins should include your local and deployed frontends, for example:

- `http://127.0.0.1:5173`
- `http://localhost:5173`
- `https://your-production-domain.example`
- `https://your-preview-domain.example`

This app uses the Google Identity Services token client popup flow, so redirect URIs are typically not required for the local browser flow used here.

## Create the API Key

Create an API key for browser use and lock it down:

1. Restrict the key to `HTTP referrers (web sites)`.
2. Allow only your local and deployed origins.
3. Restrict API usage to the APIs this app needs, typically:
   - Google Sheets API
   - Google Drive API
   - Google Picker API, if available in your project

Do not use an unrestricted API key.

## Find the App ID

`VITE_GOOGLE_APP_ID` should be your Google Cloud project number, not the project name.

You can find it in the Google Cloud project settings.

## Local Development

1. Copy `.env.example` to `.env.local`.
2. Fill in your Google values.
3. Restart the Vite dev server after changing environment variables.

If Google is not configured:

- the core editor still works
- Google Contacts and Google Sheets features stay unavailable

## Troubleshooting

### `VITE_GOOGLE_CLIENT_ID is missing`

Set `VITE_GOOGLE_CLIENT_ID` in `.env.local` and restart the dev server.

### `VITE_GOOGLE_API_KEY is missing`

Set `VITE_GOOGLE_API_KEY` in `.env.local` and restart the dev server.

### `VITE_GOOGLE_APP_ID is missing`

Set `VITE_GOOGLE_APP_ID` in `.env.local` and restart the dev server.

### `origin_mismatch` or unauthorized origin

Add the exact local or deployed frontend origin to the OAuth client's authorized JavaScript origins.

### Access denied for Google Contacts

Check that:

- Google People API is enabled
- the consent screen includes the contacts scopes
- the signed-in account granted access

### Access denied for Google Sheets

Check that:

- Google Sheets API is enabled
- Google Drive API is enabled
- the API key allows the correct referrers and APIs
- the signed-in account can access the spreadsheet

### Selected file is not a native Google Spreadsheet

Convert the file to Google Sheets format and try again.

## Recommended Practice for Public Deployments

- Use a separate Google Cloud project for production.
- Use separate credentials for local development and production.
- Restrict OAuth origins and API-key referrers as tightly as possible.
- Rotate credentials if they are ever shared outside their intended audience.
