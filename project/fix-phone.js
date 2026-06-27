const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/PublicLayout.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/917661820085/g, '918008807506');
content = content.replace(/76618 20085/g, '80088 07506');

fs.writeFileSync(filePath, content);
console.log('Updated phone number');
