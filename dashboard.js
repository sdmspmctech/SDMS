// Page navigation functionality
const navLinks = document.querySelectorAll('.nav-link[data-page]');
const dashboardBtns = document.querySelectorAll('[data-target]');
const backBtns = document.querySelectorAll('.back-btn[data-target]');
const pages = document.querySelectorAll('.page');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileOverlay = document.getElementById('mobileOverlay');
const closeMobileMenu = document.getElementById('closeMobileMenu');
const logoutBtn = document.getElementById('logoutBtn');
const logoutBtnMobile = document.getElementById('logoutBtnMobile');
const bookCaseForm = document.getElementById('bookCaseForm');
const navMenu = document.querySelector('.nav-menu');

// Mobile menu toggle functionality
function toggleMobileMenu() {
    const isOpen = !mobileMenu.classList.contains('translate-x-full');
    
    if (isOpen) {
        // Close menu
        mobileMenu.classList.add('translate-x-full');
        mobileOverlay.classList.add('hidden');
        hamburger.classList.remove('active');
        resetHamburgerBars();
    } else {
        // Open menu
        mobileMenu.classList.remove('translate-x-full');
        mobileOverlay.classList.remove('hidden');
        hamburger.classList.add('active');
        animateHamburgerBars();
    }
}

function resetHamburgerBars() {
    const bars = hamburger.querySelectorAll('.bar');
    bars[0].style.transform = '';
    bars[1].style.opacity = '1';
    bars[2].style.transform = '';
}

function animateHamburgerBars() {
    const bars = hamburger.querySelectorAll('.bar');
    bars[0].style.transform = 'translateY(8px) rotate(45deg)';
    bars[1].style.opacity = '0';
    bars[2].style.transform = 'translateY(-8px) rotate(-45deg)';
}

// Event listeners for mobile menu
if (hamburger) {
    hamburger.addEventListener('click', toggleMobileMenu);
}

if (closeMobileMenu) {
    closeMobileMenu.addEventListener('click', toggleMobileMenu);
}

if (mobileOverlay) {
    mobileOverlay.addEventListener('click', toggleMobileMenu);
}

// Close mobile menu when clicking on nav links
document.addEventListener('click', (e) => {
    if (e.target.matches('.nav-link[data-page]') && !mobileMenu.classList.contains('translate-x-full')) {
        toggleMobileMenu();
    }
});

// Page navigation function
function showPage(pageId) {
    // Hide all pages
    pages.forEach(page => {
        page.classList.remove('block');
        page.classList.add('hidden');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.classList.add('block');
    }
    
    // Update active nav link
    navLinks.forEach(link => {
        link.classList.remove('active', 'bg-white/20');
        if (link.dataset.page === pageId) {
            link.classList.add('active', 'bg-white/20');
        }
    });
    
    // Load data based on page
    switch (pageId) {
        case 'pending':
            loadPendingCases();
            break;
        case 'solved':
            loadSolvedCases();
            break;
        case 'history':
            loadCaseHistory();
            break;
        case 'registered-students':
            if (typeof loadRegisteredStudents === 'function') {
                loadRegisteredStudents();
            }
            break;
    }
    
    // Close mobile menu when page changes
    if (!mobileMenu.classList.contains('translate-x-full')) {
        toggleMobileMenu();
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Navigation link click handlers
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = link.dataset.page;
        showPage(pageId);
    });
});

// Dashboard button click handlers
dashboardBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetPage = btn.dataset.target;
        showPage(targetPage);
    });
});

// Back button click handlers
backBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetPage = btn.dataset.target;
        showPage(targetPage);
    });
});

// Logout functionality
async function handleLogout(e) {
    e.preventDefault();
    document.getElementById('logoutModal').classList.remove('hidden');
}

function closeLogoutModal() {
    document.getElementById('logoutModal').classList.add('hidden');
}

async function executeLogout() {
    closeLogoutModal();
    try {
        const result = await AuthService.signOut();
        if (result.success) {
            showMessage('Logging out...', 'info');
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        } else {
            showMessage('Error logging out. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('Error logging out. Please try again.', 'error');
    }
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
}

if (logoutBtnMobile) {
    logoutBtnMobile.addEventListener('click', handleLogout);
}

// Bind confirm button in logout modal
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', executeLogout);
}

// Intercept hardware back button (especially on mobile)
window.addEventListener('load', () => {
    window.history.pushState({ noBack: true }, '');
});

window.addEventListener('popstate', (event) => {
    // Push the state again to trap the user on the page
    window.history.pushState({ noBack: true }, '');
    
    // Show the logout warning modal
    const logoutModal = document.getElementById('logoutModal');
    if (logoutModal && logoutModal.classList.contains('hidden')) {
        logoutModal.classList.remove('hidden');
    }
});

// Photo upload and camera functionality
let currentPhotoData = null;
let currentCameraFacing = 'environment'; // 'environment' for back, 'user' for front
let availableCameras = [];
let currentCameraIndex = 0;

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                displayPhoto(e.target.result);
                currentPhotoData = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            showMessage('Please select a valid image file', 'error');
        }
    }
}

function displayPhoto(imageSrc) {
    const profilePhoto = document.getElementById('profilePhoto');
    const profilePlaceholder = document.getElementById('profilePlaceholder');
    const removeBtn = document.getElementById('removePhotoBtn');
    
    profilePhoto.src = imageSrc;
    profilePhoto.classList.remove('hidden');
    profilePlaceholder.classList.add('hidden');
    removeBtn.style.display = 'block';
}

function removePhoto() {
    const profilePhoto = document.getElementById('profilePhoto');
    const profilePlaceholder = document.getElementById('profilePlaceholder');
    const removeBtn = document.getElementById('removePhotoBtn');
    const fileInput = document.getElementById('fileInput');
    
    profilePhoto.classList.add('hidden');
    profilePlaceholder.classList.remove('hidden');
    removeBtn.style.display = 'none';
    fileInput.value = '';
    currentPhotoData = null;
}

async function getAvailableCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        availableCameras = devices.filter(device => device.kind === 'videoinput');
        return availableCameras;
    } catch (error) {
        console.error('Error getting cameras:', error);
        return [];
    }
}

async function openCamera() {
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraVideo');
    const switchBtn = document.getElementById('switchCameraBtn');
    const cameraLabel = document.getElementById('cameraLabel');
    
    modal.classList.remove('hidden');
    
    try {
        // Get available cameras first
        await getAvailableCameras();
        
        // Hide switch button if only one camera available
        if (availableCameras.length <= 1) {
            switchBtn.style.display = 'none';
        } else {
            switchBtn.style.display = 'flex';
        }
        
        // Start with back camera (environment)
        await startCamera('environment');
        
    } catch (error) {
        console.error('Camera access error:', error);
        showMessage('Unable to access camera. Please check permissions.', 'error');
        closeCamera();
    }
}

async function startCamera(facingMode) {
    const video = document.getElementById('cameraVideo');
    const cameraLabel = document.getElementById('cameraLabel');
    
    try {
        // Stop current stream if exists
        if (window.currentStream) {
            window.currentStream.getTracks().forEach(track => track.stop());
        }
        
        // Camera constraints
        const constraints = {
            video: {
                facingMode: facingMode,
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };
        
        // Try to get stream with specified facing mode
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        window.currentStream = stream;
        currentCameraFacing = facingMode;
        
        // Update camera label
        cameraLabel.textContent = facingMode === 'environment' ? 'Back Camera' : 'Front Camera';
        
    } catch (error) {
        console.error('Error starting camera:', error);
        
        // Fallback: try without facingMode constraint
        try {
            const fallbackConstraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
            video.srcObject = stream;
            window.currentStream = stream;
            cameraLabel.textContent = 'Camera';
            
        } catch (fallbackError) {
            console.error('Fallback camera error:', fallbackError);
            showMessage('Unable to access camera. Please check permissions.', 'error');
            closeCamera();
        }
    }
}

async function switchCamera() {
    try {
        // Toggle between front and back camera
        const newFacingMode = currentCameraFacing === 'environment' ? 'user' : 'environment';
        await startCamera(newFacingMode);
        
        // Visual feedback
        const switchBtn = document.getElementById('switchCameraBtn');
        switchBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Switching...';
        
        setTimeout(() => {
            switchBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Switch';
        }, 1000);
        
    } catch (error) {
        console.error('Error switching camera:', error);
        showMessage('Unable to switch camera. Using current camera.', 'warning');
    }
}

function closeCamera() {
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraVideo');
    
    modal.classList.add('hidden');
    
    if (window.currentStream) {
        window.currentStream.getTracks().forEach(track => track.stop());
        window.currentStream = null;
    }
    
    video.srcObject = null;
    
    // Reset camera variables
    currentCameraFacing = 'environment';
    availableCameras = [];
    currentCameraIndex = 0;
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const context = canvas.getContext('2d');
    
    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to data URL
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Display the captured photo
    displayPhoto(photoData);
    currentPhotoData = photoData;
    
    // Close camera modal
    closeCamera();
    
    showMessage('Photo captured successfully!', 'success');
}

// Book case form submission
if (bookCaseForm) {
    bookCaseForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data for the new cases_ table schema
        const formData = {
            clientName: document.getElementById('studentName').value,
            department: document.getElementById('department').value,
            year: document.getElementById('year').value,
            section: document.getElementById('section').value,
            regNo: document.getElementById('regNo').value,
            parentNo: document.getElementById('parentNo').value,
            caseDescription: document.getElementById('caseDescription').value,
            casedBookBy: document.getElementById('casedBookBy').value,
            photoData: currentPhotoData // Include photo data for upload
        };
        
        // Additional data for validation
        const studentData = {
            department: formData.department,
            year: formData.year,
            section: formData.section,
            regNo: formData.regNo,
            parentNo: formData.parentNo,
            caseDescription: formData.caseDescription
        };
        
        // Validate form
        if (!formData.clientName || !studentData.department || !studentData.year || 
            !studentData.section || !studentData.regNo || !studentData.parentNo || 
            !studentData.caseDescription || !formData.casedBookBy) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        // Validate registration number format (basic validation)
        if (!/^[A-Za-z0-9]{6,15}$/.test(studentData.regNo)) {
            showMessage('Please enter a valid registration number', 'error');
            return;
        }
        
        // Validate phone number format (basic validation)
        if (!/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(studentData.parentNo)) {
            showMessage('Please enter a valid phone number', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Filing Case...';
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-70', 'cursor-not-allowed');
        
        try {
            // Create case using Supabase
            const result = await CaseService.createCase(formData);
            
            if (result.success) {
                // Reset form
                bookCaseForm.reset();
                removePhoto(); // Clear the photo as well
                
                // Show enhanced success message
                showMessage(`✅ Success! Case for ${formData.clientName} has been filed successfully! 🎉`, 'success');
                
                // Optional: Show additional confirmation
                setTimeout(() => {
                    showMessage('📋 You can view your case in the Pending Cases section', 'info');
                }, 2000);
                
                // Update pending cases display
                await loadPendingCases();
                
                // Update case history to show the new case
                await loadCaseHistory();
                
                // Update case history to show the new case
                await loadCaseHistory();
                
                // Redirect to pending cases after a delay
                setTimeout(() => {
                    showPage('pending');
                }, 2000);
            } else {
                showMessage(result.error || 'Failed to file case. Please try again.', 'error');
            }
        } catch (error) {
            console.error('File case error:', error);
            showMessage('An error occurred while filing the case. Please try again.', 'error');
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    });
}

// Helper function to generate case number
function generateCaseNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return String(timestamp).slice(-6) + String(random).padStart(3, '0');
}

// Helper function to store case data
function storeCaseData(caseNumber, data) {
    // Get existing cases from localStorage
    let cases = JSON.parse(localStorage.getItem('cases') || '[]');
    
    // Add new case
    const newCase = {
        caseNumber: caseNumber,
        ...data,
        status: 'pending',
        dateCreated: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    
    cases.push(newCase);
    
    // Store back to localStorage
    localStorage.setItem('cases', JSON.stringify(cases));
    
    // Update pending cases display
    updatePendingCasesDisplay();
}

// Function to load pending cases from cases_ table
async function loadPendingCases() {
    try {
        const container = document.getElementById('pendingCasesContainer');
        if (!container) return;
        
        // Show loading
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Loading pending cases...</p>
            </div>
        `;
        
        const result = await CaseService.getCases();
        
        if (result.success && result.data) {
            // Clear loading
            container.innerHTML = '';
            
            // Filter for pending cases (assume all are pending for now)
            const pendingCases = result.data.filter(caseItem => !caseItem.resolved_at);
            
            if (pendingCases.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-inbox text-4xl mb-4"></i>
                        <p class="text-lg">No pending cases found</p>
                        <p class="text-sm">All cases have been resolved</p>
                    </div>
                `;
            } else {
                // Add real pending cases with resolve buttons
                pendingCases.forEach(caseItem => {
                    const caseElement = createPendingCaseElementWrapped(caseItem);
                    container.appendChild(caseElement);
                });
            }
        }
    } catch (error) {
        console.error('Load pending cases error:', error);
        const container = document.getElementById('pendingCasesContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Error loading pending cases</p>
                </div>
            `;
        }
        showMessage('Error loading pending cases', 'error');
    }
}

// Function to load solved cases
async function loadSolvedCases() {
    try {
        const container = document.getElementById('solvedCasesContainer');
        if (!container) return;
        
        // Show loading
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Loading solved cases...</p>
            </div>
        `;
        
        const result = await CaseService.getCases();
        
        if (result.success && result.data) {
            // Clear loading
            container.innerHTML = '';
            
            // Filter for solved cases
            const solvedCases = result.data.filter(caseItem => caseItem.resolved_at);
            
            if (solvedCases.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-clipboard-check text-4xl mb-4"></i>
                        <p class="text-lg">No solved cases found</p>
                        <p class="text-sm">Cases you resolve will appear here</p>
                    </div>
                `;
            } else {
                // Add solved cases
                solvedCases.forEach(caseItem => {
                    const caseElement = createSolvedCaseElement(caseItem);
                    container.appendChild(caseElement);
                });
            }
        }
    } catch (error) {
        console.error('Load solved cases error:', error);
        const container = document.getElementById('solvedCasesContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Error loading solved cases</p>
                </div>
            `;
        }
        showMessage('Error loading solved cases', 'error');
    }
}

// Function to load case history from Supabase
async function loadCaseHistory() {
    try {
        const container = document.getElementById('historyCasesContainer');
        if (!container) return;
        
        // Show loading
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Loading case history...</p>
            </div>
        `;
        
        const result = await CaseService.getCases();
        
        if (result.success && result.data) {
            // Clear loading
            container.innerHTML = '';
            
            // Sort cases by date (most recent first)
            const sortedCases = result.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            if (sortedCases.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-history text-4xl mb-4"></i>
                        <p class="text-lg">No case history found</p>
                        <p class="text-sm">Case activities will appear here</p>
                    </div>
                `;
            } else {
                // Add all cases to history (both pending and solved)
                sortedCases.forEach(caseItem => {
                    const caseElement = createHistoryCaseElement(caseItem);
                    container.appendChild(caseElement);
                });
            }
        }
    } catch (error) {
        console.error('Load case history error:', error);
        const container = document.getElementById('historyCasesContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Error loading case history</p>
                </div>
            `;
        }
        showMessage('Error loading case history', 'error');
    }
}

// Function to create history case element (Mobile-Optimized)
function createHistoryCaseElement(caseData) {
    const caseItem = document.createElement('div');
    const isResolved = caseData.resolved_at;
    const borderColor = isResolved ? 'border-green-600' : 'border-blue-600';
    
    caseItem.className = `bg-gray-50 rounded-lg p-4 md:p-6 border-l-4 ${borderColor} transition-all duration-300 hover:translate-x-1 hover:shadow-lg`;
    
    // Build photo display
    const cachedPhoto = caseData['Take Photo'];
    const photoDisplayHTML = buildPhotoHTML(cachedPhoto, isResolved ? 'border-green-300' : 'border-blue-300');
    
    const createdDate = new Date(caseData.created_at).toLocaleDateString();
    const resolvedDate = isResolved ? new Date(caseData.resolved_at).toLocaleDateString() : null;
    
    caseItem.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-start gap-3 md:gap-4">
                <div class="photo-slot flex-shrink-0">${photoDisplayHTML}</div>
                <div class="flex-1 min-w-0">
                    <h3 class="text-slate-700 mb-2 text-lg font-semibold truncate">${caseData.Name}</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 md:gap-2 text-xs md:text-sm">
                        <p class="text-gray-600"><strong>Dept:</strong> ${caseData.Department}</p>
                        <p class="text-gray-600"><strong>Year:</strong> ${caseData.Year}</p>
                        <p class="text-gray-600"><strong>Section:</strong> ${caseData.Section || 'N/A'}</p>
                        <p class="text-gray-600"><strong>Reg:</strong> ${caseData['Reg no'] || 'N/A'}</p>
                    </div>
                    <div class="text-xs md:text-sm mt-1 space-y-1">
                        <p class="text-gray-600"><strong>Filed:</strong> ${createdDate}</p>
                        ${resolvedDate ? `<p class="text-gray-600"><strong>Resolved:</strong> ${resolvedDate}</p>` : ''}
                        <p class="text-gray-600"><strong>Booked By:</strong> ${caseData['Cased Book By'] || 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-3 rounded border">
                <p class="text-gray-700 text-sm font-medium mb-1">Case Description:</p>
                <p class="text-gray-600 text-sm leading-relaxed">${caseData.Case || 'N/A'}</p>
            </div>
            
            ${caseData.resolution_notes ? `
                <div class="bg-green-50 p-3 rounded border border-green-200">
                    <p class="text-gray-700 text-sm font-medium mb-1">Resolution Notes:</p>
                    <p class="text-gray-600 text-sm leading-relaxed">${caseData.resolution_notes}</p>
                </div>
            ` : ''}
            
            <div class="flex flex-col sm:flex-row gap-2 items-stretch">
                <div class="px-3 py-2 rounded-full font-semibold uppercase text-xs ${isResolved ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-blue-100 text-blue-800 border border-blue-200'} text-center flex items-center justify-center">
                    <i class="fas ${isResolved ? 'fa-check-circle' : 'fa-clock'} mr-1"></i> 
                    ${isResolved ? 'Resolved' : 'Pending'}
                </div>
                <div class="flex flex-1 gap-2">
                    <button 
                        onclick="viewCaseDetails('${caseData.id}')" 
                        class="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg active:scale-95 touch-manipulation text-sm"
                    >
                        <i class="fas fa-eye"></i> <span class="hidden sm:inline">View Details</span>
                    </button>
                    ${!isResolved ? `
                        <button 
                            onclick="resolveCase('${caseData.id}')" 
                            class="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg active:scale-95 touch-manipulation text-sm"
                        >
                            <i class="fas fa-check"></i> <span class="hidden sm:inline">Resolve</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    lazyLoadPhoto(caseItem, caseData, isResolved ? 'border-green-300' : 'border-blue-300');
    return caseItem;
}

// Function to create timeline element
function createTimelineElement(timestamp, action, description, type) {
    const timelineItem = document.createElement('div');
    timelineItem.className = 'relative mb-6 md:mb-8 pl-6 md:pl-8 timeline-item';
    
    const date = new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Different colors for different action types
    const dotColor = type === 'resolved' ? 'bg-green-600' : 'bg-purple-600';
    const actionIcon = type === 'resolved' ? 'fas fa-check-circle' : 'fas fa-plus-circle';
    
    timelineItem.innerHTML = `
        <div class="absolute -left-1.5 top-2 w-3 h-3 ${dotColor} rounded-full border-4 border-white shadow-lg"></div>
        <div class="text-purple-600 font-semibold mb-2 text-sm md:text-base">${date}</div>
        <div>
            <h4 class="text-slate-700 mb-1 font-semibold text-sm md:text-base flex items-center gap-2">
                <i class="${actionIcon} text-sm"></i>
                ${action}
            </h4>
            <p class="text-gray-600 text-sm">${description}</p>
        </div>
    `;
    
    return timelineItem;
}

// Function to update pending cases display (legacy support)
async function updatePendingCasesDisplay() {
    await loadPendingCases();
}

// Function to create pending case element with resolve button (Mobile-Optimized)
// Helper: get photo from case data OR from students_data by reg no
async function getStudentPhotoSrc(caseData) {
    if (caseData['Take Photo']) return caseData['Take Photo'];
    const regNo = caseData['Reg no'];
    if (!regNo) return null;
    try {
        const { data, error } = await window.supabaseClient
            .from('students_data')
            .select('photo_base64')
            .eq('reg_no', regNo)
            .maybeSingle();
        if (!error && data && data.photo_base64) return data.photo_base64;
    } catch (e) { /* silently ignore */ }
    return null;
}

// Helper: build photo HTML element
function buildPhotoHTML(photoSrc, borderColor) {
    if (photoSrc) {
        return `<img src="${photoSrc}" alt="Student Photo" class="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 ${borderColor}">`;
    }
    return '<div class="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-200 flex items-center justify-center"><i class="fas fa-user text-gray-500 text-lg"></i></div>';
}

// Helper: async-update photo slot if Take Photo was null (look up from students_data)
function lazyLoadPhoto(caseItem, caseData, borderColor) {
    if (!caseData['Take Photo'] && caseData['Reg no']) {
        getStudentPhotoSrc(caseData).then(src => {
            if (src) {
                const slot = caseItem.querySelector('.photo-slot');
                if (slot) slot.innerHTML = buildPhotoHTML(src, borderColor);
            }
        });
    }
}

function createPendingCaseElement(caseData) {
    const caseItem = document.createElement('div');
    caseItem.className = 'bg-gray-50 rounded-lg p-4 md:p-6 border-l-4 border-purple-600 transition-all duration-300 hover:translate-x-1 hover:shadow-lg';
    
    // Build photo display - use Take Photo if available, else placeholder; async update later
    const cachedPhoto = caseData['Take Photo'];
    const photoDisplayHTML = buildPhotoHTML(cachedPhoto, 'border-purple-300');
    const createdDate = new Date(caseData.created_at).toLocaleDateString();
    
    caseItem.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-start gap-3 md:gap-4">
                <div class="photo-slot flex-shrink-0">${photoDisplayHTML}</div>
                <div class="flex-1 min-w-0">
                    <h3 class="text-slate-700 mb-2 text-lg font-semibold truncate">${caseData.Name}</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 md:gap-2 text-xs md:text-sm">
                        <p class="text-gray-600"><strong>Dept:</strong> ${caseData.Department}</p>
                        <p class="text-gray-600"><strong>Year:</strong> ${caseData.Year}</p>
                        <p class="text-gray-600"><strong>Section:</strong> ${caseData.Section || 'N/A'}</p>
                        <p class="text-gray-600"><strong>Reg:</strong> ${caseData['Reg no'] || 'N/A'}</p>
                    </div>
                    <div class="text-xs md:text-sm mt-1 space-y-1">
                        <p class="text-gray-600"><strong>Filed:</strong> ${createdDate}</p>
                        <p class="text-gray-600"><strong>Booked By:</strong> ${caseData['Cased Book By'] || 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-3 rounded border">
                <p class="text-gray-700 text-sm font-medium mb-1">Case Description:</p>
                <p class="text-gray-600 text-sm leading-relaxed">${caseData.Case || 'N/A'}</p>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-2 items-stretch">
                <div class="px-3 py-2 rounded-full font-semibold uppercase text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 text-center flex items-center justify-center">
                    <i class="fas fa-clock mr-1"></i> Pending
                </div>
                <div class="flex flex-1 gap-2">
                    <button 
                        onclick="resolveCase('${caseData.id}')" 
                        class="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg active:scale-95 touch-manipulation text-sm"
                    >
                        <i class="fas fa-check"></i> <span class="hidden sm:inline">Resolve</span>
                    </button>
                    <button 
                        onclick="viewCaseDetails('${caseData.id}')" 
                        class="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg active:scale-95 touch-manipulation text-sm"
                    >
                        <i class="fas fa-eye"></i> <span class="hidden sm:inline">View</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return caseItem;
}

function createPendingCaseElementWrapped(caseData) {
    const el = createPendingCaseElement(caseData);
    lazyLoadPhoto(el, caseData, 'border-purple-300');
    return el;
}

// Function to create solved case element (Mobile-Optimized)
function createSolvedCaseElement(caseData) {
    const caseItem = document.createElement('div');
    caseItem.className = 'bg-gray-50 rounded-lg p-4 md:p-6 border-l-4 border-green-600 transition-all duration-300 hover:translate-x-1 hover:shadow-lg';
    
    // Build photo display
    const cachedPhoto = caseData['Take Photo'];
    const photoDisplayHTML = buildPhotoHTML(cachedPhoto, 'border-green-300');
    
    const createdDate = new Date(caseData.created_at).toLocaleDateString();
    const resolvedDate = new Date(caseData.resolved_at).toLocaleDateString();
    
    caseItem.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-start gap-3 md:gap-4">
                <div class="photo-slot flex-shrink-0">${photoDisplayHTML}</div>
                <div class="flex-1 min-w-0">
                    <h3 class="text-slate-700 mb-2 text-lg font-semibold truncate">${caseData.Name}</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 md:gap-2 text-xs md:text-sm">
                        <p class="text-gray-600"><strong>Dept:</strong> ${caseData.Department}</p>
                        <p class="text-gray-600"><strong>Year:</strong> ${caseData.Year}</p>
                        <p class="text-gray-600"><strong>Filed:</strong> ${createdDate}</p>
                        <p class="text-gray-600"><strong>Resolved:</strong> ${resolvedDate}</p>
                        <p class="text-gray-600"><strong>Booked By:</strong> ${caseData['Cased Book By'] || 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-3 rounded border">
                <p class="text-gray-700 text-sm font-medium mb-1">Case Description:</p>
                <p class="text-gray-600 text-sm leading-relaxed">${caseData.Case || 'N/A'}</p>
            </div>
            
            ${caseData.resolution_notes ? `
                <div class="bg-green-50 p-3 rounded border border-green-200">
                    <p class="text-gray-700 text-sm font-medium mb-1">Resolution Notes:</p>
                    <p class="text-gray-600 text-sm leading-relaxed">${caseData.resolution_notes}</p>
                </div>
            ` : ''}
            
            <div class="flex flex-col sm:flex-row gap-2 items-stretch">
                <div class="px-3 py-2 rounded-full font-semibold uppercase text-xs bg-green-100 text-green-800 border border-green-200 text-center flex items-center justify-center">
                    <i class="fas fa-check-circle mr-1"></i> Resolved
                </div>
                <button 
                    onclick="viewCaseDetails('${caseData.id}')" 
                    class="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg active:scale-95 touch-manipulation text-sm"
                >
                    <i class="fas fa-eye"></i> View Details
                </button>
            </div>
        </div>
    `;
    
    lazyLoadPhoto(caseItem, caseData, 'border-green-300');
    return caseItem;
}

// Function to resolve a case
async function resolveCase(caseId) {
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to mark this case as resolved?');
    if (!confirmed) return;
    
    // Prompt for resolution notes
    const resolutionNotes = prompt('Please enter resolution notes (optional):');
    
    try {
        showMessage('Resolving case...', 'info');
        
        // Update case in database
        const result = await CaseService.resolveCase(caseId, resolutionNotes);
        
        if (result.success) {
            showMessage('✅ Case resolved successfully!', 'success');
            
            // Refresh all related views
            await loadPendingCases();
            await loadSolvedCases();
            await loadCaseHistory(); // Add this line to refresh case history
            
            // Show additional success message
            setTimeout(() => {
                showMessage('📋 Case moved to Solved Cases section and added to history', 'info');
            }, 1500);
        } else {
            showMessage(result.error || 'Failed to resolve case. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Resolve case error:', error);
        showMessage('An error occurred while resolving the case. Please try again.', 'error');
    }
}

// Function to view case details
async function viewCaseDetails(caseId) {
    try {
        // Get case details
        const result = await CaseService.getCaseById(caseId);
        
        if (result.success && result.data) {
            const caseData = result.data;
            
            // Create modal for case details
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
            modal.onclick = (e) => {
                if (e.target === modal) modal.remove();
            };
            
            const photoDisplay = caseData['Take Photo'] 
                ? `<img src="${caseData['Take Photo']}" alt="Student Photo" class="w-24 h-24 rounded-full object-cover border-4 border-purple-300 mx-auto">`
                : '<div class="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto border-4 border-purple-300"><i class="fas fa-user text-gray-500 text-2xl"></i></div>';
            
            const createdDate = new Date(caseData.created_at).toLocaleDateString();
            const resolvedDate = caseData.resolved_at ? new Date(caseData.resolved_at).toLocaleDateString() : null;
            
            modal.innerHTML = `
                <div class="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-purple-600">Case Details</h2>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="text-center mb-6">
                        ${photoDisplay}
                        <h3 class="text-xl font-semibold mt-3">${caseData.Name}</h3>
                        <div class="mt-2">
                            ${caseData.resolved_at 
                                ? '<span class="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800"><i class="fas fa-check-circle mr-1"></i> Resolved</span>'
                                : '<span class="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800"><i class="fas fa-clock mr-1"></i> Pending</span>'
                            }
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="font-semibold text-gray-700 mb-1">Department</p>
                            <p class="text-gray-600">${caseData.Department}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="font-semibold text-gray-700 mb-1">Year & Section</p>
                            <p class="text-gray-600">${caseData.Year} - Section ${caseData.Section || 'N/A'}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="font-semibold text-gray-700 mb-1">Registration No</p>
                            <p class="text-gray-600">${caseData['Reg no'] || 'N/A'}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="font-semibold text-gray-700 mb-1">Parent's Contact</p>
                            <p class="text-gray-600">${caseData['Parent\'s no'] || 'N/A'}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="font-semibold text-gray-700 mb-1">Date Filed</p>
                            <p class="text-gray-600">${createdDate}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="font-semibold text-gray-700 mb-1">Cased Book By</p>
                            <p class="text-gray-600">${caseData['Cased Book By'] || 'N/A'}</p>
                        </div>
                        ${resolvedDate ? `
                            <div class="bg-green-50 p-4 rounded-lg">
                                <p class="font-semibold text-gray-700 mb-1">Date Resolved</p>
                                <p class="text-gray-600">${resolvedDate}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="mb-6">
                        <p class="font-semibold text-gray-700 mb-2">Case Description</p>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-600">${caseData.Case || 'N/A'}</p>
                        </div>
                    </div>
                    
                    ${caseData.resolution_notes ? `
                        <div class="mb-6">
                            <p class="font-semibold text-gray-700 mb-2">Resolution Notes</p>
                            <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                                <p class="text-gray-600">${caseData.resolution_notes}</p>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="flex gap-3 justify-end">
                        ${!caseData.resolved_at ? `
                            <button onclick="modal.remove(); resolveCase('${caseData.id}')" class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2 rounded-lg transition-all duration-300 flex items-center gap-2">
                                <i class="fas fa-check"></i> Resolve Case
                            </button>
                        ` : ''}
                        <button onclick="this.closest('.fixed').remove()" class="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-2 rounded-lg transition-all duration-300">
                            Close
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        } else {
            showMessage('Error loading case details', 'error');
        }
    } catch (error) {
        console.error('View case details error:', error);
        showMessage('Error loading case details', 'error');
    }
}

// Function to get status classes
function getStatusClasses(status) {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        case 'in_progress':
            return 'bg-blue-100 text-blue-800 border border-blue-200';
        case 'solved':
            return 'bg-green-100 text-green-800 border border-green-200';
        case 'cancelled':
            return 'bg-red-100 text-red-800 border border-red-200';
        default:
            return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
}

// Show message function
function showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Add styles for the message
    messageDiv.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideInRight 0.5s ease-out;
        max-width: 300px;
        word-wrap: break-word;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    `;
    
    if (type === 'error') {
        messageDiv.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    } else if (type === 'success') {
        messageDiv.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
    } else if (type === 'info') {
        messageDiv.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
    }
    
    document.body.appendChild(messageDiv);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        if (messageDiv) {
            messageDiv.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => messageDiv.remove(), 500);
        }
    }, 5000);
}

// Add CSS animations for messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard loaded'); // Debug log
    
    try {
        // Check if user is authenticated with Supabase
        const user = await AuthService.getCurrentUser();
        console.log('Current user:', user); // Debug log
        
        if (!user) {
            console.log('User not authenticated, redirecting to login'); // Debug log
            window.location.href = 'index.html';
            return;
        }
        
        // Show home page by default
        showPage('home');
        
        // Load initial data
        await loadPendingCases();
        
        // Initialize search functionality
        initializeSearchFunctionality();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showMessage('Error loading dashboard. Please refresh the page.', 'error');
    }
});

// Search functionality
function initializeSearchFunctionality() {
    // Initialize search for pending cases
    const pendingSearchInput = document.getElementById('pendingSearchInput');
    if (pendingSearchInput) {
        pendingSearchInput.addEventListener('input', function() {
            handleSearch('pending', this.value);
            toggleClearButton('pendingSearchInput', 'clearPendingSearch');
        });
    }
    
    // Initialize search for solved cases
    const solvedSearchInput = document.getElementById('solvedSearchInput');
    if (solvedSearchInput) {
        solvedSearchInput.addEventListener('input', function() {
            handleSearch('solved', this.value);
            toggleClearButton('solvedSearchInput', 'clearSolvedSearch');
        });
    }
    
    // Initialize search for case history
    const historySearchInput = document.getElementById('historySearchInput');
    if (historySearchInput) {
        historySearchInput.addEventListener('input', function() {
            handleSearch('history', this.value);
            toggleClearButton('historySearchInput', 'clearHistorySearch');
        });
    }
}

// Handle search functionality
function handleSearch(section, searchTerm) {
    const containers = {
        'pending': 'pendingCasesContainer',
        'solved': 'solvedCasesContainer',
        'history': 'historyCasesContainer'
    };
    
    const container = document.getElementById(containers[section]);
    if (!container) return;
    
    const caseElements = container.querySelectorAll('.bg-gray-50');
    let visibleCount = 0;
    
    caseElements.forEach(caseElement => {
        const caseText = caseElement.textContent.toLowerCase();
        const isVisible = caseText.includes(searchTerm.toLowerCase());
        
        if (isVisible) {
            caseElement.style.display = 'block';
            visibleCount++;
        } else {
            caseElement.style.display = 'none';
        }
    });
    
    // Show "no results" message if no cases are visible
    const existingNoResults = container.querySelector('.no-search-results');
    if (existingNoResults) {
        existingNoResults.remove();
    }
    
    if (searchTerm && visibleCount === 0) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-search-results text-center py-8 text-gray-500';
        noResultsDiv.innerHTML = `
            <i class="fas fa-search text-4xl mb-4"></i>
            <p class="text-lg">No cases found</p>
            <p class="text-sm">Try adjusting your search terms</p>
        `;
        container.appendChild(noResultsDiv);
    }
}

// Toggle clear button visibility
function toggleClearButton(inputId, clearButtonId) {
    const input = document.getElementById(inputId);
    const clearButton = document.getElementById(clearButtonId);
    
    if (input && clearButton) {
        if (input.value.length > 0) {
            clearButton.style.display = 'block';
        } else {
            clearButton.style.display = 'none';
        }
    }
}

// Clear search function
function clearSearch(inputId) {
    const input = document.getElementById(inputId);
    const clearButton = document.getElementById(inputId.replace('SearchInput', 'Search').replace('Input', '') + 'Search');
    
    if (input) {
        input.value = '';
        input.focus();
    }
    
    if (clearButton) {
        clearButton.style.display = 'none';
    }
    
    // Clear search results
    const section = inputId.replace('SearchInput', '');
    handleSearch(section, '');
}

// Export to Excel function
async function exportToExcel() {
    try {
        showMessage('Preparing Excel export...', 'info');
        
        // Get all cases from Supabase
        const result = await CaseService.getCases();
        
        if (!result.success || !result.data || result.data.length === 0) {
            showMessage('No data available to export', 'warning');
            return;
        }
        
        // Prepare data for Excel export
        const excelData = result.data.map((caseItem, index) => {
            const createdDate = new Date(caseItem.created_at).toLocaleDateString('en-US');
            const resolvedDate = caseItem.resolved_at ? new Date(caseItem.resolved_at).toLocaleDateString('en-US') : 'Pending';
            
            return {
                'S.No': index + 1,
                'Name': caseItem.Name || 'N/A',
                'Department': caseItem.Department || 'N/A',
                'Year': caseItem.Year || 'N/A',
                'Section': caseItem.Section || 'N/A',
                'Registration No': caseItem['Reg no'] || 'N/A',
                'Parent Contact': caseItem["Parent's no"] || 'N/A',
                'Case Description': caseItem.Case || 'N/A',
                'Cased Book By': caseItem['Cased Book By'] || 'N/A',
                'Date Filed': createdDate,
                'Status': caseItem.resolved_at ? 'Resolved' : 'Pending',
                'Date Resolved': resolvedDate,
                'Resolution Notes': caseItem.resolution_notes || 'N/A'
            };
        });
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Set column widths
        const colWidths = [
            { wch: 5 },   // S.No
            { wch: 20 },  // Name
            { wch: 12 },  // Department
            { wch: 8 },   // Year
            { wch: 10 },  // Section
            { wch: 15 },  // Registration No
            { wch: 15 },  // Parent Contact
            { wch: 40 },  // Case Description
            { wch: 20 },  // Cased Book By
            { wch: 12 },  // Date Filed
            { wch: 10 },  // Status
            { wch: 12 },  // Date Resolved
            { wch: 30 }   // Resolution Notes
        ];
        ws['!cols'] = colWidths;
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Case History');
        
        // Generate filename with current date
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        const filename = `SDMS_Case_History_${dateStr}.xlsx`;
        
        // Write and download file
        XLSX.writeFile(wb, filename);
        
        showMessage('✅ Excel file exported successfully!', 'success');
        
        // Show additional info message
        setTimeout(() => {
            showMessage(`📄 File saved as: ${filename}`, 'info');
        }, 1500);
        
    } catch (error) {
        console.error('Export to Excel error:', error);
        showMessage('Failed to export Excel file. Please try again.', 'error');
    }
}

// Export pending cases to Excel function
async function exportPendingToExcel() {
    try {
        showMessage('Preparing Pending Cases Excel export...', 'info');
        
        // Get all cases from Supabase
        const result = await CaseService.getCases();
        
        if (!result.success || !result.data || result.data.length === 0) {
            showMessage('No data available to export', 'warning');
            return;
        }
        
        // Filter for pending cases only
        const pendingCases = result.data.filter(caseItem => !caseItem.resolved_at);
        
        if (pendingCases.length === 0) {
            showMessage('No pending cases available to export', 'warning');
            return;
        }
        
        // Prepare data for Excel export
        const excelData = pendingCases.map((caseItem, index) => {
            const createdDate = new Date(caseItem.created_at).toLocaleDateString('en-US');
            
            return {
                'S.No': index + 1,
                'Name': caseItem.Name || 'N/A',
                'Department': caseItem.Department || 'N/A',
                'Year': caseItem.Year || 'N/A',
                'Section': caseItem.Section || 'N/A',
                'Registration No': caseItem['Reg no'] || 'N/A',
                'Parent Contact': caseItem["Parent's no"] || 'N/A',
                'Case Description': caseItem.Case || 'N/A',
                'Cased Book By': caseItem['Cased Book By'] || 'N/A',
                'Date Filed': createdDate,
                'Status': 'Pending'
            };
        });
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Set column widths
        const colWidths = [
            { wch: 5 },   // S.No
            { wch: 20 },  // Name
            { wch: 12 },  // Department
            { wch: 8 },   // Year
            { wch: 10 },  // Section
            { wch: 15 },  // Registration No
            { wch: 15 },  // Parent Contact
            { wch: 40 },  // Case Description
            { wch: 20 },  // Cased Book By
            { wch: 12 },  // Date Filed
            { wch: 10 }   // Status
        ];
        ws['!cols'] = colWidths;
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Pending Cases');
        
        // Generate filename with current date
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        const filename = `SDMS_Pending_Cases_${dateStr}.xlsx`;
        
        // Write and download file
        XLSX.writeFile(wb, filename);
        
        showMessage('✅ Pending Cases Excel file exported successfully!', 'success');
        
        // Show additional info message
        setTimeout(() => {
            showMessage(`📄 File saved as: ${filename}`, 'info');
        }, 1500);
        
    } catch (error) {
        console.error('Export Pending Cases to Excel error:', error);
        showMessage('Failed to export Excel file. Please try again.', 'error');
    }
}

// Export solved cases to Excel function
async function exportSolvedToExcel() {
    try {
        showMessage('Preparing Solved Cases Excel export...', 'info');
        
        // Get all cases from Supabase
        const result = await CaseService.getCases();
        
        if (!result.success || !result.data || result.data.length === 0) {
            showMessage('No data available to export', 'warning');
            return;
        }
        
        // Filter for solved cases only
        const solvedCases = result.data.filter(caseItem => caseItem.resolved_at);
        
        if (solvedCases.length === 0) {
            showMessage('No solved cases available to export', 'warning');
            return;
        }
        
        // Prepare data for Excel export
        const excelData = solvedCases.map((caseItem, index) => {
            const createdDate = new Date(caseItem.created_at).toLocaleDateString('en-US');
            const resolvedDate = new Date(caseItem.resolved_at).toLocaleDateString('en-US');
            
            return {
                'S.No': index + 1,
                'Name': caseItem.Name || 'N/A',
                'Department': caseItem.Department || 'N/A',
                'Year': caseItem.Year || 'N/A',
                'Section': caseItem.Section || 'N/A',
                'Registration No': caseItem['Reg no'] || 'N/A',
                'Parent Contact': caseItem["Parent's no"] || 'N/A',
                'Case Description': caseItem.Case || 'N/A',
                'Cased Book By': caseItem['Cased Book By'] || 'N/A',
                'Date Filed': createdDate,
                'Date Resolved': resolvedDate,
                'Resolution Notes': caseItem.resolution_notes || 'N/A',
                'Status': 'Resolved'
            };
        });
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Set column widths
        const colWidths = [
            { wch: 5 },   // S.No
            { wch: 20 },  // Name
            { wch: 12 },  // Department
            { wch: 8 },   // Year
            { wch: 10 },  // Section
            { wch: 15 },  // Registration No
            { wch: 15 },  // Parent Contact
            { wch: 40 },  // Case Description
            { wch: 20 },  // Cased Book By
            { wch: 12 },  // Date Filed
            { wch: 12 },  // Date Resolved
            { wch: 30 },  // Resolution Notes
            { wch: 10 }   // Status
        ];
        ws['!cols'] = colWidths;
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Solved Cases');
        
        // Generate filename with current date
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        const filename = `SDMS_Solved_Cases_${dateStr}.xlsx`;
        
        // Write and download file
        XLSX.writeFile(wb, filename);
        
        showMessage('✅ Solved Cases Excel file exported successfully!', 'success');
        
        // Show additional info message
        setTimeout(() => {
            showMessage(`📄 File saved as: ${filename}`, 'info');
        }, 1500);
        
    } catch (error) {
        console.error('Export Solved Cases to Excel error:', error);
        showMessage('Failed to export Excel file. Please try again.', 'error');
    }
}

// Window resize handler for mobile menu
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('active') && 
        !navMenu.contains(e.target) && 
        !hamburger.contains(e.target)) {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    }
});