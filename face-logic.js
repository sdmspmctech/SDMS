// Face Recognition Logic using face-api.js

let modelsLoaded = false;
let registerDescriptor = null;
let registerPhoto = null;
let registerStream = null;
let autofillStream = null;

// Helper to play a warning beep sound
function playBeep() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2); // Play for 200ms
    } catch (e) {
        console.error("Audio error:", e);
    }
}

// Initialize models
async function initFaceAPI() {
    try {
        console.log("Loading Face API models...");
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri('models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('models')
        ]);
        modelsLoaded = true;
        console.log("Face API models loaded successfully.");
    } catch (error) {
        console.error("Error loading Face API models:", error);
        if (window.location.protocol === 'file:') {
            alert("Error: Face Recognition models cannot load when opening the HTML file directly (file://). Please use a local web server (like VS Code Live Server) to run this application.");
        }
    }
}

// Load models when document is ready
document.addEventListener('DOMContentLoaded', () => {
    initFaceAPI();
    loadRegisteredStudents();
});

// --- Register Student Logic ---
const registerVideo = document.getElementById('registerVideo');
const startRegisterCameraBtn = document.getElementById('startRegisterCameraBtn');
const captureRegisterFaceBtn = document.getElementById('captureRegisterFaceBtn');
const registerCameraPlaceholder = document.getElementById('registerCameraPlaceholder');
const registerScanningOverlay = document.getElementById('registerScanningOverlay');
const registerFaceStatus = document.getElementById('registerFaceStatus');
const saveStudentBtn = document.getElementById('saveStudentBtn');
const registerStudentForm = document.getElementById('registerStudentForm');

if (startRegisterCameraBtn) {
    startRegisterCameraBtn.addEventListener('click', async () => {
        if (!modelsLoaded) {
            showMessage("Face recognition models are still loading. Please wait a moment.", "warning");
            return;
        }

        try {
            if (registerVideo.srcObject && registerVideo.paused) {
                // We are retaking
                registerVideo.play();
                registerDescriptor = null;
                registerPhoto = null;
                startRegisterCameraBtn.classList.add('hidden');
                captureRegisterFaceBtn.classList.remove('hidden');
                saveStudentBtn.disabled = true;
                
                registerFaceStatus.textContent = "Camera active. Please face the camera clearly.";
                registerFaceStatus.className = "mt-2 text-center text-sm font-medium p-2 rounded-lg w-full bg-blue-100 text-blue-800";
                return;
            }

            registerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            registerVideo.srcObject = registerStream;
            registerVideo.classList.remove('hidden');
            registerCameraPlaceholder.classList.add('hidden');
            
            startRegisterCameraBtn.classList.add('hidden');
            captureRegisterFaceBtn.classList.remove('hidden');
            
            registerFaceStatus.textContent = "Camera active. Please face the camera clearly.";
            registerFaceStatus.className = "mt-2 text-center text-sm font-medium p-2 rounded-lg w-full bg-blue-100 text-blue-800";
        } catch (err) {
            console.error("Error accessing camera:", err);
            showMessage("Could not access camera. Please allow camera permissions.", "error");
        }
    });
}

if (captureRegisterFaceBtn) {
    captureRegisterFaceBtn.addEventListener('click', async () => {
        if (!registerVideo.srcObject) return;
        
        registerScanningOverlay.classList.remove('hidden');
        registerFaceStatus.textContent = "Scanning face... Please wait.";
        registerFaceStatus.className = "mt-2 text-center text-sm font-medium p-2 rounded-lg w-full bg-yellow-100 text-yellow-800";
        
        try {
            const detection = await faceapi.detectSingleFace(registerVideo)
                                           .withFaceLandmarks()
                                           .withFaceDescriptor();
            
            if (detection) {
                registerDescriptor = detection.descriptor;
                
                // Capture image as base64
                const canvas = document.createElement('canvas');
                canvas.width = registerVideo.videoWidth;
                canvas.height = registerVideo.videoHeight;
                canvas.getContext('2d').drawImage(registerVideo, 0, 0, canvas.width, canvas.height);
                registerPhoto = canvas.toDataURL('image/jpeg', 0.8);
                
                // Pause camera to freeze frame instead of stopping it completely
                registerVideo.pause();
                
                registerScanningOverlay.classList.add('hidden');
                captureRegisterFaceBtn.classList.add('hidden');
                startRegisterCameraBtn.classList.remove('hidden');
                startRegisterCameraBtn.innerHTML = '<i class="fas fa-redo"></i> Retake Photo';
                
                registerFaceStatus.textContent = "Face scanned successfully! You can now save.";
                registerFaceStatus.className = "mt-2 text-center text-sm font-medium p-2 rounded-lg w-full bg-green-100 text-green-800";
                
                saveStudentBtn.disabled = false;
            } else {
                registerScanningOverlay.classList.add('hidden');
                registerFaceStatus.textContent = "No face detected. Please try again.";
                registerFaceStatus.className = "mt-2 text-center text-sm font-medium p-2 rounded-lg w-full bg-red-100 text-red-800";
            }
        } catch (error) {
            console.error("Error detecting face:", error);
            registerScanningOverlay.classList.add('hidden');
            registerFaceStatus.textContent = "Error scanning face.";
            registerFaceStatus.className = "mt-2 text-center text-sm font-medium p-2 rounded-lg w-full bg-red-100 text-red-800";
        }
    });
}

if (registerStudentForm) {
    registerStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!registerDescriptor) {
            showMessage("Please scan the student's face first.", "error");
            return;
        }
        
        const studentData = {
            name: document.getElementById('regStudentName').value,
            department: document.getElementById('regStudentDept').value,
            year: document.getElementById('regStudentYear').value,
            section: document.getElementById('regStudentSection').value,
            reg_no: document.getElementById('regStudentRegNo').value,
            parent_no: document.getElementById('regStudentParentNo').value,
            face_descriptor: JSON.stringify(Array.from(registerDescriptor)),
            photo_base64: registerPhoto
        };
        
        saveStudentBtn.disabled = true;
        saveStudentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking face...';
        
        try {
            // Check for duplicate face
            const { data: allStudents, error: fetchError } = await window.supabaseClient
                .from('students_data')
                .select('name, reg_no, face_descriptor');
                
            if (fetchError) throw fetchError;
            
            let duplicate = null;
            for (const s of allStudents) {
                if (!s.face_descriptor || s.face_descriptor === '[]') continue;
                const desc = new Float32Array(JSON.parse(s.face_descriptor));
                const distance = faceapi.euclideanDistance(registerDescriptor, desc);
                if (distance < 0.55) { // Slightly stricter threshold for registration
                    duplicate = s;
                    break;
                }
            }
            
            if (duplicate) {
                playBeep();
                showMessage(`ALREADY REGISTERED: This face matches ${duplicate.name} (${duplicate.reg_no})`, "error");
                saveStudentBtn.disabled = false;
                saveStudentBtn.innerHTML = '<i class="fas fa-save"></i> Save Student Data';
                return;
            }

            saveStudentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            const { data, error } = await window.supabaseClient
                .from('students_data')
                .insert([studentData]);
                
            if (error) {
                if (error.code === '23505') {
                    showMessage("A student with this Registration Number already exists.", "error");
                } else {
                    throw error;
                }
            } else {
                showMessage("Student registered successfully!", "success");
                registerStudentForm.reset();
                registerDescriptor = null;
                registerPhoto = null;
                saveStudentBtn.disabled = true;
                
                registerVideo.classList.add('hidden');
                registerCameraPlaceholder.classList.remove('hidden');
                startRegisterCameraBtn.innerHTML = '<i class="fas fa-video"></i> Start Camera';
                registerFaceStatus.textContent = "";
                registerFaceStatus.className = "mt-2 text-center text-sm font-medium p-2 rounded-lg w-full";
                
                // Stop the stream now that we saved
                if (registerStream) {
                    registerStream.getTracks().forEach(track => track.stop());
                    registerVideo.srcObject = null;
                }
                
                loadRegisteredStudents();
            }
        } catch (error) {
            console.error("Error saving student:", error);
            showMessage("Error saving student data.", "error");
        } finally {
            saveStudentBtn.disabled = false;
            saveStudentBtn.innerHTML = '<i class="fas fa-save"></i> Save Student Data';
        }
    });
}


// --- Autofill Logic ---
const autofillCameraModal = document.getElementById('autofillCameraModal');
const autofillVideo = document.getElementById('autofillVideo');
const autofillStatusOverlay = document.getElementById('autofillStatusOverlay');
const autofillStatusText = document.getElementById('autofillStatusText');

let autofillInterval = null;

async function openAutoFillCameraModal() {
    if (!modelsLoaded) {
        showMessage("Face recognition models are still loading. Please wait.", "warning");
        return;
    }
    
    autofillCameraModal.classList.remove('hidden');
    autofillVideo.classList.remove('hidden');
    autofillStatusOverlay.classList.remove('hidden');
    autofillStatusText.textContent = "Starting camera...";
    
    try {
        autofillStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        autofillVideo.srcObject = autofillStream;
        
        // Start scanning automatically once video starts playing
        autofillVideo.onplay = () => {
            startContinuousAutoFillScan();
        };
    } catch (err) {
        console.error("Camera error:", err);
        // Fallback to user camera if environment fails
        try {
            autofillStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            autofillVideo.srcObject = autofillStream;
            
            autofillVideo.onplay = () => {
                startContinuousAutoFillScan();
            };
        } catch (fallbackErr) {
            showMessage("Could not access camera. Please allow camera permissions.", "error");
            closeAutoFillCameraModal();
        }
    }
}

function closeAutoFillCameraModal() {
    autofillCameraModal.classList.add('hidden');
    if (autofillStream) {
        autofillStream.getTracks().forEach(track => track.stop());
        autofillVideo.srcObject = null;
    }
    autofillStatusOverlay.classList.add('hidden');
    if (autofillInterval) {
        clearInterval(autofillInterval);
        autofillInterval = null;
    }
}

async function startContinuousAutoFillScan() {
    autofillStatusText.textContent = "Looking for a face...";
    
    // Fetch all students from Supabase once
    const { data: students, error } = await window.supabaseClient
        .from('students_data')
        .select('*');
        
    if (error || !students || students.length === 0) {
        autofillStatusText.textContent = "No registered students found.";
        setTimeout(closeAutoFillCameraModal, 2000);
        return;
    }
    
    autofillInterval = setInterval(async () => {
        if (!autofillVideo.srcObject || autofillVideo.paused) return;
        
        try {
            const detection = await faceapi.detectSingleFace(autofillVideo)
                                           .withFaceLandmarks()
                                           .withFaceDescriptor();
                                           
            if (detection) {
                autofillStatusText.textContent = "Face detected! Matching...";
                
                let bestMatch = null;
                let minDistance = 0.6; // Threshold
                
                for (const student of students) {
                    if (student.face_descriptor) {
                        const descriptorArray = JSON.parse(student.face_descriptor);
                        const studentDescriptor = new Float32Array(descriptorArray);
                        const distance = faceapi.euclideanDistance(detection.descriptor, studentDescriptor);
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            bestMatch = student;
                        }
                    }
                }
                
                if (bestMatch) {
                    clearInterval(autofillInterval); // Stop scanning on match
                    autofillStatusText.innerHTML = `<i class="fas fa-check-circle text-green-400"></i> Match found: ${bestMatch.name}`;
                    
                    // Auto-fill form fields
                    const fieldMappings = {
                        'studentName': bestMatch.name,
                        'regNo': bestMatch.reg_no,
                        'department': bestMatch.department,
                        'year': bestMatch.year,
                        'section': bestMatch.section,
                        'parentNo': bestMatch.parent_no
                    };
                    
                    for (const [id, value] of Object.entries(fieldMappings)) {
                        const el = document.getElementById(id);
                        if (el) {
                            el.value = value;
                            // Freeze the field
                            if (el.tagName === 'SELECT') {
                                el.style.pointerEvents = 'none';
                                el.tabIndex = -1;
                            } else {
                                el.readOnly = true;
                            }
                            el.classList.add('bg-gray-200'); // Visual indication that it's frozen
                        }
                    }
                    
                    // Show matched photo if available
                    const matchedStudentPhoto = document.getElementById('profilePhoto');
                    const profilePlaceholder = document.getElementById('profilePlaceholder');
                    const removePhotoBtn = document.getElementById('removePhotoBtn');
                    
                    if (matchedStudentPhoto && bestMatch.photo_base64) {
                        matchedStudentPhoto.src = bestMatch.photo_base64;
                        matchedStudentPhoto.classList.remove('hidden');
                        if (profilePlaceholder) profilePlaceholder.classList.add('hidden');
                        if (removePhotoBtn) removePhotoBtn.style.display = 'flex';
                        
                        // Also store it in the window object so the existing save logic might pick it up if needed,
                        // though it's already an img src. The existing save logic uses a data URL from the image.
                        window.currentPhotoData = bestMatch.photo_base64;
                    }
                    
                    showMessage(`Auto-filled details for ${bestMatch.name}`, "success");
                    
                    setTimeout(() => {
                        closeAutoFillCameraModal();
                    }, 1500);
                } else {
                    autofillStatusText.textContent = "Face not recognized. Keep looking...";
                }
            } else {
                autofillStatusText.textContent = "Looking for a face...";
            }
        } catch (error) {
            console.error("Error during autofill scan:", error);
        }
    }, 1000); // scan every 1 second
}

        



// --- Student Dairy Logic ---
let allStudentsCache = []; // cache for filtering

async function loadRegisteredStudents() {
    const tableBody = document.getElementById('registeredStudentsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7" class="p-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading students...</td></tr>';

    try {
        const { data: students, error } = await window.supabaseClient
            .from('students_data')
            .select('id, name, department, year, section, reg_no, parent_no, photo_base64, face_descriptor, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allStudentsCache = students || [];
        renderStudentTable(allStudentsCache);

    } catch (error) {
        console.error("Error loading registered students:", error);
        tableBody.innerHTML = '<tr><td colspan="7" class="p-8 text-center text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>Error loading students data.</td></tr>';
    }
}

function renderStudentTable(students) {
    const tableBody = document.getElementById('registeredStudentsTableBody');
    const statsBar = document.getElementById('studentStatsBar');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (statsBar) {
        statsBar.innerHTML = `<span class="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold mr-1">${students.length}</span> records found`;
    }

    if (!students || students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="p-16 text-center text-gray-400">
            <div class="flex flex-col items-center gap-2 opacity-60">
                <i class="fas fa-search-minus text-4xl mb-2"></i>
                <p class="text-lg font-semibold">No students matched your search</p>
                <p class="text-sm">Try adjusting your filters or search terms</p>
            </div>
        </td></tr>`;
        return;
    }

    students.forEach(student => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-indigo-50/50 transition-all duration-200 group border-b border-gray-50';

        const photoHTML = student.photo_base64
            ? `<div class="relative inline-block">
                 <img src="${student.photo_base64}" class="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                 <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
               </div>`
            : `<div class="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 border-2 border-white shadow-sm group-hover:bg-gray-200 transition-colors">
                 <i class="fas fa-user"></i>
               </div>`;

        tr.innerHTML = `
            <td class="p-4 text-center">${photoHTML}</td>
            <td class="p-4">
                <span class="font-mono text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200">
                    ${student.reg_no}
                </span>
            </td>
            <td class="p-4">
                <div class="font-bold text-gray-900 group-hover:text-purple-700 transition-colors">${student.name}</div>
                <div class="text-[10px] text-gray-400 uppercase tracking-tighter mt-0.5">Full Name</div>
            </td>
            <td class="p-4">
                <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                    <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    ${student.department}
                </div>
            </td>
            <td class="p-4 text-center">
                <div class="flex flex-col items-center">
                    <span class="text-sm font-bold text-gray-700">${student.year}${['st','nd','rd','th'][student.year-1] || 'th'} Year</span>
                    <span class="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 rounded uppercase">Section ${student.section}</span>
                </div>
            </td>
            <td class="p-4">
                <div class="flex items-center gap-2 text-gray-600 font-medium">
                    <i class="fas fa-phone-alt text-[10px] opacity-40"></i>
                    ${student.parent_no}
                </div>
            </td>
            <td class="p-4 text-center">
                <button onclick="openEditStudentModal(${JSON.stringify(student).replace(/"/g, '&quot;')})"
                    class="h-9 px-4 bg-white hover:bg-purple-600 text-purple-600 hover:text-white border-2 border-purple-600 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto">
                    <i class="fas fa-pencil-alt"></i> Edit Profile
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function filterStudentTable() {
    const search = (document.getElementById('studentSearchInput')?.value || '').toLowerCase();
    const dept = document.getElementById('filterDept')?.value || '';
    const year = document.getElementById('filterYear')?.value || '';

    const filtered = allStudentsCache.filter(s => {
        const matchSearch = !search ||
            s.name.toLowerCase().includes(search) ||
            s.reg_no.toLowerCase().includes(search);
        const matchDept = !dept || s.department === dept;
        const matchYear = !year || String(s.year) === year;
        return matchSearch && matchDept && matchYear;
    });

    renderStudentTable(filtered);
}


// --- Edit Student Modal ---
let editStream = null;
let editNewDescriptor = null;
let editNewPhoto = null;

function openEditStudentModal(student) {
    document.getElementById('editStudentId').value = student.id;
    document.getElementById('editStudentName').value = student.name;
    document.getElementById('editStudentRegNo').value = student.reg_no;
    document.getElementById('editStudentDept').value = student.department;
    document.getElementById('editStudentYear').value = student.year;
    document.getElementById('editStudentSection').value = student.section;
    document.getElementById('editStudentParentNo').value = student.parent_no;

    // Reset face fields
    editNewDescriptor = null;
    editNewPhoto = null;
    document.getElementById('editFaceStatus').textContent = '';
    document.getElementById('editCaptureFaceBtn').classList.add('hidden');
    document.getElementById('editStartCameraBtn').classList.remove('hidden');
    document.getElementById('editCameraVideo').classList.add('hidden');

    // Show existing photo
    const preview = document.getElementById('editPhotoPreview');
    if (student.photo_base64) {
        preview.innerHTML = `<img src="${student.photo_base64}" class="w-full h-full object-cover rounded-full">`;
    } else {
        preview.innerHTML = '<i class="fas fa-user text-gray-400 text-2xl"></i>';
    }

    document.getElementById('editStudentModal').classList.remove('hidden');
}

function closeEditStudentModal() {
    document.getElementById('editStudentModal').classList.add('hidden');
    if (editStream) {
        editStream.getTracks().forEach(t => t.stop());
        editStream = null;
        document.getElementById('editCameraVideo').srcObject = null;
    }
}

async function startEditCamera() {
    if (!modelsLoaded) {
        showMessage("Face AI models are still loading.", "warning");
        return;
    }
    try {
        editStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        const video = document.getElementById('editCameraVideo');
        video.srcObject = editStream;
        video.classList.remove('hidden');
        document.getElementById('editStartCameraBtn').classList.add('hidden');
        document.getElementById('editCaptureFaceBtn').classList.remove('hidden');
        document.getElementById('editFaceStatus').textContent = 'Camera on. Face the camera clearly.';
    } catch (err) {
        showMessage("Camera access failed.", "error");
    }
}

async function captureEditFace() {
    const video = document.getElementById('editCameraVideo');
    if (!video.srcObject) return;

    document.getElementById('editFaceStatus').textContent = 'Scanning face...';

    const detection = await faceapi.detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) {
        document.getElementById('editFaceStatus').textContent = 'No face detected. Try again.';
        return;
    }

    editNewDescriptor = detection.descriptor;

    // Capture photo
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    editNewPhoto = canvas.toDataURL('image/jpeg', 0.8);

    // Stop camera & preview
    editStream.getTracks().forEach(t => t.stop());
    editStream = null;
    video.srcObject = null;
    video.classList.add('hidden');

    document.getElementById('editPhotoPreview').innerHTML = `<img src="${editNewPhoto}" class="w-full h-full object-cover rounded-full">`;
    document.getElementById('editCaptureFaceBtn').classList.add('hidden');
    document.getElementById('editStartCameraBtn').classList.remove('hidden');
    document.getElementById('editStartCameraBtn').innerHTML = '<i class="fas fa-redo"></i> Retake';
    document.getElementById('editFaceStatus').textContent = '✓ Face captured successfully!';
}

async function saveEditStudent() {
    const id = document.getElementById('editStudentId').value;
    const updateData = {
        name: document.getElementById('editStudentName').value.trim(),
        reg_no: document.getElementById('editStudentRegNo').value.trim(),
        department: document.getElementById('editStudentDept').value,
        year: document.getElementById('editStudentYear').value,
        section: document.getElementById('editStudentSection').value,
        parent_no: document.getElementById('editStudentParentNo').value.trim()
    };

    if (!updateData.name || !updateData.reg_no || !updateData.department || !updateData.year || !updateData.section) {
        showMessage("Please fill all required fields.", "error");
        return;
    }

    if (editNewDescriptor) {
        updateData.face_descriptor = JSON.stringify(Array.from(editNewDescriptor));
        updateData.photo_base64 = editNewPhoto;
    }

    try {
        const { error } = await window.supabaseClient
            .from('students_data')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;

        showMessage(`${updateData.name} updated successfully!`, "success");
        closeEditStudentModal();
        loadRegisteredStudents();
    } catch (err) {
        console.error("Error updating student:", err);
        showMessage("Failed to save changes.", "error");
    }
}


// --- Bulk CSV Upload ---
async function handleBulkUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = ''; // reset so same file can be re-uploaded

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const rows = text.trim().split('\n');
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());

        // Expected: name, reg_no, department, year, section, parent_no
        const required = ['name', 'reg_no', 'department', 'year', 'section', 'parent_no'];
        const missing = required.filter(r => !headers.includes(r));

        if (missing.length > 0) {
            showBulkResult('❌', 'Invalid CSV Format', `Missing columns: ${missing.join(', ')}<br><br><b>Expected headers:</b><br>name, reg_no, department, year, section, parent_no`);
            return;
        }

        const records = [];
        for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(',').map(v => v.trim());
            if (values.length < required.length) continue;
            const record = {};
            headers.forEach((h, idx) => { record[h] = values[idx] || ''; });

            if (!record.name || !record.reg_no) continue; // skip empty rows

            records.push({
                name: record.name,
                reg_no: record.reg_no,
                department: record.department,
                year: record.year,
                section: record.section,
                parent_no: record.parent_no,
                face_descriptor: '[]' // empty — face will be added via Edit later
            });
        }

        if (records.length === 0) {
            showBulkResult('⚠️', 'No Data Found', 'The CSV file is empty or has no valid rows.');
            return;
        }

        // Upsert to Supabase (insert or update by reg_no)
        const { data, error } = await window.supabaseClient
            .from('students_data')
            .upsert(records, { onConflict: 'reg_no' });

        if (error) {
            showBulkResult('❌', 'Upload Failed', error.message);
        } else {
            showBulkResult('✅', 'Upload Successful!', `${records.length} student${records.length !== 1 ? 's' : ''} imported successfully.<br><small class="text-gray-400">Use the Edit button to scan each student's face.</small>`);
        }
    };

    reader.readAsText(file);
}

function showBulkResult(icon, title, msg) {
    document.getElementById('bulkUploadResultIcon').textContent = icon;
    document.getElementById('bulkUploadResultTitle').textContent = title;
    document.getElementById('bulkUploadResultMsg').innerHTML = msg;
    document.getElementById('bulkUploadResultModal').classList.remove('hidden');
}

