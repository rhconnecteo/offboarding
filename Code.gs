var SHEET_ID = '1nL61HqFb9EKNmurLfT9qgo0U05bKqXqY1rKw0hC4klQ';
var SHEET_NAME = 'Demission';

// ================= DO GET (TOUT LE CRUD) =================
function doGet(e) {
  // Guard: Si doGet est appelée sans paramètres (test direct), créer un objet vide
  if (!e) {
    e = { parameter: {} };
  }
  
  const action = e.parameter.action;

  try {
    // ================= ACTION: GET ROWS (Lire toutes les données) =================
    if (action === "rows" || !action) {
      return output({ success: true, data: getRows() });
    }
    
    // ================= ACTION: CHECK (Marquer comme checked) =================
    if (action === "check") {
      const rowNumber = parseInt(e.parameter.rowNumber);
      markChecked(rowNumber);
      return output({ success: true, message: "Check enregistré" });
    }
    
    return output({ success: false, error: "Action inconnue: " + action });
  } catch (err) {
    return output({ success: false, error: err.toString() });
  }
}

// ================= DO POST (Redirection vers GET pour compatibilité) =================
function doPost(e) {
  try {
    if (e.postData) {
      const data = JSON.parse(e.postData.contents);
      // Rediriger vers doGet avec les paramètres
      const redirectUrl = ScriptApp.getService().getUrl() + '?action=' + encodeURIComponent(data.action) + '&rowNumber=' + data.rowNumber;
      return HtmlService.createHtmlOutput('<script>window.location.href="' + redirectUrl + '";</script>');
    }
  } catch (err) {
    return output({ success: false, error: err.toString() });
  }
}

// ================= GET ROWS (Retourner toutes les données) =================
function getRows() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[i][j];
    }
    obj._rowNumber = i + 1;
    rows.push(obj);
  }
  return rows;
}

// ================= MARK CHECKED (Mettre à jour Check et Date de désactivation) =================
function markChecked(rowNumber) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Chercher les colonnes existantes (insensible à la casse)
  var checkColIdx = findHeaderIndex(headers, 'checkin');
  var dateColIdx = findHeaderIndex(headers, 'date de désactivation');
  
  // Si colonnes manquent, les créer
  if (checkColIdx === -1) {
    checkColIdx = headers.length;
    sheet.getRange(1, checkColIdx + 1).setValue('Checkin');
  }
  
  if (dateColIdx === -1) {
    dateColIdx = headers.length + (checkColIdx === headers.length ? 1 : 0);
    sheet.getRange(1, dateColIdx + 1).setValue('Date de désactivation');
  }
  
  console.log('📍 Check col: ' + (checkColIdx + 1) + ', Date col: ' + (dateColIdx + 1));
  
  // Mettre à jour les cellules
  sheet.getRange(rowNumber, checkColIdx + 1).setValue(true);
  sheet.getRange(rowNumber, dateColIdx + 1).setValue(new Date());
  
  console.log('✅ Checked: Ligne ' + rowNumber);
}

function findHeaderIndex(headers, expectedName) {
  var target = expectedName.toString().toLowerCase().trim();
  for (var i = 0; i < headers.length; i++) {
    var current = headers[i].toString().toLowerCase().trim();
    if (current === target) return i;
  }
  return -1;
}

// ================= JSON OUTPUT =================
function output(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
