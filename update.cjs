const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'components', 'NewComicsSection.jsx');
const outDir = path.join(__dirname, 'public', 'assets', 'extracted');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

let content = fs.readFileSync(cssPath, 'utf8');

// Match data:mime/type;base64,.....
const regex = /data:(image|font|application)\/([a-zA-Z0-9\-]+);(?:charset=[^;]+;)?base64,([^"']+)/g;

let count = 0;
content = content.replace(regex, (match, mime, ext, base64Data) => {
  if (ext === 'x-font-woff') ext = 'woff';
  
  const buffer = Buffer.from(base64Data, 'base64');
  const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);
  const filename = `extracted_${count}_${hash}.${ext}`;
  const outPath = path.join(outDir, filename);
  
  fs.writeFileSync(outPath, buffer);
  count++;
  
  return `/assets/extracted/${filename}`;
});

fs.writeFileSync(cssPath, content, 'utf8');
console.log(`Extracted ${count} assets. New filesize: ${content.length} bytes`);
