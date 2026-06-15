const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
console.log('JSON.stringify of privateKey:', JSON.stringify(privateKey));

if (privateKey) {
  // Let's test if there is a trailing or leading issue, or extra quotes
  try {
    crypto.createPrivateKey(privateKey);
    console.log('✔ Parse success without changes');
  } catch (err) {
    console.log('❌ Parse fail without changes:', err.message);
  }

  // Let's try replacing \\n with \n (which should work if it has literal backslash + n)
  const replaceEscaped = privateKey.replace(/\\n/g, '\n');
  try {
    crypto.createPrivateKey(replaceEscaped);
    console.log('✔ Parse success after replacing \\n with \\n');
  } catch (err) {
    console.log('❌ Parse fail after replacing \\n with \\n:', err.message);
  }

  // What if we clean the newlines? Sometimes there are actual \r\n or double quotes inside the string itself.
  // Let's print the first 100 and last 100 characters
  console.log('First 100:', privateKey.substring(0, 100));
  console.log('Last 100:', privateKey.substring(privateKey.length - 100));
}
