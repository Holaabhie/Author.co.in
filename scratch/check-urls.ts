import fetch from "node-fetch"; // or standard global fetch in newer Node

async function main() {
  const urls = [
    "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto,dpr_auto,c_fill,w_1200/author-black-sweatpants-back%201s",
    "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto,dpr_auto,c_fill,w_1200/author-black-sweatpants-back%202nd",
    "https://res.cloudinary.com/dpxirx0mn/image/upload/f_auto,q_auto,dpr_auto,c_fill,w_1200/author-black-sweatpants-back%203rd",
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      console.log(`URL: ${url}`);
      console.log(`Status: ${res.status} ${res.statusText}`);
      console.log(`Content-Type: ${res.headers.get("content-type")}\n`);
    } catch (e) {
      console.error(`Error fetching ${url}:`, e);
    }
  }
}

main();
