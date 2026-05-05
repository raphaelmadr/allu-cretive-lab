const fs = require('fs');
const path = require('path');
const https = require('https');

const productsPath = path.join(__dirname, '..', 'assets', 'products.js');
const productsDir = path.join(__dirname, '..', 'assets', 'products');

if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true });
}

let content = fs.readFileSync(productsPath, 'utf8');
const startMatch = content.indexOf('[');
const endMatch = content.lastIndexOf(']');
const productsJson = content.slice(startMatch, endMatch + 1);

let products = JSON.parse(productsJson);

async function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(dest)) {
            // console.log(`Skipping existing file: ${dest}`);
            return resolve();
        }

        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded: ${dest}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

async function run() {
    console.log(`Processing ${products.length} products...`);
    
    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (!p.img) continue;

        const filename = slugify(p.name) + '.png';
        const localPath = `./assets/products/${filename}`;
        const absolutePath = path.join(productsDir, filename);

        try {
            await downloadImage(p.img, absolutePath);
            p.local_img = localPath;
        } catch (err) {
            console.error(`Error downloading ${p.name}: ${err.message}`);
        }
        
        if (i % 10 === 0) console.log(`Progress: ${i}/${products.length}`);
    }

    const newContent = `window.alluProducts = ${JSON.stringify(products, null, 4)};\n`;
    fs.writeFileSync(productsPath, newContent);
    console.log('All set! products.js updated.');
}

run();
