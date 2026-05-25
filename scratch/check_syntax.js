const { execSync } = require('child_process');

try {
    console.log("Checking properties.js syntax...");
    execSync('node --check "js/tools/properties.js"');
    console.log("properties.js: Syntax OK!");
    
    console.log("Checking products.js syntax...");
    execSync('node --check "js/tools/products.js"');
    console.log("products.js: Syntax OK!");
} catch (e) {
    console.error("Syntax Error found!");
    console.error(e.stderr ? e.stderr.toString() : e.message);
    process.exit(1);
}
