async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    console.log(role)

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, role }),
        });

        const data = await response.json();

        if (response.ok) {
            const token = data.token;
            // Store the token securely, e.g., in localStorage
            localStorage.setItem('authToken', token);
            alert(`Welcome, ${data.user.username}! You are logged in as a ${data.user.role}.`);
            
            // Redirect or perform additional actions based on the user's role
            if (data.user.role === 'librarian' && role === 'librarian') {
                window.location.href = '/librarian.html';
            } else if(data.user.role === 'user' && role === 'user') {
                window.location.href = '/user.html';
            }
        } else {
            const errorMessage = data.message || 'Unknown error occurred';
            alert(`Login failed: ${errorMessage}`);
        }
    } catch (error) {
        console.error('Error during login:', error.message);
    }
}
