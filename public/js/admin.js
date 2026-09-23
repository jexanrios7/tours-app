// Configuración de la API
const API_URL = '/api';

// Estado global
let allTours = [];
let allContacts = [];
let currentTourId = null;

// Modales
let tourModal = null;
let passwordModal = null;
let tourImagesModal = null;

// Subir imágenes adicionales a un tour
async function uploadAdditionalImages(tourId, files) {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
    }
    
    const response = await fetch(`${API_URL}/tours/${tourId}/images`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.message || 'Error al subir imágenes adicionales');
    }
    
    return data;
}

// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    tourModal = new bootstrap.Modal(document.getElementById('tourModal'));
    passwordModal = new bootstrap.Modal(document.getElementById('passwordModal'));
    tourImagesModal = new bootstrap.Modal(document.getElementById('tourImagesModal'));
    setupEventListeners();
});

// Verificar autenticación
async function checkAuth() {
    const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            logout();
            return;
        }
        
        // Mostrar nombre del usuario
        document.getElementById('userName').textContent = data.user.username;
        
        // Cargar datos
        loadStats();
        loadTours();
        loadContacts();
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        logout();
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Botón ver todos los mensajes
    document.getElementById('viewAllMessagesBtn').addEventListener('click', viewAllMessages);
    
    // Botón agregar tour
    document.getElementById('addTourBtn').addEventListener('click', () => {
        openTourModal();
    });
    
    // Botón guardar tour
    document.getElementById('saveTourBtn').addEventListener('click', saveTour);
    
    // Preview de imagen al seleccionar archivo
    document.getElementById('tourImage').addEventListener('change', handleImageSelect);
    
    // Búsqueda de tours
    document.getElementById('tourSearchInput').addEventListener('input', filterTours);
    
    // Botón cambiar contraseña
    document.getElementById('changePasswordBtn').addEventListener('click', () => {
        passwordModal.show();
    });
    
    // Botón guardar contraseña
    document.getElementById('savePasswordBtn').addEventListener('click', changePassword);
    
    // Botón logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Botón agregar imágenes
    document.getElementById('addImagesBtn').addEventListener('click', addNewTourImages);
}

// Cargar estadísticas
async function loadStats() {
    try {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const response = await fetch(`${API_URL}/tours/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const stats = data.data;
            document.getElementById('statTotalTours').textContent = stats.total_tours || 0;
            document.getElementById('statActiveTours').textContent = stats.active_tours || 0;
            document.getElementById('statAvgPrice').textContent = `$${parseFloat(stats.avg_price || 0).toFixed(2)}`;
            document.getElementById('statPriceRange').textContent = 
                `$${parseFloat(stats.min_price || 0).toFixed(2)} - $${parseFloat(stats.max_price || 0).toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Filtrar tours por búsqueda
function filterTours() {
    const searchTerm = document.getElementById('tourSearchInput').value.toLowerCase();
    
    if (!searchTerm) {
        renderTours(allTours);
        return;
    }
    
    const filteredTours = allTours.filter(tour => {
        return tour.title.toLowerCase().includes(searchTerm) ||
               tour.category.toLowerCase().includes(searchTerm) ||
               tour.description.toLowerCase().includes(searchTerm);
    });
    
    renderTours(filteredTours);
}

// Cargar tours
async function loadTours() {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_URL}/tours`);
        const data = await response.json();
        
        if (data.success) {
            allTours = data.data;
            renderTours(allTours);
        } else {
            showToast('Error', 'No se pudieron cargar los tours', 'error');
        }
    } catch (error) {
        console.error('Error al cargar tours:', error);
        showToast('Error', 'Error de conexión', 'error');
    } finally {
        showLoading(false);
    }
}

// Renderizar tours en las secciones separadas
function renderTours(tours) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const availableToursContainer = document.getElementById('availableToursContainer');
    const unavailableToursContainer = document.getElementById('unavailableToursContainer');
    const noAvailableResults = document.getElementById('noAvailableResults');
    const noUnavailableResults = document.getElementById('noUnavailableResults');
    const availableToursTable = document.getElementById('availableToursTable');
    const unavailableToursTable = document.getElementById('unavailableToursTable');
    
    loadingSpinner.style.display = 'none';
    
    // Separar tours según disponibilidad
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const availableTours = tours.filter(tour => {
        const tourDate = tour.tour_date ? new Date(tour.tour_date) : null;
        const isDateValid = tourDate ? tourDate >= today : true;
        const hasCapacity = tour.capacity > 0;
        const isActive = tour.is_active === true;
        return isActive && isDateValid && hasCapacity;
    });
    
    const unavailableTours = tours.filter(tour => {
        const tourDate = tour.tour_date ? new Date(tour.tour_date) : null;
        const isDateValid = tourDate ? tourDate >= today : true;
        const hasCapacity = tour.capacity > 0;
        const isActive = tour.is_active === true;
        return !isActive || !isDateValid || !hasCapacity;
    });
    
    // Renderizar tours disponibles
    if (availableTours.length === 0) {
        availableToursContainer.style.display = 'none';
        noAvailableResults.style.display = 'block';
    } else {
        availableToursContainer.style.display = 'block';
        noAvailableResults.style.display = 'none';
        availableToursTable.innerHTML = availableTours.map(tour => renderTourRow(tour)).join('');
    }
    
    // Renderizar tours no disponibles
    if (unavailableTours.length === 0) {
        unavailableToursContainer.style.display = 'none';
        noUnavailableResults.style.display = 'block';
    } else {
        unavailableToursContainer.style.display = 'block';
        noUnavailableResults.style.display = 'none';
        unavailableToursTable.innerHTML = unavailableTours.map(tour => renderTourRow(tour)).join('');
    }
}

// Renderizar fila de tour individual
function renderTourRow(tour) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tourDate = tour.tour_date ? new Date(tour.tour_date) : null;
    const isDateValid = tourDate ? tourDate >= today : true;
    const hasCapacity = tour.capacity > 0;
    const isAvailable = tour.is_active && isDateValid && hasCapacity;
    
    const formattedDate = tour.tour_date ? new Date(tour.tour_date).toLocaleDateString('es-MX') : 'No especificada';
    
    return `
        <tr>
            <td>
                <img src="${tour.image_url || 'https://placehold.co/50'}" 
                     alt="${tour.title}" 
                     class="rounded"
                     style="width: 50px; height: 50px; object-fit: cover;"
                     onerror="this.src='https://placehold.co/50'">
            </td>
            <td>
                <strong>${tour.title}</strong>
                <br>
                <small class="text-muted">${tour.description.substring(0, 50)}...</small>
            </td>
            <td>
                <span class="badge bg-${getCategoryColor(tour.category)}">${tour.category}</span>
            </td>
            <td>${tour.duration}</td>
            <td><strong>$${parseFloat(tour.price).toFixed(2)} MXN</strong></td>
            <td>${formattedDate}</td>
            <td>${tour.capacity}</td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           ${tour.is_active ? 'checked' : ''} 
                           onclick="toggleTourStatus(${tour.id}, event)"
                           ${!isDateValid || !hasCapacity ? 'disabled' : ''}>
                </div>
            </td>
            <td>
                <button onclick="editTour(${tour.id})" class="btn btn-sm btn-primary me-1">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="manageTourImages(${tour.id})" class="btn btn-sm btn-info me-1" title="Gestionar imágenes">
                    <i class="fas fa-images"></i>
                </button>
                <button onclick="deleteTour(${tour.id})" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

// Obtener color por categoría
function getCategoryColor(category) {
    const colors = {
        'Aventura': 'warning',
        'Cultural': 'info',
        'Playa': 'primary',
        'Gastronómico': 'success',
        'Ecológico': 'secondary'
    };
    return colors[category] || 'secondary';
}

// Abrir modal de tour (crear o editar)
function openTourModal(tour = null) {
    const form = document.getElementById('tourForm');
    const title = document.getElementById('tourModalTitle');
    
    if (tour) {
        // Editar tour existente
        currentTourId = tour.id;
        title.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Tour';
        
        document.getElementById('tourTitle').value = tour.title;
        document.getElementById('tourCategory').value = tour.category;
        document.getElementById('tourDescription').value = tour.description;
        document.getElementById('tourDuration').value = tour.duration;
        document.getElementById('tourPrice').value = tour.price;
        document.getElementById('tourAttractions').value = tour.attractions ? tour.attractions.join(', ') : '';
        document.getElementById('tourImageUrl').value = tour.image_url || '';
        document.getElementById('tourCapacity').value = tour.capacity || 20;
        document.getElementById('tourDate').value = tour.tour_date || '';
        document.getElementById('tourIsActive').checked = tour.is_active;
    } else {
        // Crear nuevo tour
        currentTourId = null;
        title.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Nuevo Tour';
        form.reset();
        document.getElementById('tourCapacity').value = 20;
        document.getElementById('tourIsActive').checked = true;
    }
    
    updateImagePreview();
    tourModal.show();
}

// Manejar selección de imagen
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        // Mostrar preview
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreviewContainer').style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        document.getElementById('imagePreviewContainer').style.display = 'none';
    }
}

// Actualizar vista previa de imagen
function updateImagePreview() {
    const imageUrl = document.getElementById('tourImageUrl').value;
    const previewContainer = document.getElementById('imagePreviewContainer');
    const preview = document.getElementById('imagePreview');
    
    if (imageUrl) {
        preview.src = imageUrl;
        previewContainer.style.display = 'block';
    } else {
        previewContainer.style.display = 'none';
    }
}

// Editar tour
function editTour(id) {
    const tour = allTours.find(t => t.id === id);
    if (tour) {
        openTourModal(tour);
    }
}

// Guardar tour
async function saveTour() {
    const form = document.getElementById('tourForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const imageFile = document.getElementById('tourImage').files[0];
    const currentImageUrl = document.getElementById('tourImageUrl').value;
    
    const saveBtn = document.getElementById('saveTourBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
    
    try {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        let imageUrl = currentImageUrl;
        
        // Si hay una nueva imagen, subirla primero
        if (imageFile) {
            const formData = new FormData();
            formData.append('image', imageFile);
            
            const uploadResponse = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const uploadData = await uploadResponse.json();
            
            if (!uploadData.success) {
                throw new Error(uploadData.message || 'Error al subir la imagen');
            }
            
            imageUrl = uploadData.imageUrl;
        }
        
        const tourData = {
            title: document.getElementById('tourTitle').value,
            category: document.getElementById('tourCategory').value,
            description: document.getElementById('tourDescription').value,
            duration: document.getElementById('tourDuration').value,
            price: parseFloat(document.getElementById('tourPrice').value),
            attractions: document.getElementById('tourAttractions').value.split(',').map(a => a.trim()).filter(a => a),
            image_url: imageUrl || null,
            capacity: parseInt(document.getElementById('tourCapacity').value) || 20,
            tour_date: document.getElementById('tourDate').value || null,
            is_active: document.getElementById('tourIsActive').checked
        };
        
        let url = `${API_URL}/tours`;
        let method = 'POST';
        
        if (currentTourId) {
            url += `/${currentTourId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(tourData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Si hay imágenes adicionales, subirlas después de crear/actualizar el tour
            const additionalImagesInput = document.getElementById('tourAdditionalImages');
            if (additionalImagesInput.files.length > 0) {
                const tourId = currentTourId || data.data.id;
                await uploadAdditionalImages(tourId, additionalImagesInput.files);
            }
            
            await Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: currentTourId ? 'Tour actualizado correctamente' : 'Tour creado correctamente',
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false
            });
            
            tourModal.hide();
            loadTours();
            loadStats();
        } else {
            throw new Error(data.message || 'Error al guardar el tour');
        }
    } catch (error) {
        console.error('Error guardando tour:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#dc3545'
        });
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar';
    }
}

// Activar/Desactivar tour
async function toggleTourStatus(id, event) {
    try {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        
        // Primero obtener el estado actual del tour
        const getResponse = await fetch(`${API_URL}/tours/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const getData = await getResponse.json();
        if (!getData.success) {
            throw new Error('Error al obtener el tour');
        }
        
        const newStatus = !getData.data.is_active;
        
        const response = await fetch(`${API_URL}/tours/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                is_active: newStatus
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: newStatus ? 'Tour activado correctamente' : 'Tour desactivado correctamente',
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false
            });
            
            loadTours();
        } else {
            throw new Error(data.message || 'Error al actualizar el tour');
        }
    } catch (error) {
        console.error('Error al cambiar estado del tour:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#dc3545'
        });
    }
}

// Eliminar tour
async function deleteTour(tourId) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const response = await fetch(`${API_URL}/tours/${tourId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'Tour eliminado correctamente',
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false
            });
            loadTours();
            loadStats();
        } else {
            throw new Error(data.message || 'Error al eliminar el tour');
        }
    }
}

// Gestionar imágenes de un tour
async function manageTourImages(tourId) {
    document.getElementById('currentTourIdForImages').value = tourId;
    await loadTourImagesForAdmin(tourId);
    tourImagesModal.show();
}

// Cargar imágenes de un tour para el admin
async function loadTourImagesForAdmin(tourId) {
    try {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const response = await fetch(`${API_URL}/tours/${tourId}/images`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        const imagesContainer = document.getElementById('currentTourImages');
        
        if (data.success && data.data.length > 0) {
            imagesContainer.innerHTML = data.data.map(img => `
                <div class="position-relative">
                    <img src="${img.image_url}" alt="Imagen" 
                         class="rounded" style="width: 100px; height: 100px; object-fit: cover;">
                    <button onclick="deleteTourImage(${img.id})" 
                            class="btn btn-danger btn-sm position-absolute top-0 end-0"
                            style="width: 25px; height: 25px; padding: 0;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        } else {
            imagesContainer.innerHTML = '<p class="text-muted">No hay imágenes adicionales</p>';
        }
    } catch (error) {
        console.error('Error al cargar imágenes:', error);
        document.getElementById('currentTourImages').innerHTML = '<p class="text-danger">Error al cargar imágenes</p>';
    }
}

// Eliminar imagen de un tour
async function deleteTourImage(imageId) {
    const result = await Swal.fire({
        title: '¿Eliminar imagen?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const response = await fetch(`${API_URL}/tours/images/${imageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const tourId = document.getElementById('currentTourIdForImages').value;
            await loadTourImagesForAdmin(tourId);
        } else {
            throw new Error(data.message || 'Error al eliminar la imagen');
        }
    }
}

// Agregar nuevas imágenes a un tour
async function addNewTourImages() {
    const tourId = document.getElementById('currentTourIdForImages').value;
    const imagesInput = document.getElementById('newTourImages');
    
    if (!imagesInput.files || imagesInput.files.length === 0) {
        await Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'Por favor selecciona al menos una imagen'
        });
        return;
    }
    
    try {
        await uploadAdditionalImages(tourId, imagesInput.files);
        await loadTourImagesForAdmin(tourId);
        imagesInput.value = '';
        
        await Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Imágenes agregadas correctamente',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false
        });
    } catch (error) {
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Error al agregar las imágenes'
        });
    }
}

// Actualizar vista previa de imagen
function updateImagePreview() {
    const imageUrl = document.getElementById('tourImageUrl').value;
    const previewContainer = document.getElementById('imagePreviewContainer');
    const preview = document.getElementById('imagePreview');
    
    if (imageUrl) {
        preview.src = imageUrl;
        previewContainer.style.display = 'block';
    } else {
        previewContainer.style.display = 'none';
    }
}

// Cambiar contraseña
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Las contraseñas no coinciden',
            confirmButtonColor: '#dc3545'
        });
        return;
    }
    
    if (newPassword.length < 6) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'La contraseña debe tener al menos 6 caracteres',
            confirmButtonColor: '#dc3545'
        });
        return;
    }
    
    const saveBtn = document.getElementById('savePasswordBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Cambiando...';
    
    try {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        
        const response = await fetch(`${API_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Contraseña cambiada correctamente',
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false
            });
            
            passwordModal.hide();
            document.getElementById('passwordForm').reset();
        } else {
            throw new Error(data.message || 'Error al cambiar la contraseña');
        }
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#dc3545'
        });
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Cambiar';
    }
}

// Logout
function logout() {
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/login';
}

// Mostrar/ocultar loading
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const availableContainer = document.getElementById('availableToursContainer');
    const unavailableContainer = document.getElementById('unavailableToursContainer');
    const noAvailableResults = document.getElementById('noAvailableResults');
    const noUnavailableResults = document.getElementById('noUnavailableResults');
    
    if (show) {
        spinner.style.display = 'block';
        if (availableContainer) availableContainer.style.display = 'none';
        if (unavailableContainer) unavailableContainer.style.display = 'none';
        if (noAvailableResults) noAvailableResults.style.display = 'none';
        if (noUnavailableResults) noUnavailableResults.style.display = 'none';
    } else {
        spinner.style.display = 'none';
    }
}

// Mostrar notificación toast
function showToast(title, message, type = 'info') {
    const icon = type === 'success' ? 'success' : type === 'error' ? 'error' : 'info';
}

// Cargar contactos
async function loadContacts() {
    try {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const response = await fetch(`${API_URL}/contacts`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            allContacts = data.data;
            displayContacts(data.data);
            document.getElementById('statMessages').textContent = data.data.length;
            
            // Mostrar badge de mensajes no leídos
            const unreadCount = data.data.filter(c => !c.is_read).length;
            updateUnreadBadge(unreadCount);
        }
    } catch (error) {
        console.error('Error cargando contactos:', error);
    }
}

// Actualizar badge de mensajes no leídos
function updateUnreadBadge(count) {
    const badge = document.getElementById('unreadBadge');
    if (!badge) {
        // Crear badge si no existe
        const messagesCard = document.querySelector('.card.bg-danger');
        if (messagesCard) {
            const badgeHtml = document.createElement('span');
            badgeHtml.id = 'unreadBadge';
            badgeHtml.className = 'position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger';
            badgeHtml.style.display = count > 0 ? 'block' : 'none';
            badgeHtml.textContent = count;
            messagesCard.querySelector('.fa-envelope').parentElement.style.position = 'relative';
            messagesCard.querySelector('.fa-envelope').parentElement.appendChild(badgeHtml);
        }
    } else {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'block' : 'none';
    }
}

// Mostrar contactos en la tabla
function displayContacts(contacts) {
    const tbody = document.getElementById('contactsTableBody');
    
    if (contacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay mensajes de contacto</td></tr>';
        return;
    }
    
    tbody.innerHTML = contacts.map(contact => `
        <tr>
            <td>${new Date(contact.created_at).toLocaleDateString('es-ES')}</td>
            <td>${contact.name}</td>
            <td>${contact.email}</td>
            <td>${contact.phone || '-'}</td>
            <td>
                <button class="btn btn-sm btn-info view-contact-btn" data-id="${contact.id}">
                    <i class="fas fa-eye"></i> Ver
                </button>
            </td>
            <td>
                <button class="btn btn-sm btn-danger delete-contact-btn" data-id="${contact.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Agregar event listeners
    document.querySelectorAll('.view-contact-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            viewContactMessage(id);
        });
    });
    
    document.querySelectorAll('.delete-contact-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            deleteContact(id);
        });
    });
}

// Ver mensaje de contacto
window.viewContactMessage = function(id) {
    console.log('viewContactMessage called with id:', id);
    console.log('allContacts:', allContacts);
    const contact = allContacts.find(c => c.id === id);
    console.log('found contact:', contact);
    if (contact) {
        Swal.fire({
            title: `Mensaje de ${contact.name}`,
            html: `
                <p><strong>Email:</strong> ${contact.email}</p>
                ${contact.phone ? `<p><strong>Teléfono:</strong> ${contact.phone}</p>` : ''}
                <p><strong>Mensaje:</strong></p>
                <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${contact.message}</p>
            `,
            icon: 'info',
            confirmButtonColor: '#0d6efd'
        });
    } else {
        console.error('Contacto no encontrado con id:', id);
    }
};

// Ver todos los mensajes
async function viewAllMessages() {
    if (allContacts.length === 0) {
        Swal.fire({
            title: 'Sin mensajes',
            text: 'No hay mensajes de contacto para mostrar',
            icon: 'info',
            confirmButtonColor: '#0d6efd'
        });
        return;
    }
    
    // Marcar todos los mensajes como leídos
    const unreadIds = allContacts.filter(c => !c.is_read).map(c => c.id);
    if (unreadIds.length > 0) {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        await Promise.all(unreadIds.map(id => 
            fetch(`${API_URL}/contacts/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ));
        // Actualizar estado local
        allContacts.forEach(c => c.is_read = true);
        updateUnreadBadge(0);
    }
    
    const messagesHtml = allContacts.map(contact => `
        <div style="background-color: #f8f9fa; padding: 15px; margin-bottom: 10px; border-radius: 5px; border-left: 4px solid #dc3545;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <h6 style="margin-bottom: 0; color: #dc3545;">
                    <i class="fas fa-user"></i> ${contact.name}
                    <small style="color: #666; margin-left: 10px;">${new Date(contact.created_at).toLocaleDateString('es-ES')}</small>
                </h6>
                <button class="btn btn-sm btn-danger delete-msg-btn" data-id="${contact.id}" style="margin-left: 10px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <p style="margin-bottom: 5px;"><strong>Email:</strong> ${contact.email}</p>
            ${contact.phone ? `<p style="margin-bottom: 5px;"><strong>Teléfono:</strong> ${contact.phone}</p>` : ''}
            <p style="margin-bottom: 0;"><strong>Mensaje:</strong></p>
            <p style="background-color: #fff; padding: 10px; border-radius: 3px; margin-top: 5px;">${contact.message}</p>
        </div>
    `).join('');
    
    Swal.fire({
        title: `Todos los Mensajes (${allContacts.length})`,
        html: `
            <div style="max-height: 400px; overflow-y: auto;">
                ${messagesHtml}
            </div>
        `,
        width: '600px',
        confirmButtonColor: '#0d6efd',
        didOpen: () => {
            // Agregar event listeners a los botones de eliminar
            document.querySelectorAll('.delete-msg-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const id = parseInt(btn.dataset.id);
                    await deleteContact(id);
                    // Cerrar y reabrir el modal para actualizar
                    Swal.close();
                    setTimeout(() => viewAllMessages(), 300);
                });
            });
        }
    });
}

// Eliminar contacto
window.deleteContact = async function(id) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción eliminará el mensaje permanentemente',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    
    if (!result.isConfirmed) {
        return;
    }
    
    try {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const response = await fetch(`${API_URL}/contacts/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            await Swal.fire({
                icon: 'success',
                title: '¡Eliminado!',
                text: 'El mensaje ha sido eliminado',
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false
            });
            
            loadContacts();
        } else {
            throw new Error(data.message || 'Error al eliminar el mensaje');
        }
    } catch (error) {
        console.error('Error eliminando contacto:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#dc3545'
        });
    }
};

// Mostrar notificación toast
function showToast(title, message, type = 'info') {
    const icon = type === 'success' ? 'success' : type === 'error' ? 'error' : 'info';
    Swal.fire({
        icon: icon,
        title: title,
        text: message,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false
    });
}
