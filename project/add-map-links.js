const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/admin/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add MapPin import if missing
if (!content.includes('MapPin,')) {
  content = content.replace(/RefreshCw,/, "RefreshCw,\n  MapPin,");
}

// Add map link to Appointment Requests
content = content.replace(
  /\{apt\.address && <span className="flex items-center gap-1"><Home className="w-3 h-3" \/>\{apt\.address\}<\/span>\}/g,
  `{apt.address && <span className="flex items-center gap-1"><Home className="w-3 h-3" />{apt.address}</span>}
                          {apt.location && (
                            <a href={\`https://maps.google.com/?q=\${apt.location}\`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                              <MapPin className="w-3 h-3" /> View on Map
                            </a>
                          )}`
);

// Add map link to Patient table
content = content.replace(
  /\{p\.age && <p className="text-xs text-gray-400">\{p\.age\}y \{p\.gender \|\| ''\}<\/p>\}/g,
  `{p.age && <p className="text-xs text-gray-400">{p.age}y {p.gender || ''}</p>}
                            {p.location && (
                              <a href={\`https://maps.google.com/?q=\${p.location}\`} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 mt-1 text-blue-600 dark:text-blue-400 hover:underline w-max">
                                <MapPin className="w-3 h-3" /> View Map
                              </a>
                            )}`
);

fs.writeFileSync(filePath, content);
console.log('Successfully added Google Maps links for location data');
