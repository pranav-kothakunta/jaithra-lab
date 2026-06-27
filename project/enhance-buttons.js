const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/admin/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Desktop Navigation Tabs
content = content.replace(
  /'text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 shadow-sm border border-indigo-100\/50 dark:border-indigo-900\/50 ring-1 ring-indigo-50 dark:ring-indigo-900\/50'/g,
  "'text-white bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/25 border-transparent'"
);
// Tab icon color when active
content = content.replace(/text-indigo-600 dark:text-indigo-400/g, "text-white");

// 2. Mobile Navigation Tabs
content = content.replace(
  /'bg-slate-900 dark:bg-indigo-600 text-white shadow-md'/g,
  "'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 border-transparent'"
);

// 3. Table action buttons ("View Details", "Add Result", "Generate Bill")
// Currently they look like: bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-blue-700 ... hover:bg-slate-50
// I will replace `hover:bg-slate-50 dark:hover:bg-slate-800/50` for buttons with gradient hovers where applicable, 
// but it's easier to just find `border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50` 
// and change it. Let's do a more generic replace for standard buttons.

content = content.replace(
  /hover:bg-slate-50 dark:hover:bg-slate-800\/50/g,
  "hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
);

// Add transition-all to any button that doesn't have it
content = content.replace(/<button([^>]*?)className="([^"]*?)"/g, (match, p1, p2) => {
  if (!p2.includes('transition-all') && !p2.includes('transition-colors')) {
    return `<button${p1}className="${p2} transition-all duration-300"`;
  }
  return match;
});

// For forms (Save / Submit buttons)
content = content.replace(
  /bg-blue-600 hover:bg-blue-700/g,
  "bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 shadow-md hover:shadow-lg transition-all duration-300"
);

content = content.replace(
  /bg-slate-900 text-white hover:bg-slate-800/g,
  "bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 text-white hover:shadow-lg transition-all duration-300"
);

// Form buttons in Add Patient/Test/Payment might be using standard UI Button if they exist, but we use native buttons
content = content.replace(
  /className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"/g,
  'className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"'
);

// "Refresh" Button
content = content.replace(
  /hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300/g, // Replaced earlier
  "hover:bg-gradient-to-r hover:from-indigo-500 hover:to-cyan-500 hover:text-white hover:border-transparent hover:shadow-md transition-all duration-300"
);

// Ensure the profile dropdown / logout button doesn't get messed up
// It's a Button component from UI library.

fs.writeFileSync(filePath, content);
console.log('Applied gradient styles and transitions to tabs and buttons');
