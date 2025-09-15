const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyAPDocGC-_GTdp1DHxLHKB3YdKZt_N3TGRkmbYks3rCm3aUrRDTs9NDaaXVcebzuGW/exec';
const messageContainer = document.getElementById('message-container');

// ฟังก์ชันสำหรับจัดรูปแบบตัวเลขให้มีเครื่องหมายจุลภาค (,)
function formatNumber(num) {
    if (num === null) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ฟังก์ชันสำหรับแสดงข้อความแจ้งเตือน
function showMessage(message, type, isPermanent = false) {
    messageContainer.innerHTML = `<div class="message ${type}">${message}</div>`;
    messageContainer.style.display = 'block';

    // ถ้าไม่ใช่ข้อความที่ต้องการให้แสดงค้างไว้ จะตั้งเวลาให้หายไปเอง
    if (!isPermanent) {
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 2000); // 2000 มิลลิวินาที = 2 วินาที
    }
}



// ฟังก์ชันสำหรับสลับหน้าจอ
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// ฟังก์ชันแสดงสถานะโหลด
function showLoading(elementId, show) {
    const element = document.getElementById(elementId);
    if (show) {
        element.disabled = true;
        element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังโหลด...';
        element.style.opacity = '0.7';
    } else {
        element.disabled = false;
        if (elementId === 'login-btn') {
            element.innerHTML = 'เข้าสู่ระบบ';
        } else if (elementId === 'submit-btn') {
            element.innerHTML = 'ส่งคำขอ';
        }
        element.style.opacity = '1';
    }
}

// ฟังก์ชันเข้าสู่ระบบ
async function login(e) {
    if (e) e.preventDefault();
    
    const employeeId = document.getElementById('employee-id').value.trim();
    const employeePhone = document.getElementById('employee-phone').value.trim();

    if (!employeeId || !employeePhone) {
        showMessage('กรุณากรอกรหัสพนักงานและเบอร์โทรศัพท์ให้ครบ', 'error');
        return;
    }

    showLoading('login-btn', true);
    
    const formData = new FormData();
    formData.append('employeeId', employeeId);
    formData.append('employeePhone', employeePhone);
    formData.append('action', 'login');

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('การเชื่อมต่อล้มเหลว');
        }

        const result = await response.json();

        if (result.success) {
            const employeeData = {
                id: employeeId,
                name: result.name,
                phone: employeePhone,
                hasClaimed: result.hasClaimed,
                claimAmount: result.claimAmount
            };
            localStorage.setItem('loggedInEmployee', JSON.stringify(employeeData));

            showClaimScreen(employeeData);
        } else {
            showMessage(result.message, 'error');
        }

    } catch (error) {
        console.error('Error:', error);
        showMessage('เกิดข้อผิดพลาดในการเข้าสู่ระบบ', 'error');
    } finally {
        showLoading('login-btn', false);
    }
}

// ฟังก์ชันสำหรับแสดงหน้าจอเบิกเงิน
function showClaimScreen(employeeData) {
    document.getElementById('welcome-message').innerHTML = `สวัสดีคุณ <br> ${employeeData.name}`;
    document.getElementById('logout-btn').style.display = 'flex';
    
    if (employeeData.hasClaimed) {
        document.getElementById('status-message').textContent = 'คุณได้ทำการเบิกเงินไปแล้ว';
        document.getElementById('status-message').className = 'status-message approved';
        document.getElementById('claim-info').style.display = 'block';
        document.getElementById('current-status').textContent = 'สำเร็จ';
        document.getElementById('current-amount').textContent = `${formatNumber(employeeData.claimAmount)} บาท`;
        document.getElementById('claim-form').style.display = 'none';
    } else {
        document.getElementById('status-message').textContent = 'คุณยังไม่ได้ทำการเบิกเงิน';
        document.getElementById('status-message').className = 'status-message pending';
        document.getElementById('claim-info').style.display = 'none';
        document.getElementById('claim-form').style.display = 'block';
    }
    
    switchScreen('claim-screen');
}

// ฟังก์ชันส่งคำขอเบิกเงิน
async function submitClaim() {
    const claimAmount = document.getElementById('claim-amount').value;
    const loggedInEmployee = JSON.parse(localStorage.getItem('loggedInEmployee'));

    if (!claimAmount || claimAmount <= 0) {
        showMessage('กรุณาระบุจำนวนเงินที่ถูกต้อง', 'error');
        return;
    }
    
    showLoading('submit-btn', true);

    const formData = new FormData();
    formData.append('employeeId', loggedInEmployee.id);
    formData.append('employeeName', loggedInEmployee.name);
    formData.append('claimAmount', claimAmount);
    formData.append('action', 'submitClaim');

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showMessage('ส่งคำขอเบิกเงินสำเร็จ', 'success');
            loggedInEmployee.hasClaimed = true;
            loggedInEmployee.claimAmount = claimAmount;
            localStorage.setItem('loggedInEmployee', JSON.stringify(loggedInEmployee));
            showClaimScreen(loggedInEmployee);
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        showMessage('เกิดข้อผิดพลาดในการส่งคำขอ', 'error');
    } finally {
        showLoading('submit-btn', false);
    }
}

// ฟังก์ชันออกจากระบบ
function logout() {
    localStorage.removeItem('loggedInEmployee');
    localStorage.removeItem('systemStatus');
    document.getElementById('logout-btn').style.display = 'none';
    document.getElementById('employee-id').value = '';
    document.getElementById('employee-phone').value = '';
    switchScreen('login-screen');
}

// ฟังก์ชันสำหรับดึงวันที่จาก Google Sheets
async function fetchPayrollDate() {
    const formData = new FormData();
    formData.append('action', 'getPayrollDate');

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success && result.payrollDate) {
            document.getElementById('payroll-date').textContent = `ประจำวันที่ ${result.payrollDate}`;
        } else {
            document.getElementById('payroll-date').textContent = 'ไม่พบข้อมูลวันที่';
            console.error('Failed to fetch payroll date:', result.message);
        }
    } catch (error) {
        document.getElementById('payroll-date').textContent = 'ไม่สามารถเชื่อมต่อได้';
        console.error('Error fetching payroll date:', error);
    }
}

// ฟังก์ชันสำหรับดึงสถานะระบบจาก Google Sheet
async function fetchSystemStatus() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getSystemStatus`);
        const data = await response.json();
        if (data.success) {
            return data.status;
        }
        return null;
    } catch (error) {
        console.error('Error fetching system status:', error);
        return null;
    }
}

// Event Listener สำหรับฟอร์มเข้าสู่ระบบ
document.addEventListener('DOMContentLoaded', async () => {
    fetchPayrollDate();
    
    // ดึงสถานะระบบจาก Google Sheet
    const systemStatus = await fetchSystemStatus();
    localStorage.setItem('systemStatus', systemStatus);
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }
    
    const loggedInEmployee = localStorage.getItem('loggedInEmployee');
    
    if (systemStatus === 'Open') {
        if (loggedInEmployee) {
            const employeeData = JSON.parse(loggedInEmployee);
            document.getElementById('employee-id').value = employeeData.id;
            document.getElementById('employee-phone').value = employeeData.phone;
            login();
        }
    } else if (systemStatus === 'Close') {
        // แก้ไขส่วนนี้: เพิ่ม isPermanent = true เพื่อให้ข้อความค้าง
        showMessage('ระบบอยู่ในระหว่างการปรับปรุง กรุณารอประกาศจากฝ่ายที่เกี่ยวข้อง', 'error', true);
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'none';
    }
});
