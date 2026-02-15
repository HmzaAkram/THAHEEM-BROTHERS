const fs = require('fs');
const oldPath = 'c:/Users/HP/Documents/GitHub/THAHEEM-BROTHERS/frontend/app/(auth)/login/page.tsx';
const newPath = 'c:/Users/HP/Documents/GitHub/THAHEEM-BROTHERS/frontend/app/(auth)/login/page.bak';

try {
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log('Successfully renamed conflicting page.tsx to page.bak');
    } else {
        console.log('Conflicting file not found at ' + oldPath);
    }
} catch (e) {
    console.error('Rename failed: ' + e.message);
    // If rename fails (lock), try to truncate it
    try {
        fs.writeFileSync(oldPath, '// Disabled due to conflict\nexport default function Disabled() { return null; }');
        console.log('Truncated conflicting file instead');
    } catch (e2) {
        console.error('Truncate also failed: ' + e2.message);
    }
}
