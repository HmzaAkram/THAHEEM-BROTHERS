const fs = require('fs');
const path = 'c:/Users/HP/Documents/GitHub/THAHEEM-BROTHERS/frontend/app/login';
const testPath = 'c:/Users/HP/Documents/GitHub/THAHEEM-BROTHERS/frontend/app/dummy_test';

try {
    if (fs.existsSync(path)) {
        fs.rmSync(path, { recursive: true, force: true });
        console.log('Successfully deleted app/login');
    } else {
        console.log('app/login does not exist');
    }

    if (fs.existsSync(testPath)) {
        fs.rmSync(testPath, { recursive: true, force: true });
        console.log('Successfully deleted app/dummy_test');
    }
} catch (e) {
    console.error('Error during deletion:', e.message);
}
