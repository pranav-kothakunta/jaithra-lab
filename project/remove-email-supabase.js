const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'supabase/functions/admin-api/index.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\/\/ Try sending via email service if configured[\s\S]*?console\.error\("Email send error:", emailError\);\n\s*}\n\s*}/g, '');

fs.writeFileSync(filePath, content);
console.log('Removed email support from Supabase Edge Function');
