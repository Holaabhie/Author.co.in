async function main() {
  const res = await fetch("http://localhost:3001/api/products/author-essential-sweatpants");
  const data = await res.json();
  console.log("Status:", res.status);
  const p = data.data;
  console.log(`Product: ${p.name} | Slug: ${p.slug}`);
  console.log("Images:");
  for (const img of p.images || []) {
    console.log(`  - URL: ${img.url} | publicId: ${img.publicId} | color: ${img.color} | sortOrder: ${img.sortOrder}`);
  }
}

main().catch(console.error);
