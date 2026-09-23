const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Hash generado para "admin123":');
    console.log(hash);
}

generateHash();
