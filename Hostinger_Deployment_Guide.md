# 🚀 cPanel Deployment Guide for Thaheem Brothers

This guide provides step-by-step instructions to deploy your full-stack application (Next.js Frontend + Laravel Backend) directly into the `thaheembrothers.com` folder shown in your cPanel File Manager (`/home/alkareemrs/thaheembrothers.com`).

---

## 📂 Folder Structure Strategy

Since you want everything inside the `thaheembrothers.com` folder, we will structure it like this:
- **Frontend (Next.js):** Files will be placed directly in the main `thaheembrothers.com` folder.
- **Backend (Laravel):** Placed inside a subfolder, e.g., `thaheembrothers.com/backend`.

---

## 1️⃣ PREPARE & DEPLOY THE BACKEND (LARAVEL)

### Step 1: Prepare the Laravel Build
1. On your local computer, open the `backend` folder.
2. Open the `.env` file and ensure your settings are ready for production:
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://api.thaheembrothers.com
   FRONTEND_URL=https://thaheembrothers.com
   ```
3. Zip the entire `backend` folder locally. *(If your hosting doesn't allow SSH or running `composer install`, make sure you do NOT exclude the `vendor` folder when zipping so dependencies are included).*

### Step 2: Upload to cPanel
1. Go to your **cPanel File Manager** and open the `thaheembrothers.com` folder.
2. Click **+ Folder** and create a new folder named `backend`.
3. Open the `backend` folder.
4. Click **Upload** and select your zipped Laravel backend file.
5. Once uploaded, right-click the zip file, select **Extract**, and ensure files are extracted inside `/home/alkareemrs/thaheembrothers.com/backend`.

### Step 3: Connect the Database
1. Go back to the main cPanel dashboard and open **MySQL Databases**.
2. Create a new Database, a new MySQL User, and link them together granting "All Privileges".
3. Open the `.env` file inside `thaheembrothers.com/backend/` using the File Manager's **Edit** tool.
4. Update the DB credentials (cPanel usually prefixes the name/user with your username `alkareemrs_`):
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=alkareemrs_yourdbname
   DB_USERNAME=alkareemrs_yourdbuser
   DB_PASSWORD=YourStrongPassword
   ```

### Step 4: Setup the API Subdomain
To ensure your API URLs are clean and secure:
1. Go to cPanel -> **Domains** (or **Subdomains**).
2. Create a subdomain named `api.thaheembrothers.com`.
3. **CRITICAL:** Set the **Document Root** for this subdomain to point exactly to the Laravel public folder: 
   `/home/alkareemrs/thaheembrothers.com/backend/public`
4. This ensures your API is served from `https://api.thaheembrothers.com` and automatically points to the `index.php` in the backend.

> [!IMPORTANT]
> **Migrations & Storage Symlink**
> If you have Terminal / SSH access in cPanel, run these commands inside the `backend` folder:
> `php artisan migrate --force`
> `php artisan storage:link`
> 
> *If you do not have SSH access, you can import your SQL database manually via **phpMyAdmin** and use a Laravel route to execute the storage link command.*

---

## 2️⃣ PREPARE & DEPLOY THE FRONTEND (NEXT.JS)

### Step 1: Prepare the Next.js Build
1. On your local computer, navigate to the `frontend` folder.
2. Check `next.config.mjs` (or `.js`) to ensure static export is enabled:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export',
     images: {
       unoptimized: true,
     },
   };
   export default nextConfig;
   ```
3. Check your frontend `.env` or `.env.local` to point to the production backend:
   ```env
   NEXT_PUBLIC_API_URL=https://api.thaheembrothers.com/api
   NEXT_PUBLIC_BASE_URL=https://thaheembrothers.com
   ```
4. Run the build command in your terminal:
   ```bash
   npm run build
   ```
5. This will generate an `out` folder inside your `frontend` directory.

### Step 2: Upload to cPanel
1. Compress/Zip the **contents** of the `out` folder (go inside `out`, select all files/folders, and zip them together).
2. Go back to **cPanel File Manager** and navigate into your main `thaheembrothers.com` folder.
3. Click **Upload** and upload the frontend zip file here.
4. Right-click and **Extract** the files directly into `thaheembrothers.com`.
5. Your folder should now contain the `backend` folder alongside Next.js files like `_next`, `assets`, and `index.html`. 

---

## 3️⃣ FIXING ROUTING & CORS

### Enable CORS on Backend
For the frontend (`thaheembrothers.com`) to communicate with the backend (`api.thaheembrothers.com`), CORS must be properly configured.
1. Use cPanel Editor to quickly check `backend/config/cors.php`.
2. Ensure it allows your frontend domain:
   ```php
   'paths' => ['api/*', 'sanctum/csrf-cookie'],
   'allowed_methods' => ['*'],
   'allowed_origins' => ['https://thaheembrothers.com', 'https://www.thaheembrothers.com'],
   // ...
   ```

### Frontend `.htaccess` (For Next.js Routing)
Because Next.js generated a static HTML site, reloading sub-pages like `/about` might return a 404 error if cPanel expects a real folder instead of an HTML file.
1. In the `thaheembrothers.com` folder, create a new file named `.htaccess` (ensure Settings -> "Show Hidden Files" is checked in cPanel File Manager).
2. Add the following Next.js routing fix:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     
     # If the requested file or directory exists, serve it
     RewriteCond %{REQUEST_FILENAME} -f [OR]
     RewriteCond %{REQUEST_FILENAME} -d
     RewriteRule ^ - [L]
     
     # Otherwise, try adding .html to the end
     RewriteCond %{REQUEST_FILENAME}.html -f
     RewriteRule ^(.*)$ $1.html [L]
   </IfModule>
   ```

---

## 🎊 FINAL CHECK
- **Frontend App:** Visit `https://thaheembrothers.com` to see if the interface loads.
- **Backend API:** Visit `https://api.thaheembrothers.com/api/up` to see if the Laravel health check responds.
- **Image Storage:** Upload an image in the admin panel and ensure it correctly displays. If images are broken, it means the `php artisan storage:link` command wasn't executed properly.
