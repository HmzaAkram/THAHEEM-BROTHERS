'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Download,
    Upload,
    Database,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    History
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';

export default function BackupPage() {
    const { user } = useAuth();
    const [exportLoading, setExportLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/backup/export`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = `thaheem_backup_${new Date().toISOString().split('T')[0]}.sql`;
                if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
                    filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
                }
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                const result = await response.json();
                alert(`Failed to export database: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('An error occurred during export.');
        } finally {
            setExportLoading(false);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            alert('Please select a backup file first.');
            return;
        }

        if (!window.confirm('WARNING: This will overwrite your current database. This action CANNOT be undone. Are you sure you want to proceed?')) {
            return;
        }

        setImportLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('backup_file', selectedFile);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/backup/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                alert('Database restored successfully! The application will now reload.');
                window.location.reload();
            } else {
                const data = await response.json();
                alert(`Restore failed: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('An error occurred during the restore process.');
        } finally {
            setImportLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Database Management</h1>
                        <p className="text-muted-foreground mt-1">
                            Backup and restore your system data to ensure business continuity.
                        </p>
                    </div>
                    <div className="bg-primary/10 px-4 py-2 rounded-full border border-primary/20 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-primary italic uppercase tracking-wider">System Secure</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="shadow-xl border-primary/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm ring-1 ring-black/5">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 shadow-sm transition-transform hover:scale-110">
                                    <Download className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold">Export Database</CardTitle>
                                    <CardDescription>Securely download your entire database.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800 p-8 flex flex-col items-center justify-center text-center space-y-4 bg-blue-50/20 dark:bg-blue-900/5 hover:bg-blue-50/40 transition-colors group">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full scale-110 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
                                    <Database className="w-16 h-16 text-blue-400 relative z-10 transition-transform group-hover:-translate-y-1" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-blue-900 dark:text-blue-300 font-bold">Ready for Download</p>
                                    <p className="text-xs text-muted-foreground max-w-[200px]">
                                        Includes all companies, bills, payments, reports, and tracking records.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleExport}
                                    disabled={exportLoading}
                                    className="w-full h-12 gap-2 font-black shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white border-0"
                                >
                                    {exportLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                    Download Full Backup
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-xl border-red-500/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm ring-1 ring-black/5">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl text-red-600 shadow-sm transition-transform hover:scale-110">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold">Restore Database</CardTitle>
                                    <CardDescription>Import a previously exported backup file.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-start gap-4 shadow-sm">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-amber-800 dark:text-amber-400 uppercase tracking-tight">Critical Warning</p>
                                    <p className="text-xs text-amber-700/80 dark:text-amber-500 mt-1 leading-relaxed">
                                        This operation will <span className="underline font-bold">permanently replace</span> your current live data. This cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="backup" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Backup File (.sqlite / .sql)</Label>
                                    <div className="relative group">
                                        <Input
                                            id="backup"
                                            type="file"
                                            accept=".sqlite,.sql"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            className="cursor-pointer file:cursor-pointer hover:border-primary/50 transition-all h-14 pt-3.5 pb-2.5 px-4 rounded-xl border-2 border-dashed bg-white dark:bg-slate-950 font-mono text-xs"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleImport}
                                    disabled={importLoading || !selectedFile}
                                    variant="destructive"
                                    className="w-full h-14 gap-3 font-black shadow-xl shadow-red-500/20 rounded-xl uppercase tracking-wider relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="relative z-10 flex items-center gap-3">
                                        {importLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                        Restore System Data
                                    </span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-2xl border-0 bg-slate-900 text-white overflow-hidden relative rounded-3xl group">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none group-hover:bg-primary/20 transition-all duration-1000" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none group-hover:bg-blue-500/20 transition-all duration-1000" />

                    <CardContent className="p-10 relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                <div className="p-4 bg-gradient-to-br from-blue-500 to-primary rounded-3xl shadow-lg">
                                    <History className="w-10 h-10 text-white" />
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-4">
                                <h3 className="text-2xl font-black tracking-tight flex items-center gap-3 justify-center md:justify-start">
                                    Automatic Safety Checkpoint
                                    <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded border border-green-500/30 uppercase font-black">Active</span>
                                </h3>
                                <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">
                                    Before any restoration begins, the system creates an internal snapshot of your current database. This <span className="text-blue-400 font-bold">"Pre-Restore"</span> backup ensures that you can always revert to your previous state if the imported data is incorrect or corrupted.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
