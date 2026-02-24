const fs = require('fs');

const backupPath = 'c:/Users/HP/Documents/GitHub/THAHEEM-BROTHERS/frontend/app/admin/backup/page.tsx';
const dashboardPath = 'c:/Users/HP/Documents/GitHub/THAHEEM-BROTHERS/frontend/app/admin/dashboard/page.tsx';

// Normalize line endings to \n
let backupText = fs.readFileSync(backupPath, 'utf8').replace(/\r\n/g, '\n');
let dashboardText = fs.readFileSync(dashboardPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Extract handleZipExport logic
const startToken = '    const handleZipExport = async () => {';
const endToken = '    return (\n        <DashboardLayout>';
const zipStartIdx = backupText.indexOf(startToken);
const zipEndIdx = backupText.indexOf(endToken, zipStartIdx);

let zipCode = backupText.substring(zipStartIdx, zipEndIdx).trim();
zipCode = zipCode.replace('const handleZipExport', 'const handleExport');
zipCode = zipCode.replace(/setZipLoading\(true\);/g, 'setExportLoading(true);');
zipCode = zipCode.replace(/setZipLoading\(false\);/g, 'setExportLoading(false);');

// 2. Extract Hidden Container
const hiddenContainerStartToken = '{/* Hidden container to render invoices to PDF */}';
const hiddenContainerEndToken = '            </div>\n        </DashboardLayout>';
const hiddenStartIdx = backupText.indexOf(hiddenContainerStartToken);
const hiddenEndIdx = backupText.indexOf(hiddenContainerEndToken, hiddenStartIdx);
const hiddenContainer = backupText.substring(hiddenStartIdx, hiddenEndIdx).trim();

// 3. Update Dashboard Imports
const importsToAdd = `
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import { InvoiceTemplate } from '@/components/invoice-template';
`;
if (!dashboardText.includes('import JSZip')) {
    dashboardText = dashboardText.replace("import { toJpeg } from 'html-to-image';", "import { toJpeg } from 'html-to-image';\n" + importsToAdd.trim());
}

// 4. Update useData
dashboardText = dashboardText.replace(
    'const { bills, payments, companies, securities } = useData();',
    'const { bills, payments, companies, securities, getCompanyLedger } = useData();'
);

// 5. Add Loader2 to lucide-react (if not there)
if (!dashboardText.includes('Loader2')) {
    dashboardText = dashboardText.replace("  Clock\n} from 'lucide-react';", "  Clock,\n  Loader2\n} from 'lucide-react';");
}

// 6. Update state variables
const stateVars = `
  const [exportLoading, setExportLoading] = useState(false);
  const [zipProgressText, setZipProgressText] = useState('');
  const [renderingBill, setRenderingBill] = useState<any>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
`;
if (!dashboardText.includes('const [exportLoading')) {
    dashboardText = dashboardText.replace(
        "const [filterType, setFilterType] = useState('overall');",
        "const [filterType, setFilterType] = useState('overall');\n" + stateVars.trim()
    );
}

// 7. Replace handleExport
const oldExportStartMatch = dashboardText.indexOf('  const handleExport = async () => {');
const oldExportEndMatch = dashboardText.indexOf('  return (\n    <DashboardLayout>', oldExportStartMatch);
if (oldExportStartMatch !== -1 && oldExportEndMatch !== -1) {
    const before = dashboardText.substring(0, oldExportStartMatch);
    const after = dashboardText.substring(oldExportEndMatch);
    dashboardText = before + "  " + zipCode + "\n\n" + after;
}

// 8. Replace Button UI
const buttonRegex = /<Button[\s\S]*?onClick=\{handleExport\}[\s\S]*?<\/Button>/;
const newButton = `<Button
                className="gap-2 shadow-md bg-primary hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto order-1 sm:order-2 disabled:opacity-50 min-w-[150px]"
                onClick={handleExport}
                disabled={exportLoading}
              >
                {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <div className="flex flex-col items-start gap-0">
                  <span>{exportLoading ? 'Exporting...' : 'Export ZIP'}</span>
                  {exportLoading && zipProgressText && <span className="text-[10px] font-normal leading-tight opacity-90 max-w-[120px] truncate">{zipProgressText}</span>}
                </div>
              </Button>`;
dashboardText = dashboardText.replace(buttonRegex, newButton);

// 9. Inject Hidden container
if (!dashboardText.includes('Hidden container to render invoices')) {
    dashboardText = dashboardText.replace(
        '      </div>\n    </DashboardLayout>',
        `\n        ${hiddenContainer}\n      </div>\n    </DashboardLayout>`
    );
}

fs.writeFileSync(dashboardPath, dashboardText, 'utf8');
console.log('Update Complete!');
