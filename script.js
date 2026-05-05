// URL de l'API Apps Script - remplacez par votre URL de déploiement
const API_BASE = 'https://script.google.com/macros/s/AKfycby081TukxUd-_jAd5qdXUKTWwQ7qMCbKP7OqSGCCC6mZ3z8Cyg6C-H0x-4fAZ6DJxbd/exec';

function showAlert(msg, type = 'success'){
  const a = document.getElementById('alert');
  if (!a) return console.warn('Alert element not found');
  a.hidden = false;
  a.textContent = msg;
  a.className = 'alert ' + type;
  setTimeout(() => a.hidden = true, 3500);
}

function formatDate(d){
  if (!d) return '';
  if (typeof d === 'string') {
    // Si c'est déjà une string, essayer de la parser comme date
    try {
      d = new Date(d);
    } catch {
      return d;
    }
  }
  
  // Convertir en fuseau horaire Madagascar (UTC+3) et afficher seulement la date
  const dt = new Date(d);
  const options = {
    timeZone: 'Indian/Antananarivo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  return dt.toLocaleDateString('fr-FR', options);
}

function isCheckedValue(value){
  return value === true || value === 'TRUE' || value === 'true' || value === 1;
}

let currentView = 'pending';

function formatMadagascarDate(value = new Date()){
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Indian/Antananarivo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(value);
}

function previewCheckboxState(checkbox, rowNumber){
  const row = checkbox.closest('tr');
  if (!row) return;

  const dateCell = row.querySelector('.date-desactivation-cell');
  const confirmButton = row.querySelector('.btn-check');

  if (checkbox.checked) {
    if (dateCell) {
      dateCell.textContent = formatMadagascarDate();
    }
    if (confirmButton) {
      confirmButton.classList.add('btn-check-ready');
      confirmButton.disabled = false;
    }
  } else {
    if (dateCell) {
      dateCell.textContent = '';
    }
    if (confirmButton) {
      confirmButton.classList.remove('btn-check-ready');
      confirmButton.disabled = true;
    }
  }

  row.dataset.previewChecked = checkbox.checked ? 'true' : 'false';
  row.dataset.rowNumber = String(rowNumber);
}

function setConfirmButtonState(row, state){
  const confirmButton = row ? row.querySelector('.btn-check') : null;
  if (!confirmButton) return;

  if (state === 'saving') {
    confirmButton.disabled = true;
    confirmButton.textContent = 'Confirmation...';
    confirmButton.classList.add('btn-check-ready');
    return;
  }

  if (state === 'confirmed') {
    confirmButton.disabled = true;
    confirmButton.textContent = 'Confirmé';
    confirmButton.classList.add('btn-check-ready');
    return;
  }

  if (state === 'ready') {
    confirmButton.disabled = false;
    confirmButton.textContent = 'Confirmer';
    confirmButton.classList.add('btn-check-ready');
    return;
  }

  confirmButton.disabled = true;
  confirmButton.textContent = 'Confirmer';
  confirmButton.classList.remove('btn-check-ready');
}

function renderTable(rows){
  console.log('🔄 renderTable appelé avec', rows.length, 'lignes');
  
  const wrap = document.getElementById('table-wrap');
  if (!wrap) {
    console.error('❌ Element table-wrap not found');
    return;
  }
  
  const pendingRows = rows.filter(r => {
    const isChecked = isCheckedValue(r['Checkin']) || isCheckedValue(r['Check']);
    return !isChecked;  // Afficher que si PAS coché
  });
  const completedRows = rows.filter(r => isCheckedValue(r['Checkin']) || isCheckedValue(r['Check']));
  const activeRows = currentView === 'completed' ? completedRows : currentView === 'all' ? rows : pendingRows;

  updateCounts({ pending: pendingRows.length, completed: completedRows.length, total: rows.length });

  console.log(`📊 Vue: ${currentView} | Lignes affichées: ${activeRows.length}/${rows.length}`);

  if (!activeRows || activeRows.length === 0){
    wrap.innerHTML = currentView === 'completed'
      ? '<div class="card">Aucune ligne déjà faite.</div>'
      : '<div class="card">✅ Tous les collaborateurs ont été traités!</div>';
    return;
  }
  
  // Afficher TOUTES les colonnes du sheet dans l'ordre (sauf _rowNumber et l'ancien Check)
  const allKeys = Object.keys(activeRows[0]).filter(k => {
    const normalized = k.toLowerCase().trim();
    return normalized !== '_rownumber' && normalized !== 'check';
  });
  console.log('📊 Toutes les colonnes:', allKeys);
  
  let html = '<div class="card"><table class="table"><thead><tr>';
  html += allKeys.map(h => `<th>${h}</th>`).join('');
  html += '<th>Action</th></tr></thead><tbody>';
  
  html += activeRows.map((r, idx) => {
    const isChecked = isCheckedValue(r['Checkin']) || isCheckedValue(r['Check']);
    const rowClass = isChecked ? 'row-checked' : '';
    let cells = '';
    
    for (const h of allKeys) {
      let val = r[h] || '';
      
      // Formatage spécial selon le type de colonne
      if (h && h.toLowerCase().includes('mail')) {
        cells += `<td class="mail-cell"><strong>${val}</strong></td>`;
      } else if (h && h.toLowerCase() === 'checkin') {
        cells += `<td class="check-cell">${isChecked ? '✓' : ''}</td>`;
      } else if (h && h.toLowerCase().includes('date de désactivation')) {
        cells += `<td class="date-desactivation-cell">${formatDate(val)}</td>`;
      } else if (h && h.toLowerCase().includes('date')) {
        cells += `<td class="date-cell">${formatDate(val)}</td>`;
      } else {
        cells += `<td>${val}</td>`;
      }
    }
    
    // Colonne Action: checkbox + bouton
    const checkboxHtml = `<input type="checkbox" class="row-checkbox" ${isChecked ? 'checked disabled' : ''} onchange="handleCheckboxChange(this, ${r._rowNumber})">`;
    const action = `<td class="action-cell">${checkboxHtml} <button class="btn-check" disabled onclick="markChecked(${r._rowNumber})">Confirmer</button></td>`;
    
    return `<tr class="${rowClass}" data-row-number="${r._rowNumber}">${cells}${action}</tr>`;
  }).join('');
  
  html += '</tbody></table></div>';
  console.log('✅ HTML généré');
  wrap.innerHTML = html;
}

async function markChecked(rowNumber){
  console.log('✔️ markChecked appelé pour ligne', rowNumber);
  try {
    const row = document.querySelector(`tr[data-row-number="${rowNumber}"]`);
    const checkbox = row ? row.querySelector('.row-checkbox') : null;
    if (!checkbox || !checkbox.checked) {
      showAlert('Cochez la ligne avant de confirmer', 'error');
      return;
    }

    setConfirmButtonState(row, 'saving');

    // Utiliser GET au lieu de POST pour éviter CORS
    const url = API_BASE + '?action=check&rowNumber=' + rowNumber;
    console.log('📍 URL GET appelée:', url);
    
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const j = await res.json();
    console.log('✅ Réponse:', j);
    
    if (j.success === true){
      showAlert('✓ Enregistré - Ligne masquée', 'success');
      setConfirmButtonState(row, 'confirmed');
      if (row) {
        row.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateY(-4px)';
        setTimeout(() => row.remove(), 220);
      }
    } else {
      setConfirmButtonState(row, 'ready');
      showAlert('❌ Erreur: ' + (j.error || j.message || 'unknown'), 'error');
    }
  } catch (err) {
    console.error('❌ Erreur markChecked:', err);
    const row = document.querySelector(`tr[data-row-number="${rowNumber}"]`);
    setConfirmButtonState(row, 'ready');
    showAlert('❌ Erreur: ' + err.message, 'error');
  }
}

function handleCheckboxChange(checkbox, rowNumber){
  console.log('☑️ Checkbox changée pour ligne', rowNumber, '- Checked:', checkbox.checked);
  const row = checkbox.closest('tr');
  if (checkbox.checked) {
    previewCheckboxState(checkbox, rowNumber);
    setConfirmButtonState(row, 'ready');
    showAlert('Date prête, cliquez sur Confirmer pour enregistrer', 'success');
  } else {
    previewCheckboxState(checkbox, rowNumber);
    setConfirmButtonState(row, 'idle');
  }
}

function updateCounts(counts){
  const pending = document.getElementById('count-pending');
  const completed = document.getElementById('count-completed');
  const total = document.getElementById('count-total');

  if (pending) pending.textContent = String(counts.pending);
  if (completed) completed.textContent = String(counts.completed);
  if (total) total.textContent = String(counts.total);
}

function setView(view){
  currentView = view;
  document.querySelectorAll('.sidebar-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.view === view);
  });
  loadRows();
}

async function loadRows(){
  console.log('📥 loadRows appelé - Appel API...');
  try {
    const url = API_BASE + '?action=rows';
    console.log('📍 URL appelée:', url);
    
    const res = await fetch(url);
    console.log('📡 Réponse HTTP:', res.status, res.statusText);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const json = await res.json();
    console.log('✅ Données reçues:', json);
    
    if (json.success && json.data) {
      renderTable(json.data);
    } else {
      showAlert('Erreur: ' + (json.error || 'Pas de données'), 'error');
    }
  } catch (err) {
    console.error('❌ Erreur API:', err);
    showAlert('Erreur: ' + err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', function(){
  console.log('🚀 DOM chargé');
  document.querySelectorAll('.sidebar-btn').forEach(button => {
    button.addEventListener('click', () => setView(button.dataset.view));
  });
  loadRows();
});
