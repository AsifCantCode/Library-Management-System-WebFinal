document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchTitle');
    searchInput.addEventListener('input', () => {
        searchBooks();
    });
    const filterDropdown = document.getElementById('availabilityFilter');
    filterDropdown.addEventListener('change', () => {
        applyFilter();
    });
});
async function applyFilter() {
    try {
        const filter = document.getElementById('availabilityFilter').value;
        const searchQuery = document.getElementById('searchTitle').value.trim().toLowerCase();
        const response = await fetch(`/api/books?filter=${filter}&keyword=${searchQuery}`);
        const data = await response.json();

        if (response.ok) {
            updateBookList(data);
        } else {
            console.error('Failed to fetch book list:', data.message);
        }
    } catch (error) {
        console.error('Error fetching book list:', error.message);
    }
}
function updateBookList(books) {
    const bookList = document.getElementById('bookList');
    bookList.innerHTML = '';

    books.forEach(book => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item');
        listItem.textContent = `${book.title} by ${book.author} - Genre: ${book.genre}`;
        bookList.appendChild(listItem);
    });
}
// Add Book function for librarian role
async function addBook() {
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const genre = document.getElementById('genre').value;
    const description = document.getElementById('description').value; // Added description field

    try {
        const token = localStorage.getItem('authToken');
        console.log('Authentication Token:', token);

        const response = await fetch('/api/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ title, author, genre, description }), // Include description in the request body
        });

        console.log('Server Response:', response);

        if (!response.ok) {
            const data = await response.json().catch(() => null);
            console.error('Failed to add book. Server response:', data);
            alert(`Failed to add book: ${data?.message || 'Unknown error'}`);
            return;
        }

        const data = await response.json();

        alert(`Book added successfully: ${data.title} by ${data.author}`);
        // Redirect to the librarian page
        window.location.href = '/librarian.html';
    } catch (error) {
        console.error('Error adding book:', error.message);
        alert('Failed to add book. Please try again.');
    }
}

async function deleteBook() {
    const deleteTitle = document.getElementById('deleteTitle').value;

    try {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`/api/books/${deleteTitle}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const contentType = response.headers.get('content-type');
        const isJSON = contentType && contentType.includes('application/json');

        if (isJSON) {
            const data = await response.json();

            if (response.ok) {
                alert(`Book deleted successfully: ${data.deletedBook.title} by ${data.deletedBook.author}`);
                // Refresh the book list
                getBookList();
            } else {
                alert(`Failed to delete book: ${data.message}`);
            }
        } else {
            const textData = await response.text();
            alert(`Non-JSON response: ${textData}`);
        }
    } catch (error) {
        console.error('Error deleting book:', error.message);
        alert('Failed to delete book. Please try again.');
    }
}

// Function to get and display the book list
async function getBookList() {
    try {
        const response = await fetch('/api/books');
        const data = await response.json();

        if (response.ok) {
            const bookList = document.getElementById('bookList');
            // Clear existing book list items
            bookList.innerHTML = '';

            data.forEach(book => {
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item');
                listItem.textContent = `${book.title} by ${book.author} - Genre: ${book.genre}`;
                bookList.appendChild(listItem);
            });
        } else {
            console.error('Failed to fetch book list:', data.message);
        }
    } catch (error) {
        console.error('Error fetching book list:', error.message);
    }
}

async function searchBooks() {
    try {
        const searchQuery = document.getElementById('searchTitle').value.trim().toLowerCase();
        const response = await fetch(`/api/books?keyword=${searchQuery}`);
        const data = await response.json();

        if (response.ok) {
            const bookList = document.getElementById('bookList');
            // Clear existing book list items
            bookList.innerHTML = '';

            // Add new book list items
            data.forEach(book => {
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item');
                listItem.textContent = `${book.title} by ${book.author} - Genre: ${book.genre}`;
                bookList.appendChild(listItem);
            });
        } else {
            console.error('Failed to fetch book list:', data.message);
        }
    } catch (error) {
        console.error('Error fetching book list:', error.message);
    }
}

// Attach the function to the search button or input change event
document.getElementById('searchTitle').addEventListener('input', searchBooks);

// Call getBookList on page load to initially populate the book list
applyFilter();
getBookList();
