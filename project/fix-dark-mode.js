const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/admin/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix payment status colors
content = content.replace(/'bg-green-100 text-green-700'/g, "'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900'");
content = content.replace(/'bg-yellow-100 text-yellow-700'/g, "'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-900'");
content = content.replace(/'bg-red-100 text-red-600'/g, "'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900'");

// Fix active tab text and background
content = content.replace(/'text-indigo-700 bg-white shadow-sm border border-indigo-100\/50 ring-1 ring-indigo-50'/g, 
  "'text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 shadow-sm border border-indigo-100/50 dark:border-indigo-900/50 ring-1 ring-indigo-50 dark:ring-indigo-900/50'");

// Fix active icon color
content = content.replace(/text-indigo-600(?!(\/|[a-z0-9-]))/g, "text-indigo-600 dark:text-indigo-400");

// Fix red badges
content = content.replace(/bg-red-50 text-red-600 border-red-200/g, "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50");
content = content.replace(/bg-red-50\/80 backdrop-blur-md border border-red-200\/50 text-red-700/g, "bg-red-50/80 dark:bg-red-950/80 backdrop-blur-md border border-red-200/50 dark:border-red-900/50 text-red-700 dark:text-red-400");

// Fix other specific colors that may be unreadable
content = content.replace(/text-slate-900(?!(\s*dark:text-white|\s*dark:text-slate-100))/g, "text-slate-900 dark:text-white");
content = content.replace(/text-slate-500(?!(\s*dark:text-slate-400))/g, "text-slate-500 dark:text-slate-400");

// Table hover states
content = content.replace(/hover:bg-slate-50(?!(\/|[a-z0-9-]))/g, "hover:bg-slate-50 dark:hover:bg-slate-800/50");

// Input fields and borders
content = content.replace(/bg-white border-slate-200/g, "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700");

// Mobile active tab
content = content.replace(/'bg-slate-900 text-white shadow-md'/g, "'bg-slate-900 dark:bg-indigo-600 text-white shadow-md'");

fs.writeFileSync(filePath, content);
console.log('Successfully fixed colored text visibility in dark mode');
