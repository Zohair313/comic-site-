const fs = require('fs');
const path = require('path');
const srcDir = 'd:/gryfire studiio/webapp/src';

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walkDir(filePath);
        } else {
            if (file.endsWith('.jsx') || file.endsWith('.js')) {
                let content = fs.readFileSync(filePath, 'utf-8');
                content = content.replace(/"\/images\//g, '"images/').replace(/'\/images\//g, "'images/");
                content = content.replace(/"\/assets\//g, '"assets/').replace(/'\/assets\//g, "'assets/");
                fs.writeFileSync(filePath, content, 'utf-8');
            } else if (file.endsWith('.css')) {
                let content = fs.readFileSync(filePath, 'utf-8');
                content = content.replace(/url\("\/assets\//g, 'url("/comic-site-/assets/');
                content = content.replace(/url\('\/assets\//g, 'url(\'/comic-site-/assets/');
                fs.writeFileSync(filePath, content, 'utf-8');
            }
        }
    }
}
walkDir(srcDir);
console.log('Fixed asset paths');
