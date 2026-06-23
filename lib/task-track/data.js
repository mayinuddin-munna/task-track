export const database = {
  users: [
    { id: 1, name: "Rahim Ahmed", initials: "RA", avatarClass: "av-blue", role: "Employee", team: "Frontend Squad", email: "rahim@team.dev", status: "Active" },
    { id: 2, name: "Sadia Khatun", initials: "SK", avatarClass: "av-green", role: "Employee", team: "Frontend Squad", email: "sadia@team.dev", status: "Active" },
    { id: 3, name: "Tanvir Hasan", initials: "TH", avatarClass: "av-amber", role: "Employee", team: "Backend Team", email: "tanvir@team.dev", status: "Active" },
    { id: 4, name: "Mitu Begum", initials: "MB", avatarClass: "av-violet", role: "Employee", team: "Backend Team", email: "mitu@team.dev", status: "Active" },
    { id: 5, name: "Karim Uddin", initials: "KU", avatarClass: "av-teal", role: "Employee", team: "DevOps", email: "karim@team.dev", status: "Active" },
    { id: 6, name: "Nusrat Islam", initials: "NI", avatarClass: "av-rose", role: "Team Lead", team: "Frontend Squad", email: "nusrat@team.dev", status: "Active" },
    { id: 7, name: "Farhan Hossain", initials: "FH", avatarClass: "av-amber", role: "Admin", team: "All Teams", email: "farhan@team.dev", status: "Active" },
    { id: 8, name: "System Admin", initials: "SA", avatarClass: "av-violet", role: "Super Admin", team: "All Teams", email: "admin@team.dev", status: "Active" },
  ],
  projects: [
    { id: 1, name: "Auth Module", team: "Frontend Squad", status: "in-progress", tasks: 8, done: 5, hours: "24h 10m", desc: "JWT auth, login, session management" },
    { id: 2, name: "Frontend Revamp", team: "Frontend Squad", status: "in-progress", tasks: 12, done: 4, hours: "18h 30m", desc: "Dashboard redesign and component library" },
    { id: 3, name: "Payments Integration", team: "Backend Team", status: "on-hold", tasks: 6, done: 1, hours: "8h 00m", desc: "Stripe & SSLCommerz payment gateway" },
    { id: 4, name: "API Gateway", team: "Backend Team", status: "in-progress", tasks: 5, done: 3, hours: "14h 20m", desc: "Unified REST API gateway with rate limiting" },
    { id: 5, name: "Infra & DevOps", team: "DevOps", status: "in-progress", tasks: 4, done: 2, hours: "10h 15m", desc: "Docker, k8s, CI/CD pipelines" },
  ],
  tasks: [
    { id: 1, title: "Fix login timeout bug", projectId: 1, project: "Auth Module", assignedTo: 1, assignee: "Rahim Ahmed", priority: "urgent", status: "in-progress", progress: 60, due: "Jun 24", time: "1h 15m", blocker: null },
    { id: 2, title: "Design dashboard wireframes", projectId: 2, project: "Frontend Revamp", assignedTo: 2, assignee: "Sadia Khatun", priority: "high", status: "in-progress", progress: 70, due: "Jun 26", time: "2h 10m", blocker: null },
    { id: 3, title: "Write API endpoint docs", projectId: 4, project: "API Gateway", assignedTo: 1, assignee: "Rahim Ahmed", priority: "medium", status: "in-progress", progress: 35, due: "Jun 28", time: "0h 45m", blocker: null },
    { id: 4, title: "Database migration script", projectId: 5, project: "Infra & DevOps", assignedTo: 3, assignee: "Tanvir Hasan", priority: "urgent", status: "paused", progress: 20, due: "Jun 23", time: "2h 05m", blocker: "Waiting for prod DB credentials" },
    { id: 5, title: "Unit tests for payment flow", projectId: 3, project: "Payments Integration", assignedTo: 4, assignee: "Mitu Begum", priority: "high", status: "pending", progress: 0, due: "Jun 30", time: "0m", blocker: null },
    { id: 6, title: "Deploy auth service to k8s", projectId: 5, project: "Infra & DevOps", assignedTo: 5, assignee: "Karim Uddin", priority: "high", status: "completed", progress: 100, due: "Jun 20", time: "3h 20m", blocker: null },
    { id: 7, title: "Implement refresh token", projectId: 1, project: "Auth Module", assignedTo: 1, assignee: "Rahim Ahmed", priority: "high", status: "pending", progress: 0, due: "Jun 29", time: "0m", blocker: null },
    { id: 8, title: "Nginx reverse proxy config", projectId: 5, project: "Infra & DevOps", assignedTo: 5, assignee: "Karim Uddin", priority: "medium", status: "completed", progress: 100, due: "Jun 18", time: "1h 50m", blocker: null },
  ],
  sessions: [
    { task: "Fix login timeout bug", project: "Auth Module", start: "9:00 AM", end: "10:15 AM", dur: "1h 15m", note: "Traced issue to JWT expiry config" },
    { task: "Write API endpoint docs", project: "API Gateway", start: "10:30 AM", end: "11:15 AM", dur: "0h 45m", note: "Endpoints 1-12 documented" },
    { task: "Fix login timeout bug", project: "Auth Module", start: "2:00 PM", end: "Running >", dur: "LIVE", note: "-" },
  ],
  notifications: [
    { id: 1, icon: "ti-clipboard-list", iconBg: "#eff6ff", iconColor: "#2563eb", text: "New task assigned: <b>Fix login timeout bug</b> in Auth Module", time: "2 min ago", unread: true },
    { id: 2, icon: "ti-alert-circle", iconBg: "#fef2f2", iconColor: "#dc2626", text: "Task <b>Database migration script</b> is overdue (due Jun 23)", time: "1 hr ago", unread: true },
    { id: 3, icon: "ti-circle-check", iconBg: "#f0fdf4", iconColor: "#16a34a", text: "<b>Sadia Khatun</b> completed: Deploy auth service to k8s", time: "3 hr ago", unread: true },
    { id: 4, icon: "ti-clock", iconBg: "#fffbeb", iconColor: "#d97706", text: "Reminder: <b>Write API endpoint docs</b> is due in 2 days", time: "Yesterday", unread: false },
    { id: 5, icon: "ti-user-plus", iconBg: "#faf5ff", iconColor: "#7c3aed", text: "You were added to <b>Payments Integration</b> project", time: "2 days ago", unread: false },
  ],
};

export const rolesConfig = {
  employee: { label: "Employee", name: "Rahim Ahmed", initials: "RA", avatarClass: "av-blue", userId: 1 },
  teamlead: { label: "Team Lead", name: "Nusrat Islam", initials: "NI", avatarClass: "av-rose", userId: 6 },
  admin: { label: "Admin", name: "Farhan Hossain", initials: "FH", avatarClass: "av-amber", userId: 7 },
  superadmin: { label: "Super Admin", name: "System Admin", initials: "SA", avatarClass: "av-violet", userId: 8 },
};

export const navItems = {
  employee: [
    { id: "dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },
    { id: "tasks", icon: "ti-checkbox", label: "My Tasks", badge: 3 },
    { id: "time-tracking", icon: "ti-clock-play", label: "Time Tracking" },
    { id: "notifications", icon: "ti-bell", label: "Notifications", badge: 3 },
  ],
  teamlead: [
    { id: "dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },
    { id: "tasks", icon: "ti-checkbox", label: "Tasks", badge: 4 },
    { id: "team", icon: "ti-users-group", label: "Team" },
    { id: "projects", icon: "ti-folder-open", label: "Projects" },
    { id: "reports", icon: "ti-chart-bar", label: "Reports" },
    { id: "notifications", icon: "ti-bell", label: "Notifications", badge: 3 },
  ],
  admin: [
    { id: "dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },
    { id: "tasks", icon: "ti-checkbox", label: "All Tasks" },
    { id: "team", icon: "ti-users-group", label: "Team" },
    { id: "projects", icon: "ti-folder-open", label: "Projects" },
    { id: "reports", icon: "ti-chart-bar", label: "Reports" },
    { id: "users", icon: "ti-user-circle", label: "Users" },
    { id: "notifications", icon: "ti-bell", label: "Notifications", badge: 3 },
  ],
  superadmin: [
    { id: "dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },
    { id: "users", icon: "ti-user-circle", label: "Users" },
    { id: "team", icon: "ti-users-group", label: "Teams" },
    { id: "projects", icon: "ti-folder-open", label: "Projects" },
    { id: "tasks", icon: "ti-checkbox", label: "All Tasks" },
    { id: "reports", icon: "ti-chart-bar", label: "Reports" },
    { id: "settings", icon: "ti-settings", label: "Settings" },
    { id: "notifications", icon: "ti-bell", label: "Notifications", badge: 3 },
  ],
};

export const permissionRows = [
  ["View own tasks", "yes", "yes", "yes", "yes"],
  ["Start/pause timer", "yes", "yes", "yes", "yes"],
  ["Create tasks", "no", "yes", "yes", "yes"],
  ["Assign tasks", "no", "yes", "yes", "yes"],
  ["View team live activity", "no", "yes", "yes", "yes"],
  ["View all reports", "no", "Team only", "yes", "yes"],
  ["Manage users", "no", "no", "yes", "yes"],
  ["Manage roles", "no", "no", "no", "yes"],
  ["System settings", "no", "no", "no", "yes"],
];
