document.addEventListener('DOMContentLoaded', () => {
    const loginLink = document.querySelector('#login-form a[href="#register"]');
    const registerLink = document.querySelector('#register-form a[href="#login"]');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });
});