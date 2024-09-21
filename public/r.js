// Get form and input fields
const registerForm = document.querySelector('form');
const emailInput = document.getElementById('register-email');
const passwordInput = document.getElementById('register-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const usernameinput = document.getElementById('username');

// Add event listener to handle form submission
registerForm.addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent the form from submitting automatically

    // Get values from input fields
    const email = emailInput.value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Basic validation
    if (!email || !password || !confirmPassword) {
        alert('Please fill in all fields.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match. Please try again.');
        return;
    }

    // Create data object to send to the server
    const userData = {
        email: email,
        password: password
    };

    // Send a POST request to the server to register the user
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    })
    .then(response => {
        if (response.ok) {
            return response.text(); // Parse response text (can be JSON if needed)
        } else {
            return response.text().then(text => { throw new Error(text); });
        }
    })
    .then(data => {
        // Show success message and redirect to login page
        alert('Registration successful! You can now log in.');
        window.location.href = 'login.html'; // Redirect to login page
    })
    .catch(error => {
        // Handle error (for example, duplicate email)
        alert('Error: ' + error.message);
    });
});
