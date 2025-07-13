
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const SHEETS_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

function gFetch(url, accessToken, method='GET', body) {
  return fetch(url, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    ...(body && { body: JSON.stringify(body) })
  }).then(r => r.json());
}

export async function ensureUserSheet({ appName, userName, accessToken }) {
  const query = encodeURIComponent(`name='${appName}/${userName}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
  let res = await gFetch(`${DRIVE_FILES_URL}?q=${query}&fields=files(id,name)`, accessToken);
  if (res.files?.length) return res.files[0].id;
  res = await gFetch(`${SHEETS_URL}`, accessToken, 'POST', { properties: { title: `${appName}/${userName}` }, sheets: [{ properties: { title: 'Expenses' } }] });
  const header = [['ID','Timestamp','User Email','Counterparty Email','Type','Amount','Description','Group ID']];
  await gFetch(`${SHEETS_URL}/${res.spreadsheetId}/values/A1:H1:append?valueInputOption=RAW`, accessToken, 'POST', { values: header });
  return res.spreadsheetId;
}

export function appendExpense({ spreadsheetId, accessToken, entry }) {
  const values = [[entry.id, entry.timestamp, entry.userEmail, entry.counterparty, entry.type, entry.amount, entry.description, '']];
  return gFetch(`${SHEETS_URL}/${spreadsheetId}/values/A2:H2:append?valueInputOption=USER_ENTERED`, accessToken, 'POST', { values });
}

export async function fetchAllRows({ spreadsheetId, accessToken }) {
  const res = await gFetch(`${SHEETS_URL}/${spreadsheetId}/values/Expenses!A2:H10000`, accessToken);
  if (!res.values) return [];
  return res.values.map(([id,timestamp,userEmail,counterparty,type,amount,description], i)=>({ id, timestamp, userEmail, counterparty, type, amount, description, rowIndex: i+2 }));
}

export function updateExpenseRow({ spreadsheetId, accessToken, rowIndex, entry }) {
  const range = `Expenses!A${rowIndex}:H${rowIndex}`;
  const values = [[entry.id, entry.timestamp, entry.userEmail, entry.counterparty, entry.type, entry.amount, entry.description, '']];
  return gFetch(`${SHEETS_URL}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, accessToken, 'PUT', { values });
}

export function deleteExpenseRow({ spreadsheetId, accessToken, rowIndex }) {
  const body = { requests: [{ deleteDimension: { range: { sheetId: 0, dimension: 'ROWS', startIndex: rowIndex-1, endIndex: rowIndex } } }] };
  return gFetch(`${SHEETS_URL}/${spreadsheetId}:batchUpdate`, accessToken, 'POST', body);
}
