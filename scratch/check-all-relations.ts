import * as fs from "fs";
import * as path from "path";

function main() {
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  const content = fs.readFileSync(schemaPath, "utf-8");
  
  const models = content.split("model ");
  console.log("Auditing relations in schema.prisma...");
  
  for (const m of models) {
    if (!m.trim()) continue;
    const lines = m.split("\n");
    const modelName = lines[0].split("{")[0].trim();
    
    // Check if the model has a relation or field referencing User
    const referencesUser = m.includes("User ") || m.includes("User?") || m.includes("userId") || m.includes("userId?");
    if (referencesUser && modelName !== "User") {
      console.log(`- Model: "${modelName}" has user reference`);
      // Find the specific field names referencing User
      for (const line of lines) {
        if (line.includes("userId") || line.includes("User ") || line.includes("User?")) {
          console.log(`  * Line: ${line.trim()}`);
        }
      }
    }
  }
}

main();
