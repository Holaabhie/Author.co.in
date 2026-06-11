const pg = require("pg");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Connection error details:", err);
  } else {
    console.log("Connected successfully to DB!");
    release();
  }
  process.exit(0);
});
