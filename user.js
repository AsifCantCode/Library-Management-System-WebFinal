const notificationContainer = document.createElement('div');
notificationContainer.id = 'notification-container';
document.body.appendChild(notificationContainer);


function displayNotification(message) {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification-box';
    notificationDiv.innerHTML = `<p>${message}</p>`;

    // Append the notification to the container
    notificationContainer.appendChild(notificationDiv);

    // Optionally, you can set a timeout to remove the notification after a few seconds
    setTimeout(() => {
        notificationContainer.removeChild(notificationDiv);
    }, 10000); // Remove after 5 seconds (adjust as needed)
}

function notifyNewBookAvailable() {
    displayNotification('New books are available!');
}
document.addEventListener('DOMContentLoaded', () => {
    // Attach the function to the search button or input change event
    document.getElementById('search').addEventListener('input', searchBooks);

    // Call getBookList on page load to initially populate the book list
    getBookList();
    getBorrowedBooks();
});

// Function to get and display the book list
// Function to get and display the book list, including popular books
async function getBookList(filter = 'available') {
    try {
        const response = await fetch(`/api/books?filter=${filter}`);
        const data = await response.json();

        if (response.ok) {
            // Sort all books based on borrowCount in descending order
            const sortedBooks = data.sort((a, b) => b.borrowCount - a.borrowCount);

            const bookList = document.getElementById('bookList');
            // Clear existing book list items
            bookList.innerHTML = '';

            // Display all books in the main book list
            sortedBooks.forEach(book => {
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item');
                listItem.textContent = `${book.title} by ${book.author} - Genre: ${book.genre}`;
                listItem.addEventListener('click', () => applyToBorrow(book.title));
                bookList.appendChild(listItem);
            });

            // Display the top 3 popular books in a separate section
            displayPopularBooks(sortedBooks.slice(0, 3));
        } else {
            console.error('Failed to fetch book list:', data.message);
        }
    } catch (error) {
        console.error('Error fetching book list:', error.message);
    }
}

// Function to display the top 3 popular books
// Function to display the top 3 popular books
function displayPopularBooks(popularBooks) {
    const popularBooksSection = document.getElementById('popularBooks');
    // Clear existing popular books section
    popularBooksSection.innerHTML = '';

    const popularBooksTitle = document.createElement('h2');
    popularBooksTitle.textContent = 'Popular Books';
    popularBooksSection.appendChild(popularBooksTitle);

    const popularBooksList = document.createElement('div');
    popularBooksList.classList.add('popular-books-list'); // Add the custom class
    popularBooksSection.appendChild(popularBooksList);

    // Display each popular book with custom styling
    popularBooks.forEach(book => {
        const bookItem = document.createElement('div');
        bookItem.classList.add('popular-book-item'); // Add the custom class
        bookItem.innerHTML = `
            <div class="popular-book-title">${book.title}</div>
            <div class="popular-book-author">${book.author}</div>
            <div class="popular-book-count">Total Borrows: ${book.borrowCount}</div>
        `;
        popularBooksList.appendChild(bookItem);
    });

    // Display the popular genre
    const popularGenreSection = document.getElementById('popularGenre');
    const popularGenreTitle = document.createElement('h2');
    popularGenreTitle.textContent = 'Popular Genre';
    popularGenreSection.appendChild(popularGenreTitle);

    // Assume the genre is available in the first book of the popularBooks array
    const popularGenre = document.createElement('div');
    popularGenre.classList.add('popular-genre'); // Add the custom class
    popularGenre.textContent = `Genre: ${popularBooks.length > 0 ? popularBooks[0].genre : 'N/A'}`;
    popularGenreSection.appendChild(popularGenre);
}



// Assume you have a function to fetch popular genres from the backend
async function fetchPopularGenres() {
    try {
        const response = await fetch('/api/popular-genres');
        const data = await response.json();

        if (response.ok) {
            displayPopularGenre(data);
        } else {
            console.error('Failed to fetch popular genres:', data.message);
        }
    } catch (error) {
        console.error('Error fetching popular genres:', error.message);
    }
}

// Display popular genres in the UI
function displayPopularGenre(popularGenres) {
    const popularGenreSection = document.getElementById('popularGenre');
    // Clear existing popular genre section
    popularGenreSection.innerHTML = '';

    const popularGenreTitle = document.createElement('h2');
    popularGenreTitle.textContent = 'Popular Genre';
    popularGenreSection.appendChild(popularGenreTitle);

    // Display the first popular genre
    const popularGenre = popularGenres[0];
    if (popularGenre) {
        const genreElement = document.createElement('div');
        genreElement.classList.add('popular-genre'); // Add the custom class
        genreElement.textContent = popularGenre;
        popularGenreSection.appendChild(genreElement);
    }
}

// Fetch and display popular genres on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchPopularGenres();
});


async function applyToBorrow() {
    const borrowTitle = document.getElementById('borrowTitle').value;
    //alert(borrowTitle);

    try {
        const token = localStorage.getItem('authToken');
        // console.log('Authentication Token:', token);

        const response = await fetch(`/api/borrow/${borrowTitle}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        // Check the content type of the response
        const contentType = response.headers.get('content-type');
        const isJSON = contentType && contentType.includes('application/json');

        if (isJSON) {
            const data = await response.json();

            if (response.ok) {
                alert(`Borrow request submitted successfully for ${data.borrowedBook.title} by ${data.borrowedBook.author}`);
                // Refresh the book list
                getBookList();
                getBorrowedBooks();
            } else {
                alert(`Failed to submit borrow request: ${data.message}`);
            }
        } else {
            // Handle non-JSON response (e.g., text or HTML)
            const textData = await response.text();
            alert(`Non-JSON response: ${textData}`);
        }
    } catch (error) {
        console.error('Error applying to borrow:', error.message);
        alert('Failed to apply for borrow. Please try again.');
    }
}

// Function to search for books
async function searchBooks() {
    try {
        const searchQuery = document.getElementById('search').value.trim().toLowerCase();

        if (searchQuery) {
            const response = await fetch(`/api/books?keyword=${searchQuery}`);
            const data = await response.json();

            if (response.ok) {
                displayBooks(data);
            } else {
                console.error('Failed to fetch book list:', data.message);
            }
        } else {
            // If the search bar is empty, show only available books
            getBookList('available');
        }
    } catch (error) {
        console.error('Error fetching book list:', error.message);
    }
}

function displayBooks(data) {
    const bookList = document.getElementById('bookList');
    // Clear existing book list items
    bookList.innerHTML = '';

    data.forEach(book => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item');
        listItem.textContent = `${book.title} by ${book.author} - Genre: ${book.genre}`;
        listItem.addEventListener('click', () => applyToBorrow(book.title));
        bookList.appendChild(listItem);
    });
}
async function getBorrowedBooks() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/books/borrowed', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        const data = await response.json();

        if (response.ok) {
            displayBorrowedBooks(data);
        } else {
            console.error('Failed to fetch borrowed books:', data.message);
        }
    } catch (error) {
        console.error('Error fetching borrowed books:', error.message);
    }
}

function calculateFine(overdueDays) {
    const finePerDay = 20; // You can adjust this value based on your requirement
    return overdueDays * finePerDay;
}

// Update the displayBorrowedBooks function
// Update the displayBorrowedBooks function
function displayBorrowedBooks(borrowedBooks) {
    const borrowedBooksList = document.getElementById('borrowedBooksList');
    // Clear existing borrowed books list items
    borrowedBooksList.innerHTML = '';

    borrowedBooks.forEach(book => {
        const row = document.createElement('tr');

        // Calculate overdue days and fines
        const borrowedDeadline = new Date(book.borrowedDeadline);
        const randomInteger = Math.floor(Math.random() * 10);
        const today = new Date();
        if(randomInteger%2!=0){
            today.setDate(today.getDate() - 10);
        }
        else{
            today.setDate(today.getDate() + 10);
        }
        const overdueDays = Math.max(0, Math.floor((today - borrowedDeadline) / (1000 * 60 * 60 * 24)));
        const fine = calculateFine(borrowedDeadline,randomInteger);

        // Set button color and text based on the presence of a fine
        const buttonColor = fine > 0 ? 'btn-danger' : 'btn-success';
        const buttonText = fine > 0 ? `Pay Fine & Return` : `Return`;

        row.innerHTML = `
            <td class="title">${book.title}</td>
            <td>${book.author}</td>
            <td>${book.genre}</td>
            <td>${new Date(book.borrowedDeadline).toLocaleDateString()}</td>
            <td>${overdueDays}</td>
            <td>${fine}</td>
            <td><button class="btn ${buttonColor}" onclick="handleBookAction('${book._id}', ${fine})">${buttonText}</button></td>
        `;
        borrowedBooksList.appendChild(row);
    });
}

// Function to handle book action (return or pay fine)
async function handleBookAction(bookId, fine) {
    if (fine > 0) {
        //alert("FINE")
        pay(bookId, fine);
    } else {
        
        // If there is no fine, proceed with book return
        returnBook(bookId);
    }
}

// Function to initiate the fine payment process
async function pay(bookId, fine) {
    alert("FINE");
    const isConfirmed = confirm(`There is a fine of ${fine}. Do you want to pay the fine and return the book?`);

    if (isConfirmed) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/pay-fine/${bookId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                alert('Fine payment successful. Book returned.');
                getBorrowedBooks();
                getBookList();
                notifyNewBookAvailable();
            } else {
                alert(`Fine payment failed: ${data.message}`);
            }
        } catch (error) {
            console.error('Error paying fine:', error.message);
            alert('Failed to pay fine. Please try again.');
        }
    }
}

// Function to return the book (called when there is no fine)
async function returnBook(bookId) {
    const isConfirmed = confirm('Do you want to return the book?');

    if (isConfirmed) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/return-book/${bookId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                alert('Book returned successfully.');
                getBorrowedBooks();
                getBookList();
                notifyNewBookAvailable();
            } else {
                alert(`Book return failed: ${data.message}`);
            }
        } catch (error) {
            console.error('Error returning book:', error.message);
            alert('Failed to return book. Please try again.');
        }
    }
}


// Function to calculate fines based on overdue days
function calculateFine(borrowedDeadline,randomInteger) {
    const today = new Date();
    if(randomInteger%2!==0)
    {
        today.setDate(today.getDate() - 10);
    }
    else{
        today.setDate(today.getDate() + 10);
    }
    const overdueDays = Math.max(0, Math.floor((today - borrowedDeadline) / (1000 * 60 * 60 * 24)));
    const finePerDay = 20; // You can adjust this value based on your requirement
    return overdueDays * finePerDay;
}
async function payFine(bookId) {
    //alert(bookId);
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/pay-fine/${bookId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (response.ok) {
            getBorrowedBooks();
            getBookList();
        } else {
            alert(`Fine payment failed: ${data.message}`);
        }
    } catch (error) {
        console.error('Error paying fine:', error.message);
        alert('Failed to pay fine. Please try again.');
    }
    getBookList();
    getBorrowedBooks();
}

getBorrowedBooks();
