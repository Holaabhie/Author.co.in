import fetch from "node-fetch";

async function testUrl(url: string) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.status} ${res.statusText}\n`);
  } catch (e: any) {
    console.error(`Error for ${url}:`, e);
  }
}

async function main() {
  const urls = [
    "https://res.cloudinary.com/dpxirx0mn/image/upload/w_1400,c_scale,q_auto:best,f_auto/author-black-sweatpants-back%201s",
    "https://res.cloudinary.com/dpxirx0mn/image/upload/w_1400,c_scale,q_auto:best,f_auto/author-black-sweatpants-back%202nd",
    "https://res.cloudinary.com/dpxirx0mn/image/upload/w_1400,c_scale,q_auto:best,f_auto/author-black-sweatpants-back%203rd",
  ];

  for (const url of urls) {
    await testUrl(url);
  }
}

main();
