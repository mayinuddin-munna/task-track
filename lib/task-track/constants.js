export const INITIAL_TIMER = {
  status: "running",
  seconds: 4575,
  task: "Fix login timeout bug",
  project: "Auth Module",
};

export const ROLE_ORDER = ["employee", "teamlead", "admin", "superadmin"];
export const ROLE_OPTIONS = ["Employee", "Team Lead", "Admin", "Super Admin"];
export const USER_STATUS_OPTIONS = ["Active", "Invited", "Inactive"];
export const TASK_STATUS_OPTIONS = ["pending", "in-progress", "paused", "completed"];
export const PROJECT_STATUS_OPTIONS = ["planning", "in-progress", "on-hold", "completed"];
export const TASK_PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];

export const REPORT_TABS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "by-project", label: "By Project" },
  { id: "by-employee", label: "By Employee" },
];

export const TASK_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

export const NOTIFICATION_TABS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
];

export const AVATAR_CLASSES = ["av-blue", "av-green", "av-amber", "av-violet", "av-rose", "av-teal"];

export const TEAM_DESCRIPTIONS = {
  "Frontend Squad": "Owns the product UI, shared design patterns, and customer-facing flows.",
  "Backend Team": "Builds APIs, integrations, queue workers, and internal service contracts.",
  DevOps: "Maintains release pipelines, observability, cloud infra, and runtime stability.",
};

export const DEFAULT_SETTINGS = {
  heartbeat: "60 seconds",
  autoIdle: "5 minutes",
  defaultHours: "8 hours",
  timezone: "Asia/Dhaka",
  workWeek: "Sunday - Thursday",
  reportCadence: "Weekly",
  defaultLanding: "Dashboard",
  trackTimers: true,
  showPresence: true,
  allowNotes: true,
  notifyManagers: true,
  requireTaskNotes: false,
};
