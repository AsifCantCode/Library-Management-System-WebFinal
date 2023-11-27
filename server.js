const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3000;

mongoose.connect('mongodb://localhost/library', {});

const bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    genre: String,
    description: String,
    available: {
        type: Boolean,
        default: true,
    },
    borrowedBy: String,
    borrowedDeadline: Date,
    fine: {
        type: Number,
        default: 0,  // Set the default value to 0
    },
    paidAmount: {
        type: Number,
        default: 0,
    },
    isFinePaid: {
        type: Boolean,
        default: false,
    },
    borrowCount: { type: Number, default: 0 },
});

const Book = mongoose.model('Book', bookSchema);

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    role: String,
    accountBalance: {
        type: Number,
        default: 1000, // Set the default account balance to 1000
    },
});

const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());
app.use(express.static(__dirname));

// Middleware to authenticate tokens
const authenticateToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).send('Access denied.');

    jwt.verify(token, 'secret', (err, user) => {
        if (err) return res.status(403).send('Invalid token.');
        req.user = user;
        next();
    });
};

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/return-book/:bookId', authenticateToken, async (req, res) => {
    const { bookId } = req.params;

    try {
        const borrowedBook = await Book.findById(bookId);

        if (!borrowedBook) {
            return res.status(404).json({ message: 'Borrowed book not found' });
        }

        if (borrowedBook.borrowedBy !== req.user.username) {
            return res.status(403).json({ message: 'Unauthorized to return this book' });
        }

        if (borrowedBook.isFinePaid) {
            return res.status(400).json({ message: 'Fine already paid for this book. Use the pay fine process.' });
        }

        // Mark the book as available and reset borrowedBy and borrowedDeadline
        borrowedBook.available = true;
        borrowedBook.borrowedBy = null;
        borrowedBook.borrowedDeadline = null;

        // Save the changes
        await borrowedBook.save();

        res.json({ message: 'Book returned successfully' });
    } catch (error) {
        console.error('Error returning book:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
app.post('/api/pay-fine/:bookId', authenticateToken, async (req, res) => {
    const { bookId } = req.params;

    try {
        const borrowedBook = await Book.findById(bookId);

        if (!borrowedBook) {
            return res.status(404).json({ message: 'Borrowed book not found' });
        }

        if (borrowedBook.borrowedBy !== req.user.username) {
            return res.status(403).json({ message: 'Unauthorized to pay fine for this book' });
        }

        if (borrowedBook.isFinePaid) {
            return res.status(400).json({ message: 'Fine already paid for this book' });
        }

        const fine = 60;

        const user = await User.findOne({ username: req.user.username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.accountBalance < fine) {
            return res.status(400).json({ message: 'Insufficient account balance to pay fine' });
        }

        // Update the user's balance, set isFinePaid to true, set fine to zero, and make the book available
        borrowedBook.paidAmount = fine;
        borrowedBook.isFinePaid = true;
        borrowedBook.fine = 0;
        borrowedBook.available = true;
        borrowedBook.borrowedBy = null;
        borrowedBook.borrowedDeadline = null;

        // Save the changes
        await borrowedBook.save();

        // Deduct the remaining fine from the user's account balance
        user.accountBalance -= fine;

        // Save the user changes
        await user.save();

        res.json({ message: 'Fine payment successful', remainingBalance: user.accountBalance });
    } catch (error) {
        console.error('Error processing fine payment:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const token = jwt.sign({ username, role: user.role }, 'secret');

        res.json({ user: { username, role: user.role }, token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'An error occurred during login' });
    }
});


// Catalog Management Routes

// Add a book for librarian role
app.post('/api/books', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'librarian') {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        const { title, author, genre, description } = req.body;
        const book = new Book({ title, author, genre, description });
        await book.save();
        res.status(201).json(book);
    } catch (error) {
        res.status(500).json({ message: 'Error adding book', error: error.message });
    }
});
app.get('/api/books', async (req, res) => {
    try {
        const { keyword, filter } = req.query;
        
        let filterCondition = {};
        if (filter === 'available') {
            filterCondition = { available: true };
        } else if (filter === 'borrowed') {
            filterCondition = { available: false };
        }

        const keywordFilter = keyword ? {
            $or: [
                { title: { $regex: keyword, $options: 'i' } },
                { author: { $regex: keyword, $options: 'i' } },
            ]
        } : {};

        const books = await Book.find({ ...filterCondition, ...keywordFilter });
        res.json(books);
    } catch (error) {
        res.status(500).send(error.message);
    }
});
app.delete('/api/books/:title', authenticateToken, async (req, res) => {
    try {
        // Check if the user has the librarian role
        if (req.user.role !== 'librarian') {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        const { title } = req.params;

        if (!title) {
            return res.status(400).json({ message: 'Title is required for book deletion' });
        }

        const deletedBook = await Book.findOneAndDelete({ title });

        if (!deletedBook) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.json({ deletedBook });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete book' });
    }
});


app.post('/api/users', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, role });
        await user.save();

        const token = jwt.sign({ username, role }, 'secret');
        res.status(201).json({ user, token });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// Get all users (requires authentication)
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// Update the borrow route in your server code
app.post('/api/borrow/:title', authenticateToken, async (req, res) => {
    try {
        const { title } = req.params;
        const { username } = req.user;

        // Check if the book is available
        const book = await Book.findOne({ title, available: true });

        if (!book) {
            return res.status(404).json({ message: 'Book not available for borrowing' });
        }

        // Calculate the borrowed deadline (7 days from now)
        const borrowedDeadline = new Date();
        borrowedDeadline.setDate(borrowedDeadline.getDate() + 7);

        // Calculate the fine based on the borrowed deadline
        const fine = calculateFine(borrowedDeadline);

        // Update the book document
        book.available = false;
        book.borrowedBy = username;
        book.borrowedDeadline = borrowedDeadline;
        book.fine = fine;
        book.isFinePaid = false;
        book.borrowCount += 1;

        await book.save();

        res.status(201).json({ borrowedBook: book });
    } catch (error) {
        console.error('Error borrowing book:', error);
        res.status(500).json({ message: 'An error occurred during book borrowing' });
    }
});

// Function to calculate fines based on overdue days
function calculateFine(borrowedDeadline) {
    const today = new Date();
    const overdueDays = Math.max(0, Math.floor((today - borrowedDeadline) / (1000 * 60 * 60 * 24)));
    const finePerDay = 20; // Adjust this value based on your requirement
    return overdueDays * finePerDay;
}

app.get('/api/books/borrowed', authenticateToken, async (req, res) => {
    try {
        const borrowedBooks = await Book.find({ borrowedBy: req.user.username });

        res.json(borrowedBooks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching borrowed books', error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
