<!-- README.md -->
# Grafikuy

Interactive Data Visualization Dashboard

## Manual Setup Instructions

Please complete the following 3 steps before starting development:

### 1. Firebase Setup
- Create a new Firebase project and enable Realtime Database (RTDB).
- Set the RTDB rules for development.
- Copy your Firebase configuration values into the `.env` file for the respective `VITE_FIREBASE_*` variables.

### 2. Cloudinary Setup
- Create a Cloudinary account if you don't have one.
- Create an unsigned upload preset and name it exactly: `grafikuy_upload`.
- Copy your Cloudinary cloud name into the `.env` file under `VITE_CLOUDINARY_CLOUD_NAME`.

### 3. Password Hash Setup
- Generate a SHA-256 hash for your chosen password using your browser's console.
- Paste the resulting hash string into the `.env` file under `VITE_IMPORT_PASSWORD_HASH`.

**Console snippet to generate the hash:**
```javascript
crypto.subtle.digest('SHA-256', 
  new TextEncoder().encode('YOUR_PASSWORD')
).then(b => console.log(
  [...new Uint8Array(b)]
    .map(x => x.toString(16).padStart(2,'0'))
    .join('')
))
```
