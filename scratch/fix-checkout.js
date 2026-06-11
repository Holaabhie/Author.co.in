const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/checkout/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const isCrlf = content.includes('\r\n');
const lines = content.split(/\r?\n/);

// Line 431 is index 430
const line431 = lines[430];
console.log("Line 431 content:", JSON.stringify(line431));

if (line431.trim() === '</div>') {
  // Replace line 431 with two closing divs
  lines[430] = '                          </div>\n                        </div>';
  
  const separator = isCrlf ? '\r\n' : '\n';
  fs.writeFileSync(filePath, lines.join(separator), 'utf8');
  console.log("Successfully replaced line 431!");
} else {
  console.log("Error: Line 431 is not </div>");
}
