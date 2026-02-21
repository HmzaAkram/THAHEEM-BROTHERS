<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BackupController extends Controller
{
    /**
     * Export the database as a SQL file.
     */
    public function export()
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        try {
            // 1. Get all tables
            $tables = DB::select('SHOW TABLES');
            $tables = array_map('current', $tables);

            $return = "SET FOREIGN_KEY_CHECKS=0;\n\n";
            
            // 2. Cycle through each table
            foreach ($tables as $table) {
                // Skip migrations table if you want, usually good to keep
                
                $result = DB::select("SELECT * FROM `$table`");
                $num_fields = count(DB::select("SHOW COLUMNS FROM `$table`"));

                $return .= "DROP TABLE IF EXISTS `$table`;";
                $row2 = DB::select("SHOW CREATE TABLE `$table`");
                $row2 = (array) $row2[0];
                $return .= "\n\n" . $row2['Create Table'] . ";\n\n";

                foreach ($result as $row) {
                    $return .= "INSERT INTO `$table` VALUES(";
                    $row = (array) $row;
                    $first = true;
                    foreach ($row as $value) {
                        if (!$first) {
                            $return .= ',';
                        }
                        
                        if (is_null($value)) {
                            $return .= "NULL";
                        } else {
                            $value = addslashes($value);
                            $value = str_replace("\n", "\\n", $value);
                            $return .= '"' . $value . '"';
                        }
                        $first = false;
                    }
                    $return .= ");\n";
                }
                $return .= "\n\n\n";
            }

            $return .= "SET FOREIGN_KEY_CHECKS=1;\n";

            // 3. Generate Filename
            $fileName = 'backup_' . Carbon::now()->format('Y-m-d_H-i-s') . '.sql';

            // 4. Return Response
            return Response::make($return, 200, [
                'Content-Type' => 'application/sql',
                'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            ]);

        } catch (\Exception $e) {
            Log::error("Backup Export Failed: " . $e->getMessage());
            return response()->json(['error' => 'Backup export failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Import a database backup.
     */
    public function import(Request $request)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $request->validate([
            'backup_file' => 'required|file' // Removing strict mimes check for raw sql text files often sent as text/plain
        ]);

        try {
            $file = $request->file('backup_file');
            $sql = file_get_contents($file->getRealPath());

            // Split SQL into separate statements
            // Note: This is a basic split. Complex SQL with triggers/procedures might need a robust parser.
            // For simple dumps (CREATE/INSERT), splitting by ";\n" is usually sufficient or just DB::unprepared.
            
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            DB::unprepared($sql);
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            return response()->json(['message' => 'Database restored successfully.']);

        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            Log::error("Backup Import Failed: " . $e->getMessage());
            return response()->json(['error' => 'Restore failed: ' . $e->getMessage()], 500);
        }
    }
}
