/**
 * Google Apps Script - 사업 실적 입력 시스템 API
 *
 * doGet  → 데이터 조회 (get_users, get_programs, get_init_data)
 * doPost → 데이터 생성 (login, signup, submit_log, upload_users)
 */

// ─── 설정 ───────────────────────────────────────────────
// ⚠️ 반드시 본인의 Google Sheets ID로 교체하세요!
// 스프레드시트 URL: https://docs.google.com/spreadsheets/d/여기가_ID/edit
const SPREADSHEET_ID = '1-PUH4PgC3WvmMDBcMofp9PUV31mdosqHY-zGqQgKDa4';

const SHEET_NAMES = {
  STAFF: 'Staff_DB',
  PROGRAMS: 'Program_DB',
  USERS: 'User_DB',
  LOGS: 'Performance_DB'
};

const SHEET_HEADERS = {
  'Staff_DB':       ['ID', 'Name', 'Team', 'Position', 'JoinDate', 'Status', 'Password'],
  'Program_DB':     ['ID', 'Category', 'Name', 'Target', 'Type', 'Manager'],
  'User_DB':        ['ID', 'Name', 'Birth', 'Gender', 'Phone', 'DisabilityType', 'DisabilityDegree'],
  'Performance_DB': ['Timestamp', 'Date', 'Manager', 'Program', 'User', 'Status', 'Note', 'Qty']
};

// ─── 유틸리티 ────────────────────────────────────────────
/**
 * 스프레드시트 객체 가져오기
 * openById로 먼저 시도, 실패하면 getActiveSpreadsheet 폴백
 */
function getSpreadsheet() {
  try {
    if (SPREADSHEET_ID && SPREADSHEET_ID !== '여기에_스프레드시트_ID_입력') {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    }
  } catch (e) {
    // openById 실패 시 폴백
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('스프레드시트에 연결할 수 없습니다. SPREADSHEET_ID를 설정해주세요.');
  }
  return ss;
}

/**
 * 시트를 가져오거나, 없으면 헤더와 함께 자동 생성
 */
function getOrCreateSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    const headers = SHEET_HEADERS[sheetName];
    if (headers) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    }
    // Staff_DB의 Password 열(G열) 전체를 텍스트 형식으로 설정
    if (sheetName === 'Staff_DB') {
      sheet.getRange('G:G').setNumberFormat('@');
    }
  }
  return sheet;
}

/**
 * ★ GAS 에디터에서 수동 실행용 ★
 * 기존 Staff_DB의 Password(G열) 전체를 텍스트 형식으로 변환합니다.
 * 이미 숫자로 변환된 비밀번호(예: 741)는 수동으로 0741로 수정해야 합니다.
 */
function setupPasswordColumn() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Staff_DB');
  if (!sheet) {
    Logger.log('Staff_DB 시트가 없습니다.');
    return;
  }
  // G열 전체를 텍스트 형식으로 설정
  sheet.getRange('G:G').setNumberFormat('@');
  Logger.log('Staff_DB의 Password(G열)을 텍스트 형식으로 설정했습니다.');
  
  // 기존 데이터도 텍스트로 재설정
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    for (let i = 2; i <= lastRow; i++) {
      const cell = sheet.getRange(i, 7);
      const val = cell.getValue();
      if (val !== '' && val !== null) {
        cell.setNumberFormat('@');
        cell.setValue(String(val));
      }
    }
    Logger.log('기존 비밀번호 ' + (lastRow - 1) + '건을 텍스트로 변환했습니다.');
  }
}

/** JSON 응답 헬퍼 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 날짜 포맷 (안전 처리) */
function formatDate(date) {
  if (!date) return '';
  try {
    return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  } catch (e) {
    return String(date);
  }
}

// ─── HTTP 핸들러 ─────────────────────────────────────────
function doGet(e) {
  if (!e || !e.parameter) {
    return jsonResponse({ status: 'ok', message: 'API 정상 작동 중. ?action=get_users 등으로 데이터를 조회하세요.' });
  }

  try {
    const action = e.parameter.action;

    switch (action) {
      case 'get_init_data':
        return jsonResponse({ status: 'success', data: { server_time: new Date() } });
      case 'get_users':
        return jsonResponse({ status: 'success', data: getUsers() });
      case 'get_programs':
        return jsonResponse({ status: 'success', data: getAllPrograms() });
      default:
        return jsonResponse({ status: 'error', message: '알 수 없는 action: ' + action });
    }
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.message });
  }
}

function doPost(e) {
  if (!e || !e.postData) {
    return jsonResponse({ status: 'error', message: 'POST 데이터가 없습니다.' });
  }

  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    let result;

    switch (action) {
      case 'login':
        result = loginUser(data.name, data.team, data.password);
        break;
      case 'signup':
        result = signupUser(data.name, data.team, data.position, data.password);
        break;
      case 'submit_log':
        result = submitLog(data);
        break;
      case 'upload_users':
        result = uploadUsers(data.users);
        break;
      default:
        return jsonResponse({ status: 'error', message: '알 수 없는 action: ' + action });
    }

    return jsonResponse({ status: 'success', data: result });

  } catch (error) {
    return jsonResponse({ status: 'error', message: error.message || error.toString() });
  }
}

// ─── 비즈니스 로직 ───────────────────────────────────────

/** 로그인: Staff_DB에서 이름+팀+비밀번호 확인 */
function loginUser(name, team, password) {
  if (!name || !password) throw new Error('이름과 비밀번호를 입력해주세요.');

  const sheet = getOrCreateSheet(SHEET_NAMES.STAFF);
  const data = sheet.getDataRange().getValues();
  // 헤더: ID(0), Name(1), Team(2), Position(3), JoinDate(4), Status(5), Password(6)

  const trimName = String(name).trim();
  const trimTeam = String(team).trim();
  const inputPw  = String(password).trim();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[1]).trim() !== trimName) continue;
    if (String(row[2]).trim() !== trimTeam) continue;

    // 비밀번호 비교: Sheets가 '0741'을 741(숫자)로 저장했을 수 있으므로
    // 문자열 비교와 숫자 비교 모두 시도
    const storedPw = String(row[6]).trim();
    if (storedPw === inputPw || storedPw === String(Number(inputPw))) {
      // 비밀번호 매칭 성공 — 숫자로 저장되어 있으면 텍스트로 복구
      if (storedPw !== inputPw) {
        const pwCell = sheet.getRange(i + 1, 7);
        pwCell.setNumberFormat('@');
        SpreadsheetApp.flush();
        pwCell.setValue(inputPw);
      }
      const programs = getProgramsForStaff(trimName);
      return {
        token: trimName,
        role: 'staff',
        programs: programs
      };
    }
  }
  throw new Error('로그인 실패: 이름, 팀, 비밀번호를 확인해주세요.');
}

/** 회원가입: 중복 확인 후 Staff_DB에 추가 */
function signupUser(name, team, position, password) {
  if (!name || !password) throw new Error('이름과 비밀번호를 입력해주세요.');
  const pwStr = String(password);
  if (pwStr.length < 4) throw new Error('비밀번호는 4자리 이상이어야 합니다.');

  const sheet = getOrCreateSheet(SHEET_NAMES.STAFF);
  const data = sheet.getDataRange().getValues();

  const trimName = String(name).trim();
  const trimTeam = String(team).trim();

  // 중복 확인
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === trimName && String(data[i][2]).trim() === trimTeam) {
      throw new Error('이미 등록된 사용자입니다: ' + trimName + ' (' + trimTeam + ')');
    }
  }

  const newId = 'S_' + data.length;
  const joinDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const lastRow = sheet.getLastRow() + 1;

  // ① 비밀번호를 제외한 6개 열 먼저 쓰기 (A~F열)
  const rowData = [newId, trimName, trimTeam, String(position || '').trim(), joinDate, '재직'];
  sheet.getRange(lastRow, 1, 1, rowData.length).setValues([rowData]);

  // ② 비밀번호(G열)는 반드시 텍스트 형식으로 개별 설정
  const pwCell = sheet.getRange(lastRow, 7);
  pwCell.setNumberFormat('@');
  // flush()로 텍스트 형식을 확정한 뒤 값 쓰기 — 이래야 '0741'이 유지됨
  SpreadsheetApp.flush();
  pwCell.setValue(pwStr);

  return { message: '가입이 완료되었습니다.' };
}

/** 담당자에게 배정된 프로그램 목록 */
function getProgramsForStaff(staffName) {
  const sheet = getOrCreateSheet(SHEET_NAMES.PROGRAMS);
  const data = sheet.getDataRange().getValues();
  const programs = [];
  // 헤더: ID(0), Category(1), Name(2), Target(3), Type(4), Manager(5)

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const manager = String(row[5]).trim();
    if (manager === staffName || manager === 'All' || manager === '전체') {
      programs.push({
        id: String(row[0]),
        category: String(row[1]),
        name: String(row[2]),
        type: String(row[4])
      });
    }
  }
  return programs;
}

/** 전체 프로그램 목록 (관리용) */
function getAllPrograms() {
  const sheet = getOrCreateSheet(SHEET_NAMES.PROGRAMS);
  const data = sheet.getDataRange().getValues();
  const programs = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      programs.push({
        id: String(row[0]),
        category: String(row[1]),
        name: String(row[2]),
        target: String(row[3]),
        type: String(row[4]),
        manager: String(row[5])
      });
    }
  }
  return programs;
}

/** 이용자 목록 조회 */
function getUsers() {
  const sheet = getOrCreateSheet(SHEET_NAMES.USERS);
  const data = sheet.getDataRange().getValues();
  const users = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // 빈 행 건너뛰기
    users.push({
      id: String(row[0]),
      name: String(row[1]),
      birth: formatDate(row[2]),
      gender: String(row[3]),
      phone: String(row[4]),
      disability: (row[5] ? String(row[5]) : '') + (row[6] ? ' (' + String(row[6]) + ')' : '')
    });
  }
  return users;
}

/** 실적 저장 (배치 쓰기 최적화) */
function submitLog(data) {
  if (!data.entries || data.entries.length === 0) throw new Error('저장할 실적이 없습니다.');

  const sheet = getOrCreateSheet(SHEET_NAMES.LOGS);
  const timestamp = new Date();

  // 배치 쓰기: appendRow를 여러 번 호출하는 대신 한 번에 기록
  const rows = data.entries.map(entry => [
    timestamp,
    data.date,
    String(data.manager_name || ''),
    String(data.program_name || ''),
    String(entry.user_name || ''),
    String(entry.status || '출석'),
    String(entry.note || ''),
    1
  ]);

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);

  return { count: rows.length };
}

/** 이용자 일괄 등록 (배치 쓰기 최적화) */
function uploadUsers(users) {
  if (!users || users.length === 0) throw new Error('업로드할 이용자가 없습니다.');

  const sheet = getOrCreateSheet(SHEET_NAMES.USERS);
  const lastRow = sheet.getLastRow();

  // 배치 쓰기
  const rows = users.map((user, index) => {
    const id = 'U_' + (lastRow + index + 1);
    // CSV 순서: Name, Birth, Gender, Phone, Type, Degree
    return [id, ...(Array.isArray(user) ? user : [user])];
  });

  sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);

  return { count: rows.length };
}
