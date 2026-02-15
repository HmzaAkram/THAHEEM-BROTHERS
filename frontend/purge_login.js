const fs = require('fs');
const path = require('path');

const targetDir = 'c:/Users/HP/Documents/GitHub/THAHEEM-BROTHERS/frontend/app/login';

function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
        console.log(`Deleted: ${folderPath}`);
    } else {
        console.log(`Path not found: ${folderPath}`);
    }
}

try {
    deleteFolderRecursive(targetDir);
} catch (e) {
    console.error(`Error deleting ${targetDir}: ${e.message}`);
    // If it fails, try to just rename the file inside to something neutral
    try {
        const pagePath = path.join(targetDir, 'page.tsx');
        if (fs.existsSync(pagePath)) {
            fs.renameSync(pagePath, path.join(targetDir, 'page.disabled.tsx'));
            console.log('Renamed page.tsx to page.disabled.tsx');
        }
    } catch (e2) {
        console.error('Rename also failed');
    }
}
