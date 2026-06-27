const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/api/booking/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Remove buildAdminEmail, row, capitalise, and sendAdminEmail functions
// Since they span from line 4 to 160, we can use string replace with regex for the entire block.
content = content.replace(/\/\/ ── Email HTML template ──[\s\S]*?\/\/ ── POST \/api\/booking ──/g, '// ── POST /api/booking ──');

// Remove the call to sendAdminEmail
content = content.replace(/\/\/ 5\. Send email notification to admin[\s\S]*?await sendAdminEmail\([\s\S]*?\);/g, '');

fs.writeFileSync(filePath, content);
console.log('Removed email support from booking API');
