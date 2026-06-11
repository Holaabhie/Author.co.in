const fs = require('fs');
const path = require('path');

const files = [
  "src/app/admin/login/page.tsx",
  "src/app/admin/settings/page.tsx",
  "src/app/admin/returns/page.tsx",
  "src/app/admin/orders/page.tsx",
  "src/app/admin/media/page.tsx",
  "src/app/admin/products/page.tsx",
  "src/app/admin/categories/page.tsx",
  "src/app/admin/products/new/page.tsx",
  "src/app/admin/products/[id]/page.tsx",
  "src/app/admin/orders/[id]/page.tsx",
  "src/app/admin/brands/page.tsx",
  "src/app/admin/coupons/page.tsx",
  "src/app/admin/cms/page.tsx",
];

function removeToastSuccess(content, filePath) {
  let index = 0;
  let count = 0;
  while (true) {
    index = content.indexOf('toast.success(', index);
    if (index === -1) break;
    
    let openCount = 1;
    let scanIndex = index + 'toast.success('.length;
    let inString = null;
    
    while (scanIndex < content.length && openCount > 0) {
      const char = content[scanIndex];
      const prevChar = content[scanIndex - 1];
      
      if (inString) {
        if (char === inString && prevChar !== '\\') {
          inString = null;
        }
      } else {
        if (char === '"' || char === "'" || char === '`') {
          inString = char;
        } else if (char === '(') {
          openCount++;
        } else if (char === ')') {
          openCount--;
        }
      }
      scanIndex++;
    }
    
    if (openCount === 0) {
      let endStmt = scanIndex;
      if (content[endStmt] === ';') {
        endStmt++;
      }
      
      const statement = content.substring(index, endStmt);
      console.log(`[${filePath}] Removing: ${statement}`);
      
      // Let's replace the statement with a comment.
      content = content.substring(0, index) + '/* success toast removed */' + content.substring(endStmt);
      index = index + '/* success toast removed */'.length;
      count++;
    } else {
      index += 'toast.success('.length;
    }
  }
  return { content, count };
}

console.log("Starting toast removal...");
let total = 0;
for (const file of files) {
  const absolutePath = path.resolve(__dirname, '..', file);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`File does not exist: ${absolutePath}`);
    continue;
  }
  
  const content = fs.readFileSync(absolutePath, 'utf8');
  const result = removeToastSuccess(content, file);
  if (result.count > 0) {
    fs.writeFileSync(absolutePath, result.content, 'utf8');
    console.log(`Updated ${file} - removed ${result.count} toasts`);
    total += result.count;
  }
}
console.log(`Done! Removed ${total} success toasts.`);
