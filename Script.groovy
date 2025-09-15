// doPost will handle all POST requests from the web app
function doPost(e) {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var employeesSheet = activeSpreadsheet.getSheetByName('Employees');
  var claimsSheet = activeSpreadsheet.getSheetByName('Claims');
  
  var data = e.parameter;
  var action = data.action;

  if (action === 'login') {
    return handleLogin(employeesSheet, claimsSheet, data);
  } else if (action === 'submitClaim') {
    return handleSubmitClaim(claimsSheet, data);
  } else if (action === 'getPayrollDate') {
    return getPayrollDate(employeesSheet);
  }
}

// doGet will handle all GET requests (e.g., for getting system status)
function doGet(e) {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var employeesSheet = activeSpreadsheet.getSheetByName('Employees');
  var action = e.parameter.action;
  
  if (action === 'getSystemStatus') {
    return getSystemStatus(employeesSheet);
  }
}

// Function to handle login
function handleLogin(employeesSheet, claimsSheet, data) {
  var employeeId = data.employeeId;
  var employeePhone = data.employeePhone;
  
  // getDataRange().getValues() จะดึงข้อมูลทั้งหมดมาเป็นอาร์เรย์ 2 มิติ
  // แถวที่ 1 ในชีท คือ index 0 ในอาร์เรย์
  // แถวที่ 4 ในชีท คือ index 3 ในอาร์เรย์
  var values = employeesSheet.getDataRange().getValues();

  // แก้ไขตรงนี้: เปลี่ยน i = 1 เป็น i = 3
  for (var i = 3; i < values.length; i++) {
    if (values[i][0] == employeeId && values[i][1] == employeePhone) {
      var employeeName = values[i][2];
      
      var hasClaimed = false;
      var claimAmount = null;
      var claimsData = claimsSheet.getDataRange().getValues();
      for (var j = 1; j < claimsData.length; j++) {
        if (claimsData[j][1] == employeeId) {
          hasClaimed = true;
          claimAmount = claimsData[j][3];
          break;
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        name: employeeName,
        hasClaimed: hasClaimed,
        claimAmount: claimAmount,
        message: 'เข้าสู่ระบบสำเร็จ'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: 'รหัสพนักงานหรือเบอร์โทรศัพท์ไม่ถูกต้อง'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Function to handle claim submission
function handleSubmitClaim(claimsSheet, data) {
  var employeeId = data.employeeId;
  var employeeName = data.employeeName;
  var claimAmount = data.claimAmount;

  var claimsData = claimsSheet.getDataRange().getValues();
  for (var i = 1; i < claimsData.length; i++) {
    if (claimsData[i][1] == employeeId) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'คุณได้ทำการเบิกเงินไปแล้ว'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  claimsSheet.appendRow([new Date(), employeeId, employeeName, claimAmount]);

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'ส่งคำขอเบิกเงินสำเร็จ'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ฟังก์ชันสำหรับดึงวันที่จาก Google Sheets
function getPayrollDate(employeesSheet) {
  try {
    var payrollDate = employeesSheet.getRange('B1').getValue();
    
    if (payrollDate) {
      if (Object.prototype.toString.call(payrollDate) === '[object Date]') {
        payrollDate = Utilities.formatDate(payrollDate, "GMT+7", "dd/MM/yyyy");
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, payrollDate: payrollDate })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Payroll date not found in B1.' })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Error fetching payroll date: ' + e.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// New function to get system status from cell B2
function getSystemStatus(employeesSheet) {
  try {
    var status = employeesSheet.getRange('B2').getValue();
    return ContentService.createTextOutput(JSON.stringify({ success: true, status: status })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Error fetching system status: ' + e.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}