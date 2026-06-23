import Link from "next/link";

export const metadata = {
  title: "TaskTrack Tutorial",
  description: "Role-based use case tutorial for the TaskTrack application.",
};

const quickLinks = [
  { href: "/employee/dashboard", label: "Employee Dashboard" },
  { href: "/team-lead/dashboard", label: "Team Lead Dashboard" },
  { href: "/admin/dashboard", label: "Admin Dashboard" },
  { href: "/super-admin/dashboard", label: "Super Admin Dashboard" },
];

const workflowCards = [
  {
    title: "Employee Daily Flow",
    audience: "Best for delivery members and individual contributors",
    steps: [
      "Open /employee/dashboard to review your work summary, active timer, and recent sessions.",
      "Go to /employee/tasks and review your assigned work by status and priority.",
      "Use /employee/time-tracking to select a task and start a live timer.",
      "Add work notes or progress notes before stopping when note rules are enabled.",
      "Check /employee/notifications for assignments, reminders, and task updates.",
    ],
  },
  {
    title: "Team Lead Review Flow",
    audience: "Best for squad leads and delivery coordinators",
    steps: [
      "Visit /team-lead/dashboard to monitor live team activity and delivery balance.",
      "Open /team-lead/tasks to review pending, in-progress, paused, and completed work.",
      "Use /team-lead/team to inspect team members, target hours, and workload health.",
      "Go to /team-lead/projects to follow project completion and ownership.",
      "Use /team-lead/reports for daily, weekly, monthly, project, and employee views.",
    ],
  },
  {
    title: "Admin Operations Flow",
    audience: "Best for operations admins and delivery managers",
    steps: [
      "Start at /admin/dashboard for the cross-team operational overview.",
      "Use /admin/users to maintain user details and status.",
      "Manage project definitions and delivery structure from /admin/projects.",
      "Open /admin/tasks when you need system-wide task visibility and action.",
      "Use /admin/reports to export delivery snapshots for internal stakeholders.",
    ],
  },
  {
    title: "Super Admin Control Flow",
    audience: "Best for workspace owners and platform administrators",
    steps: [
      "Open /super-admin/dashboard to monitor the full workspace from one screen.",
      "Manage users, teams, projects, and tasks from the dedicated super admin sections.",
      "Use /super-admin/reports for the broadest reporting view across the system.",
      "Open /super-admin/settings to control timers, notes policy, and report defaults.",
      "Review /super-admin/notifications to confirm major system changes and alerts.",
    ],
  },
];

const scenarios = [
  {
    title: "Create and assign a task",
    points: [
      "Open the admin or super admin tasks screen.",
      "Create a new task with project, assignee, priority, due date, and current status.",
      "Save it to place the task in the assignee workflow and trigger a notification.",
    ],
  },
  {
    title: "Track a live work session",
    points: [
      "Switch to the employee role and open time tracking.",
      "Select the active task, start the timer, and pause or stop when work is complete.",
      "The session log and task time update automatically after save.",
    ],
  },
  {
    title: "Review blocked or overdue work",
    points: [
      "Use the tasks screen to inspect blockers, progress, status, and priority.",
      "Open notifications to catch overdue warnings and assignment changes quickly.",
      "Edit, reassign, or update status based on what the team needs next.",
    ],
  },
  {
    title: "Update system policy",
    points: [
      "Open the super admin settings page.",
      "Change timer behavior, notes requirements, timezone, or reporting cadence.",
      "Save the changes to persist them to the MongoDB-backed app state.",
    ],
  },
];

export default function TutorialPage() {
  return (
    <main className="tutorial-page">
      <section className="tutorial-hero">
        <div className="tutorial-hero-copy">
          <div className="tutorial-kicker">Application Tutorial</div>
          <h1 className="tutorial-title">TaskTrack use case guide for every role in the workspace</h1>
          <p className="tutorial-lead">
            This tutorial walks through the real day-to-day use of TaskTrack for employees,
            team leads, admins, and super admins, including where to go and what to do.
          </p>
          <div className="tutorial-hero-actions">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="btn btn-primary btn-sm">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="tutorial-hero-panel card">
          <div className="card-header">
            <div>
              <div className="card-title">Quick Start</div>
              <div className="card-sub">Open the right part of the app faster</div>
            </div>
          </div>
          <div className="card-body tutorial-quickstart">
            <div className="tutorial-stat">
              <span className="tutorial-stat-label">Default Landing</span>
              <span className="tutorial-stat-value">/employee/dashboard</span>
            </div>
            <div className="tutorial-stat">
              <span className="tutorial-stat-label">Alternative Pattern</span>
              <span className="tutorial-stat-value">/dashboard/employee</span>
            </div>
            <div className="tutorial-stat">
              <span className="tutorial-stat-label">Main Sections</span>
              <span className="tutorial-stat-value">Dashboard, Tasks, Projects, Reports, Settings, Notifications</span>
            </div>
          </div>
        </div>
      </section>

      <section className="tutorial-section">
        <div className="tutorial-section-head">
          <h2>Role-Based Workflows</h2>
          <p>Use the flow that matches the responsibility of the person using the platform.</p>
        </div>
        <div className="tutorial-grid">
          {workflowCards.map((card) => (
            <article key={card.title} className="card tutorial-card">
              <div className="card-header">
                <div>
                  <div className="card-title">{card.title}</div>
                  <div className="card-sub">{card.audience}</div>
                </div>
              </div>
              <div className="card-body">
                <ol className="tutorial-list">
                  {card.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="tutorial-section">
        <div className="tutorial-section-head">
          <h2>Common Use Cases</h2>
          <p>These are the most repeated workflows across the application.</p>
        </div>
        <div className="tutorial-grid tutorial-grid-2">
          {scenarios.map((scenario) => (
            <article key={scenario.title} className="card tutorial-card">
              <div className="card-header">
                <div className="card-title">{scenario.title}</div>
              </div>
              <div className="card-body">
                <ul className="tutorial-bullets">
                  {scenario.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="tutorial-section">
        <div className="tutorial-section-head">
          <h2>Route Reference</h2>
          <p>Both URL styles work for the same destination screen.</p>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="tutorial-route-table">
              <div className="tutorial-route-row tutorial-route-head">
                <span>Role-first</span>
                <span>Page-first</span>
              </div>
              <div className="tutorial-route-row">
                <span>/employee/dashboard</span>
                <span>/dashboard/employee</span>
              </div>
              <div className="tutorial-route-row">
                <span>/team-lead/reports</span>
                <span>/reports/team-lead</span>
              </div>
              <div className="tutorial-route-row">
                <span>/admin/projects</span>
                <span>/projects/admin</span>
              </div>
              <div className="tutorial-route-row">
                <span>/super-admin/settings</span>
                <span>/settings/super-admin</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
