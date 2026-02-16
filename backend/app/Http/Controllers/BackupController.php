<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BackupController extends Controller
{
    /**
     * Export the current database.
     */
    public function export()
    {
        // Prioritize MySQL as requested by user ("SQLite nahi")
        $connection = config('database.default');
        
        // Check if we should use MySQL (either as default or forced via env)
        if ($connection === 'mysql' || env('DB_CONNECTION') === 'mysql') {
            $host = config('database.connections.mysql.host');
            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');

            $filename = 'thaheem_backup_' . date('Y-m-d_His') . '.sql';
            $path = storage_path('app/' . $filename);

            // Try to find mysqldump path on Windows or use from PATH
            $mysqldump = 'mysqldump';
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                $possiblePaths = [
                    'C:\\xampp\\mysql\\bin\\mysqldump.exe',
                    'D:\\xampp\\mysql\\bin\\mysqldump.exe',
                    'C:\\wamp64\\bin\\mysql\\mysql' . config('database.connections.mysql.version', '8.0') . '\\bin\\mysqldump.exe',
                    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
                    'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe',
                ];

                foreach ($possiblePaths as $p) {
                    if (file_exists($p)) {
                        $mysqldump = '"' . $p . '"';
                        break;
                    }
                }
            }

            // Command for mysqldump
            // Note: We use --no-tablespaces to avoid permission issues when not running as root/admin
            $command = sprintf(
                '%s --user=%s --password=%s --host=%s --no-tablespaces %s > %s',
                $mysqldump,
                escapeshellarg($username),
                escapeshellarg($password),
                escapeshellarg($host),
                escapeshellarg($database),
                escapeshellarg($path)
            );

            $output = [];
            $returnVar = 0;
            exec($command . ' 2>&1', $output, $returnVar);

            if ($returnVar === 0 && file_exists($path)) {
                return response()->download($path, $filename)->deleteFileAfterSend(true);
            }

            return response()->json([
                'error' => 'MySQL dump failed. ' . implode("\n", $output),
                'diagnostics' => [
                    'mysqldump_command' => $mysqldump,
                    'return_code' => $returnVar,
                    'output' => $output,
                    'database' => $database,
                    'host' => $host
                ]
            ], 500);
        }

        // Fallback to SQLite only if absolutely necessary and not strictly forbidden
        if ($connection === 'sqlite') {
            $dbPath = config('database.connections.sqlite.database');
            if (file_exists($dbPath)) {
                return response()->download($dbPath, 'thaheem_backup_' . date('Y-m-d_His') . '.sqlite');
            }
        }

        return response()->json(['error' => 'No suitable database connection found for export. Connection is: ' . $connection], 400);
    }

    /**
     * Import a database backup.
     */
    public function import(Request $request)
    {
        $request->validate([
            'backup_file' => 'required|file',
        ]);

        $file = $request->file('backup_file');
        $extension = strtolower($file->getClientOriginalExtension());
        $connection = config('database.default');

        if ($extension === 'sql') {
            $host = config('database.connections.mysql.host');
            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');

            $mysql = 'mysql';
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                $possiblePaths = [
                    'C:\\xampp\\mysql\\bin\\mysql.exe',
                    'D:\\xampp\\mysql\\bin\\mysql.exe',
                    'C:\\wamp64\\bin\\mysql\\mysql' . config('database.connections.mysql.version', '8.0') . '\\bin\\mysql.exe',
                    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
                ];

                foreach ($possiblePaths as $p) {
                    if (file_exists($p)) {
                        $mysql = '"' . $p . '"';
                        break;
                    }
                }
            }

            $path = $file->getRealPath();

            $command = sprintf(
                '%s --user=%s --password=%s --host=%s %s < %s',
                $mysql,
                escapeshellarg($username),
                escapeshellarg($password),
                escapeshellarg($host),
                escapeshellarg($database),
                escapeshellarg($path)
            );

            $output = [];
            $returnVar = 0;
            exec($command . ' 2>&1', $output, $returnVar);

            if ($returnVar === 0) {
                return response()->json(['message' => 'MySQL database restored successfully.']);
            }

            return response()->json([
                'error' => 'MySQL restore failed. ' . implode("\n", $output),
                'diagnostics' => [
                    'mysql_command' => $mysql,
                    'return_code' => $returnVar,
                    'output' => $output,
                    'database' => $database,
                    'host' => $host
                ]
            ], 500);
        }

        if ($extension === 'sqlite') {
            $dbPath = config('database.connections.sqlite.database');
            
            // Backup current state before overwrite
            if (file_exists($dbPath)) {
                copy($dbPath, $dbPath . '_pre_import_' . date('YmdHis'));
            }

            // Replace current sqlite file
            try {
                if (!is_dir(dirname($dbPath))) {
                    mkdir(dirname($dbPath), 0755, true);
                }
                $file->move(dirname($dbPath), basename($dbPath));
                return response()->json(['message' => 'SQLite database restored successfully.']);
            } catch (\Exception $e) {
                return response()->json(['error' => 'Failed to restore SQLite database: ' . $e->getMessage()], 500);
            }
        }

        return response()->json(['error' => 'Unsupported file format: ' . $extension], 400);
    }
}
