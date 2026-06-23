"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import { database, navItems, permissionRows, rolesConfig } from "../../lib/task-track/data";
import { renderTaskTrackIcon } from "../../lib/task-track/icons";
import { buildTaskTrackPath, DEFAULT_PAGE, DEFAULT_ROLE, getDefaultPageForRole } from "../../lib/task-track/routes";

const INITIAL_TIMER = {
  status: "running",
  seconds: 4575,
  task: "Fix login timeout bug",
  project: "Auth Module",
};

const ROLE_ORDER = ["employee", "teamlead", "admin", "superadmin"];
const ROLE_OPTIONS = ["Employee", "Team Lead", "Admin", "Super Admin"];
const USER_STATUS_OPTIONS = ["Active", "Invited", "Inactive"];
const TASK_STATUS_OPTIONS = ["pending", "in-progress", "paused", "completed"];
const PROJECT_STATUS_OPTIONS = ["planning", "in-progress", "on-hold", "completed"];
const TASK_PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];
const REPORT_TABS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "by-project", label: "By Project" },
  { id: "by-employee", label: "By Employee" },
];
const TASK_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];
const NOTIFICATION_TABS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
];
const AVATAR_CLASSES = ["av-blue", "av-green", "av-amber", "av-violet", "av-rose", "av-teal"];
const TEAM_DESCRIPTIONS = {
  "Frontend Squad": "Owns the product UI, shared design patterns, and customer-facing flows.",
  "Backend Team": "Builds APIs, integrations, queue workers, and internal service contracts.",
  DevOps: "Maintains release pipelines, observability, cloud infra, and runtime stability.",
};
const DEFAULT_SETTINGS = {
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

function formatTimer(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function formatMinutesToClock(totalMinutes) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

function formatMinutesShort(totalMinutes) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (!hours) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

function formatHoursCompact(totalMinutes) {
  return `${(Math.max(0, totalMinutes) / 60).toFixed(1)}h`;
}

function parseDurationToMinutes(value) {
  if (!value || value === "-" || value === "LIVE") {
    return 0;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    const [hours, minutes, seconds] = value.split(":").map(Number);
    return hours * 60 + minutes + seconds / 60;
  }

  const hoursMatch = value.match(/(\d+)\s*h/i);
  const minutesMatch = value.match(/(\d+)\s*m/i);

  return Number(hoursMatch?.[1] ?? 0) * 60 + Number(minutesMatch?.[1] ?? 0);
}

function createInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function statusLabel(status) {
  if (!status) {
    return "";
  }

  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function shortName(name) {
  return name.split(" ")[0];
}

function getRingOffset(seconds) {
  return 440 - 440 * Math.min((seconds % 3600) / 3600, 1);
}

function getNextId(items) {
  return items.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1;
}

function getStatusPill(status) {
  const classes = {
    working: "pill-working",
    paused: "pill-paused",
    idle: "pill-idle",
    online: "pill-online",
    offline: "pill-offline",
    overdue: "pill-overdue",
    completed: "pill-completed",
    pending: "pill-pending",
    planning: "pill-pending",
    "in-progress": "pill-progress",
    "on-hold": "pill-on-hold",
    cancelled: "pill-cancelled",
  };

  return classes[status] ?? "pill-offline";
}

function getPriorityPill(priority) {
  return `pill-${priority}`;
}

function getProgressTone(value) {
  if (value === 100) {
    return "prog-fill-green";
  }

  if (value < 30) {
    return "prog-fill-amber";
  }

  return "";
}

function buildInitialTeams(users, projects) {
  const teamNames = Array.from(
    new Set(
      [...users.map((user) => user.team), ...projects.map((project) => project.team)].filter(
        (team) => team && team !== "All Teams",
      ),
    ),
  );

  return teamNames.map((teamName, index) => {
    const lead = users.find((user) => user.role === "Team Lead" && user.team === teamName);

    return {
      id: index + 1,
      name: teamName,
      leadId: lead?.id ?? "",
      targetHours: "40h/week",
      description: TEAM_DESCRIPTIONS[teamName] ?? "Managed delivery team across shared roadmap initiatives.",
    };
  });
}

function getCurrentRoleProfile(role, users) {
  const profile = rolesConfig[role];
  const linkedUser = users.find((user) => user.id === profile.userId);

  if (!linkedUser) {
    return profile;
  }

  return {
    ...profile,
    name: linkedUser.name,
    initials: linkedUser.initials,
    avatarClass: linkedUser.avatarClass,
  };
}

function summarizeProject(project, tasks) {
  const relatedTasks = tasks.filter((task) => task.projectId === project.id);
  const doneCount = relatedTasks.filter((task) => task.status === "completed").length;
  const totalCount = relatedTasks.length;
  const openCount = relatedTasks.filter((task) => task.status !== "completed").length;
  const totalMinutes = relatedTasks.reduce((sum, task) => sum + parseDurationToMinutes(task.time), 0);
  const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  return {
    ...project,
    totalCount,
    doneCount,
    openCount,
    totalMinutes,
    progress,
  };
}

function summarizeTeam(team, users, projects, tasks) {
  const teamUsers = users.filter((user) => user.team === team.name && user.role !== "Super Admin");
  const teamProjects = projects.filter((project) => project.team === team.name);
  const teamProjectIds = new Set(teamProjects.map((project) => project.id));
  const teamTasks = tasks.filter((task) => teamProjectIds.has(task.projectId));
  const completedTasks = teamTasks.filter((task) => task.status === "completed").length;
  const activeTasks = teamTasks.filter((task) => task.status === "in-progress" || task.status === "paused").length;
  const totalMinutes = teamTasks.reduce((sum, task) => sum + parseDurationToMinutes(task.time), 0);
  const lead = users.find((user) => String(user.id) === String(team.leadId));

  return {
    ...team,
    members: teamUsers.length,
    projectCount: teamProjects.length,
    taskCount: teamTasks.length,
    completedTasks,
    activeTasks,
    totalMinutes,
    leadName: lead?.name ?? "Unassigned",
  };
}

function buildUserActivity(users, tasks) {
  return users
    .filter((user) => user.role !== "Super Admin")
    .map((user) => {
      if (user.status !== "Active") {
        return {
          userId: user.id,
          name: user.name,
          initials: user.initials,
          avatarClass: user.avatarClass,
          status: "offline",
          task: "Unavailable",
          time: "-",
          progress: 0,
        };
      }

      const userTasks = tasks.filter((task) => task.assignedTo === user.id);
      const runningTask = userTasks.find((task) => task.status === "in-progress");
      const pausedTask = userTasks.find((task) => task.status === "paused");
      const completedTask = [...userTasks].reverse().find((task) => task.status === "completed");
      const pendingTask = userTasks.find((task) => task.status === "pending");

      if (runningTask) {
        return {
          userId: user.id,
          name: user.name,
          initials: user.initials,
          avatarClass: user.avatarClass,
          status: "working",
          task: runningTask.title,
          time: formatMinutesToClock(parseDurationToMinutes(runningTask.time)),
          progress: runningTask.progress,
        };
      }

      if (pausedTask) {
        return {
          userId: user.id,
          name: user.name,
          initials: user.initials,
          avatarClass: user.avatarClass,
          status: "paused",
          task: pausedTask.title,
          time: formatMinutesToClock(parseDurationToMinutes(pausedTask.time)),
          progress: pausedTask.progress,
        };
      }

      if (completedTask) {
        return {
          userId: user.id,
          name: user.name,
          initials: user.initials,
          avatarClass: user.avatarClass,
          status: "idle",
          task: `Last: ${completedTask.title}`,
          time: completedTask.time,
          progress: 0,
        };
      }

      return {
        userId: user.id,
        name: user.name,
        initials: user.initials,
        avatarClass: user.avatarClass,
        status: pendingTask ? "idle" : "online",
        task: pendingTask ? `Next: ${pendingTask.title}` : "Available for assignment",
        time: pendingTask ? pendingTask.time : "0m",
        progress: 0,
      };
    });
}

function buildReportModel(reportTab, users, teams, projects, tasks, sessions) {
  const activeUsers = users.filter((user) => user.status === "Active" && user.role !== "Super Admin");
  const userRows = activeUsers.map((user) => {
    const userTasks = tasks.filter((task) => task.assignedTo === user.id);
    const completed = userTasks.filter((task) => task.status === "completed").length;
    const open = userTasks.filter((task) => task.status !== "completed").length;
    const minutes = userTasks.reduce((sum, task) => sum + parseDurationToMinutes(task.time), 0);

    return {
      id: user.id,
      label: user.name,
      secondary: `${user.role} - ${user.team}`,
      open,
      completed,
      minutes,
    };
  });

  const projectRows = projects.map((project) => {
    const summary = summarizeProject(project, tasks);

    return {
      id: project.id,
      label: project.name,
      secondary: `${project.team} - ${statusLabel(project.status)}`,
      open: summary.openCount,
      completed: summary.doneCount,
      minutes: summary.totalMinutes,
    };
  });

  const teamRows = teams.map((team) => {
    const summary = summarizeTeam(team, users, projects, tasks);

    return {
      id: team.id,
      label: team.name,
      secondary: `Lead: ${summary.leadName}`,
      open: summary.activeTasks,
      completed: summary.completedTasks,
      minutes: summary.totalMinutes,
    };
  });

  const sessionMinutes = sessions.reduce((sum, session) => sum + parseDurationToMinutes(session.dur), 0);
  const totalTaskMinutes = tasks.reduce((sum, task) => sum + parseDurationToMinutes(task.time), 0);
  const totalCompleted = tasks.filter((task) => task.status === "completed").length;
  const totalOpen = tasks.filter((task) => task.status !== "completed").length;
  const activeMembers = buildUserActivity(users, tasks).filter(
    (member) => member.status === "working" || member.status === "paused",
  ).length;

  const baseMetrics = [
    {
      icon: "ti-clock",
      iconBackground: "#eef0ff",
      iconColor: "var(--accent)",
      value: formatHoursCompact(totalTaskMinutes),
      label: "Tracked Hours",
      delta: `${tasks.length} tasks in system`,
      valueClassName: "inline-mono",
    },
    {
      icon: "ti-checkbox",
      iconBackground: "#f0fdf4",
      iconColor: "#16a34a",
      value: String(totalCompleted),
      label: "Completed Tasks",
      delta: `${totalOpen} still open`,
    },
    {
      icon: "ti-users-group",
      iconBackground: "#fffbeb",
      iconColor: "#d97706",
      value: `${activeMembers}/${activeUsers.length}`,
      label: "Active Members",
      delta: "Working or paused now",
    },
    {
      icon: "ti-clock-play",
      iconBackground: "#faf5ff",
      iconColor: "#7c3aed",
      value: sessions.length ? formatMinutesShort(sessionMinutes / sessions.length) : "0m",
      label: "Avg Session",
      delta: `${sessions.length} logged sessions`,
      valueClassName: "inline-mono",
    },
  ];

  const models = {
    daily: {
      metrics: baseMetrics,
      leftTitle: "Hours by Employee - Today",
      leftBars: userRows.map((row) => ({
        label: shortName(row.label),
        minutes: row.minutes,
      })),
      rightTitle: "Hours by Project - Today",
      rightBars: projectRows.map((row) => ({
        label: row.label,
        minutes: row.minutes,
      })),
      tableTitle: "Daily Activity",
      rows: userRows,
    },
    weekly: {
      metrics: [
        { ...baseMetrics[0], value: formatHoursCompact(totalTaskMinutes * 1.6), label: "Weekly Hours", delta: "Projected from tracked work" },
        { ...baseMetrics[1], value: String(totalCompleted + Math.max(teams.length - 1, 0)), label: "Weekly Completions", delta: "Across all teams" },
        { ...baseMetrics[2], value: `${teams.length} teams`, label: "Reporting Teams", delta: `${projects.length} active projects` },
        { ...baseMetrics[3], value: formatMinutesShort((sessionMinutes || 90) * 1.2 / Math.max(sessions.length, 1)), label: "Avg Weekly Session", delta: "Rolling view" },
      ],
      leftTitle: "Hours by Team - This Week",
      leftBars: teamRows.map((row) => ({
        label: row.label,
        minutes: row.minutes || row.completed * 45,
      })),
      rightTitle: "Projects Closed This Week",
      rightBars: projectRows.map((row) => ({
        label: row.label,
        minutes: row.completed * 60,
      })),
      tableTitle: "Weekly Delivery Snapshot",
      rows: teamRows,
    },
    monthly: {
      metrics: [
        { ...baseMetrics[0], value: formatHoursCompact(totalTaskMinutes * 4.2), label: "Monthly Hours", delta: "Current month projection" },
        { ...baseMetrics[1], value: String(totalCompleted * 2), label: "Monthly Completions", delta: "Projected throughput" },
        { ...baseMetrics[2], value: String(projects.length), label: "Tracked Projects", delta: `${teams.length} delivery groups` },
        { ...baseMetrics[3], value: formatMinutesShort((sessionMinutes || 120) * 1.4 / Math.max(sessions.length, 1)), label: "Avg Monthly Session", delta: "Longer-form work blocks" },
      ],
      leftTitle: "Hours by Project - This Month",
      leftBars: projectRows.map((row) => ({
        label: row.label,
        minutes: row.minutes * 2 || row.completed * 80,
      })),
      rightTitle: "Hours by Team - This Month",
      rightBars: teamRows.map((row) => ({
        label: row.label,
        minutes: row.minutes * 2 || row.completed * 70,
      })),
      tableTitle: "Monthly Project Review",
      rows: projectRows,
    },
    "by-project": {
      metrics: [
        { ...baseMetrics[0], value: String(projects.length), label: "Projects", delta: `${tasks.length} linked tasks` },
        { ...baseMetrics[1], value: String(projects.filter((project) => project.status === "completed").length), label: "Completed Projects", delta: "Status based" },
        { ...baseMetrics[2], value: String(projects.filter((project) => project.status === "in-progress").length), label: "In Progress", delta: "Currently active" },
        { ...baseMetrics[3], value: formatHoursCompact(totalTaskMinutes / Math.max(projects.length, 1)), label: "Avg Hours / Project", delta: "Across system" },
      ],
      leftTitle: "Project Effort",
      leftBars: projectRows.map((row) => ({
        label: row.label,
        minutes: row.minutes,
      })),
      rightTitle: "Project Completion",
      rightBars: projectRows.map((row) => ({
        label: row.label,
        minutes: row.completed * 60,
      })),
      tableTitle: "Project Breakdown",
      rows: projectRows,
    },
    "by-employee": {
      metrics: [
        { ...baseMetrics[0], value: String(activeUsers.length), label: "Tracked Employees", delta: "Active delivery users" },
        { ...baseMetrics[1], value: String(activeUsers.filter((user) => user.role === "Employee").length), label: "Individual Contributors", delta: "Delivery focused" },
        { ...baseMetrics[2], value: String(activeUsers.filter((user) => user.role !== "Employee").length), label: "Leads and Admins", delta: "Management roles" },
        { ...baseMetrics[3], value: formatHoursCompact(totalTaskMinutes / Math.max(activeUsers.length, 1)), label: "Avg Hours / User", delta: "Across tracked work" },
      ],
      leftTitle: "Employee Hours",
      leftBars: userRows.map((row) => ({
        label: shortName(row.label),
        minutes: row.minutes,
      })),
      rightTitle: "Employee Completion",
      rightBars: userRows.map((row) => ({
        label: shortName(row.label),
        minutes: row.completed * 60,
      })),
      tableTitle: "Employee Breakdown",
      rows: userRows,
    },
  };

  return models[reportTab];
}

function buildModalForm(type, entity, prefill, teams, users, projects) {
  const defaultTeamName = teams[0]?.name ?? "";
  const defaultProjectId = String(projects[0]?.id ?? "");
  const defaultAssigneeId = String(users.find((user) => user.role === "Employee")?.id ?? "");

  if (type === "user") {
    return {
      name: entity?.name ?? prefill?.name ?? "",
      email: entity?.email ?? prefill?.email ?? "",
      role: entity?.role ?? prefill?.role ?? "Employee",
      team: entity?.team ?? prefill?.team ?? defaultTeamName,
      status: entity?.status ?? prefill?.status ?? "Active",
    };
  }

  if (type === "team") {
    return {
      name: entity?.name ?? prefill?.name ?? "",
      leadId: String(entity?.leadId ?? prefill?.leadId ?? ""),
      targetHours: entity?.targetHours ?? prefill?.targetHours ?? "40h/week",
      description: entity?.description ?? prefill?.description ?? "",
    };
  }

  if (type === "project") {
    return {
      name: entity?.name ?? prefill?.name ?? "",
      team: entity?.team ?? prefill?.team ?? defaultTeamName,
      status: entity?.status ?? prefill?.status ?? "planning",
      desc: entity?.desc ?? prefill?.desc ?? "",
      hours: entity?.hours ?? prefill?.hours ?? "0h 00m",
    };
  }

  return {
    title: entity?.title ?? prefill?.title ?? "",
    projectId: String(entity?.projectId ?? prefill?.projectId ?? defaultProjectId),
    assignedTo: String(entity?.assignedTo ?? prefill?.assignedTo ?? defaultAssigneeId),
    priority: entity?.priority ?? prefill?.priority ?? "medium",
    status: entity?.status ?? prefill?.status ?? "pending",
    progress: String(entity?.progress ?? prefill?.progress ?? 0),
    due: entity?.due ?? prefill?.due ?? "",
    time: entity?.time ?? prefill?.time ?? "0m",
    blocker: entity?.blocker ?? prefill?.blocker ?? "",
  };
}

function Icon({ name, className = "", style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`icon-svg ${className}`.trim()}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {renderTaskTrackIcon(name)}
    </svg>
  );
}

function Avatar({ initials, avatarClass, size = "md", children }) {
  return (
    <div className={`avatar av-${size} ${avatarClass}`}>
      {initials}
      {children}
    </div>
  );
}

function Tag({ children }) {
  return <span className="tag">{children}</span>;
}

function Pill({ className, children }) {
  return <span className={`pill ${className}`}>{children}</span>;
}

function ProgressBar({ value, tone = "" }) {
  return (
    <div className="prog-wrap">
      <div className={`prog-fill ${tone}`.trim()} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function MetricCard({ icon, iconColor, iconBackground, value, label, delta, deltaClassName = "", valueClassName = "" }) {
  return (
    <div className="metric-card">
      <div className="metric-icon" style={{ background: iconBackground }}>
        <Icon name={icon} style={{ color: iconColor }} />
      </div>
      <div className={`metric-value ${valueClassName}`.trim()}>{value}</div>
      <div className="metric-label">{label}</div>
      {delta ? <div className={`metric-delta ${deltaClassName}`.trim()}>{delta}</div> : null}
    </div>
  );
}

function EmptyState({ title, hint }) {
  return (
    <div className="empty-state">
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-hint">{hint}</div>
    </div>
  );
}

function TimerCard({ timer, onStart, onPause, onStop, idleStartLabel = "Start Timer" }) {
  const statusLabelText = timer.status === "running" ? "Running" : timer.status === "paused" ? "Paused" : "Idle";
  const statusClass = timer.status === "running" ? "pill-working" : timer.status === "paused" ? "pill-paused" : "pill-offline";

  return (
    <div className="card card-body timer-card">
      <div className="flex-between timer-card-header">
        <div className="card-title">Active Timer</div>
        <Pill className={statusClass}>{statusLabelText}</Pill>
      </div>
      <div className="timer-ring-wrap">
        <div className="timer-ring">
          <div className={`timer-glow-ring ${timer.status === "running" ? "running" : ""}`.trim()} />
          <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
            <circle className="timer-ring-bg" cx="80" cy="80" r="70" />
            <circle
              className="timer-ring-fill"
              cx="80"
              cy="80"
              r="70"
              style={{
                strokeDashoffset: timer.status !== "idle" ? getRingOffset(timer.seconds) : 440,
                stroke: timer.status === "paused" ? "var(--s-paused)" : "var(--accent)",
              }}
            />
          </svg>
          <div className="timer-inner">
            <div className={`timer-display ${timer.status === "running" ? "running" : timer.status === "paused" ? "paused" : ""}`.trim()}>
              {formatTimer(timer.seconds)}
            </div>
            <div className="timer-task-label">{timer.status !== "idle" ? timer.task : "No active task"}</div>
          </div>
        </div>
        {timer.status !== "idle" ? (
          <div className="timer-project-label">{timer.project}</div>
        ) : (
          <div className="timer-project-label timer-project-empty" />
        )}
        <div className="timer-controls">
          {timer.status === "idle" ? (
            <button type="button" className="btn btn-primary" onClick={onStart}>
              <Icon name="ti-player-play" />
              {idleStartLabel}
            </button>
          ) : null}
          {timer.status === "running" ? (
            <>
              <button type="button" className="btn btn-warning" onClick={onPause}>
                <Icon name="ti-player-pause" />
                Pause
              </button>
              <button type="button" className="btn btn-danger" onClick={onStop}>
                <Icon name="ti-player-stop" />
                Stop
              </button>
            </>
          ) : null}
          {timer.status === "paused" ? (
            <>
              <button type="button" className="btn btn-primary" onClick={onStart}>
                <Icon name="ti-player-play" />
                Resume
              </button>
              <button type="button" className="btn btn-danger" onClick={onStop}>
                <Icon name="ti-player-stop" />
                Stop
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard({ timer, myTasks, sessions, onNavigate, onStartTimer, onPauseTimer, onStopTimer }) {
  const totalMinutes = myTasks.reduce((sum, task) => sum + parseDurationToMinutes(task.time), 0);
  const completedCount = myTasks.filter((task) => task.status === "completed").length;
  const activeCount = myTasks.filter((task) => task.status === "in-progress" || task.status === "paused").length;

  return (
    <div className="gap-stack">
      <div className="metric-grid">
        <MetricCard icon="ti-clipboard-list" iconColor="var(--accent)" iconBackground="#eef0ff" value={String(activeCount)} label="My Active Tasks" delta={`${myTasks.length - completedCount} currently open`} deltaClassName="delta-up" />
        <MetricCard icon="ti-clock" iconColor="#16a34a" iconBackground="#f0fdf4" value={formatHoursCompact(totalMinutes)} label="Tracked Work" delta={`${formatMinutesShort(totalMinutes)} total`} deltaClassName="delta-up" valueClassName="inline-mono" />
        <MetricCard icon="ti-trophy" iconColor="#b45309" iconBackground="#fef9c3" value={String(completedCount)} label="Completed Tasks" delta={`${myTasks.length} assigned overall`} deltaClassName="delta-up" />
        <MetricCard icon="ti-chart-line" iconColor="#7c3aed" iconBackground="#faf5ff" value={sessions.length ? formatMinutesShort(sessions.reduce((sum, session) => sum + parseDurationToMinutes(session.dur), 0) / sessions.length) : "0m"} label="Avg Session" delta="Personal activity view" valueClassName="inline-mono" />
      </div>

      <div className="g-4060">
        <TimerCard timer={timer} onStart={onStartTimer} onPause={onPauseTimer} onStop={onStopTimer} />

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">My Tasks</div>
              <div className="card-sub">Assigned to you</div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate("tasks")}>
              View all
            </button>
          </div>
          <div>
            {myTasks.map((task) => (
              <div key={task.id} className="list-panel-row">
                <div className="flex-between list-panel-row-top">
                  <span className="list-panel-row-title">{task.title}</span>
                  <Pill className={getPriorityPill(task.priority)}>{task.priority}</Pill>
                </div>
                <div className="flex-row list-panel-row-meta">
                  <Tag>{task.project}</Tag>
                  <span className="muted-text">Due {task.due}</span>
                  <Pill className={getStatusPill(task.status)}>{statusLabel(task.status)}</Pill>
                </div>
                {task.progress > 0 ? (
                  <div className="flex-row progress-row">
                    <div className="progress-row-bar">
                      <ProgressBar value={task.progress} tone={getProgressTone(task.progress)} />
                    </div>
                    <span className="tiny-muted-text">{task.progress}%</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Sessions</div>
          <Tag>Personal Log</Tag>
        </div>
        <div className="tbl-inner">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, index) => (
                <tr key={`${session.task}-${session.start}-${index}`}>
                  <td className="table-strong-cell">{session.task}</td>
                  <td><Tag>{session.project}</Tag></td>
                  <td className="inline-mono table-small-cell">{session.start}</td>
                  <td className={`inline-mono table-small-cell ${session.end.includes(">") ? "accent-text" : "secondary-text"}`.trim()}>{session.end}</td>
                  <td className={`inline-mono ${session.dur === "LIVE" ? "accent-text" : "table-strong-cell"}`.trim()}>
                    {session.dur === "LIVE" ? formatTimer(timer.seconds) : session.dur}
                  </td>
                  <td className="table-note-cell">{session.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TeamLeadDashboard({ activity, tasks, teamName }) {
  const teamTasks = tasks.filter((task) => task.status !== "completed");
  const urgentTasks = tasks.filter((task) => task.priority === "urgent");
  const workingCount = activity.filter((member) => member.status === "working").length;

  return (
    <div className="gap-stack">
      <div className="metric-grid">
        <MetricCard icon="ti-users-group" iconColor="#16a34a" iconBackground="#f0fdf4" value={String(activity.length)} label="Team Members" delta={`${workingCount} working now`} deltaClassName="delta-up" />
        <MetricCard icon="ti-checkbox" iconColor="var(--accent)" iconBackground="#eef0ff" value={String(teamTasks.length)} label="Open Tasks" delta={`${urgentTasks.length} urgent`} deltaClassName="delta-down" />
        <MetricCard icon="ti-clock" iconColor="#d97706" iconBackground="#fffbeb" value={formatHoursCompact(teamTasks.reduce((sum, task) => sum + parseDurationToMinutes(task.time), 0))} label="Tracked Hours" delta={teamName} deltaClassName="delta-up" valueClassName="inline-mono" />
        <MetricCard icon="ti-trophy" iconColor="#b45309" iconBackground="#fef9c3" value={String(tasks.filter((task) => task.status === "completed").length)} label="Completed" delta="Across current team" deltaClassName="delta-up" />
      </div>

      <div className="g-6040">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Live Team Activity</div>
              <div className="card-sub">{teamName}</div>
            </div>
            <div className="live-badge">
              <div className="pulse-dot" />
              Live
            </div>
          </div>
          {activity.map((member) => (
            <div key={member.userId} className="emp-live-row">
              <Avatar initials={member.initials} avatarClass={member.avatarClass} />
              <div className="emp-info">
                <div className="emp-name">{member.name}</div>
                <div className="emp-task-text">{member.task}</div>
                {member.progress > 0 ? (
                  <div className="member-progress-wrap">
                    <ProgressBar value={member.progress} />
                  </div>
                ) : null}
              </div>
              <div className="emp-live-side">
                <Pill className={getStatusPill(member.status)}>{statusLabel(member.status)}</Pill>
                <span className="emp-time-val">{member.time}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="gap-stack gap-tight">
          <div className="card card-body">
            <div className="card-title section-bottom">Tracked Hours</div>
            {activity.map((member) => (
              <div key={member.userId} className="bar-row">
                <div className="bar-name">{shortName(member.name)}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.max(8, member.progress || 10)}%` }} />
                </div>
                <div className="bar-val">{member.time === "-" ? "0h" : member.time.slice(0, 5)}</div>
              </div>
            ))}
          </div>

          <div className="card card-body">
            <div className="flex-between section-bottom">
              <div className="card-title">Urgent Queue</div>
              <Pill className="pill-overdue">{urgentTasks.length} urgent</Pill>
            </div>
            <div className="gap-sm">
              {urgentTasks.length ? (
                urgentTasks.map((task) => (
                  <div key={task.id} className="surface-alert-card">
                    <div className="flex-between list-panel-row-top">
                      <span className="list-panel-row-title">{task.title}</span>
                      <Pill className="pill-urgent">urgent</Pill>
                    </div>
                    <div className="flex-row">
                      <span className="tiny-secondary-text">{task.assignee}</span>
                      <span className="tiny-danger-text">Due {task.due}</span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No urgent tasks" hint="Your team has cleared the urgent queue." />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ users, projects, tasks, activity }) {
  const activeProjects = projects.filter((project) => project.status === "in-progress");
  const completedTasks = tasks.filter((task) => task.status === "completed");
  const openTasks = tasks.filter((task) => task.status !== "completed");

  return (
    <div className="gap-stack">
      <div className="metric-grid">
        <MetricCard icon="ti-users" iconColor="#16a34a" iconBackground="#f0fdf4" value={String(users.length)} label="Total Users" delta={`${users.filter((user) => user.status === "Active").length} active now`} />
        <MetricCard icon="ti-folder-open" iconColor="var(--accent)" iconBackground="#eef0ff" value={String(activeProjects.length)} label="Active Projects" delta={`${projects.length - activeProjects.length} in other states`} deltaClassName="delta-down" />
        <MetricCard icon="ti-clock" iconColor="#d97706" iconBackground="#fffbeb" value={formatHoursCompact(tasks.reduce((sum, task) => sum + parseDurationToMinutes(task.time), 0))} label="Tracked Hours" delta={`${openTasks.length} open tasks`} deltaClassName="delta-up" valueClassName="inline-mono" />
        <MetricCard icon="ti-check" iconColor="#b45309" iconBackground="#fef9c3" value={String(completedTasks.length)} label="Completed Tasks" delta={`${activity.filter((member) => member.status === "working").length} people working`} deltaClassName="delta-up" />
      </div>

      <div className="g2">
        <div className="card card-body">
          <div className="card-title section-bottom">Projects Overview</div>
          {projects.map((project) => {
            const summary = summarizeProject(project, tasks);

            return (
              <div key={project.id} className="project-summary-row">
                <div className="flex-between project-summary-top">
                  <span className="list-panel-row-title">{project.name}</span>
                  <Pill className={getStatusPill(project.status)}>{statusLabel(project.status)}</Pill>
                </div>
                <div className="flex-row project-summary-meta">
                  <span className="tiny-secondary-text">
                    {summary.doneCount}/{summary.totalCount} tasks - {formatMinutesShort(summary.totalMinutes)}
                  </span>
                </div>
                <ProgressBar value={summary.progress} tone={getProgressTone(summary.progress)} />
              </div>
            );
          })}
        </div>

        <div className="card card-body">
          <div className="card-title section-bottom">Workload by Member</div>
          {activity.map((member) => (
            <div key={member.userId} className="bar-row">
              <div className="bar-name">{shortName(member.name)}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.max(10, member.progress || 12)}%` }} />
              </div>
              <div className="bar-val">{member.time === "-" ? "0h" : member.time.slice(0, 5)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SuperAdminDashboard({ users, teams, projects, tasks, notifications, onNavigate, onOpenModal }) {
  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const inactiveUsers = users.filter((user) => user.status !== "Active").length;
  const urgentTasks = tasks.filter((task) => task.priority === "urgent" && task.status !== "completed");
  const teamSummaries = teams.map((team) => summarizeTeam(team, users, projects, tasks));

  return (
    <div className="gap-stack">
      <div className="metric-grid">
        <MetricCard icon="ti-user-circle" iconColor="var(--accent)" iconBackground="#eef0ff" value={String(users.length)} label="Managed Users" delta={`${inactiveUsers} inactive or invited`} />
        <MetricCard icon="ti-users-group" iconColor="#16a34a" iconBackground="#f0fdf4" value={String(teams.length)} label="Delivery Teams" delta={`${projects.length} tracked projects`} />
        <MetricCard icon="ti-checkbox" iconColor="#d97706" iconBackground="#fffbeb" value={String(tasks.filter((task) => task.status !== "completed").length)} label="Open Tasks" delta={`${urgentTasks.length} urgent right now`} deltaClassName="delta-down" />
        <MetricCard icon="ti-bell" iconColor="#7c3aed" iconBackground="#faf5ff" value={String(unreadCount)} label="Unread Notifications" delta="System activity queue" />
      </div>

      <div className="g2">
        <div className="card card-body">
          <div className="flex-between section-bottom">
            <div className="card-title">System Quick Actions</div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate("reports")}>
              Open reports
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
            <button type="button" className="btn btn-primary" onClick={() => onOpenModal("user", "create")}>
              <Icon name="ti-user-plus" />
              New User
            </button>
            <button type="button" className="btn btn-primary" onClick={() => onOpenModal("team", "create")}>
              <Icon name="ti-users-plus" />
              New Team
            </button>
            <button type="button" className="btn btn-primary" onClick={() => onOpenModal("project", "create")}>
              <Icon name="ti-folder-plus" />
              New Project
            </button>
            <button type="button" className="btn btn-primary" onClick={() => onOpenModal("task", "create")}>
              <Icon name="ti-clipboard-plus" />
              New Task
            </button>
          </div>
          <div className="divider" />
          <div className="card-title section-bottom">Attention Needed</div>
          <div className="gap-sm">
            {urgentTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="surface-alert-card">
                <div className="flex-between list-panel-row-top">
                  <span className="list-panel-row-title">{task.title}</span>
                  <Pill className="pill-urgent">urgent</Pill>
                </div>
                <div className="flex-row">
                  <Tag>{task.project}</Tag>
                  <span className="tiny-secondary-text">{task.assignee}</span>
                </div>
              </div>
            ))}
            {!urgentTasks.length ? <EmptyState title="System looks stable" hint="No urgent work items are waiting on the super admin queue." /> : null}
          </div>
        </div>

        <div className="card card-body">
          <div className="flex-between section-bottom">
            <div className="card-title">Team Health</div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate("team")}>
              View teams
            </button>
          </div>
          {teamSummaries.map((summary) => (
            <div key={summary.id} style={{ marginBottom: "14px" }}>
              <div className="flex-between" style={{ marginBottom: "5px" }}>
                <span className="list-panel-row-title">{summary.name}</span>
                <span className="tiny-secondary-text">{summary.members} members</span>
              </div>
              <div className="flex-row" style={{ marginBottom: "6px", flexWrap: "wrap" }}>
                <Tag>{summary.projectCount} projects</Tag>
                <span className="tiny-secondary-text">{summary.activeTasks} active tasks</span>
                <span className="tiny-secondary-text">{summary.completedTasks} completed</span>
              </div>
              <ProgressBar
                value={summary.taskCount ? Math.round((summary.completedTasks / summary.taskCount) * 100) : 0}
                tone={summary.taskCount ? getProgressTone(Math.round((summary.completedTasks / summary.taskCount) * 100)) : ""}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Latest Notifications</div>
            <div className="card-sub">Cross-system activity</div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate("notifications")}>
            Open inbox
          </button>
        </div>
        {notifications.slice(0, 5).map((notification) => (
          <div key={notification.id} className={`notif-row ${notification.unread ? "unread" : ""}`.trim()}>
            <div className="notif-icon-wrap" style={{ background: notification.iconBg }}>
              <Icon name={notification.icon} style={{ color: notification.iconColor, fontSize: 16 }} />
            </div>
            <div className="notif-content">
              <div className="notif-text" dangerouslySetInnerHTML={{ __html: notification.text }} />
              <div className="notif-time">{notification.time}</div>
            </div>
            {notification.unread ? <div className="unread-dot" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function TasksPage({
  role,
  tasks,
  projects,
  users,
  taskView,
  onTaskViewChange,
  onOpenModal,
  onStartTaskTimer,
  onPauseTimer,
  onDeleteTask,
}) {
  const canManage = role !== "employee";
  const openTaskCount = tasks.filter((task) => task.status !== "completed").length;
  const filteredTasks = tasks.filter((task) => {
    const searchTarget = `${task.title} ${task.project} ${task.assignee}`.toLowerCase();
    const matchesSearch = searchTarget.includes(taskView.search.toLowerCase());
    const matchesTab = taskView.tab === "all" ? true : task.status === taskView.tab;
    const matchesProject = taskView.project === "all" ? true : String(task.projectId) === taskView.project;
    const matchesPriority = taskView.priority === "all" ? true : task.priority === taskView.priority;

    return matchesSearch && matchesTab && matchesProject && matchesPriority;
  });

  return (
    <div className="gap-stack">
      <div className="flex-between" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div className="tab-row" style={{ marginBottom: "10px" }}>
            {TASK_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`tab-btn ${taskView.tab === tab.id ? "active" : ""}`.trim()}
                onClick={() => onTaskViewChange({ tab: tab.id })}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-row" style={{ flexWrap: "wrap" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search task, project, assignee"
              value={taskView.search}
              onChange={(event) => onTaskViewChange({ search: event.target.value })}
              style={{ width: 240 }}
            />
            <select
              className="form-control"
              value={taskView.project}
              onChange={(event) => onTaskViewChange({ project: event.target.value })}
              style={{ width: 180 }}
            >
              <option value="all">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select
              className="form-control"
              value={taskView.priority}
              onChange={(event) => onTaskViewChange({ priority: event.target.value })}
              style={{ width: 160 }}
            >
              <option value="all">All priorities</option>
              {TASK_PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {statusLabel(priority)}
                </option>
              ))}
            </select>
            <span className="tiny-muted-text">{filteredTasks.length} shown, {openTaskCount} open total</span>
          </div>
        </div>
        {canManage ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onOpenModal("task", "create")}>
            <Icon name="ti-plus" />
            New Task
          </button>
        ) : null}
      </div>

      <div className="tbl-wrap">
        <div className="tbl-inner">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Due Date</th>
                <th>Assigned To</th>
                <th>Time Logged</th>
                <th>{role === "employee" ? "Action" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length ? (
                filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <div className="table-strong-cell">{task.title}</div>
                      {task.blocker ? (
                        <div className="table-blocker-text">
                          <Icon name="ti-alert-triangle" className="table-blocker-icon" />
                          {task.blocker}
                        </div>
                      ) : null}
                    </td>
                    <td><Tag>{task.project}</Tag></td>
                    <td><Pill className={getPriorityPill(task.priority)}>{task.priority}</Pill></td>
                    <td><Pill className={getStatusPill(task.status)}>{statusLabel(task.status)}</Pill></td>
                    <td>
                      <div className="table-progress">
                        <div className="table-progress-bar">
                          <ProgressBar value={task.progress} tone={getProgressTone(task.progress)} />
                        </div>
                        <span className="tiny-muted-text">{task.progress}%</span>
                      </div>
                    </td>
                    <td className={`table-small-cell ${task.due === "Jun 23" ? "danger-text" : "secondary-text"}`.trim()}>{task.due}</td>
                    <td>{users.find((user) => user.id === task.assignedTo)?.name ?? task.assignee}</td>
                    <td className="inline-mono accent-text table-small-cell">{task.time}</td>
                    <td>
                      {role === "employee" ? (
                        <>
                          {task.status === "pending" ? (
                            <button type="button" className="btn btn-success btn-sm" onClick={() => onStartTaskTimer(task)}>
                              <Icon name="ti-player-play" />
                              Start
                            </button>
                          ) : null}
                          {task.status === "in-progress" ? (
                            <button type="button" className="btn btn-warning btn-sm" onClick={onPauseTimer}>
                              <Icon name="ti-player-pause" />
                            </button>
                          ) : null}
                          {task.status === "paused" ? (
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => onStartTaskTimer(task)}>
                              <Icon name="ti-player-play" />
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <div className="flex-row">
                          <button type="button" className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => onOpenModal("task", "edit", task)}>
                            <Icon name="ti-edit" />
                          </button>
                          <button type="button" className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => onDeleteTask(task)}>
                            <Icon name="ti-trash" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9}>
                    <EmptyState title="No tasks match these filters" hint="Try a broader search or switch back to the All tab." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TimeTrackingPage({
  timer,
  tasks,
  sessions,
  currentUserId,
  notesEnabled,
  notesRequired,
  selectedTaskId,
  workNote,
  progressNote,
  onSelectTask,
  onWorkNoteChange,
  onProgressNoteChange,
  onStartTaskTimer,
  onStartTimer,
  onPauseTimer,
  onStopTimer,
}) {
  const availableTasks = tasks.filter((task) => task.assignedTo === currentUserId && task.status !== "completed");
  const selectedTask = availableTasks.find((task) => String(task.id) === String(selectedTaskId)) ?? availableTasks[0];
  const totalMinutes = sessions.reduce((sum, session) => sum + parseDurationToMinutes(session.dur), 0);

  return (
    <div className="gap-stack">
      <div className="metric-grid">
        <MetricCard icon="ti-calendar-day" iconColor="var(--accent)" iconBackground="#eef0ff" value={formatHoursCompact(totalMinutes)} label="Logged Sessions" valueClassName="inline-mono" />
        <MetricCard icon="ti-calendar-week" iconColor="#16a34a" iconBackground="#f0fdf4" value={formatHoursCompact(tasks.reduce((sum, task) => sum + parseDurationToMinutes(task.time), 0))} label="Task Time" valueClassName="inline-mono" />
        <MetricCard icon="ti-calendar-month" iconColor="#d97706" iconBackground="#fffbeb" value={String(availableTasks.length)} label="Open Assignments" valueClassName="inline-mono" />
        <MetricCard
          icon="ti-player-play"
          iconColor={timer.status === "running" ? "var(--accent)" : "var(--s-offline)"}
          iconBackground={timer.status === "running" ? "#eef0ff" : "#f8fafc"}
          value={timer.status !== "idle" ? formatTimer(timer.seconds) : "-"}
          label="Active Session"
          valueClassName={`inline-mono ${timer.status === "running" ? "accent-text" : "muted-text"}`.trim()}
        />
      </div>

      <div className="g-6040">
        <div className="card card-body time-tracking-card">
          <div className="flex-between section-bottom">
            <div className="card-title">Timer Control</div>
            <Pill className={timer.status === "running" ? "pill-working" : timer.status === "paused" ? "pill-paused" : "pill-offline"}>
              {timer.status === "running" ? "Running" : timer.status === "paused" ? "Paused" : "Idle"}
            </Pill>
          </div>

          {timer.status === "idle" ? (
            <>
              <div className="time-start-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="task-select">
                    Select task to work on
                  </label>
                  <select id="task-select" className="form-control" value={selectedTask?.id ?? ""} onChange={(event) => onSelectTask(event.target.value)}>
                    {availableTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title} - {task.project}
                      </option>
                    ))}
                  </select>
                </div>
                {notesEnabled ? (
                  <div className="form-group form-group-none">
                    <label className="form-label" htmlFor="work-note">
                      Work note {notesRequired ? "*" : "(optional)"}
                    </label>
                    <input
                      id="work-note"
                      type="text"
                      className="form-control"
                      placeholder="What will you work on?"
                      value={workNote}
                      onChange={(event) => onWorkNoteChange(event.target.value)}
                    />
                  </div>
                ) : null}
              </div>
              <button type="button" className="btn btn-primary btn-block" onClick={() => onStartTaskTimer(selectedTask)}>
                <Icon name="ti-player-play" />
                Start Timer
              </button>
            </>
          ) : (
            <>
              <div className="timer-ring-wrap">
                <div className="timer-ring">
                  <div className={`timer-glow-ring ${timer.status === "running" ? "running" : ""}`.trim()} />
                  <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
                    <circle className="timer-ring-bg" cx="80" cy="80" r="70" />
                    <circle
                      className="timer-ring-fill"
                      cx="80"
                      cy="80"
                      r="70"
                      style={{
                        strokeDashoffset: getRingOffset(timer.seconds),
                        stroke: timer.status === "paused" ? "var(--s-paused)" : "var(--accent)",
                      }}
                    />
                  </svg>
                  <div className="timer-inner">
                    <div className={`timer-display ${timer.status}`}>{formatTimer(timer.seconds)}</div>
                    <div className="timer-task-label">{timer.task}</div>
                  </div>
                </div>
                <div className="timer-project-label">{timer.project}</div>
              </div>
              {notesEnabled ? (
                <div className="time-progress-note">
                  <label className="form-label" htmlFor="progress-note">
                    Progress note {notesRequired ? "*" : ""}
                  </label>
                  <input
                    id="progress-note"
                    type="text"
                    className="form-control"
                    placeholder="What did you work on?"
                    value={progressNote}
                    onChange={(event) => onProgressNoteChange(event.target.value)}
                  />
                </div>
              ) : null}
              <div className="timer-controls">
                {timer.status === "running" ? (
                  <>
                    <button type="button" className="btn btn-warning" onClick={onPauseTimer}>
                      <Icon name="ti-player-pause" />
                      Pause
                    </button>
                    <button type="button" className="btn btn-danger" onClick={onStopTimer}>
                      <Icon name="ti-player-stop" />
                      Stop &amp; Save
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn btn-primary" onClick={onStartTimer}>
                      <Icon name="ti-player-play" />
                      Resume
                    </button>
                    <button type="button" className="btn btn-danger" onClick={onStopTimer}>
                      <Icon name="ti-player-stop" />
                      Stop &amp; Save
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="gap-stack gap-tight">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Sessions</div>
              <Tag>Live + saved</Tag>
            </div>
            {sessions.map((session, index) => (
              <div key={`${session.task}-${session.start}-${index}`} className="list-panel-row">
                <div className="flex-between list-panel-row-top">
                  <span className="list-panel-row-title">{session.task}</span>
                  <span className={`inline-mono table-small-cell ${session.dur === "LIVE" ? "accent-text" : "table-strong-cell"}`.trim()}>
                    {session.dur === "LIVE" ? formatTimer(timer.seconds) : session.dur}
                  </span>
                </div>
                <div className="flex-row" style={{ flexWrap: "wrap" }}>
                  <Tag>{session.project}</Tag>
                  <span className="tiny-muted-text">{session.start} - {session.end}</span>
                </div>
              </div>
            ))}
            <div className="list-panel-footer">
              <div className="flex-between">
                <span className="tiny-secondary-text">Total tracked</span>
                <span className="inline-mono table-strong-cell">{formatMinutesShort(totalMinutes)}</span>
              </div>
            </div>
          </div>

          <div className="card card-body">
            <div className="card-title section-bottom">Open Tasks</div>
            {availableTasks.length ? (
              availableTasks.map((task) => (
                <div key={task.id} className="bar-row">
                  <div className="bar-name">{task.title.length > 12 ? `${task.title.slice(0, 11)}...` : task.title}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.max(8, task.progress)}%` }} />
                  </div>
                  <div className="bar-val">{task.progress}%</div>
                </div>
              ))
            ) : (
              <EmptyState title="No active assignments" hint="Once tasks are assigned to you, they will appear here for timer tracking." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamPage({ role, teams, users, projects, tasks, selectedTeamId, onSelectTeam, onOpenModal }) {
  const canManage = role === "admin" || role === "superadmin";
  const teamSummaries = teams.map((team) => summarizeTeam(team, users, projects, tasks));
  const selectedTeam = teamSummaries.find((team) => String(team.id) === String(selectedTeamId)) ?? teamSummaries[0];
  const memberRows = users.filter((user) => user.team === selectedTeam?.name);
  const teamProjectIds = new Set(projects.filter((project) => project.team === selectedTeam?.name).map((project) => project.id));
  const teamTasks = tasks.filter((task) => teamProjectIds.has(task.projectId));

  return (
    <div className="gap-stack">
      <div className="flex-between" style={{ flexWrap: "wrap" }}>
        <div>
          <div className="table-strong-cell">Team Workspace</div>
          <div className="tiny-muted-text">{teamSummaries.length} teams managed across the system</div>
        </div>
        {canManage ? (
          <div className="flex-row">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onOpenModal("team", "create")}>
              <Icon name="ti-users-plus" />
              Add Team
            </button>
            {selectedTeam ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOpenModal("team", "edit", teams.find((team) => team.id === selectedTeam.id))}>
                <Icon name="ti-edit" />
                Edit Team
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        {teamSummaries.map((team) => (
          <button
            key={team.id}
            type="button"
            className={`card card-body ${String(team.id) === String(selectedTeam?.id) ? "selected-card" : ""}`.trim()}
            onClick={() => onSelectTeam(String(team.id))}
            style={{ textAlign: "left" }}
          >
            <div className="flex-between section-bottom">
              <div className="card-title">{team.name}</div>
              <Pill className={team.activeTasks ? "pill-working" : "pill-completed"}>{team.activeTasks ? "Active" : "Stable"}</Pill>
            </div>
            <div className="tiny-secondary-text" style={{ marginBottom: "10px" }}>{team.description}</div>
            <div className="gap-sm">
              <div className="flex-between">
                <span className="tiny-secondary-text">Lead</span>
                <span className="table-strong-cell">{team.leadName}</span>
              </div>
              <div className="flex-between">
                <span className="tiny-secondary-text">Members</span>
                <span className="table-strong-cell">{team.members}</span>
              </div>
              <div className="flex-between">
                <span className="tiny-secondary-text">Projects</span>
                <span className="table-strong-cell">{team.projectCount}</span>
              </div>
              <div className="flex-between">
                <span className="tiny-secondary-text">Target Hours</span>
                <span className="table-strong-cell">{team.targetHours}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedTeam ? (
        <div className="g2">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{selectedTeam.name} Members</div>
                <div className="card-sub">{selectedTeam.members} people assigned</div>
              </div>
              {canManage ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => onOpenModal("user", "create", null, { team: selectedTeam.name })}>
                  <Icon name="ti-user-plus" />
                  Add Member
                </button>
              ) : null}
            </div>
            <div className="tbl-inner">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Tasks</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {memberRows.map((user) => {
                    const userTasks = teamTasks.filter((task) => task.assignedTo === user.id);
                    const hours = userTasks.reduce((sum, task) => sum + parseDurationToMinutes(task.time), 0);

                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="table-user-cell">
                            <Avatar initials={user.initials} avatarClass={user.avatarClass} size="sm" />
                            <span className="table-strong-cell">{user.name}</span>
                          </div>
                        </td>
                        <td><Tag>{user.role}</Tag></td>
                        <td><Pill className={user.status === "Active" ? "pill-completed" : "pill-offline"}>{user.status}</Pill></td>
                        <td>{userTasks.length}</td>
                        <td className="inline-mono table-small-cell">{formatMinutesShort(hours)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card card-body">
            <div className="card-title section-bottom">{selectedTeam.name} Delivery</div>
            <div className="gap-sm">
              <div className="flex-between">
                <span className="tiny-secondary-text">Projects</span>
                <span className="table-strong-cell">{selectedTeam.projectCount}</span>
              </div>
              <div className="flex-between">
                <span className="tiny-secondary-text">Open Tasks</span>
                <span className="table-strong-cell">{selectedTeam.taskCount - selectedTeam.completedTasks}</span>
              </div>
              <div className="flex-between">
                <span className="tiny-secondary-text">Completed</span>
                <span className="table-strong-cell">{selectedTeam.completedTasks}</span>
              </div>
              <div className="flex-between">
                <span className="tiny-secondary-text">Tracked Hours</span>
                <span className="table-strong-cell">{formatMinutesShort(selectedTeam.totalMinutes)}</span>
              </div>
            </div>
            <div className="divider" />
            <div className="card-title section-bottom">Projects in Team</div>
            <div className="gap-sm">
              {projects.filter((project) => project.team === selectedTeam.name).map((project) => {
                const summary = summarizeProject(project, tasks);

                return (
                  <div key={project.id}>
                    <div className="flex-between" style={{ marginBottom: "5px" }}>
                      <span className="list-panel-row-title">{project.name}</span>
                      <Pill className={getStatusPill(project.status)}>{statusLabel(project.status)}</Pill>
                    </div>
                    <div className="tiny-secondary-text" style={{ marginBottom: "6px" }}>
                      {summary.doneCount}/{summary.totalCount} tasks complete
                    </div>
                    <ProgressBar value={summary.progress} tone={getProgressTone(summary.progress)} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState title="No teams configured" hint="Create a team to start organizing members, projects, and task ownership." />
      )}
    </div>
  );
}

function ProjectsPage({ role, projects, tasks, teams, projectView, onProjectViewChange, onOpenModal, onDeleteProject }) {
  const canManage = role !== "employee";
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = `${project.name} ${project.desc} ${project.team}`.toLowerCase().includes(projectView.search.toLowerCase());
    const matchesTeam = projectView.team === "all" ? true : project.team === projectView.team;
    const matchesStatus = projectView.status === "all" ? true : project.status === projectView.status;

    return matchesSearch && matchesTeam && matchesStatus;
  });

  const activeCount = projects.filter((project) => project.status === "in-progress").length;
  const onHoldCount = projects.filter((project) => project.status === "on-hold").length;

  return (
    <div className="gap-stack">
      <div className="flex-between projects-toolbar" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div className="g3 projects-toolbar-grid">
            <div className="metric-card compact-metric-card">
              <div className="metric-value">{projects.length}</div>
              <div className="metric-label">Total Projects</div>
            </div>
            <div className="metric-card compact-metric-card">
              <div className="metric-value accent-text">{activeCount}</div>
              <div className="metric-label">In Progress</div>
            </div>
            <div className="metric-card compact-metric-card">
              <div className="metric-value warning-text">{onHoldCount}</div>
              <div className="metric-label">On Hold</div>
            </div>
          </div>
          <div className="flex-row" style={{ marginTop: "12px", flexWrap: "wrap" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search project"
              value={projectView.search}
              onChange={(event) => onProjectViewChange({ search: event.target.value })}
              style={{ width: 220 }}
            />
            <select
              className="form-control"
              value={projectView.team}
              onChange={(event) => onProjectViewChange({ team: event.target.value })}
              style={{ width: 170 }}
            >
              <option value="all">All teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
            <select
              className="form-control"
              value={projectView.status}
              onChange={(event) => onProjectViewChange({ status: event.target.value })}
              style={{ width: 170 }}
            >
              <option value="all">All statuses</option>
              {PROJECT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {canManage ? (
          <button type="button" className="btn btn-primary btn-sm projects-toolbar-action" onClick={() => onOpenModal("project", "create")}>
            <Icon name="ti-plus" />
            New Project
          </button>
        ) : null}
      </div>

      <div className="tbl-wrap">
        <div className="tbl-inner">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Team</th>
                <th>Description</th>
                <th>Status</th>
                <th>Tasks</th>
                <th>Progress</th>
                <th>Hours</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length ? (
                filteredProjects.map((project) => {
                  const summary = summarizeProject(project, tasks);

                  return (
                    <tr key={project.id}>
                      <td className="table-strong-cell">{project.name}</td>
                      <td><Tag>{project.team}</Tag></td>
                      <td className="table-note-cell project-description-cell">{project.desc}</td>
                      <td><Pill className={getStatusPill(project.status)}>{statusLabel(project.status)}</Pill></td>
                      <td>{summary.doneCount}/{summary.totalCount}</td>
                      <td>
                        <div className="table-progress">
                          <div className="table-progress-bar">
                            <ProgressBar value={summary.progress} tone={getProgressTone(summary.progress)} />
                          </div>
                          <span className="tiny-muted-text">{summary.progress}%</span>
                        </div>
                      </td>
                      <td className="inline-mono table-small-cell">{summary.totalMinutes ? formatMinutesShort(summary.totalMinutes) : project.hours}</td>
                      <td>
                        <div className="flex-row">
                          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => onOpenModal("project", "edit", project)}>
                            <Icon name="ti-edit" />
                          </button>
                          {canManage ? (
                            <button type="button" className="btn btn-danger btn-icon btn-sm" onClick={() => onDeleteProject(project)}>
                              <Icon name="ti-trash" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8}>
                    <EmptyState title="No projects found" hint="Create a project or change the current filters." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportsPage({ reportTab, onReportTabChange, reportModel, onExport }) {
  const maxLeftMinutes = Math.max(...reportModel.leftBars.map((bar) => bar.minutes), 1);
  const maxRightMinutes = Math.max(...reportModel.rightBars.map((bar) => bar.minutes), 1);

  return (
    <div className="gap-stack">
      <div className="flex-between reports-toolbar" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
        <div className="tab-row">
          {REPORT_TABS.map((tab) => (
            <button key={tab.id} type="button" className={`tab-btn ${reportTab === tab.id ? "active" : ""}`.trim()} onClick={() => onReportTabChange(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-row">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onExport("PDF")}>
            <Icon name="ti-file-type-pdf" />
            PDF
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onExport("Excel")}>
            <Icon name="ti-file-spreadsheet" />
            Excel
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onExport("CSV")}>
            <Icon name="ti-download" />
            CSV
          </button>
        </div>
      </div>

      <div className="metric-grid">
        {reportModel.metrics.map((metric) => (
          <MetricCard
            key={`${reportTab}-${metric.label}`}
            icon={metric.icon}
            iconColor={metric.iconColor}
            iconBackground={metric.iconBackground}
            value={metric.value}
            label={metric.label}
            delta={metric.delta}
            valueClassName={metric.valueClassName}
          />
        ))}
      </div>

      <div className="g2">
        <div className="card card-body">
          <div className="card-title section-bottom">{reportModel.leftTitle}</div>
          {reportModel.leftBars.map((bar) => (
            <div key={`${reportTab}-${bar.label}-left`} className="bar-row">
              <div className="bar-name">{bar.label.length > 14 ? `${bar.label.slice(0, 13)}...` : bar.label}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(bar.minutes / maxLeftMinutes) * 100}%` }} />
              </div>
              <div className="bar-val">{formatHoursCompact(bar.minutes)}</div>
            </div>
          ))}
        </div>

        <div className="card card-body">
          <div className="card-title section-bottom">{reportModel.rightTitle}</div>
          {reportModel.rightBars.map((bar) => (
            <div key={`${reportTab}-${bar.label}-right`} className="bar-row">
              <div className="bar-name">{bar.label.length > 14 ? `${bar.label.slice(0, 13)}...` : bar.label}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(bar.minutes / maxRightMinutes) * 100}%` }} />
              </div>
              <div className="bar-val">{formatHoursCompact(bar.minutes)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="tbl-wrap">
        <div className="card-header reports-table-header">
          <div className="card-title">{reportModel.tableTitle}</div>
          <span className="tiny-muted-text">{statusLabel(reportTab)}</span>
        </div>
        <div className="tbl-inner">
          <table>
            <thead>
              <tr>
                <th>Label</th>
                <th>Secondary</th>
                <th>Open</th>
                <th>Completed</th>
                <th>Tracked Hours</th>
              </tr>
            </thead>
            <tbody>
              {reportModel.rows.map((row) => (
                <tr key={`${reportTab}-${row.id}`}>
                  <td className="table-strong-cell">{row.label}</td>
                  <td className="table-note-cell">{row.secondary}</td>
                  <td>{row.open}</td>
                  <td>{row.completed}</td>
                  <td className="inline-mono table-small-cell">{formatHoursCompact(row.minutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsersPage({ users, teams, userView, onUserViewChange, onOpenModal, onToggleUserStatus }) {
  const filteredUsers = users.filter((user) => {
    const matchesSearch = `${user.name} ${user.email} ${user.role} ${user.team}`.toLowerCase().includes(userView.search.toLowerCase());
    const matchesRole = userView.role === "all" ? true : user.role === userView.role;
    const matchesTeam = userView.team === "all" ? true : user.team === userView.team;
    const matchesStatus = userView.status === "all" ? true : user.status === userView.status;

    return matchesSearch && matchesRole && matchesTeam && matchesStatus;
  });

  return (
    <div className="gap-stack">
      <div className="flex-between" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <span className="tiny-muted-text">{filteredUsers.length} of {users.length} users shown</span>
          <div className="flex-row" style={{ marginTop: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search name, email, role, team"
              value={userView.search}
              onChange={(event) => onUserViewChange({ search: event.target.value })}
              style={{ width: 240 }}
            />
            <select className="form-control" value={userView.role} onChange={(event) => onUserViewChange({ role: event.target.value })} style={{ width: 170 }}>
              <option value="all">All roles</option>
              {ROLE_OPTIONS.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption}
                </option>
              ))}
            </select>
            <select className="form-control" value={userView.team} onChange={(event) => onUserViewChange({ team: event.target.value })} style={{ width: 170 }}>
              <option value="all">All teams</option>
              <option value="All Teams">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
            <select className="form-control" value={userView.status} onChange={(event) => onUserViewChange({ status: event.target.value })} style={{ width: 170 }}>
              <option value="all">All statuses</option>
              {USER_STATUS_OPTIONS.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onOpenModal("user", "create")}>
          <Icon name="ti-plus" />
          Add User
        </button>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-inner">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Team</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="table-user-cell">
                        <Avatar initials={user.initials} avatarClass={user.avatarClass} size="sm" />
                        <span className="table-strong-cell">{user.name}</span>
                      </div>
                    </td>
                    <td className="table-note-cell">{user.email}</td>
                    <td><Tag>{user.role}</Tag></td>
                    <td>{user.team}</td>
                    <td><Pill className={user.status === "Active" ? "pill-completed" : user.status === "Invited" ? "pill-pending" : "pill-offline"}>{user.status}</Pill></td>
                    <td>
                      <div className="flex-row">
                        <button type="button" className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => onOpenModal("user", "edit", user)}>
                          <Icon name="ti-edit" />
                        </button>
                        <button type="button" className="btn btn-ghost btn-icon btn-sm" title="Change role" onClick={() => onOpenModal("user", "edit", user)}>
                          <Icon name="ti-shield" />
                        </button>
                        <button
                          type="button"
                          className={`btn ${user.status === "Active" ? "btn-danger" : "btn-success"} btn-icon btn-sm`}
                          title={user.status === "Active" ? "Deactivate" : "Activate"}
                          onClick={() => onToggleUserStatus(user)}
                        >
                          <Icon name={user.status === "Active" ? "ti-user-minus" : "ti-user-check"} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <EmptyState title="No users match this view" hint="Broaden the search or clear one of the role, team, or status filters." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NotificationsPage({
  notifications,
  notificationFilter,
  onNotificationFilterChange,
  onMarkAllRead,
  onClearRead,
  onToggleNotificationRead,
  onDeleteNotification,
}) {
  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const filteredNotifications = notifications.filter((notification) => {
    if (notificationFilter === "unread") {
      return notification.unread;
    }

    if (notificationFilter === "read") {
      return !notification.unread;
    }

    return true;
  });

  return (
    <div className="gap-stack">
      <div className="flex-between" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div className="tab-row" style={{ marginBottom: "10px" }}>
            {NOTIFICATION_TABS.map((tab) => (
              <button key={tab.id} type="button" className={`tab-btn ${notificationFilter === tab.id ? "active" : ""}`.trim()} onClick={() => onNotificationFilterChange(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>
          <span className="tiny-muted-text">{unreadCount} unread, {filteredNotifications.length} shown</span>
        </div>
        <div className="flex-row">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onMarkAllRead}>
            Mark all read
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClearRead}>
            Clear read
          </button>
        </div>
      </div>

      <div className="card notifications-card">
        {filteredNotifications.length ? (
          filteredNotifications.map((notification) => (
            <div key={notification.id} className={`notif-row ${notification.unread ? "unread" : ""}`.trim()}>
              <div className="notif-icon-wrap" style={{ background: notification.iconBg }}>
                <Icon name={notification.icon} style={{ color: notification.iconColor, fontSize: 16 }} />
              </div>
              <div className="notif-content">
                <div className="notif-text" dangerouslySetInnerHTML={{ __html: notification.text }} />
                <div className="notif-time">{notification.time}</div>
              </div>
              <div className="notif-action-row">
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => onToggleNotificationRead(notification)}>
                  {notification.unread ? "Mark read" : "Mark unread"}
                </button>
                <button type="button" className="btn btn-danger btn-xs" onClick={() => onDeleteNotification(notification.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: "20px" }}>
            <EmptyState title="No notifications in this view" hint="Switch filters or trigger a system action to generate new activity." />
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPage({ settings, savedSettings, onSettingChange, onToggleChange, onSave, onReset }) {
  const dirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  return (
    <div className="gap-stack settings-page">
      <div className="card card-body">
        <div className="flex-between settings-card-title">
          <div className="card-title">System Configuration</div>
          <Pill className={dirty ? "pill-paused" : "pill-completed"}>{dirty ? "Unsaved" : "Saved"}</Pill>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Heartbeat interval</div>
            <div className="settings-hint">How often active timers send a ping (FR-030)</div>
          </div>
          <input type="text" className="form-control settings-input" value={settings.heartbeat} onChange={(event) => onSettingChange("heartbeat", event.target.value)} />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Auto-idle timeout</div>
            <div className="settings-hint">Mark user idle if no heartbeat is received</div>
          </div>
          <input type="text" className="form-control settings-input" value={settings.autoIdle} onChange={(event) => onSettingChange("autoIdle", event.target.value)} />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Default working hours</div>
            <div className="settings-hint">Expected daily hours per employee</div>
          </div>
          <input type="text" className="form-control settings-input" value={settings.defaultHours} onChange={(event) => onSettingChange("defaultHours", event.target.value)} />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Timezone</div>
            <div className="settings-hint">Primary reporting timezone for system reports</div>
          </div>
          <input type="text" className="form-control settings-input" value={settings.timezone} onChange={(event) => onSettingChange("timezone", event.target.value)} />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Work week</div>
            <div className="settings-hint">Displayed in scheduling and summary views</div>
          </div>
          <input type="text" className="form-control settings-input" value={settings.workWeek} onChange={(event) => onSettingChange("workWeek", event.target.value)} />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Report cadence</div>
            <div className="settings-hint">Default management reporting rhythm</div>
          </div>
          <select className="form-control settings-input" value={settings.reportCadence} onChange={(event) => onSettingChange("reportCadence", event.target.value)}>
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Default landing page</div>
            <div className="settings-hint">Used when new managers sign in</div>
          </div>
          <select className="form-control settings-input" value={settings.defaultLanding} onChange={(event) => onSettingChange("defaultLanding", event.target.value)}>
            <option>Dashboard</option>
            <option>Reports</option>
            <option>Notifications</option>
            <option>Projects</option>
          </select>
        </div>
        <div className="settings-save-row">
          <div className="flex-row">
            <button type="button" className="btn btn-primary btn-sm" onClick={onSave} disabled={!dirty}>
              Save Changes
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onReset} disabled={!dirty}>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="card card-body">
        <div className="card-title settings-card-title">Privacy &amp; Monitoring</div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Task timer tracking</div>
            <div className="settings-hint">Track start, pause, and stop events for all timers</div>
          </div>
          <button type="button" className={`toggle ${settings.trackTimers ? "on" : ""}`.trim()} onClick={() => onToggleChange("trackTimers")} aria-label="Toggle task timer tracking" />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Online / offline status</div>
            <div className="settings-hint">Show live presence to leads and admins</div>
          </div>
          <button type="button" className={`toggle ${settings.showPresence ? "on" : ""}`.trim()} onClick={() => onToggleChange("showPresence")} aria-label="Toggle presence tracking" />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Progress notes</div>
            <div className="settings-hint">Allow team members to add session notes while logging work</div>
          </div>
          <button type="button" className={`toggle ${settings.allowNotes ? "on" : ""}`.trim()} onClick={() => onToggleChange("allowNotes")} aria-label="Toggle progress notes" />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Notify managers on changes</div>
            <div className="settings-hint">Send notifications when assignments or statuses change</div>
          </div>
          <button type="button" className={`toggle ${settings.notifyManagers ? "on" : ""}`.trim()} onClick={() => onToggleChange("notifyManagers")} aria-label="Toggle manager notifications" />
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Require notes on stop</div>
            <div className="settings-hint">Prompt members for a short work summary before saving a session</div>
          </div>
          <button type="button" className={`toggle ${settings.requireTaskNotes ? "on" : ""}`.trim()} onClick={() => onToggleChange("requireTaskNotes")} aria-label="Toggle required notes" />
        </div>
      </div>

      <div className="card card-body">
        <div className="card-title settings-card-title">Role Permissions Matrix</div>
        <table className="permissions-table">
          <thead>
            <tr>
              <th>Permission</th>
              <th className="centered-cell">Employee</th>
              <th className="centered-cell">Team Lead</th>
              <th className="centered-cell">Admin</th>
              <th className="centered-cell">Super Admin</th>
            </tr>
          </thead>
          <tbody>
            {permissionRows.map((row) => (
              <tr key={row[0]}>
                {row.map((column, index) => (
                  <td
                    key={`${row[0]}-${index}`}
                    className={[
                      index === 0 ? "table-strong-cell" : "centered-cell",
                      column === "yes" ? "success-text" : "",
                      column === "no" ? "muted-text" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {column === "yes" ? "Yes" : column === "no" ? "-" : column}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AppModal({ modalState, modalForm, teams, users, projects, onClose, onChange, onSubmit }) {
  if (!modalState) {
    return null;
  }

  const { type, mode } = modalState;
  const titleMap = {
    user: mode === "create" ? "Add User" : "Edit User",
    team: mode === "create" ? "Create Team" : "Edit Team",
    project: mode === "create" ? "Create Project" : "Edit Project",
    task: mode === "create" ? "Create Task" : "Edit Task",
  };
  const iconMap = {
    user: "ti-user-plus",
    team: "ti-users-plus",
    project: "ti-folder-plus",
    task: "ti-clipboard-plus",
  };
  const submitLabelMap = {
    user: mode === "create" ? "Add User" : "Save User",
    team: mode === "create" ? "Create Team" : "Save Team",
    project: mode === "create" ? "Create Project" : "Save Project",
    task: mode === "create" ? "Create Task" : "Save Task",
  };

  const employeeUsers = users.filter((user) => user.role === "Employee");
  const teamLeadUsers = users.filter((user) => user.role === "Team Lead" || user.role === "Admin");
  const teamOptions = ["All Teams", ...teams.map((team) => team.name)];
  const roleDrivenTeamDisabled = type === "user" && modalForm.role === "Super Admin";
  const isValid =
    (type === "user" && modalForm.name.trim() && modalForm.email.trim() && modalForm.role && modalForm.team) ||
    (type === "team" && modalForm.name.trim()) ||
    (type === "project" && modalForm.name.trim() && modalForm.team) ||
    (type === "task" && modalForm.title.trim() && modalForm.projectId && modalForm.assignedTo && modalForm.due.trim());

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title">
          <Icon name={iconMap[type]} className="modal-title-icon" />
          {titleMap[type]}
        </div>

        {type === "user" ? (
          <>
            <div className="modal-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="user-name">
                  Full name *
                </label>
                <input id="user-name" type="text" className="form-control" value={modalForm.name} onChange={(event) => onChange("name", event.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="user-email">
                  Email *
                </label>
                <input id="user-email" type="email" className="form-control" value={modalForm.email} onChange={(event) => onChange("email", event.target.value)} />
              </div>
            </div>
            <div className="modal-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="user-role">
                  Role *
                </label>
                <select id="user-role" className="form-control" value={modalForm.role} onChange={(event) => onChange("role", event.target.value)}>
                  {ROLE_OPTIONS.map((roleOption) => (
                    <option key={roleOption} value={roleOption}>
                      {roleOption}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="user-team">
                  Team *
                </label>
                <select id="user-team" className="form-control" value={modalForm.team} onChange={(event) => onChange("team", event.target.value)} disabled={roleDrivenTeamDisabled}>
                  {teamOptions.map((teamOption) => (
                    <option key={teamOption} value={teamOption}>
                      {teamOption}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="user-status">
                Status
              </label>
              <select id="user-status" className="form-control" value={modalForm.status} onChange={(event) => onChange("status", event.target.value)}>
                {USER_STATUS_OPTIONS.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {statusOption}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}

        {type === "team" ? (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="team-name">
                Team name *
              </label>
              <input id="team-name" type="text" className="form-control" value={modalForm.name} onChange={(event) => onChange("name", event.target.value)} />
            </div>
            <div className="modal-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="team-lead">
                  Team lead
                </label>
                <select id="team-lead" className="form-control" value={modalForm.leadId} onChange={(event) => onChange("leadId", event.target.value)}>
                  <option value="">Unassigned</option>
                  {teamLeadUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="team-target">
                  Target hours
                </label>
                <input id="team-target" type="text" className="form-control" value={modalForm.targetHours} onChange={(event) => onChange("targetHours", event.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="team-description">
                Description
              </label>
              <textarea id="team-description" className="form-control" value={modalForm.description} onChange={(event) => onChange("description", event.target.value)} />
            </div>
          </>
        ) : null}

        {type === "project" ? (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="project-name">
                Project name *
              </label>
              <input id="project-name" type="text" className="form-control" value={modalForm.name} onChange={(event) => onChange("name", event.target.value)} />
            </div>
            <div className="modal-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="project-team">
                  Team *
                </label>
                <select id="project-team" className="form-control" value={modalForm.team} onChange={(event) => onChange("team", event.target.value)}>
                  {teams.map((team) => (
                    <option key={team.id} value={team.name}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="project-status">
                  Status
                </label>
                <select id="project-status" className="form-control" value={modalForm.status} onChange={(event) => onChange("status", event.target.value)}>
                  {PROJECT_STATUS_OPTIONS.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusLabel(statusOption)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="project-hours">
                  Planned hours
                </label>
                <input id="project-hours" type="text" className="form-control" value={modalForm.hours} onChange={(event) => onChange("hours", event.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="project-desc">
                  Description
                </label>
                <textarea id="project-desc" className="form-control" value={modalForm.desc} onChange={(event) => onChange("desc", event.target.value)} />
              </div>
            </div>
          </>
        ) : null}

        {type === "task" ? (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="task-title">
                Task title *
              </label>
              <input id="task-title" type="text" className="form-control" value={modalForm.title} onChange={(event) => onChange("title", event.target.value)} />
            </div>
            <div className="modal-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="task-project">
                  Project *
                </label>
                <select id="task-project" className="form-control" value={modalForm.projectId} onChange={(event) => onChange("projectId", event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-assignee">
                  Assigned to *
                </label>
                <select id="task-assignee" className="form-control" value={modalForm.assignedTo} onChange={(event) => onChange("assignedTo", event.target.value)}>
                  {employeeUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="task-priority">
                  Priority
                </label>
                <select id="task-priority" className="form-control" value={modalForm.priority} onChange={(event) => onChange("priority", event.target.value)}>
                  {TASK_PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>
                      {statusLabel(priority)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-status">
                  Status
                </label>
                <select id="task-status" className="form-control" value={modalForm.status} onChange={(event) => onChange("status", event.target.value)}>
                  {TASK_STATUS_OPTIONS.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusLabel(statusOption)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="task-progress">
                  Progress %
                </label>
                <input id="task-progress" type="number" min="0" max="100" className="form-control" value={modalForm.progress} onChange={(event) => onChange("progress", event.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-due">
                  Due date *
                </label>
                <input id="task-due" type="text" className="form-control" value={modalForm.due} onChange={(event) => onChange("due", event.target.value)} placeholder="Jul 05" />
              </div>
            </div>
            <div className="modal-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="task-time">
                  Logged time
                </label>
                <input id="task-time" type="text" className="form-control" value={modalForm.time} onChange={(event) => onChange("time", event.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-blocker">
                  Blocker
                </label>
                <input id="task-blocker" type="text" className="form-control" value={modalForm.blocker} onChange={(event) => onChange("blocker", event.target.value)} />
              </div>
            </div>
          </>
        ) : null}

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={!isValid}>
            <Icon name={iconMap[type]} />
            {submitLabelMap[type]}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastStack({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`.trim()}>
          <Icon name={toast.type === "success" ? "ti-circle-check" : "ti-alert-circle"} />
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function getInitialAppState(initialData) {
  const users = Array.isArray(initialData?.users) ? initialData.users : database.users;
  const projects = Array.isArray(initialData?.projects) ? initialData.projects : database.projects;

  return {
    users,
    teams:
      Array.isArray(initialData?.teams) && initialData.teams.length
        ? initialData.teams
        : buildInitialTeams(users, projects),
    projects,
    tasks: Array.isArray(initialData?.tasks) ? initialData.tasks : database.tasks,
    sessions: Array.isArray(initialData?.sessions) ? initialData.sessions : database.sessions,
    notifications: Array.isArray(initialData?.notifications)
      ? initialData.notifications
      : database.notifications,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(initialData?.settings ?? {}),
    },
  };
}

export default function TaskTrackApp({ initialData, initialRoute }) {
  const initialState = getInitialAppState(initialData);
  const router = useRouter();
  const [role, setRole] = useState(initialRoute?.role ?? DEFAULT_ROLE);
  const [page, setPage] = useState(initialRoute?.page ?? DEFAULT_PAGE);
  const [users, setUsers] = useState(initialState.users);
  const [teams, setTeams] = useState(initialState.teams);
  const [projects, setProjects] = useState(initialState.projects);
  const [tasks, setTasks] = useState(initialState.tasks);
  const [sessions, setSessions] = useState(initialState.sessions);
  const [notifications, setNotifications] = useState(initialState.notifications);
  const [timer, setTimer] = useState(INITIAL_TIMER);
  const [toasts, setToasts] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(
    String(initialState.tasks.find((task) => task.assignedTo === rolesConfig.employee.userId)?.id ?? ""),
  );
  const [workNote, setWorkNote] = useState("");
  const [progressNote, setProgressNote] = useState("");
  const [settings, setSettings] = useState(initialState.settings);
  const [savedSettings, setSavedSettings] = useState(initialState.settings);
  const [modalState, setModalState] = useState(null);
  const [modalForm, setModalForm] = useState({});
  const [userView, setUserView] = useState({ search: "", role: "all", team: "all", status: "all" });
  const [projectView, setProjectView] = useState({ search: "", team: "all", status: "all" });
  const [taskView, setTaskView] = useState({ tab: "all", search: "", project: "all", priority: "all" });
  const [reportTab, setReportTab] = useState("daily");
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [routeOrder, setRouteOrder] = useState(initialRoute?.order ?? "role-first");
  const [syncState, setSyncState] = useState("synced");
  const [syncError, setSyncError] = useState("");
  const persistTimeoutRef = useRef(null);
  const hasMountedRef = useRef(false);
  const hasShownSyncErrorRef = useRef(false);

  const currentRole = getCurrentRoleProfile(role, users);
  const currentUserId = currentRole.userId;
  const activity = buildUserActivity(users, tasks);
  const myTasks = tasks.filter((task) => task.assignedTo === currentUserId);
  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const openTaskCount = role === "employee" ? myTasks.filter((task) => task.status !== "completed").length : tasks.filter((task) => task.status !== "completed").length;
  const currentNavItems = navItems[role].map((item) => {
    if (item.id === "notifications") {
      return { ...item, badge: unreadCount || undefined };
    }

    if (item.id === "tasks") {
      return { ...item, badge: openTaskCount || undefined };
    }

    return item;
  });

  const currentPageLabel = currentNavItems.find((item) => item.id === page)?.label ?? "Dashboard";
  const reportModel = buildReportModel(reportTab, users, teams, projects, tasks, sessions);
  const currentTeamName = users.find((user) => user.id === currentUserId)?.team ?? teams[0]?.name ?? "Frontend Squad";
  const teamLeadActivity = activity.filter((member) => users.find((user) => user.id === member.userId)?.team === currentTeamName);
  const liveStatusLabel = syncState === "syncing" ? "Syncing" : syncState === "error" ? "Local Only" : "Synced";
  const liveBadgeClassName = `live-badge ${
    syncState === "syncing" ? "live-badge-syncing" : syncState === "error" ? "live-badge-error" : ""
  }`.trim();
  const pulseDotClassName = `pulse-dot ${
    syncState === "syncing" ? "pulse-dot-syncing" : syncState === "error" ? "pulse-dot-error" : ""
  }`.trim();

  useEffect(() => {
    if (!initialRoute) {
      return;
    }

    setRole(initialRoute.role);
    setPage(initialRoute.page);
    setRouteOrder(initialRoute.order ?? "role-first");
  }, [initialRoute?.order, initialRoute?.page, initialRoute?.role]);

  useEffect(() => {
    if (!selectedTeamId && teams.length) {
      setSelectedTeamId(String(teams[0].id));
      return;
    }

    if (selectedTeamId && !teams.some((team) => String(team.id) === String(selectedTeamId))) {
      setSelectedTeamId(teams.length ? String(teams[0].id) : "");
    }
  }, [teams, selectedTeamId]);

  useEffect(() => {
    if (timer.status !== "running") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTimer((currentTimer) => {
        if (currentTimer.status !== "running") {
          return currentTimer;
        }

        return {
          ...currentTimer,
          seconds: currentTimer.seconds + 1,
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timer.status]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return undefined;
    }

    setSyncState("syncing");

    if (persistTimeoutRef.current) {
      window.clearTimeout(persistTimeoutRef.current);
    }

    persistTimeoutRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/task-track", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            users,
            teams,
            projects,
            tasks,
            sessions,
            notifications,
            settings: savedSettings,
          }),
        });

        if (!response.ok) {
          throw new Error("Could not sync updates to MongoDB");
        }

        hasShownSyncErrorRef.current = false;
        setSyncError("");
        setSyncState("synced");
      } catch (error) {
        setSyncState("error");
        setSyncError(error instanceof Error ? error.message : "Could not sync updates to MongoDB");

        if (!hasShownSyncErrorRef.current) {
          pushToast("MongoDB sync failed. Changes remain only in this browser session.", "warning");
          hasShownSyncErrorRef.current = true;
        }
      }
    }, 450);

    return () => {
      if (persistTimeoutRef.current) {
        window.clearTimeout(persistTimeoutRef.current);
      }
    };
  }, [users, teams, projects, tasks, sessions, notifications, savedSettings]);

  function pushToast(message, type = "success") {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((currentToasts) => [...currentToasts, { id, message, type }]);

    window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
    }, 3000);
  }

  function createNotification(text, icon = "ti-bell", iconBg = "#eef0ff", iconColor = "#2563eb") {
    if (!settings.notifyManagers) {
      return;
    }

    setNotifications((currentNotifications) => [
      {
        id: getNextId(currentNotifications),
        icon,
        iconBg,
        iconColor,
        text,
        time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        unread: true,
      },
      ...currentNotifications,
    ]);
  }

  function navigate(nextPage) {
    if (!navItems[role].some((item) => item.id === nextPage)) {
      return;
    }

    startTransition(() => {
      setPage(nextPage);
      router.push(buildTaskTrackPath(role, nextPage, routeOrder));
    });
  }

  function switchRole(nextRole) {
    const allowedPages = navItems[nextRole].map((item) => item.id);
    const nextPage = allowedPages.includes(page) ? page : getDefaultPageForRole(nextRole);

    startTransition(() => {
      setRole(nextRole);
      setPage(nextPage);
      router.push(buildTaskTrackPath(nextRole, nextPage, routeOrder));
    });
  }

  function startTimer(taskOverride) {
    if (!settings.trackTimers) {
      pushToast("Timer tracking is currently disabled in settings", "warning");
      return;
    }

    setTimer((currentTimer) => ({
      ...currentTimer,
      status: "running",
      task: taskOverride?.title ?? currentTimer.task,
      project: taskOverride?.project ?? currentTimer.project,
      seconds: currentTimer.status === "idle" ? 0 : currentTimer.seconds,
    }));
  }

  function startTaskTimer(task) {
    if (!settings.trackTimers) {
      pushToast("Timer tracking is currently disabled in settings", "warning");
      return;
    }

    if (!task) {
      startTimer();
      return;
    }

    setSelectedTaskId(String(task.id));
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
              ...currentTask,
              status: "in-progress",
              progress: currentTask.progress === 0 ? 5 : currentTask.progress,
            }
          : currentTask,
      ),
    );
    setTimer({
      status: "running",
      seconds: 0,
      task: task.title,
      project: task.project,
    });
    pushToast(`Timer started for ${task.title}`, "success");
  }

  function pauseTimer() {
    setTimer((currentTimer) => ({
      ...currentTimer,
      status: "paused",
    }));
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.title === timer.task && task.assignedTo === currentUserId && task.status === "in-progress"
          ? { ...task, status: "paused" }
          : task,
      ),
    );
  }

  function stopTimer() {
    if (settings.requireTaskNotes && settings.allowNotes && !progressNote.trim() && !workNote.trim()) {
      pushToast("Add a short progress note before stopping the timer", "warning");
      return;
    }

    const sessionDuration = formatMinutesShort(timer.seconds / 60);
    const sessionNote = progressNote || workNote || "-";

    setSessions((currentSessions) => [
      {
        task: timer.task,
        project: timer.project,
        start: "Live session",
        end: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        dur: sessionDuration,
        note: sessionNote,
      },
      ...currentSessions,
    ]);
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.title === timer.task && task.assignedTo === currentUserId
          ? {
              ...task,
              time: sessionDuration,
              status: task.progress >= 100 ? "completed" : "pending",
            }
          : task,
      ),
    );
    setTimer((currentTimer) => ({
      ...currentTimer,
      status: "idle",
      seconds: 0,
    }));
    setProgressNote("");
    setWorkNote("");
    pushToast("Session saved successfully", "success");
  }

  function openModal(type, mode = "create", entity = null, prefill = {}) {
    setModalState({ type, mode, entityId: entity?.id ?? null, entity, prefill });
    setModalForm(buildModalForm(type, entity, prefill, teams, users, projects));
  }

  function closeModal() {
    setModalState(null);
    setModalForm({});
  }

  function updateModalField(field, value) {
    setModalForm((currentForm) => {
      const nextForm = {
        ...currentForm,
        [field]: value,
      };

      if (modalState?.type === "user" && field === "role") {
        if (value === "Super Admin") {
          nextForm.team = "All Teams";
        } else if (currentForm.team === "All Teams") {
          nextForm.team = teams[0]?.name ?? "";
        }
      }

      if (modalState?.type === "task" && field === "status" && value === "completed") {
        nextForm.progress = "100";
      }

      return nextForm;
    });
  }

  function handleModalSubmit() {
    if (!modalState) {
      return;
    }

    const { type, mode, entityId, entity } = modalState;

    if (type === "user") {
      const userPayload = {
        name: modalForm.name.trim(),
        email: modalForm.email.trim(),
        role: modalForm.role,
        team: modalForm.role === "Super Admin" ? "All Teams" : modalForm.team,
        status: modalForm.status,
      };

      if (mode === "create") {
        const nextId = getNextId(users);
        const newUser = {
          id: nextId,
          ...userPayload,
          initials: createInitials(userPayload.name),
          avatarClass: AVATAR_CLASSES[nextId % AVATAR_CLASSES.length],
        };

        setUsers((currentUsers) => [...currentUsers, newUser]);
        createNotification(`New user <b>${newUser.name}</b> added to <b>${newUser.team}</b>.`, "ti-user-plus", "#faf5ff", "#7c3aed");
        pushToast("User added successfully", "success");
      } else {
        setUsers((currentUsers) =>
          currentUsers.map((user) =>
            user.id === entityId
              ? {
                  ...user,
                  ...userPayload,
                  initials: createInitials(userPayload.name),
                }
              : user,
          ),
        );
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.assignedTo === entityId
              ? {
                  ...task,
                  assignee: userPayload.name,
                }
              : task,
          ),
        );
        createNotification(`User <b>${userPayload.name}</b> profile updated.`, "ti-user-edit", "#eff6ff", "#2563eb");
        pushToast("User updated successfully", "success");
      }
    }

    if (type === "team") {
      const teamPayload = {
        name: modalForm.name.trim(),
        leadId: modalForm.leadId ? Number(modalForm.leadId) : "",
        targetHours: modalForm.targetHours.trim(),
        description: modalForm.description.trim(),
      };

      if (mode === "create") {
        const newTeam = {
          id: getNextId(teams),
          ...teamPayload,
        };
        setTeams((currentTeams) => [...currentTeams, newTeam]);
        createNotification(`New team <b>${newTeam.name}</b> created.`, "ti-users-plus", "#eef0ff", "#2563eb");
        pushToast("Team created successfully", "success");
      } else {
        setTeams((currentTeams) =>
          currentTeams.map((team) =>
            team.id === entityId
              ? {
                  ...team,
                  ...teamPayload,
                }
              : team,
          ),
        );

        if (entity && entity.name !== teamPayload.name) {
          setUsers((currentUsers) =>
            currentUsers.map((user) =>
              user.team === entity.name
                ? {
                    ...user,
                    team: teamPayload.name,
                  }
                : user,
            ),
          );
          setProjects((currentProjects) =>
            currentProjects.map((project) =>
              project.team === entity.name
                ? {
                    ...project,
                    team: teamPayload.name,
                  }
                : project,
            ),
          );
        }

        createNotification(`Team <b>${teamPayload.name}</b> details updated.`, "ti-users-group", "#f0fdf4", "#16a34a");
        pushToast("Team updated successfully", "success");
      }
    }

    if (type === "project") {
      const projectPayload = {
        name: modalForm.name.trim(),
        team: modalForm.team,
        status: modalForm.status,
        desc: modalForm.desc.trim(),
        hours: modalForm.hours.trim() || "0h 00m",
      };

      if (mode === "create") {
        const newProject = {
          id: getNextId(projects),
          ...projectPayload,
          tasks: 0,
          done: 0,
        };
        setProjects((currentProjects) => [...currentProjects, newProject]);
        createNotification(`Project <b>${newProject.name}</b> created for <b>${newProject.team}</b>.`, "ti-folder-plus", "#eef0ff", "#2563eb");
        pushToast("Project created successfully", "success");
      } else {
        setProjects((currentProjects) =>
          currentProjects.map((project) =>
            project.id === entityId
              ? {
                  ...project,
                  ...projectPayload,
                }
              : project,
          ),
        );
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.projectId === entityId
              ? {
                  ...task,
                  project: projectPayload.name,
                }
              : task,
          ),
        );
        createNotification(`Project <b>${projectPayload.name}</b> updated.`, "ti-folder-open", "#f0fdf4", "#16a34a");
        pushToast("Project updated successfully", "success");
      }
    }

    if (type === "task") {
      const project = projects.find((currentProject) => String(currentProject.id) === String(modalForm.projectId));
      const assignee = users.find((user) => String(user.id) === String(modalForm.assignedTo));
      const normalizedStatus = modalForm.status;
      const normalizedProgress = normalizedStatus === "completed" ? 100 : Math.max(0, Math.min(100, Number(modalForm.progress) || 0));
      const taskPayload = {
        title: modalForm.title.trim(),
        projectId: Number(modalForm.projectId),
        project: project?.name ?? "",
        assignedTo: Number(modalForm.assignedTo),
        assignee: assignee?.name ?? "",
        priority: modalForm.priority,
        status: normalizedStatus,
        progress: normalizedProgress,
        due: modalForm.due.trim(),
        time: modalForm.time.trim() || "0m",
        blocker: modalForm.blocker.trim() || null,
      };

      if (mode === "create") {
        const newTask = {
          id: getNextId(tasks),
          ...taskPayload,
        };
        setTasks((currentTasks) => [...currentTasks, newTask]);
        createNotification(`Task <b>${newTask.title}</b> assigned to <b>${newTask.assignee}</b>.`, "ti-clipboard-list", "#eff6ff", "#2563eb");
        pushToast("Task created successfully", "success");
      } else {
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === entityId
              ? {
                  ...task,
                  ...taskPayload,
                }
              : task,
          ),
        );
        createNotification(`Task <b>${taskPayload.title}</b> updated.`, "ti-edit", "#fffbeb", "#d97706");
        pushToast("Task updated successfully", "success");
      }
    }

    closeModal();
  }

  function handleExport(format) {
    pushToast(`${format} export prepared for the ${statusLabel(reportTab)} report view.`, "success");
  }

  function markAllNotificationsRead() {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        unread: false,
      })),
    );
    pushToast("All notifications marked as read", "success");
  }

  function clearReadNotifications() {
    setNotifications((currentNotifications) => currentNotifications.filter((notification) => notification.unread));
    pushToast("Read notifications cleared", "success");
  }

  function toggleNotificationRead(notification) {
    setNotifications((currentNotifications) =>
      currentNotifications.map((currentNotification) =>
        currentNotification.id === notification.id
          ? {
              ...currentNotification,
              unread: !currentNotification.unread,
            }
          : currentNotification,
      ),
    );
  }

  function deleteNotification(notificationId) {
    setNotifications((currentNotifications) => currentNotifications.filter((notification) => notification.id !== notificationId));
    pushToast("Notification removed", "success");
  }

  function updateSetting(key, value) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
  }

  function toggleSetting(key) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: !currentSettings[key],
    }));
  }

  function saveSettings() {
    setSavedSettings(settings);
    createNotification("System settings were updated by the super admin.", "ti-settings", "#eef0ff", "#2563eb");
    pushToast("Settings saved", "success");
  }

  function resetSettings() {
    setSettings(savedSettings);
    pushToast("Unsaved settings changes were reset", "success");
  }

  function updateUserView(patch) {
    setUserView((currentView) => ({
      ...currentView,
      ...patch,
    }));
  }

  function updateProjectView(patch) {
    setProjectView((currentView) => ({
      ...currentView,
      ...patch,
    }));
  }

  function updateTaskView(patch) {
    setTaskView((currentView) => ({
      ...currentView,
      ...patch,
    }));
  }

  function toggleUserStatus(user) {
    const nextStatus = user.status === "Active" ? "Inactive" : "Active";

    setUsers((currentUsers) =>
      currentUsers.map((currentUser) =>
        currentUser.id === user.id
          ? {
              ...currentUser,
              status: nextStatus,
            }
          : currentUser,
      ),
    );
    createNotification(`User <b>${user.name}</b> is now <b>${nextStatus}</b>.`, "ti-user-circle", "#fffbeb", "#d97706");
    pushToast(`User marked ${nextStatus.toLowerCase()}`, "success");
  }

  function deleteProject(project) {
    if (!window.confirm(`Delete project "${project.name}" and its linked tasks?`)) {
      return;
    }

    setProjects((currentProjects) => currentProjects.filter((currentProject) => currentProject.id !== project.id));
    setTasks((currentTasks) => currentTasks.filter((task) => task.projectId !== project.id));
    createNotification(`Project <b>${project.name}</b> was removed from the system.`, "ti-trash", "#fef2f2", "#dc2626");
    pushToast("Project deleted successfully", "success");
  }

  function deleteTask(task) {
    if (!window.confirm(`Delete task "${task.title}"?`)) {
      return;
    }

    setTasks((currentTasks) => currentTasks.filter((currentTask) => currentTask.id !== task.id));
    createNotification(`Task <b>${task.title}</b> was deleted.`, "ti-trash", "#fef2f2", "#dc2626");
    pushToast("Task deleted successfully", "success");
  }

  function renderPage() {
    switch (page) {
      case "dashboard":
        if (role === "employee") {
          return (
            <EmployeeDashboard
              timer={timer}
              myTasks={myTasks}
              sessions={sessions}
              onNavigate={navigate}
              onStartTimer={() => startTimer()}
              onPauseTimer={pauseTimer}
              onStopTimer={stopTimer}
            />
          );
        }

        if (role === "teamlead") {
          return <TeamLeadDashboard activity={teamLeadActivity} tasks={tasks.filter((task) => users.find((user) => user.id === task.assignedTo)?.team === currentTeamName)} teamName={currentTeamName} />;
        }

        if (role === "superadmin") {
          return <SuperAdminDashboard users={users} teams={teams} projects={projects} tasks={tasks} notifications={notifications} onNavigate={navigate} onOpenModal={openModal} />;
        }

        return <AdminDashboard users={users} projects={projects} tasks={tasks} activity={activity} />;
      case "tasks":
        return (
          <TasksPage
            role={role}
            tasks={role === "employee" ? myTasks : tasks}
            projects={projects}
            users={users}
            taskView={taskView}
            onTaskViewChange={updateTaskView}
            onOpenModal={openModal}
            onStartTaskTimer={startTaskTimer}
            onPauseTimer={pauseTimer}
            onDeleteTask={deleteTask}
          />
        );
      case "time-tracking":
        return (
          <TimeTrackingPage
            timer={timer}
            tasks={tasks}
            sessions={sessions}
            currentUserId={currentUserId}
            notesEnabled={settings.allowNotes}
            notesRequired={settings.requireTaskNotes}
            selectedTaskId={selectedTaskId}
            workNote={workNote}
            progressNote={progressNote}
            onSelectTask={setSelectedTaskId}
            onWorkNoteChange={setWorkNote}
            onProgressNoteChange={setProgressNote}
            onStartTaskTimer={startTaskTimer}
            onStartTimer={() => startTimer()}
            onPauseTimer={pauseTimer}
            onStopTimer={stopTimer}
          />
        );
      case "team":
        return <TeamPage role={role} teams={teams} users={users} projects={projects} tasks={tasks} selectedTeamId={selectedTeamId} onSelectTeam={setSelectedTeamId} onOpenModal={openModal} />;
      case "projects":
        return <ProjectsPage role={role} projects={projects} tasks={tasks} teams={teams} projectView={projectView} onProjectViewChange={updateProjectView} onOpenModal={openModal} onDeleteProject={deleteProject} />;
      case "reports":
        return <ReportsPage reportTab={reportTab} onReportTabChange={setReportTab} reportModel={reportModel} onExport={handleExport} />;
      case "users":
        return <UsersPage users={users} teams={teams} userView={userView} onUserViewChange={updateUserView} onOpenModal={openModal} onToggleUserStatus={toggleUserStatus} />;
      case "notifications":
        return (
          <NotificationsPage
            notifications={notifications}
            notificationFilter={notificationFilter}
            onNotificationFilterChange={setNotificationFilter}
            onMarkAllRead={markAllNotificationsRead}
            onClearRead={clearReadNotifications}
            onToggleNotificationRead={toggleNotificationRead}
            onDeleteNotification={deleteNotification}
          />
        );
      case "settings":
        return (
          <SettingsPage
            settings={settings}
            savedSettings={savedSettings}
            onSettingChange={updateSetting}
            onToggleChange={toggleSetting}
            onSave={saveSettings}
            onReset={resetSettings}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="app-shell">
      <div className="app">
        <nav className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <Icon name="ti-clock-bolt" />
            </div>
            <div>
              <div className="logo-name">TaskTrack</div>
              <div className="logo-ver">V 1.0 - SMALL TEAM</div>
            </div>
          </div>

          <div className="nav-wrap">
            <div className="nav-section-label">Main menu</div>
            {currentNavItems.map((item) => (
              <button key={item.id} type="button" className={`nav-item ${page === item.id ? "active" : ""}`.trim()} onClick={() => navigate(item.id)}>
                <Icon name={item.icon} />
                {item.label}
                {item.badge ? <span className={`nav-badge ${item.id === "tasks" ? "nav-badge-blue" : ""}`.trim()}>{item.badge}</span> : null}
              </button>
            ))}
          </div>

          <div className="sidebar-user">
            <div className="role-user-row">
              <Avatar initials={currentRole.initials} avatarClass={currentRole.avatarClass} size="sm" />
              <div className="role-user-info">
                <div className="role-user-name">{currentRole.name}</div>
                <div className="role-user-title">{currentRole.label}</div>
              </div>
            </div>
            <div className="sidebar-role-label">Preview role</div>
            <div className="role-pills">
              {ROLE_ORDER.map((roleKey) => (
                <button key={roleKey} type="button" className={`role-pill ${role === roleKey ? "active" : ""}`.trim()} onClick={() => switchRole(roleKey)}>
                  {rolesConfig[roleKey].label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="main">
          <header className="topbar">
            <div className="topbar-title">{currentPageLabel}</div>
            <div className="topbar-actions">
              <div className={liveBadgeClassName}>
                <div className={pulseDotClassName} />
                {liveStatusLabel}
              </div>
              <button type="button" className="btn btn-ghost btn-sm topbar-tutorial-btn" onClick={() => router.push("/tutorial")}>
                <Icon name="ti-clipboard-list" />
                Tutorial
              </button>
              <div className="topbar-divider" />
              <button type="button" className="icon-btn notif-dot" onClick={() => navigate("notifications")} title="Notifications">
                <Icon name="ti-bell" />
              </button>
              <button type="button" className="icon-btn" title="Search">
                <Icon name="ti-search" />
              </button>
            </div>
          </header>

          <div className="content">
            {syncError ? (
              <div className="sync-alert">
                MongoDB sync is unavailable right now. The dashboard is still usable locally, but recent changes are not yet persisted.
              </div>
            ) : null}
            {renderPage()}
          </div>
        </div>
      </div>

      <AppModal modalState={modalState} modalForm={modalForm} teams={teams} users={users} projects={projects} onClose={closeModal} onChange={updateModalField} onSubmit={handleModalSubmit} />
      <ToastStack toasts={toasts} />
    </div>
  );
}
