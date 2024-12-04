import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

const currentDir = __dirname;
const allFiles = getAllFiles(currentDir);

const IMAGE_CACHE_URLS = allFiles.map(file => 
    '/' + path.relative(currentDir, file).replace(/\\/g, '/')
);

console.log('const IMAGE_CACHE_URLS = [');
IMAGE_CACHE_URLS.forEach(url => console.log(`  '${url}',`));
console.log('];');

// Optionally, write to a file
fs.writeFileSync('IMAGE_CACHE_URLS.js', `export const IMAGE_CACHE_URLS = ${JSON.stringify(IMAGE_CACHE_URLS, null, 2)};`);
console.log('\nIMAGE_CACHE_URLS.js file has been created.');