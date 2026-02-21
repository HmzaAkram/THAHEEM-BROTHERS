# 🚀 Hostinger Deployment Guide: Laravel Backend + Next.js Frontend

This guide contains step-by-step instructions to deploy a full-stack application (Next.js App Router + Laravel REST API + MySQL) to Hostinger (Shared / Business / VPS).

---

## 1️⃣ DOMAIN & HOSTING SETUP

### Domain Pointing (DNS)
1. Log in to your Hostinger hPanel.
2. Go to **Domains** and manage your domain.
3. If your domain acts as the frontend, it should point directly to your Hostinger server IP. Ensure the `A` record `*` and `@` points to your hosting server IP.

### Subdomain Strategy
To clean up routing and avoid CORS nightmares, we will use a subdomain structure:
- **Frontend (Next.js):** `example.com`
- **Backend API (Laravel):** `api.example.com`

**Action:** Go to **Hosting** -> **Manage** -> **Domains** -> **Subdomains** in hPanel. Create a new subdomain named `api` (which resolves to `api.example.com`). Specify a custom folder for it, typically `/public_html/api` or `/domains/example.com/api`.

---

## 2️⃣ BACKEND (LARAVEL) DEPLOYMENT

### Uploading Files & Structure
In Hostinger Shared/Business hosting, document roots are strictly managed. 

1. **ZIP your Laravel project** locally (excluding `node_modules` and `vendor` folders to save upload time, though you can upload `vendor` if you can't run composer on the server).
2. Open Hostinger **File Manager**.
3. Upload the ZIP to the directory created for your subdomain (e.g., `domains/api.example.com/`).
4. Extract the ZIP file there.

> [!IMPORTANT]
> **Correct Public Folder Mapping**
> Hostinger points domains to the folder you specify, but a Laravel app's document root MUST be the `public` directory.
> 
> **Option A (If Hostinger allows custom document root):**
> Change the document root of `api.example.com` to `/domains/api.example.com/public` in the Subdomain settings.
> 
> **Option B (Using `.htaccess` if document root can't be changed):**
> Create an `.htaccess` file in your `api.example.com` root folder with this code:
> ```apache
> <IfModule mod_rewrite.c>
>     RewriteEngine On
>     RewriteRule ^(.*)$ public/$1 [L]
> </IfModule>
> ```

### Database Setup
1. Go to **Databases** -> **MySQL Databases** in hPanel.
2. Create a new Database, MySQL Username, and a strong Password.
3. Note down the Database Name, DB User, and Password.

### Connecting MySQL
Open the `.env` file in your Laravel root via the File Manager edit tool.
Update the database section:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=u123456789_dbname
DB_USERNAME=u123456789_dbuser
DB_PASSWORD=YourStrongPassword!
```

### SSH Commands (Composer & Migrations)
Log in via SSH (details found under **Advanced** -> **SSH Access** in hPanel).
Navigate to your backend directory:
```bash
cd domains/api.example.com
```

Run the following commands:
```bash
# Install dependencies (if vendor wasn't uploaded)
composer install --optimize-autoloader --no-dev

# Generate app key (if empty)
php artisan key:generate

# Run migrations (ensure database is empty or backed up)
php artisan migrate --force

# Link storage (Crucial for uploads)
php artisan storage:link
```

### Permissions & Optimization
Ensure the storage and cache folders have the correct write permissions.
```bash
chmod -R 775 storage bootstrap/cache
```

Cache your config and routes for production speed:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 3️⃣ FRONTEND (NEXT.JS) DEPLOYMENT

### Option A: Static Export (Shared Hosting / CPanel style)
If you don't need server-side rendering (SSR) or Node.js running continuously, Next.js can output static HTML.

1. In your `next.config.js` or `next.config.mjs`, add the output mode:
   ```javascript
   const nextConfig = {
     output: 'export',
     // ... other configs
   };
   ```
2. Run locally:
   ```bash
   npm run build
   ```
   This generates an `out` folder.
3. Compress the contents of the `out` folder into a ZIP.
4. Upload to the `public_html` (or `domains/example.com/public_html`) directory via Hostinger File Manager.
5. Extract files. Your frontend is live!

### Option B: Node.js Hosting (Hostinger VPS / Node.js Env)
If using Next.js App Router with SSR, API Routes, or dynamic features, you need a Node.js environment.

**VPS / PM2 Setup:**
1. SSH into the server and navigate to `domains/example.com`.
2. Clone or upload your Next.js project.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```
5. Install and start PM2 to keep the app running forever:
   ```bash
   npm install -g pm2
   pm2 start npm --name "nextjs-frontend" -- run start
   pm2 save
   pm2 startup
   ```

**Reverse Proxy via Nginx (VPS Setup):**
Configure Nginx to proxy port 80/443 to Next.js (usually running on port 3000).
Edit `/etc/nginx/sites-available/example.com`:
```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Restart Nginx: `sudo systemctl restart nginx`

---

## 4️⃣ ENVIRONMENT VARIABLES

> [!CAUTION]
> NEVER expose backend secrets (like `APP_KEY`, DB passwords) in frontend `.env` files. Ensure they are completely separate.

### Frontend (`.env.production`)
When building Next.js locally for **Static Export**, ensure you have:
```env
NEXT_PUBLIC_API_URL=https://api.example.com/api
NEXT_PUBLIC_BASE_URL=https://example.com
```
*Note: Variables prefixed with `NEXT_PUBLIC_` are bundled into the client build.*

### Backend (`.env`)
In Laravel production, ensure these are set:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.example.com
FRONTEND_URL=https://example.com
```

---

## 5️⃣ CORS & API CONNECTION

If you use `api.example.com` and `example.com`, that is a cross-origin request. Laravel needs to allow this.

Open backend `config/cors.php`:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => ['https://example.com', 'https://www.example.com'],
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true, // Required if using Sanctum/Cookies
```

> [!TIP]
> Clear config cache after changing CORS settings: `php artisan config:clear`

---

## 6️⃣ SSL & SECURITY

### Enabling Free SSL
1. Go to **Security** -> **SSL** in hPanel.
2. Select your domains and subdomains (`example.com`, `api.example.com`).
3. Click "Install SSL". Let Hostinger automatically generate and apply Let's Encrypt certificates.

### HTTPS Redirect
Hostinger has a toggle in the Domain dashboard to enforce HTTPS. Turn it ON.

### Security Headers & Disabling Debug
Ensure `APP_DEBUG=false` in Laravel. If true, any backend error will reveal your database credentials and source code on the API responses!

---

## 7️⃣ FINAL PRODUCTION CHECK

1. ✅ **Cache Clearing:** Ensure old views or configs aren't stuck (`php artisan optimize:clear`).
2. ✅ **Route Testing:** Visit `https://example.com` - Does it load without Next.js errors?
3. ✅ **API Health Check:** Visit `https://api.example.com/api/up` (if Laravel 11) or a custom ping route to see if the JSON responds.
4. ✅ **Database Integrity Test:** Log in via the frontend and test a database write operation (like adding a user or item).
5. ✅ **Image Upload Test:** Upload an image and verify it shows up correctly (validating the storage symlink).

---

## 🧯 COMMON HOSTINGER ERRORS & FIXES

### 1. `500 Internal Server Error` on Laravel
* **Cause:** Permissions are wrong or `vendor` folder is missing.
* **Fix:** Check `storage/logs/laravel.log`. Run `composer install` or fix permissions (`chmod -R 775 storage`). Also verify PHP version (needs PHP 8.1+ usually).

### 2. `Permission denied` on Cache/Storage
* **Fix:** Via SSH or File Manager, change owner or permissions for `storage/` and `bootstrap/cache/`.

### 3. Images not showing (Storage link issues)
* **Cause:** Storage symlink is broken, acting as a shortcut to a local path instead of server path.
* **Fix:** Delete the `public/storage` folder via File Manager. Then run `php artisan storage:link` via SSH.

### 4. `SQLSTATE[HY000] [1045] Access denied for user`
* **Fix:** Double check `.env` variables: `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`. Note that Hostinger adds prefixes to database names (e.g., `u123456789_dbname`).

### 5. CORS Errors in Browser Console
* **Cause:** The `config/cors.php` is missing the exact frontend URL (including `https://` vs `http://`).
* **Fix:** Update `allowed_origins` in `cors.php` and run `php artisan config:clear`.

### 6. Node Build Failures (Out of Memory)
* **Cause:** Next.js building on a low-tier Hostinger VPS or shared environment without enough RAM.
* **Fix:** Build the project locally with `npm run build`, and upload the `.next` or `out` directory instead.

---

### 🎉 Deployment Complete
Keep credentials safe, always test changes locally before pushing, and utilize database backups from Hostinger's control panel regularly!
