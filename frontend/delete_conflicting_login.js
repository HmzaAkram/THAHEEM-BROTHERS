const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'HP', 'Documents', 'GitHub', 'THAHEEM-BROTHERS', 'frontend', 'app', '(auth)', 'login');

function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                try {
                    fs.unlinkSync(curPath);
                    console.log(`Successfully deleted file: ${curPath}`);
                } catch (err) {
                    console.error(`Failed to delete file: ${curPath}. Error: ${err.message}`);
                }
            }
        });
        try {
            fs.rmdirSync(folderPath);
            console.log(`Successfully deleted folder: ${folderPath}`);
        } catch (err) {
            console.error(`Failed to delete folder: ${folderPath}. Error: ${err.message}`);
        }
    } else {
        console.log(`Path does not exist: ${folderPath}`);
    }
}

console.log(`Attempting to delete conflicting login directory: ${targetPath}`);
deleteFolderRecursive(targetPath);
