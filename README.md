# EduAgri — Run & Test Guide

This README explains how to run the backend and serve the frontend locally, and how to test the authentication API endpoints used by the site.

## Prerequisites
- Node.js (LTS recommended, v16+)
- npm (bundled with Node)
- A shell (PowerShell on Windows, or bash)

## Backend (server)
1. Open a terminal and go to the `server` folder:

```powershell
cd C:\Users\nived\OneDrive\Desktop\EduAgri\server
```

2. Install dependencies (only needed once):

```powershell
npm install
```

3. Start the backend server:

```powershell
npm start
```

The server listens on `http://localhost:5000` by default. You should see:

```
EduAgri server running on http://localhost:5000
Connected to SQLite database at <path>/eduagri.db
```

## Frontend (serve static files)
Serve the project directory over HTTP (do not open `.html` via `file://` because of CORS and proper fetch behavior).

From the project root:

```powershell
# Option A - http-server (quick)
npx http-server . -p 8000

# Option B - Python built-in server
python -m http.server 8000
```

Open the login page in your browser:

```
http://localhost:8000/login.html
```

## Quick smoke-test of endpoints (PowerShell)
The backend provides these endpoints used by the frontend:
- `POST /api/register` - Register a user (returns JWT token)
- `POST /api/login` - Login (returns JWT token)
- `GET /api/me` - Get current user (requires `Authorization: Bearer <token>`)
- `GET /api/enrollments` - Get user's enrollments (requires token)
- `POST /api/enroll` - Enroll in a course (requires token)
- `DELETE /api/enrollments/:courseTitle` - Unenroll (requires token)

Example PowerShell snippet to register a test user and call protected endpoints:

```powershell
# run in PowerShell
$u = 'testuser' + (Get-Random -Minimum 1000 -Maximum 9999)
$body = @{ username = $u; email = ($u + '@example.com'); password = 'secret' } | ConvertTo-Json
$reg = Invoke-RestMethod -Method Post -Uri 'http://localhost:5000/api/register' -ContentType 'application/json' -Body $body
Write-Output 'REGISTER RESPONSE:'; $reg
$token = $reg.token
# call /api/me
Invoke-RestMethod -Uri 'http://localhost:5000/api/me' -Headers @{ Authorization = 'Bearer ' + $token }
# call enrollments
Invoke-RestMethod -Uri 'http://localhost:5000/api/enrollments' -Headers @{ Authorization = 'Bearer ' + $token }
```

If `Invoke-RestMethod` fails to connect, ensure the backend is running (`npm start`) and that you used the correct port and origin.

## Debugging tips
- If you see CORS errors in the browser console, ensure the frontend is served from `http://localhost:8000` (or update CORS origin in `server/server.js`).
- If `npm install` fails compiling `sqlite3`, you may need Windows build tools. Try using a Node version with prebuilt binaries or install the "Build Tools for Visual Studio".
- Check `Application -> Local Storage` in DevTools to verify `authToken` is set after login.

## Port-in-use troubleshooting (common on Windows)
If the server fails to start with an error like `EADDRINUSE: address already in use :::5000`, another process is already listening on that port. Use these steps to identify and free the port:

1. Find which process is listening on the port (replace `5000` with your port if different):

```powershell
netstat -ano | findstr :5000
```

This prints lines containing the local address and the PID (last column). Note the PID (for example `13024`).

2. Get the process name for that PID:

```powershell
tasklist /FI "PID eq 13024"
```

3. If it's safe to stop that process, kill it:

```powershell
taskkill /PID 13024 /F
```

4. Restart the server:

```powershell
cd server
npm start
```

Alternative options:
- Start the server on a different port without killing the process:

```powershell
$env:PORT=6001; npm start
```

- Start the server directly (from project root) pointing to the server script:

```powershell
node server/server.js
```

If you prefer, you can add a small note inside `server/server.js` to choose a different `PORT` via environment or automatically retry, but killing the blocking process or choosing a different port are the simplest fixes.

## Next steps (optional)
- Move `SECRET_KEY` to an environment variable via a `.env` file and `dotenv`.
- Use HTTPS and HttpOnly cookies for production tokens.

---
If you'd like, I can start the server for you from here and run the smoke-test; paste any terminal error output you see and I'll help fix it.