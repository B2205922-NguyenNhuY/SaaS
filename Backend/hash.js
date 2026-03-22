// hash-password.js
const bcrypt = require('bcrypt');

const password = '123456';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Original password:', password);
    console.log('Hashed password:', hash);
    console.log('\nCopy this hash to your database:');
    console.log(hash);
});