/**
 * Google Apps Script for Business Performance Input App
 *
 * Implements a simple API to interact with Google Sheets.
 * - Handles `doPost` for creating records (logs).
 * - Handles `doGet` for retrieving data (programs, users).
 */

const SHEET_NAMES = {
  STAFF: 'Staff_DB',
  PROGRAMS: 'Program_DB',
  USERS: 'User_DB',
  LOGS: 'Performance_DB'
};

function doGet(e) {
  const action = e.parameter.action;
  const token = e.parameter.token; // Simple token (e.g., Staff Name for now)

  let result = {};

  try {
    if (action === 'get_init_data') {
      result = getInitData();
    } else if (action === 'get_users') {
      result = getUsers();
    } else {
      throw new Error('Invalid action');
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // Handle cross-origin requests
  if (!e.postData) {
     return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No post data' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  let result = {};

  try {
    if (action === 'login') {
      result = loginUser(data.name, data.team, data.password);
    } else if (action === 'submit_log') {
      result = submitLog(data);
    } else if (action === 'upload_users') {
      result = uploadUsers(data.users);
    } else {
      throw new Error('Invalid action: ' + action);
    }
     return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
     return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- Logic Functions ---

function getInitData() {
  // Returns basic config or public info if needed
  return { server_time: new Date() };
}

function loginUser(name, team, password) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.STAFF);
  const data = sheet.getDataRange().getValues();
  // Assume Row 1 is header
  // Structure: ID, Name, Team, Position, JoinDate, Status, Password (Column Index 6)

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Check Name, Team, Password (simple check)
    // Adjust indices based on actual sheet structure
    if (row[1] == name && row[2] == team && row[6] == password) {
       // Found user. Get their assigned programs.
       const programs = getProgramsForStaff(name); // Or ID
       return { 
         token: name, // In real app, generate a secure token
         role: 'staff',
         programs: programs
       };
    }
  }
  throw new Error('Login failed: Invalid credentials');
}

function getProgramsForStaff(staffName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.PROGRAMS);
  const data = sheet.getDataRange().getValues();
  const programs = [];
  
  // Structure: ID, Category, Name, Target, Type, Manager
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Filter by manager name (or 'All')
    if (row[5] === staffName || row[5] === 'All') { 
      programs.push({
        id: row[0],
        category: row[1],
        name: row[2],
        type: row[4]
      });
    }
  }
  return programs;
}

function getUsers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.USERS);
  const data = sheet.getDataRange().getValues();
  const users = [];
  // Structure: ID, Name, Birth, Gender, Phone, DisType, DisDegree
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    users.push({
      id: row[0],
      name: row[1],
      birth: formatDate(row[2]),
      disability: row[5] + ' (' + row[6] + ')'
    });
  }
  return users;
}

function submitLog(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.LOGS);
  const timestamp = new Date();
  
  // data.entries is array of { user_name, status, note }
  // Structure: Timestamp, Date, Manager, Program, User, Status, Note, Qty
  
  data.entries.forEach(entry => {
    sheet.appendRow([
      timestamp,
      data.date,
      data.manager_name,
      data.program_name,
      entry.user_name,
      entry.status,
      entry.note,
      1 // Default Qty 1
    ]);
  });
  
  return { count: data.entries.length };
}

function uploadUsers(users) {
   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.USERS);
   // Append multiple rows
   // users is array of arrays matching sheet columns (minus ID maybe)
   
   // Simple ID generation
   const lastRow = sheet.getLastRow();
   
   users.forEach((user, index) => {
     // User format from CSV parsed in frontend: [Name, Birth, Gender, Phone, Type, Degree]
     // Add ID
     const id = 'U_' + (lastRow + index + 1);
     const row = [id, ...user];
     sheet.appendRow(row);
   });
   
   return { count: users.length };
}

function formatDate(date) {
  if (!date) return '';
  try {
    return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  } catch (e) {
    return date;
  }
}
