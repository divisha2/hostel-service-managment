// HSRMS Utility Functions
// Shared helpers for session management, API calls, and formatting

const session = {
  get: (key) => sessionStorage.getItem(key),
  set: (key, val) => sessionStorage.setItem(key, val),
  clear: () => sessionStorage.clear()
};

const api = async (path, options = {}) => {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const fmt = {
  date: (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  datetime: (d) => new Date(d).toLocaleString('en-IN'),
  id: (n) => 'REQ-' + String(n).padStart(3, '0')
};

// Table row expand/collapse
function toggleRow(triggerRow, detailRowId) {
  const detail = document.getElementById(detailRowId);
  if (!detail) return;
  
  const isOpen = detail.style.display === 'table-row' || (detail.style.display === '' && detail.offsetHeight > 0);
  
  // Close all open rows first
  document.querySelectorAll('tbody tr[data-detail]').forEach(r => {
    const detailId = r.dataset.detail;
    if (detailId) {
      const detailEl = document.getElementById(detailId);
      if (detailEl) {
        detailEl.style.display = 'none';
      }
      r.classList.remove('expanded');
    }
  });
  
  // Open the clicked row if it wasn't already open
  if (!isOpen) {
    detail.style.display = 'table-row';
    triggerRow.classList.add('expanded');
  }
}

// Form validation
function validateRequestForm() {
  const cat = document.getElementById('category').value;
  const desc = document.getElementById('description').value.trim();
  let valid = true;
  
  // Clear previous errors
  document.querySelectorAll('.field-error').forEach(el => el.style.display = 'none');
  
  if (!cat) {
    showFieldError('category', 'Select a category');
    valid = false;
  }
  
  if (desc.length < 10) {
    showFieldError('description', 'Min 10 characters required');
    valid = false;
  }
  
  return valid;
}

function showFieldError(fieldId, msg) {
  const el = document.getElementById(fieldId + '-error');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

// Filter bar
function applyFilters() {
  const status = document.getElementById('filter-status')?.value || '';
  const category = document.getElementById('filter-category')?.value || '';
  const priority = document.getElementById('filter-priority')?.value || '';
  
  document.querySelectorAll('tbody tr.data-row').forEach(row => {
    const match =
      (!status || row.dataset.status === status) &&
      (!category || row.dataset.category === category) &&
      (!priority || row.dataset.priority === priority);
    
    row.style.display = match ? '' : 'none';
    
    // Hide detail row if parent is hidden
    const detailId = row.dataset.detail;
    if (detailId && !match) {
      document.getElementById(detailId).style.display = 'none';
      row.classList.remove('expanded');
    }
  });
}

// Logout
function logout() {
  session.clear();
  window.location.href = '../student/login.html';
}
