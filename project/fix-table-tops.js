const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/admin/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix "New Patient" button in dashboard to be visibly bright in dark mode
content = content.replace(
  /bg-white dark:bg-slate-900 px-6 py-3 text-sm font-bold text-indigo-900 shadow-lg shadow-white\/20 transition-all hover:bg-gradient-to-r hover:from-indigo-500 hover:to-cyan-500 hover:text-white hover:border-transparent hover:shadow-md transition-all duration-300 dark:bg-slate-900\/50 hover:scale-105/g,
  "bg-white px-6 py-3 text-sm font-bold text-indigo-900 shadow-lg shadow-white/20 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-cyan-500 hover:text-white hover:border-transparent hover:shadow-md hover:scale-105 transition-all duration-300"
);

// Fix table top backgrounds and hovers that were missed (gray-50)
content = content.replace(/bg-gray-50\/50(?!(\s*dark:bg-slate-900\/50))/g, "bg-gray-50/50 dark:bg-slate-900/50");
content = content.replace(/hover:bg-gray-50\/50(?!(\s*dark:hover:bg-slate-900\/50))/g, "hover:bg-gray-50/50 dark:hover:bg-slate-900/50");

// Fix border-gray-50 which might also be visible in dark mode
content = content.replace(/border-gray-50(?!(\/|[a-z0-9-]|\s*dark:border-slate-800))/g, "border-gray-50 dark:border-slate-800");
content = content.replace(/border-gray-100(?!(\/|[a-z0-9-]|\s*dark:border-slate-800))/g, "border-gray-100 dark:border-slate-800");

fs.writeFileSync(filePath, content);
console.log('Fixed New Patient button visibility and table top dark mode backgrounds');
