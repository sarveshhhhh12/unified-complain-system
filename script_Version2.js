// Global state
let complaints = [];
let adminLoggedIn = false;
const ADMIN_PASSWORD = 'admin123';
let selectedFiles = [];

// Initialize app on load
document.addEventListener('DOMContentLoaded', function() {
    loadAllComplaints();
    setupEventListeners();
    hideAdminPanel();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('complaintForm').addEventListener('submit', handleSubmit);
    document.getElementById('attachments').addEventListener('change', handleFileSelection);
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const state = document.getElementById('state').value;
    const category = document.getElementById('category').value;
    const complaint = document.getElementById('complaint').value.trim();

    if (!name || !email || !phone || !state || !category || !complaint) {
        alert('❌ Please fill in all required fields!');
        return;
    }

    if (!isValidEmail(email)) {
        alert('❌ Please enter a valid email address!');
        return;
    }

    if (phone.length !== 10 || isNaN(phone)) {
        alert('❌ Please enter a valid 10-digit phone number!');
        return;
    }

    const attachments = selectedFiles.map(f => ({
        name: f.name,
        size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
        type: f.type
    }));

    const newComplaint = {
        id: Date.now(),
        name: name,
        email: email,
        phone: phone,
        state: state,
        category: category,
        complaint: complaint,
        attachments: attachments,
        status: 'Pending',
        date: new Date().toLocaleString('en-IN')
    };

    complaints = JSON.parse(localStorage.getItem('complaints')) || [];
    complaints.push(newComplaint);
    localStorage.setItem('complaints', JSON.stringify(complaints));

    document.getElementById('complaintForm').reset();
    document.getElementById('filePreview').innerHTML = '';
    selectedFiles = [];

    showNotification('✅ Complaint submitted successfully! Ref ID: ' + newComplaint.id);
    loadAllComplaints();
}

// File handling
function handleFileSelection(e) {
    selectedFiles = [];
    const files = e.target.files;
    const preview = document.getElementById('filePreview');
    preview.innerHTML = '';

    if (files.length > 5) {
        alert('⚠️ Maximum 5 files allowed!');
        e.target.value = '';
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileSize = (file.size / 1024 / 1024).toFixed(2);

        if (fileSize > 5) {
            alert(`⚠️ File "${file.name}" is too large (Max 5MB)`);
            continue;
        }

        selectedFiles.push(file);

        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-item-name">${file.name}</div>
            <div class="file-item-size">${fileSize} MB</div>
            <button type="button" class="file-remove" onclick="removeFile(${i})">×</button>
        `;
        preview.appendChild(fileItem);
    }
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    const fileInput = document.getElementById('attachments');
    const dataTransfer = new DataTransfer();
    selectedFiles.forEach(file => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;
    handleFileSelection({ target: fileInput });
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Admin Panel Functions
function openAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'block';
}

function closeAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'none';
}

function verifyAdminPassword() {
    const password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        adminLoggedIn = true;
        document.getElementById('adminLoginModal').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('adminAccessBtn').style.display = 'none';
        document.getElementById('adminPassword').value = '';
        loadAllComplaints();
        showNotification('✅ Admin logged in successfully!');
    } else {
        alert('❌ Invalid password! Try again.');
        document.getElementById('adminPassword').value = '';
    }
}

function logoutAdmin() {
    adminLoggedIn = false;
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminAccessBtn').style.display = 'block';
    document.getElementById('adminPassword').value = '';
    showNotification('🔒 Admin logged out!');
}

function hideAdminPanel() {
    if (!adminLoggedIn) {
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('adminAccessBtn').style.display = 'block';
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('adminLoginModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Load and display all complaints
function loadAllComplaints() {
    complaints = JSON.parse(localStorage.getItem('complaints')) || [];
    loadUserComplaints(complaints);
    if (adminLoggedIn) {
        loadAdminComplaints(complaints);
    }
}

// Load complaints for user view
function loadUserComplaints(complaintsData) {
    const userComplaintsDiv = document.getElementById('userComplaints');
    userComplaintsDiv.innerHTML = '';

    if (complaintsData.length === 0) {
        userComplaintsDiv.innerHTML = '<p class="empty-message">No complaints yet. Submit one above!</p>';
        return;
    }

    complaintsData.forEach(complaint => {
        const card = createComplaintCard(complaint, false);
        userComplaintsDiv.appendChild(card);
    });
}

// Load complaints for admin view
function loadAdminComplaints(complaintsData) {
    const adminComplaintsDiv = document.getElementById('adminComplaints');
    adminComplaintsDiv.innerHTML = '';

    if (complaintsData.length === 0) {
        adminComplaintsDiv.innerHTML = '<p class="empty-message">No complaints to manage.</p>';
        return;
    }

    complaintsData.forEach(complaint => {
        const card = createComplaintCard(complaint, true);
        adminComplaintsDiv.appendChild(card);
    });
}

// Create complaint card
function createComplaintCard(complaint, isAdmin) {
    const card = document.createElement('div');
    card.className = `complaint-card ${complaint.status.toLowerCase().replace(' ', '')}`;

    let statusClass = `status-${complaint.status.toLowerCase().replace(' ', '')}`;

    let attachmentsHTML = '';
    if (complaint.attachments && complaint.attachments.length > 0) {
        attachmentsHTML = `
            <div class="complaint-attachments">
                <strong>📎 Attachments:</strong>
                <div class="attachment-list">
                    ${complaint.attachments.map(att => 
                        `<span class="attachment-item">📄 ${att.name}</span>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    let cardContent = `
        <div class="complaint-header">
            <div style="flex: 1;">
                <div class="complaint-title">📌 Complaint ID: ${complaint.id}</div>
                <div class="complaint-info">👤 ${complaint.name}</div>
                <div class="complaint-info">📧 ${complaint.email}</div>
                <div class="complaint-info">📱 ${complaint.phone}</div>
            </div>
        </div>
        <div>
            <span class="complaint-location">📍 ${complaint.state}</span>
            <span class="complaint-category">📋 ${complaint.category}</span>
            <span class="status-badge ${statusClass}">${complaint.status}</span>
        </div>
        <div class="complaint-text">${complaint.complaint}</div>
        ${attachmentsHTML}
        <div class="complaint-meta">
            <span class="complaint-date">📅 ${complaint.date}</span>
    `;

    if (isAdmin) {
        cardContent += `
            <div class="admin-actions">
                <select class="status-dropdown" onchange="updateStatus(${complaint.id}, this.value)">
                    <option value="Pending" ${complaint.status === 'Pending' ? 'selected' : ''}>🔴 Pending</option>
                    <option value="In Progress" ${complaint.status === 'In Progress' ? 'selected' : ''}>🟠 In Progress</option>
                    <option value="Resolved" ${complaint.status === 'Resolved' ? 'selected' : ''}>🟢 Resolved</option>
                </select>
                <button class="btn btn-delete" onclick="deleteComplaint(${complaint.id})">🗑️ Delete</button>
            </div>
        `;
    }

    cardContent += `</div>`;
    card.innerHTML = cardContent;

    return card;
}

// Update complaint status
function updateStatus(complaintId, newStatus) {
    complaints = JSON.parse(localStorage.getItem('complaints')) || [];
    const complaint = complaints.find(c => c.id === complaintId);
    if (complaint) {
        complaint.status = newStatus;
        localStorage.setItem('complaints', JSON.stringify(complaints));
        loadAllComplaints();
        showNotification(`✅ Status updated to "${newStatus}"!`);
    }
}

// Delete single complaint
function deleteComplaint(complaintId) {
    if (confirm('❓ Are you sure you want to delete this complaint?')) {
        complaints = JSON.parse(localStorage.getItem('complaints')) || [];
        complaints = complaints.filter(c => c.id !== complaintId);
        localStorage.setItem('complaints', JSON.stringify(complaints));
        loadAllComplaints();
        showNotification('🗑️ Complaint deleted successfully!');
    }
}

// Clear all data
function clearAllData() {
    if (confirm('⚠️ WARNING: This will delete ALL complaints! Are you sure?')) {
        if (confirm('⚠️ This action CANNOT be undone! Proceed?')) {
            localStorage.removeItem('complaints');
            complaints = [];
            loadAllComplaints();
            showNotification('🗑️ All data cleared!');
        }
    }
}

// Export data as JSON
function exportData() {
    complaints = JSON.parse(localStorage.getItem('complaints')) || [];

    if (complaints.length === 0) {
        alert('📭 No data to export!');
        return;
    }

    const dataStr = JSON.stringify(complaints, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `complaints_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    showNotification('📊 Data exported successfully!');
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #51cf66;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}