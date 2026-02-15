const fs = require('fs');
const target = 'c:/Users/HP/Documents/GitHub/THAHEEM-BROTHERS/frontend/app/(auth)/login/page.tsx';

try {
    fs.writeFileSync(target, '// Disabled to resolve conflict\nexport const metadata = {};\n// No default export here\n');
    console.log('Successfully truncated the file content to remove default export');
} catch (e) {
    console.error('Truncation failed: ' + e.message);
}
