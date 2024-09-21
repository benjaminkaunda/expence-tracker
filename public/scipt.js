// Get the form and input fields
const loginForm = document.querySelector('form');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');

// Add an event listener to handle form submission
loginForm.addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent the form from submitting automatically

    // Get the email and password from the input fields
    const email = emailInput.value;
    const password = passwordInput.value;

    // Basic form validation
    if (!email || !password) {
        alert('Please fill in both fields.');
        return;
    }

    // Create login data object
    const loginData = {
        email: email,
        password: password
    };

    // Send a POST request to the server to log in the user
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
    })
    .then(response => {
        if (response.ok) {
            return response.text(); // Assuming response will be text, can change to response.json() if JSON is returned
        } else {
            return response.text().then(text => { throw new Error(text); });
        }
    })
    .then(data => {
        // Show success message and redirect to the expense tracker page
        alert('Login successful!');
        window.location.href = '/index'; // Redirect to expense tracker page
    })
    .catch(error => {
        // Handle error (for example, incorrect email or password)
        alert('Error: ' + error.message);
    });
});
