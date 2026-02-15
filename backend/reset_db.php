<?php
$dbPath = __DIR__ . '/database/database.sqlite';
if (file_exists($dbPath)) { unlink($dbPath); }
touch($dbPath);

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Creating tables...\n";

    $pdo->exec("CREATE TABLE companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        ntn TEXT,
        username TEXT,
        password TEXT,
        status TEXT DEFAULT 'Active',
        created_at DATETIME,
        updated_at DATETIME
    )");

    $pdo->exec("CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        company_id INTEGER,
        created_at DATETIME,
        updated_at DATETIME
    )");

    $pdo->exec("CREATE TABLE bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        company_name TEXT NOT NULL,
        bill_no TEXT,
        date DATE NOT NULL,
        job_number TEXT NOT NULL,
        via TEXT,
        weight TEXT,
        packages TEXT,
        exporter TEXT,
        invoice_no TEXT,
        invoice_date DATE,
        be_number TEXT,
        hawb TEXT,
        igm TEXT,
        index_no TEXT,
        gd_number TEXT,
        no_of_containers INTEGER,
        container_no TEXT,
        total_amount NUMERIC NOT NULL,
        service_charges NUMERIC NOT NULL,
        sales_tax NUMERIC NOT NULL,
        advance_payment NUMERIC NOT NULL,
        grand_total NUMERIC NOT NULL,
        status TEXT DEFAULT 'Unpaid',
        attachment TEXT,
        created_at DATETIME,
        updated_at DATETIME
    )");

    $pdo->exec("CREATE TABLE bill_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bill_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        notes TEXT,
        amount NUMERIC NOT NULL,
        invoice_no TEXT,
        created_at DATETIME,
        updated_at DATETIME
    )");

    $pdo->exec("CREATE TABLE payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        company_name TEXT NOT NULL,
        date DATE NOT NULL,
        amount NUMERIC NOT NULL,
        reference TEXT NOT NULL,
        method TEXT NOT NULL,
        tracking_id TEXT,
        cheque_no TEXT,
        pay_order_no TEXT,
        description TEXT,
        adjustment NUMERIC,
        bill_id INTEGER,
        created_at DATETIME,
        updated_at DATETIME
    )");

    echo "Seeding data...\n";

    // Admin
    $adminPass = password_hash('123', PASSWORD_BCRYPT);
    $pdo->prepare("INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)")
        ->execute(['Admin', 'admin@thaheem.com', $adminPass, 'admin', date('Y-m-d H:i:s')]);

    // Company
    $pdo->prepare("INSERT INTO companies (id, name, email, username, password, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        ->execute([1, 'Thaheem Co', 'thaheem_co@gmail.com', 'thaheem_co', 'password123', 'Active', date('Y-m-d H:i:s')]);

    // Company User (ID 2 in Users)
    $pdo->prepare("INSERT INTO users (name, email, password, role, company_id, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        ->execute(['Company Admin', 'company@thaheem.com', $adminPass, 'company', 1, date('Y-m-d H:i:s')]);

    // Sample Bill
    $pdo->prepare("INSERT INTO bills (id, company_id, company_name, bill_no, date, job_number, total_amount, service_charges, sales_tax, advance_payment, grand_total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        ->execute([1, 1, 'Thaheem Co', 'INV-001', date('Y-m-d', strtotime('-10 days')), 'JOB-101', 50000, 5000, 800, 0, 55800, 'Unpaid', date('Y-m-d H:i:s')]);

    $pdo->prepare("INSERT INTO bill_items (bill_id, description, amount, created_at) VALUES (?, ?, ?, ?)")
        ->execute([1, 'Clearing Charges', 50000, date('Y-m-d H:i:s')]);

    // Sample Payment
    $pdo->prepare("INSERT INTO payments (company_id, company_name, date, amount, reference, method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        ->execute([1, 'Thaheem Co', date('Y-m-d', strtotime('-5 days')), 20000, 'REF-123', 'Cash', date('Y-m-d H:i:s')]);

    echo "Database reset and seeded successfully.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
