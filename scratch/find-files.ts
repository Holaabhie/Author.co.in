import * as fs from "fs";
import * as path from "path";

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    if (file === "node_modules" || file === ".next" || file === ".git" || file === ".vercel") {
      return;
    }
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function main() {
  const files = getAllFiles(process.cwd());
  console.log(`Found ${files.length} files in workspace:`);
  for (const f of files) {
    const rel = path.relative(process.cwd(), f);
    if (
      rel.endsWith(".json") ||
      rel.endsWith(".md") ||
      rel.endsWith(".txt") ||
      rel.includes("mapping") ||
      rel.includes("media")
    ) {
      console.log(`- ${rel}`);
    }
  }
}

main();
