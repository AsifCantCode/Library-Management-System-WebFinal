const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

mongoose.connect('mongodb://localhost/library', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    password: String,
    role: String,
}));

async function createLibrarian() {
    const hashedPassword = await bcrypt.hash('1234', 10);  // Replace with a strong password
    const librarian = new User({
        username: 'Lib2',
        password: hashedPassword,
        role: 'librarian',
    });

    await librarian.save();
    console.log('Librarian created successfully');
    mongoose.connection.close();
}

createLibrarian();