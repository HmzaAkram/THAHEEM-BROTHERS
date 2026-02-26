# Thaheem Brothers

This is a full-stack application for managing logistics, container tracking, payments, and billing for Thaheem Brothers. The project consists of a **Laravel** backend and a **Next.js** frontend.

## Prerequisites

Before setting up the project on a new device, ensure you have the following software installed:
- **PHP** (>= 8.2)
- **Composer**
- **Node.js** (>= 18.x) and **npm** 
- **MySQL** (or an equivalent database system)
- **Git**

---

## 🚀 1. Clone the Repository

```bash
git clone https://github.com/HmzaAkram/THAHEEM-BROTHERS.git
cd THAHEEM-BROTHERS
```

---

## 🛠️ 2. Backend Setup (Laravel)

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Install PHP dependencies**:
   ```bash
   composer install
   ```

3. **Set up environment variables**:
   Duplicate the `.env.example` file and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file in your editor and configure your database connection settings:
   ```ini
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=thaheem_db
   DB_USERNAME=root
   DB_PASSWORD=your_password
   ```

4. **Generate the Laravel application key**:
   ```bash
   php artisan key:generate
   ```

5. **Run Database Migrations & Seeders**:
   This will create the necessary tables and populate the default Admin user. (Make sure you have created the blank database in MySQL before running this).
   ```bash
   php artisan migrate --seed
   ```
   *Note: The default Admin login created via the seeder is:*
   - **Email:** `admin@thaheembrothers.com`
   - **Password:** `123`

6. **Create a Symbolic Link for Storage**:
   Required for serving uploaded files and attachments correctly.
   ```bash
   php artisan storage:link
   ```

7. **Start the backend server**:
   ```bash
   php artisan serve
   ```
   The backend API will be running at: `http://localhost:8000`

---

## 💻 3. Frontend Setup (Next.js)

Open a new terminal window/tab to keep the backend running.

1. **Navigate to the frontend folder from the project root**:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Configure Frontend Environment Variables**:
   Duplicate `.env.example` as `.env.local` (or create it if it doesn't exist) and ensure it points to the local backend API:
   ```bash
   cp .env.example .env.local
   ```
   Make sure you have `NEXT_PUBLIC_API_URL` correctly set in your environment file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

4. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```
   The frontend application will be running at `http://localhost:3000`

---

## 🔧 Useful Development Commands

**Clear Backend Cache**:
```bash
php artisan optimize:clear
```

**Run Database fresh migration** *(Warning: Wipes all existing data)*:
```bash
php artisan migrate:fresh --seed
```

**Build Frontend for Production**:
```bash
npm run build
```

---

## 📦 Deployment
For production deployment instructions to a shared hosting environment like Hostinger, please refer to the `Hostinger_Deployment_Guide.md` located in the root of the project.
