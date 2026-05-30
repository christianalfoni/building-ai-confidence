import { readFileSync, writeFileSync } from 'fs';

const html = readFileSync('dist/client/index.html', 'utf-8');
const escaped = JSON.stringify(html);
writeFileSync('src/html-template.gen.ts', `export const htmlTemplate = ${escaped};\n`);
