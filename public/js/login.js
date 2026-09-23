// Configuración de la API
const API_URL = '/api';

// Verificar si ya hay un token
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        window.location.href = '/admin';
    }
    
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Toggle password visibility
    document.getElementById('togglePassword').addEventListener('click', togglePassword);
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// Toggle visibilidad de contraseña
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');
    const icon = toggleBtn.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const loginBtn = document.getElementById('loginBtn');
    
    // Deshabilitar botón y mostrar loading
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando sesión...';
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Guardar token
            if (rememberMe) {
                localStorage.setItem('adminToken', data.token);
            } else {
                sessionStorage.setItem('adminToken', data.token);
            }
            
            // Guardar info del usuario
            localStorage.setItem('adminUser', JSON.stringify(data.user));
            
            // Mostrar éxito y redirigir
            await Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: 'Has iniciado sesión correctamente',
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false
            });
            
            window.location.href = '/admin';
        } else {
            throw new Error(data.message || 'Error en el login');
        }
    } catch (error) {
        console.error('Error en login:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Credenciales inválidas',
            confirmButtonColor: '#dc3545'
        });
    } finally {
        // Restaurar botón
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión';
    }
}
