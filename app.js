const state = {
  employees: [],
  leaves: [],
  attendance: []
};

const panels = {
  dashboard: document.getElementById("panel-dashboard"),
  employees: document.getElementById("panel-employees"),
  leave: document.getElementById("panel-leave"),
  attendance: document.getElementById("panel-attendance"),
  policies: document.getElementById("panel-policies")
};

const pageTitle = document.getElementById("pageTitle");
const navLinks = document.querySelectorAll(".nav-link");
const sidebar = document.getElementById("sidebar");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileBackButton = document.getElementById("mobileBackButton");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const employeeTableBody = document.querySelector("#employeeTable tbody");
const leaveTableBody = document.querySelector("#leaveTable tbody");
const attendanceTableBody = document.querySelector("#attendanceTable tbody");
const snapshotList = document.getElementById("snapshotList");

const employeeSearch = document.getElementById("employeeSearch");
const employeeForm = document.getElementById("employeeForm");
const employeeFormHint = document.getElementById("employeeFormHint");

const leaveForm = document.getElementById("leaveForm");
const leaveFormHint = document.getElementById("leaveFormHint");
const leaveEmployeeSelect = document.getElementById("leaveEmployee");

const modal = document.getElementById("employeeModal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");

const kpiEmployees = document.getElementById("kpiEmployees");
const kpiPendingLeaves = document.getElementById("kpiPendingLeaves");
const kpiAttendance = document.getElementById("kpiAttendance");

const checkInBtn = document.getElementById("checkIn");
const checkOutBtn = document.getElementById("checkOut");
const attendanceHint = document.getElementById("attendanceHint");
const attendanceEmployeeSelect = document.getElementById("attendanceEmployee");

const quickCheckInCard = document.getElementById("quickCheckInCard");
const addEmployeeCard = document.getElementById("addEmployeeCard");

const toggleEmployeeForm = document.getElementById("toggleEmployeeForm");
const employeeFormCard = document.getElementById("employeeFormCard");

function isMobile() {
  return window.innerWidth < 768;
}

function openSidebar() {
  if (sidebar) sidebar.classList.add("open");
}

function closeSidebar() {
  if (sidebar) sidebar.classList.remove("open");
}

function syncSidebarForViewport() {
  if (!sidebar) return;
  if (isMobile()) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

function showPanel(target) {
  Object.values(panels).forEach((panel) => panel && panel.classList.remove("active"));
  if (panels[target]) panels[target].classList.add("active");
  navLinks.forEach((link) => link.classList.remove("active"));
  const activeLink = document.querySelector(`.nav-link[data-target="${target}"]`);
  if (activeLink) activeLink.classList.add("active");
  if (!pageTitle) return;
  pageTitle.textContent =
    target === "employees"
      ? "Employee Directory"
      : target === "leave"
      ? "Leave Management"
      : target === "attendance"
      ? "Attendance Log"
      : target === "policies"
      ? "Company Policies"
      : "Dashboard";
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    showPanel(link.dataset.target);
    if (isMobile()) closeSidebar();
  });
});

if (mobileMenuButton) {
  mobileMenuButton.addEventListener("click", openSidebar);
}

if (mobileBackButton) {
  mobileBackButton.addEventListener("click", closeSidebar);
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener("click", closeSidebar);
}

window.addEventListener("resize", syncSidebarForViewport);

function renderEmployees(list) {
  if (!employeeTableBody) return;
  employeeTableBody.innerHTML = "";
  list.forEach((emp) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${emp.name}</td>
      <td>${emp.designation}</td>
      <td>${emp.department}</td>
      <td>${emp.email}</td>
      <td><button class="ghost-button" data-action="view" data-id="${emp.id}">View</button> <button class="danger-button" data-action="delete" data-id="${emp.id}">Delete</button></td>
    `;
    employeeTableBody.appendChild(row);
  });
}

function renderLeaves() {
  if (!leaveTableBody) return;
  leaveTableBody.innerHTML = "";
  state.leaves.forEach((leave) => {
    const employee = state.employees.find((emp) => emp.id === leave.employeeId);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${employee ? employee.name : "Unknown"}</td>
      <td>${leave.startDate}</td>
      <td>${leave.endDate}</td>
      <td>${leave.reason}</td>
    `;
    leaveTableBody.appendChild(row);
  });
}

function formatTimeStamp(timestamp) {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderAttendance() {
  if (!attendanceTableBody) return;
  attendanceTableBody.innerHTML = "";
  state.attendance.forEach((record) => {
    const employee = state.employees.find((emp) => emp.id === record.employeeId);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${employee ? employee.name : "Unknown"}</td>
      <td>${record.date}</td>
      <td>${formatTimeStamp(record.checkInTs)}</td>
      <td>${formatTimeStamp(record.checkOutTs)}</td>
      <td>${record.totalHours || "-"}</td>
    `;
    attendanceTableBody.appendChild(row);
  });
}

function updateDashboard() {
  if (kpiEmployees) kpiEmployees.textContent = state.employees.length;
  if (kpiPendingLeaves) kpiPendingLeaves.textContent = state.leaves.length;
  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = state.attendance.filter((rec) => rec.date === today && rec.checkInTs);
  const uniqueCheckIns = new Set(todayAttendance.map((rec) => rec.employeeId)).size;
  const attendancePercent = state.employees.length
    ? Math.round((uniqueCheckIns / state.employees.length) * 100)
    : 0;
  if (kpiAttendance) kpiAttendance.textContent = `${attendancePercent}%`;

  if (!snapshotList) return;
  snapshotList.innerHTML = "";
  const quickStats = [
    `${state.employees.length} employees onboarded`,
    `${state.leaves.length} employees on leave`,
    `${uniqueCheckIns} check-ins logged today`
  ];
  quickStats.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    snapshotList.appendChild(li);
  });
}

function populateEmployeeSelects() {
  if (!leaveEmployeeSelect || !attendanceEmployeeSelect) return;
  if (state.employees.length === 0) {
    leaveEmployeeSelect.innerHTML = '<option value="">No employees</option>';
    attendanceEmployeeSelect.innerHTML = '<option value="">No employees</option>';
    return;
  }

  const selectMarkup = state.employees
    .map((emp) => `<option value="${emp.id}">${emp.name}</option>`)
    .join("");

  leaveEmployeeSelect.innerHTML = selectMarkup;
  attendanceEmployeeSelect.innerHTML = selectMarkup;
}

if (employeeSearch) {
  employeeSearch.addEventListener("input", (event) => {
    const value = event.target.value.toLowerCase();
    const filtered = state.employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(value) ||
        emp.department.toLowerCase().includes(value)
    );
    renderEmployees(filtered);
  });
}

if (employeeTableBody) {
  employeeTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const empId = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "delete") {
      state.employees = state.employees.filter((emp) => emp.id !== empId);
      state.leaves = state.leaves.filter((leave) => leave.employeeId !== empId);
      state.attendance = state.attendance.filter((record) => record.employeeId !== empId);
      renderEmployees(state.employees);
      populateEmployeeSelects();
      renderLeaves();
      renderAttendance();
      updateDashboard();
      return;
    }

    if (action !== "view") return;
    const employee = state.employees.find((emp) => emp.id === empId);
    if (!employee || !modalBody || !modal) return;
    modalBody.innerHTML = `
      <div><strong>Name:</strong> ${employee.name}</div>
      <div><strong>Designation:</strong> ${employee.designation}</div>
      <div><strong>Department:</strong> ${employee.department}</div>
      <div><strong>Email:</strong> ${employee.email}</div>
      <div><strong>Phone:</strong> ${employee.phone}</div>
      <div><strong>Join Date:</strong> ${employee.joinDate}</div>
    `;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  });
}

const policyAccordions = document.querySelectorAll(".policy-accordion");
policyAccordions.forEach((accordion) => {
  accordion.addEventListener("toggle", () => {
    if (!accordion.open) return;
    policyAccordions.forEach((other) => {
      if (other !== accordion) other.open = false;
    });
  });
});

if (closeModal && modal) {
  closeModal.addEventListener("click", () => {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
    }
  });
}

if (employeeForm) {
  employeeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (employeeFormHint) employeeFormHint.textContent = "";
    const formData = new FormData(employeeForm);
    const name = formData.get("name").trim();
    const designation = formData.get("designation").trim();
    const department = formData.get("department").trim();
    const email = formData.get("email").trim();
    const phone = formData.get("phone").trim();
    const joinDate = formData.get("joinDate");

    if (!name || !designation || !department || !email || !phone || !joinDate) {
      if (employeeFormHint) employeeFormHint.textContent = "Please fill in all required fields.";
      return;
    }

    const newEmployee = {
      id: Date.now(),
      name,
      designation,
      department,
      email,
      phone,
      joinDate,
      image: formData.get("image")?.name || null
    };

    state.employees.push(newEmployee);
    employeeForm.reset();
    renderEmployees(state.employees);
    populateEmployeeSelects();
    updateDashboard();
    if (employeeFormCard) {
      employeeFormCard.setAttribute("hidden", "");
    }
    if (toggleEmployeeForm) {
      toggleEmployeeForm.textContent = "Add Employee";
    }
  });
}

if (leaveForm) {
  leaveForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (leaveFormHint) leaveFormHint.textContent = "";
    const formData = new FormData(leaveForm);
    const employeeId = Number(formData.get("employee"));
    const type = formData.get("type");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const reason = formData.get("reason").trim();

    if (!employeeId || !type || !startDate || !endDate || !reason) {
      if (leaveFormHint) leaveFormHint.textContent = "All fields are required.";
      return;
    }

    if (endDate < startDate) {
      if (leaveFormHint) leaveFormHint.textContent = "End date cannot be earlier than start date.";
      return;
    }

    state.leaves.push({
      id: Date.now(),
      employeeId,
      type,
      startDate,
      endDate,
      reason
    });

    leaveForm.reset();
    renderLeaves();
    updateDashboard();
  });
}

function getSelectedEmployeeId() {
  const value = attendanceEmployeeSelect ? attendanceEmployeeSelect.value : "";
  return value ? Number(value) : null;
}

function getTodayRecord(employeeId) {
  const today = new Date().toISOString().split("T")[0];
  let record = state.attendance.find(
    (rec) => rec.date === today && rec.employeeId === employeeId
  );
  if (!record) {
    record = { date: today, employeeId, checkInTs: null, checkOutTs: null, totalHours: "" };
    state.attendance.unshift(record);
  }
  return record;
}

if (checkInBtn) {
  checkInBtn.addEventListener("click", () => {
    if (attendanceHint) attendanceHint.textContent = "";
    const employeeId = getSelectedEmployeeId();
    if (!employeeId) {
      if (attendanceHint) attendanceHint.textContent = "Please select an employee.";
      return;
    }
    const record = getTodayRecord(employeeId);
    if (record.checkInTs) {
      if (attendanceHint) attendanceHint.textContent = "Check-in already recorded for this employee.";
      return;
    }
    record.checkInTs = Date.now();
    renderAttendance();
    updateDashboard();
  });
}

if (checkOutBtn) {
  checkOutBtn.addEventListener("click", () => {
    if (attendanceHint) attendanceHint.textContent = "";
    const employeeId = getSelectedEmployeeId();
    if (!employeeId) {
      if (attendanceHint) attendanceHint.textContent = "Please select an employee.";
      return;
    }
    const record = getTodayRecord(employeeId);
    if (!record.checkInTs) {
      if (attendanceHint) attendanceHint.textContent = "Please check in first.";
      return;
    }
    if (record.checkOutTs) {
      if (attendanceHint) attendanceHint.textContent = "Check-out already recorded for this employee.";
      return;
    }
    record.checkOutTs = Date.now();
    const diffMs = record.checkOutTs - record.checkInTs;
    const hours = Math.max(diffMs / (1000 * 60 * 60), 0);
    record.totalHours = `${hours.toFixed(2)} hrs`;
    renderAttendance();
    updateDashboard();
  });
}

function quickCheckInAction() {
  showPanel("attendance");
  if (checkInBtn) checkInBtn.click();
}

function addEmployeeAction() {
  showPanel("employees");
  if (employeeFormCard && employeeFormCard.hasAttribute("hidden")) {
    employeeFormCard.removeAttribute("hidden");
  }
  if (employeeForm) employeeForm.scrollIntoView({ behavior: "smooth" });
}

if (quickCheckInCard) {
  quickCheckInCard.addEventListener("click", quickCheckInAction);
}
if (addEmployeeCard) {
  addEmployeeCard.addEventListener("click", addEmployeeAction);
}

if (toggleEmployeeForm && employeeFormCard) {
  toggleEmployeeForm.addEventListener("click", () => {
    if (employeeFormCard.hasAttribute("hidden")) {
      employeeFormCard.removeAttribute("hidden");
      toggleEmployeeForm.textContent = "Hide Form";
    } else {
      employeeFormCard.setAttribute("hidden", "");
      toggleEmployeeForm.textContent = "Add Employee";
    }
  });
}
function isMobile() {
  return window.innerWidth < 768;
}

function openSidebar() {
  sidebar.classList.add("open");
  sidebarOverlay.style.display = "block";
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.style.display = "none";
}

function syncSidebarForViewport() {

  if (isMobile()) {
    closeSidebar();
  } 
  else {
    sidebar.classList.remove("open");
    sidebarOverlay.style.display = "none";
  }

}
mobileMenuButton.addEventListener("click", () => {
  openSidebar();
});
mobileBackButton.addEventListener("click", () => {
  closeSidebar();
});

sidebarOverlay.addEventListener("click", () => {
  closeSidebar();
});

syncSidebarForViewport();

renderEmployees(state.employees);
populateEmployeeSelects();
renderLeaves();
renderAttendance();
updateDashboard();
