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
