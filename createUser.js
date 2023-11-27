const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

mongoose.connect('mongodb://localhost/library', {
});

const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    password: String,
    role: String,
}));

async function createUser() {
    const hashedPassword = await bcrypt.hash('1234', 10);  // Replace with a strong password
    const librarian = new User({
        username: 'asif',
        password: hashedPassword,
        role: 'user',
    });

    await librarian.save();
    console.log('User created successfully');
    mongoose.connection.close();
}

createUser();