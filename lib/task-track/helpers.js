import {
  DEFAULT_SETTINGS,
  PROJECT_STATUS_OPTIONS,
  REPORT_TABS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  TEAM_DESCRIPTIONS,
  USER_STATUS_OPTIONS,
} from "./constants";

export function formatTimer(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function formatMinutesToClock(totalMinutes) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

export function formatMinutesShort(totalMinutes) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (!hours) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function formatHoursCompact(totalMinutes) {
  return `${(Math.max(0, totalMinutes) / 60).toFixed(1)}h`;
}

export function parseDurationToMinutes(value) {
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

export function createInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function statusLabel(status) {
  if (!status) {
    return "";
  }

  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function shortName(name) {
  return name.split(" ")[0];
}

export function getRingOffset(seconds) {
  return 440 - 440 * Math.min((seconds % 3600) / 3600, 1);
}

export function getNextId(items) {
  return items.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1;
}

export function getStatusPill(status) {
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

export function getPriorityPill(priority) {
  return `pill-${priority}`;
}

export function getProgressTone(value) {
  if (value === 100) {
    return "prog-fill-green";
  }

  if (value < 30) {
    return "prog-fill-amber";
  }

  return "";
}

export function buildInitialTeams(users, projects) {
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

export function getCurrentRoleProfile(role, users, rolesConfig) {
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

export function summarizeProject(project, tasks) {
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

export function summarizeTeam(team, users, projects, tasks) {
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

export function buildUserActivity(users, tasks) {
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

export function buildReportModel(reportTab, users, teams, projects, tasks, sessions) {
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
      leftBars: userRows.map((row) => ({ label: shortName(row.label), minutes: row.minutes })),
      rightTitle: "Hours by Project - Today",
      rightBars: projectRows.map((row) => ({ label: row.label, minutes: row.minutes })),
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
      leftBars: teamRows.map((row) => ({ label: row.label, minutes: row.minutes || row.completed * 45 })),
      rightTitle: "Projects Closed This Week",
      rightBars: projectRows.map((row) => ({ label: row.label, minutes: row.completed * 60 })),
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
      leftBars: projectRows.map((row) => ({ label: row.label, minutes: row.minutes * 2 || row.completed * 80 })),
      rightTitle: "Hours by Team - This Month",
      rightBars: teamRows.map((row) => ({ label: row.label, minutes: row.minutes * 2 || row.completed * 70 })),
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
      leftBars: projectRows.map((row) => ({ label: row.label, minutes: row.minutes })),
      rightTitle: "Project Completion",
      rightBars: projectRows.map((row) => ({ label: row.label, minutes: row.completed * 60 })),
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
      leftBars: userRows.map((row) => ({ label: shortName(row.label), minutes: row.minutes })),
      rightTitle: "Employee Completion",
      rightBars: userRows.map((row) => ({ label: shortName(row.label), minutes: row.completed * 60 })),
      tableTitle: "Employee Breakdown",
      rows: userRows,
    },
  };

  return models[reportTab];
}

export function buildModalForm(type, entity, prefill, teams, users, projects) {
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

export {
  DEFAULT_SETTINGS,
  PROJECT_STATUS_OPTIONS,
  REPORT_TABS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  USER_STATUS_OPTIONS,
};
