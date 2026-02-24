const bcrypt = require('bcrypt');

async function hashPassword() {
  const hash = await bcrypt.hash("123456", 10);
  console.log("Hashed password:");
  console.log(hash);
}

hashPassword();