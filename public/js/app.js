// Configuración de la API
const API_URL = '/api';

// Estado global
let allTours = [];
let currentTourIndex = null;
let tourDetailModal = null;

// Cargar tours al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadTours();
    setupEventListeners();
    tourDetailModal = new bootstrap.Modal(document.getElementById('tourDetailModal'));
});

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda en tiempo real
    document.getElementById('searchInput').addEventListener('input', filterTours);
    document.getElementById('categoryFilter').addEventListener('change', filterTours);
    document.getElementById('priceFilter').addEventListener('change', filterTours);
    
    // Formulario de contacto
    document.getElementById('contactForm').addEventListener('submit', handleContactForm);
}

// Cargar tours desde la API
async function loadTours() {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_URL}/tours/active`);
        const data = await response.json();
        
        if (data.success) {
            allTours = data.data;
            renderTours(allTours);
        } else {
            showToast('Error', 'No se pudieron cargar los tours', 'error');
        }
    } catch (error) {
        console.error('Error al cargar tours:', error);
        showToast('Error', 'Error de conexión al cargar tours', 'error');
    } finally {
        showLoading(false);
    }
}

// Renderizar tours en el grid
function renderTours(tours) {
    const grid = document.getElementById('toursGrid');
    const noResults = document.getElementById('noResults');
    
    if (tours.length === 0) {
        grid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    grid.style.display = 'flex';
    noResults.style.display = 'none';
    
    grid.innerHTML = tours.map((tour, index) => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 tour-card shadow-sm">
                <div class="card-img-top-wrapper" style="cursor: pointer;" onclick="showTourDetail(${index})">
                    <img src="${tour.image_url || 'https://placehold.co/400x300?text=Tour'}" 
                         alt="${tour.title}" 
                         class="card-img-top"
                         onerror="this.src='https://placehold.co/400x300?text=Tour'">
                    <span class="badge bg-primary category-badge">${tour.category}</span>
                </div>
                <div class="card-body">
                    <h5 class="card-title" style="cursor: pointer;" onclick="showTourDetail(${index})">${tour.title}</h5>
                    <p class="card-text text-muted small">${tour.description.substring(0, 100)}...</p>
                    
                    <div class="attractions mb-3">
                        ${tour.attractions && tour.attractions.length > 0 
                            ? tour.attractions.slice(0, 3).map(attr => 
                                `<span class="badge bg-light text-dark me-1 mb-1">${attr}</span>`
                              ).join('') 
                            : ''}
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <i class="fas fa-clock text-muted me-1"></i>
                            <small class="text-muted">${tour.duration}</small>
                        </div>
                        <div class="price-tag">
                            <span class="fw-bold text-primary">$${parseFloat(tour.price).toFixed(2)} MXN</span>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="fas fa-users me-1"></i> Lugares disponibles
                            </small>
                            <span class="badge bg-info">${tour.capacity || 20}</span>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i> Fecha del tour
                            </small>
                            <span class="badge bg-primary">${tour.tour_date ? new Date(tour.tour_date).toLocaleDateString('es-MX') : 'Por definir'}</span>
                        </div>
                    </div>
                    
                    <button onclick="reserveByWhatsApp(${index})" 
                            class="btn btn-success w-100">
                        <i class="fab fa-whatsapp me-2"></i>Reservar por WhatsApp
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Filtrar tours
function filterTours() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const priceRange = document.getElementById('priceFilter').value;
    
    let filtered = allTours.filter(tour => {
        // Filtro por búsqueda
        const matchesSearch = tour.title.toLowerCase().includes(searchTerm) ||
                            tour.description.toLowerCase().includes(searchTerm);
        
        // Filtro por categoría
        const matchesCategory = !category || tour.category === category;
        
        // Filtro por precio
        let matchesPrice = true;
        if (priceRange) {
            const price = parseFloat(tour.price);
            if (priceRange === '0-200') {
                matchesPrice = price < 200;
            } else if (priceRange === '200-500') {
                matchesPrice = price >= 200 && price < 500;
            } else if (priceRange === '500-1000') {
                matchesPrice = price >= 500 && price < 1000;
            } else if (priceRange === '1000+') {
                matchesPrice = price >= 1000;
            }
        }
        
        return matchesSearch && matchesCategory && matchesPrice;
    });
    
    renderTours(filtered);
}

// Mostrar detalles del tour en modal
function showTourDetail(index) {
    const tour = allTours[index];
    currentTourIndex = index;
    
    document.getElementById('tourDetailTitle').textContent = tour.title;
    document.getElementById('tourDetailImage').src = tour.image_url || 'https://placehold.co/400x300?text=Tour';
    document.getElementById('tourDetailCategory').textContent = tour.category;
    document.getElementById('tourDetailDuration').textContent = tour.duration;
    document.getElementById('tourDetailPrice').textContent = `$${parseFloat(tour.price).toFixed(2)} MXN`;
    document.getElementById('tourDetailDescription').textContent = tour.description;
    
    // Mostrar atracciones
    const attractionsContainer = document.getElementById('tourDetailAttractions');
    if (tour.attractions && tour.attractions.length > 0) {
        attractionsContainer.innerHTML = tour.attractions.map(attr => 
            `<span class="badge bg-light text-dark me-2 mb-2">${attr}</span>`
        ).join('');
    } else {
        attractionsContainer.innerHTML = '<span class="text-muted">No especificadas</span>';
    }
    
    // Mostrar capacidad
    const capacityContainer = document.getElementById('tourDetailCapacity');
    if (capacityContainer) {
        capacityContainer.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted">
                    <i class="fas fa-users me-2"></i>Lugares disponibles
                </span>
                <span class="badge bg-info fs-6">${tour.capacity || 20}</span>
            </div>
        `;
    }
    
    // Mostrar fecha del tour
    const dateContainer = document.getElementById('tourDetailDate');
    if (dateContainer) {
        dateContainer.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted">
                    <i class="fas fa-calendar me-2"></i>Fecha del tour
                </span>
                <span class="badge bg-primary fs-6">${tour.tour_date ? new Date(tour.tour_date).toLocaleDateString('es-MX') : 'Por definir'}</span>
            </div>
        `;
    }
    
    // Configurar botón de reserva
    document.getElementById('tourDetailReserveBtn').onclick = () => {
        reserveByWhatsApp(index);
    };
    
    tourDetailModal.show();
}

// Reservar por WhatsApp
function reserveByWhatsApp(index) {
    const tour = allTours[index];
    const message = `¡Hola! Estoy interesado/a en reservar el tour: "${tour.title}"

📍 Categoría: ${tour.category}
⏱️ Duración: ${tour.duration}
💰 Precio: $${parseFloat(tour.price).toFixed(2)} MXN
🎯 Atracciones: ${tour.attractions ? tour.attractions.join(', ') : 'No especificadas'}

Me gustaría conocer la disponibilidad de fechas y el proceso de pago para este viaje.`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/523338442214?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}

// Manejar formulario de contacto
async function handleContactForm(e) {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const phone = document.getElementById('contactPhone') ? document.getElementById('contactPhone').value : '';
    const message = document.getElementById('contactMessage').value;
    
    try {
        const response = await fetch(`${API_URL}/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, phone, message })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await Swal.fire({
                icon: 'success',
                title: '¡Mensaje enviado!',
                text: 'Gracias por contactarnos. Te responderemos pronto.',
                timer: 3000,
                timerProgressBar: true
            });
            
            e.target.reset();
        } else {
            throw new Error(data.message || 'Error al enviar el mensaje');
        }
    } catch (error) {
        console.error('Error al enviar mensaje de contacto:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudo enviar el mensaje. Intenta nuevamente.',
            confirmButtonColor: '#dc3545'
        });
    }
}

// Mostrar/ocultar loading
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const grid = document.getElementById('toursGrid');
    
    if (show) {
        spinner.style.display = 'block';
        grid.style.display = 'none';
    } else {
        spinner.style.display = 'none';
    }
}

// Mostrar notificación toast
function showToast(title, message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
}
