const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/admin/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace standard colors with dark mode variants
content = content.replace(/bg-white(?!(\/|[a-z0-9-]))/g, 'bg-white dark:bg-slate-900');
content = content.replace(/text-slate-900/g, 'text-slate-900 dark:text-white');
content = content.replace(/text-slate-800/g, 'text-slate-800 dark:text-slate-100');
content = content.replace(/text-slate-700/g, 'text-slate-700 dark:text-slate-200');
content = content.replace(/text-slate-600/g, 'text-slate-600 dark:text-slate-300');
content = content.replace(/text-slate-500/g, 'text-slate-500 dark:text-slate-400');
content = content.replace(/text-gray-900/g, 'text-gray-900 dark:text-white');
content = content.replace(/text-gray-800/g, 'text-gray-800 dark:text-gray-100');
content = content.replace(/text-gray-700/g, 'text-gray-700 dark:text-gray-200');
content = content.replace(/text-gray-600/g, 'text-gray-600 dark:text-gray-300');
content = content.replace(/text-gray-500/g, 'text-gray-500 dark:text-gray-400');

content = content.replace(/bg-slate-50(?!(\/|[a-z0-9-]))/g, 'bg-slate-50 dark:bg-slate-900/50');
content = content.replace(/bg-slate-100(?!(\/|[a-z0-9-]))/g, 'bg-slate-100 dark:bg-slate-800/50');
content = content.replace(/bg-gray-50(?!(\/|[a-z0-9-]))/g, 'bg-gray-50 dark:bg-slate-900/50');
content = content.replace(/bg-gray-100(?!(\/|[a-z0-9-]))/g, 'bg-gray-100 dark:bg-slate-800/50');

content = content.replace(/border-slate-100/g, 'border-slate-100 dark:border-slate-800');
content = content.replace(/border-slate-200/g, 'border-slate-200 dark:border-slate-800');
content = content.replace(/border-gray-100/g, 'border-gray-100 dark:border-slate-800');
content = content.replace(/border-gray-200/g, 'border-gray-200 dark:border-slate-800');

// Fix global background
content = content.replace(/bg-\[#F8FAFC\] bg-\[radial-gradient\(ellipse_at_top,_var\(--tw-gradient-stops\)\)\] from-indigo-50\/50 via-white to-cyan-50\/50/g, 
  'bg-[#F8FAFC] dark:bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-cyan-50/50 dark:from-indigo-950/20 dark:via-slate-950 dark:to-cyan-950/20');

// Insert ThemeToggle import
if (!content.includes('import { ThemeToggle }')) {
  content = content.replace(/import \{ formatCurrency/g, "import { ThemeToggle } from '@/components/ThemeToggle';\nimport { formatCurrency");
}

// Insert ThemeToggle component in header
content = content.replace(
  /<div className="flex items-center gap-2 bg-slate-50/g,
  '<ThemeToggle />\n            <div className="flex items-center gap-2 bg-slate-50'
);

fs.writeFileSync(filePath, content);
console.log('Successfully updated page.tsx with dark mode classes');
