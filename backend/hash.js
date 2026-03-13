const bcrypt = require('bcrypt');

async function hashPassword() {
    const password = "123456";
    
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        
        console.log("Password gốc:", password);
        console.log("Hash:", hash);
        
        return hash;
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

hashPassword();