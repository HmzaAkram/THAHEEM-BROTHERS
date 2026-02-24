import sys
import re

backup_path = r'c:\Users\HP\Documents\GitHub\THAHEEM-BROTHERS\frontend\app\admin\backup\page.tsx'
dashboard_path = r'c:\Users\HP\Documents\GitHub\THAHEEM-BROTHERS\frontend\app\admin\dashboard\page.tsx'

with open(backup_path, 'r', encoding='utf-8') as f:
    backup_text = f.read()

# Extract the handleZipExport function
zip_export_start = backup_text.find('    const handleZipExport = async () => {')
zip_export_end = backup_text.find('    return (', zip_export_start)
handle_zip_export_code = backup_text[zip_export_start:zip_export_end].strip()

# Change handleZipExport to handleExport
handle_zip_export_code = handle_zip_export_code.replace('const handleZipExport =', 'const handleExport =')
handle_zip_export_code = handle_zip_export_code.replace('setZipLoading(true);', 'setExportLoading(true);')
handle_zip_export_code = handle_zip_export_code.replace('setZipLoading(false);', 'setExportLoading(false);')

# Extract hidden template render
template_start = backup_text.find('{/* Hidden container to render invoices to PDF */}', zip_export_end)
template_end = backup_text.find('            </div>', template_start)
hidden_template_code = backup_text[template_start:template_end].strip()

with open(dashboard_path, 'r', encoding='utf-8') as f:
    dashboard_text = f.read()

# IMPORTS
imports_to_add = """
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import { InvoiceTemplate } from '@/components/invoice-template';
"""

if 'import JSZip' not in dashboard_text:
    dashboard_text = dashboard_text.replace("import { toJpeg } from 'html-to-image';", "import { toJpeg } from 'html-to-image';\n" + imports_to_add)

# update useData
dashboard_text = dashboard_text.replace('const { bills, payments, companies, securities } = useData();', 'const { bills, payments, companies, securities, getCompanyLedger } = useData();')

# add state variables
state_vars = """
  const [exportLoading, setExportLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipProgressText, setZipProgressText] = useState('');
  const [renderingBill, setRenderingBill] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
"""
dashboard_text = dashboard_text.replace("const [filterType, setFilterType] = useState('overall');", "const [filterType, setFilterType] = useState('overall');\n" + state_vars)

# replace handleExport
old_export_start = dashboard_text.find('  const handleExport = async () => {')
old_export_end = dashboard_text.find('  return (', old_export_start)
if old_export_start != -1:
    old_export_code = dashboard_text[old_export_start:old_export_end]
    dashboard_text = dashboard_text.replace(old_export_code, '  ' + handle_zip_export_code + '\n\n')

# Add loader icon to import
dashboard_text = dashboard_text.replace("Clock\n} from 'lucide-react';", "Clock,\n  Loader2\n} from 'lucide-react';")

# replace button UI
old_btn = """<Button
                className="gap-2 shadow-md bg-primary hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto order-1 sm:order-2"
                onClick={handleExport}
              >
                <Download className="w-4 h-4" />
                Export Report
              </Button>"""

new_btn = """<Button
                className="gap-2 shadow-md bg-primary hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto order-1 sm:order-2 disabled:opacity-50 min-w-[150px]"
                onClick={handleExport}
                disabled={exportLoading}
              >
                {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <div className="flex flex-col items-start gap-0">
                  <span>{exportLoading ? 'Exporting...' : 'Export ZIP'}</span>
                  {exportLoading && zipProgressText && <span className="text-[10px] font-normal leading-tight opacity-90 max-w-[120px] truncate">{zipProgressText}</span>}
                </div>
              </Button>"""

# A more robust replace for the button in case indentation differs slightly:
import re
dashboard_text = re.sub(r'<Button[^>]*onClick=\{handleExport\}[^>]*>[\s\S]*?<\/Button>', new_btn, dashboard_text)

# add hidden template
if hidden_template_code not in dashboard_text:
    dashboard_text = dashboard_text.replace('      </div>\n    </DashboardLayout>', f'        {hidden_template_code}\n      </div>\n    </DashboardLayout>')

with open(dashboard_path, 'w', encoding='utf-8') as f:
    f.write(dashboard_text)

print('Done applying changes!')
