// Handles both the login form and the register form.
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const errorBox = document.getElementById('error');

async function submitAuth(form, url, fields) {
  errorBox.textContent = '';
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;

  const body = {};
  fields.forEach((f) => (body[f] = document.getElementById(f).value));

  try {
    await api(url, { method: 'POST', body });
    window.location.href = '/index.html';
  } catch (err) {
    errorBox.textContent = err.message;
    button.disabled = false;
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitAuth(loginForm, '/api/auth/login', ['email', 'password']);
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitAuth(registerForm, '/api/auth/register', ['name', 'email', 'password']);
  });
}

setupNavbar();
