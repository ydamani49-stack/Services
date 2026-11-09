let customers = JSON.parse(localStorage.getItem('tailor_customers_modular')) || [];
let currentStatusFilter = 'الكل';
let tempPhotos = [];

const form = document.getElementById('customerForm');
const customerList = document.getElementById('customerList');
const searchInput = document.getElementById('searchInput');
const formContainer = document.getElementById('formContainer');

function toggleForm() {
    if (formContainer.style.display === 'block') {
        formContainer.style.display = 'none';
        document.getElementById('toggleIcon').textContent = '➕';
        document.getElementById('toggleText').textContent = 'إضافة طلب جديد';
    } else {
        formContainer.style.display = 'block';
        document.getElementById('toggleIcon').textContent = '❌';
        document.getElementById('toggleText').textContent = 'إغلاق نموذج الإضافة';
    }
}

function saveToLocalStorage() {
    localStorage.setItem('tailor_customers_modular', JSON.stringify(customers));
}

function updateStats() {
    const total = customers.length;
    const ready = customers.filter(c => c.status === 'جاهز للاستلام').length;
    const working = total - ready;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('workingCount').textContent = working;
    document.getElementById('readyCount').textContent = ready;
}

window.setDueDateDays = function(days, btnElement) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    document.getElementById('dueDate').value = d.toISOString().split('T')[0];
    
    document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
}

function getTimeAgo(dateString) {
    if (!dateString) return 'اليوم';
    const savedDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - savedDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    return `منذ ${diffDays} أيام`;
}

document.getElementById('itemPhotos').addEventListener('change', function(e) {
    const files = e.target.files;
    tempPhotos = [];
    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            const reader = new FileReader();
            reader.onloadend = function(event) {
                tempPhotos.push(event.target.result);
            }
            reader.readAsDataURL(files[i]);
        }
    }
});

function renderCustomers() {
    updateStats();
    customerList.innerHTML = '';
    const searchText = searchInput.value.toLowerCase();
    
    const filtered = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchText) || 
                              (c.phone && c.phone.includes(searchText)) ||
                              c.alteration.toLowerCase().includes(searchText);
        const matchesStatus = (currentStatusFilter === 'الكل' || c.status === currentStatusFilter);
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        customerList.innerHTML = '<p style="text-align: center; color: #ffffff; padding: 15px; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">لا توجد طلبات مسجلة.</p>';
        return;
    }

    filtered.forEach((cust) => {
        const realIndex = customers.indexOf(cust);
        let timeAgoText = getTimeAgo(cust.createdAt);

        let cardColorClass = 'card-pending';
        if (cust.status === 'جاري العمل') cardColorClass = 'card-working';
        if (cust.status === 'جاهز للاستلام') cardColorClass = 'card-ready';

        let photosHtml = '';
        if (cust.photos && cust.photos.length > 0) {
            photosHtml = `<div class="photos-container">`;
            cust.photos.forEach(p => {
                photosHtml += `<img src="${p}" class="item-photo" onclick="openLightbox('${p}')">`;
            });
            photosHtml += `</div>`;
        }

        let measurementsHtml = '';
        if (cust.lengthBefore || cust.lengthAfter || cust.shoulderBefore || cust.shoulderAfter || cust.chestBefore || cust.chestAfter || cust.sleeveBefore || cust.sleeveAfter) {
            measurementsHtml = `<div class="measurements-box"><span class="measurements-title">📏 تفاصيل القياسات:</span>`;
            
            if (cust.lengthBefore || cust.lengthAfter) {
                measurementsHtml += `<div class="meas-item meas-length"><span>طول:</span> <span>${cust.lengthBefore || '...'} سم ➔ ${cust.lengthAfter || '...'} سم</span></div>`;
            }
            if (cust.shoulderBefore || cust.shoulderAfter) {
                measurementsHtml += `<div class="meas-item meas-shoulder"><span>كتف:</span> <span>${cust.shoulderBefore || '...'} سم ➔ ${cust.shoulderAfter || '...'} سم</span></div>`;
            }
            if (cust.chestBefore || cust.chestAfter) {
                measurementsHtml += `<div class="meas-item meas-chest"><span>صدر:</span> <span>${cust.chestBefore || '...'} سم ➔ ${cust.chestAfter || '...'} سم</span></div>`;
            }
            if (cust.sleeveBefore || cust.sleeveAfter) {
                measurementsHtml += `<div class="meas-item meas-sleeve"><span>كم/إضافات:</span> <span>${cust.sleeveBefore || '...'} ➔ ${cust.sleeveAfter || '...'}</span></div>`;
            }
            
            measurementsHtml += `</div>`;
        }

        let waActionHtml = '';
        if (cust.phone && cust.phone.trim() !== '') {
            let waMessage = `مرحباً ${cust.name}، نخبرك من محل الخياطة بتالبورجت أن طلبك (${cust.alteration}) أصبح (${cust.status}). موعد الاستلام: ${cust.dueDate}. مرحبا بك!`;
            let waUrl = `https://wa.me/${cust.phone}?text=${encodeURIComponent(waMessage)}`;
            waActionHtml = `<a href="${waUrl}" target="_blank" class="wa-btn">💬 إرسال واتساب للزبون</a>`;
        }

        const div = document.createElement('div');
        div.className = `customer-item ${cardColorClass}`;
        div.innerHTML = `
            <div class="item-top">
                <div>
                    <div class="customer-name">${cust.name}</div>
                    <div class="customer-phone">${cust.phone ? '📞 ' + cust.phone : 'بدون رقم هاتف'}</div>
                </div>
                ${photosHtml}
            </div>

            <div class="order-box">
                ⚙️ <b>الطلب:</b> ${cust.alteration}
            </div>

            ${measurementsHtml}

            <div class="info-row">
                <span>📅 الموعد: <b class="due-date-highlight">${cust.dueDate}</b></span>
                <span>⏱️ ${timeAgoText}</span>
            </div>

            <div class="status-bar">
                <button class="status-btn ${cust.status === 'قيد الانتظار' ? 'active' : ''}" onclick="changeStatus(${realIndex}, 'قيد الانتظار')">انتظار</button>
                <button class="status-btn ${cust.status === 'جاري العمل' ? 'active' : ''}" onclick="changeStatus(${realIndex}, 'جاري العمل')">جاري</button>
                <button class="status-btn ${cust.status === 'جاهز للاستلام' ? 'active' : ''}" onclick="changeStatus(${realIndex}, 'جاهز للاستلام')">جاهز</button>
            </div>

            <div class="actions-bottom">
                ${waActionHtml}
                <button class="delete-btn" onclick="deleteCustomer(${realIndex})">حذف</button>
            </div>
        `;
        customerList.appendChild(div);
    });
}

window.openLightbox = function(src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightbox').style.display = 'flex';
}

window.setFilter = function(status, btnElement) {
    currentStatusFilter = status;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active-filter'));
    btnElement.classList.add('active-filter');
    renderCustomers();
}

window.changeStatus = function(index, newStatus) {
    customers[index].status = newStatus;
    saveToLocalStorage();
    renderCustomers();
}

form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newCustomer = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        status: document.getElementById('status').value,
        dueDate: document.getElementById('dueDate').value,
        alteration: document.getElementById('alteration').value,
        lengthBefore: document.getElementById('lengthBefore').value,
        lengthAfter: document.getElementById('lengthAfter').value,
        shoulderBefore: document.getElementById('shoulderBefore').value,
        shoulderAfter: document.getElementById('shoulderAfter').value,
        chestBefore: document.getElementById('chestBefore').value,
        chestAfter: document.getElementById('chestAfter').value,
        sleeveBefore: document.getElementById('sleeveBefore').value,
        sleeveAfter: document.getElementById('sleeveAfter').value,
        photos: tempPhotos || [],
        createdAt: new Date().toISOString()
    };

    customers.unshift(newCustomer);
    saveToLocalStorage();
    renderCustomers();
    form.reset();
    tempPhotos = [];
    document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
    toggleForm();
});

window.deleteCustomer = function(index) {
    if(confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        customers.splice(index, 1);
        saveToLocalStorage();
        renderCustomers();
    }
}

searchInput.addEventListener('input', renderCustomers);

renderCustomers();