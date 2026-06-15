import * as fs from "fs";
import * as path from "path";

function main() {
  const jsonPath = path.join(process.cwd(), "scratch", "all-resources.json");
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  console.log("Searching resources in all-resources.json for 'author-black-sweatpants-back' or 'back' mappings...");
  
  for (const item of data) {
    const serialized = JSON.stringify(item).toLowerCase();
    if (
      serialized.includes("author-black-sweatpants-back") ||
      serialized.includes("sweatpants-back") ||
      serialized.includes("sweatpants")
    ) {
      console.log(`\nMatched Resource: "${item.public_id}"`);
      console.log(`- Tags: ${JSON.stringify(item.tags)}`);
      console.log(`- Context: ${JSON.stringify(item.context)}`);
      if (item.context && item.context.custom) {
        console.log(`- Custom context: ${JSON.stringify(item.context.custom)}`);
      }
    }
  }
}

main();
