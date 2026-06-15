import fetch from "node-fetch";

async function testUrl(url: string) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Content-Type: ${res.headers.get("content-type")}\n`);
  } catch (e: any) {
    console.error(`Error for ${url}:`, e);
  }
}

async function main() {
  const urls = [
    // Without extension, with transformations
    "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto,dpr_auto,c_fill,w_1200/author-black-sweatpants-back%201s",
    "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto,dpr_auto,c_fill,w_1200/author-black-sweatpants-back%201s.jpg",
    
    // Without transformation
    "https://res.cloudinary.com/dpxirx0mn/image/upload/author-black-sweatpants-back%201s",
    "https://res.cloudinary.com/dpxirx0mn/image/upload/author-black-sweatpants-back%201s.jpg",

    // Versioned, without transformation
    "https://res.cloudinary.com/dpxirx0mn/image/upload/v1781187200/author-black-sweatpants-back%201s",
    "https://res.cloudinary.com/dpxirx0mn/image/upload/v1781187200/author-black-sweatpants-back%201s.jpg",
  ];

  for (const url of urls) {
    await testUrl(url);
  }
}

main();
