const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// The output path for the zip file
const outputZip = path.join(__dirname, '..', 'deploy.zip');
// The directory to zip
const sourceDir = path.join(__dirname, '..', 'out');

// Check if 'out' directory exists
if (!fs.existsSync(sourceDir)) {
    console.error('Error: "out" directory does not exist. Please run "npm run build" first.');
    process.exit(1);
}

// Create a file to stream archive data to
const output = fs.createWriteStream(outputZip);
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level. (highest)
});

// Listen for all archive data to be written
output.on('close', function () {
    console.log(`\n✅ Success! ${archive.pointer()} total bytes written.`);
    console.log(`The 'deploy.zip' file is ready to be uploaded to cPanel.`);
    console.log(`When extracted in cPanel's public_html, its contents will be placed directly in the root directory.\n`);
});

// good practice to catch warnings
archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
        console.warn('Warning:', err);
    } else {
        throw err;
    }
});

// good practice to catch this error explicitly
archive.on('error', function (err) {
    throw err;
});

// Pipe archive data to the file
archive.pipe(output);

console.log('Zipping contents of "out" folder... Please wait.');

// Append files from the source directory, placing them at the ROOT of the zip
archive.directory(sourceDir, false);

// Finalize the archive (i.e. we are done appending files but streams have to finish yet)
archive.finalize();
