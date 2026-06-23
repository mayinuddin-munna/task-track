export function renderTaskTrackIcon(name) {
  switch (name) {
    case "ti-alert-circle":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </>
      );
    case "ti-alert-triangle":
      return (
        <>
          <path d="M12 4 20 19H4z" />
          <path d="M12 9v4" />
          <path d="M12 16h.01" />
        </>
      );
    case "ti-bell":
      return (
        <>
          <path d="M9.5 18h5" />
          <path d="M8 10a4 4 0 1 1 8 0v5l2 2H6l2-2z" />
        </>
      );
    case "ti-calendar-day":
      return (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M4 10h16" />
          <rect x="10" y="13" width="4" height="4" rx="1" />
        </>
      );
    case "ti-calendar-week":
      return (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M4 10h16" />
          <path d="M8 14h8" />
          <path d="M8 17h5" />
        </>
      );
    case "ti-calendar-month":
      return (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M4 10h16" />
          <path d="M8 14h2" />
          <path d="M12 14h2" />
          <path d="M16 14h.01" />
          <path d="M8 17h2" />
          <path d="M12 17h2" />
          <path d="M16 17h.01" />
        </>
      );
    case "ti-chart-line":
      return (
        <>
          <path d="M4 19h16" />
          <path d="M6 15 10 11l3 3 5-6" />
          <path d="M18 8h-4" />
        </>
      );
    case "ti-chart-bar":
      return (
        <>
          <path d="M4 19h16" />
          <rect x="6" y="11" width="3" height="8" rx="1" />
          <rect x="11" y="8" width="3" height="11" rx="1" />
          <rect x="16" y="5" width="3" height="14" rx="1" />
        </>
      );
    case "ti-check":
      return <path d="m5 12 4 4 10-10" />;
    case "ti-checkbox":
      return (
        <>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="m8 12 3 3 5-6" />
        </>
      );
    case "ti-circle-check":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12 2.5 2.5 4.5-5" />
        </>
      );
    case "ti-clipboard-list":
      return (
        <>
          <rect x="6" y="5" width="12" height="15" rx="2" />
          <path d="M9 5.5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5" />
          <path d="M9 10h6" />
          <path d="M9 13h6" />
          <path d="M9 16h4" />
        </>
      );
    case "ti-clipboard-plus":
      return (
        <>
          <rect x="6" y="5" width="12" height="15" rx="2" />
          <path d="M9 5.5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5" />
          <path d="M12 11v6" />
          <path d="M9 14h6" />
        </>
      );
    case "ti-clock":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      );
    case "ti-clock-bolt":
      return (
        <>
          <circle cx="11" cy="12" r="8" />
          <path d="M11 8v4l2 1.5" />
          <path d="m16 6 2-1-1 3h2l-3 5 1-4h-2z" />
        </>
      );
    case "ti-clock-play":
      return (
        <>
          <circle cx="11" cy="12" r="8" />
          <path d="M11 8v4l2 1.5" />
          <path d="m17 10 4 2-4 2z" />
        </>
      );
    case "ti-download":
      return (
        <>
          <path d="M12 4v10" />
          <path d="m8 10 4 4 4-4" />
          <path d="M5 19h14" />
        </>
      );
    case "ti-edit":
      return (
        <>
          <path d="m4 20 4.5-1 9-9-3.5-3.5-9 9z" />
          <path d="m13.5 6.5 3.5 3.5" />
        </>
      );
    case "ti-file-spreadsheet":
      return (
        <>
          <path d="M8 3h6l4 4v14H8z" />
          <path d="M14 3v4h4" />
          <path d="M10 11h6" />
          <path d="M10 15h6" />
          <path d="M12 11v8" />
        </>
      );
    case "ti-file-type-pdf":
      return (
        <>
          <path d="M8 3h6l4 4v14H8z" />
          <path d="M14 3v4h4" />
          <path d="M10 14h1.5a1.5 1.5 0 1 0 0-3H10v6" />
          <path d="M14 11v6h1.5a1.5 1.5 0 0 0 0-3H14" />
        </>
      );
    case "ti-folder-open":
      return (
        <>
          <path d="M3 8h6l2 2h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M3 8V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v2" />
        </>
      );
    case "ti-folder-plus":
      return (
        <>
          <path d="M3 8h6l2 2h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M3 8V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v2" />
          <path d="M12 12v5" />
          <path d="M9.5 14.5h5" />
        </>
      );
    case "ti-layout-dashboard":
      return (
        <>
          <rect x="3" y="4" width="7" height="7" rx="1" />
          <rect x="14" y="4" width="7" height="5" rx="1" />
          <rect x="14" y="11" width="7" height="9" rx="1" />
          <rect x="3" y="13" width="7" height="7" rx="1" />
        </>
      );
    case "ti-player-pause":
      return (
        <>
          <rect x="7" y="6" width="3" height="12" rx="1" />
          <rect x="14" y="6" width="3" height="12" rx="1" />
        </>
      );
    case "ti-player-play":
      return <path d="m8 6 10 6-10 6z" />;
    case "ti-player-stop":
      return <rect x="7" y="7" width="10" height="10" rx="1.5" />;
    case "ti-plus":
      return (
        <>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </>
      );
    case "ti-search":
      return (
        <>
          <circle cx="11" cy="11" r="6" />
          <path d="m20 20-4.2-4.2" />
        </>
      );
    case "ti-settings":
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2.5" />
          <path d="M12 18.5V21" />
          <path d="m4.9 4.9 1.8 1.8" />
          <path d="m17.3 17.3 1.8 1.8" />
          <path d="M3 12h2.5" />
          <path d="M18.5 12H21" />
          <path d="m4.9 19.1 1.8-1.8" />
          <path d="m17.3 6.7 1.8-1.8" />
        </>
      );
    case "ti-shield":
      return (
        <>
          <path d="M12 3 6 5v5c0 4 2.5 7.5 6 9 3.5-1.5 6-5 6-9V5z" />
          <path d="m9.5 12 1.5 1.5 3.5-4" />
        </>
      );
    case "ti-trash":
      return (
        <>
          <path d="M5 7h14" />
          <path d="M9 7V5h6v2" />
          <path d="M8 7v12" />
          <path d="M16 7v12" />
          <path d="M6 7l1 13h10l1-13" />
          <path d="M11 10v7" />
          <path d="M13 10v7" />
        </>
      );
    case "ti-trophy":
      return (
        <>
          <path d="M8 4h8v3a4 4 0 0 1-8 0z" />
          <path d="M8 5H5a2 2 0 0 0 0 4h3" />
          <path d="M16 5h3a2 2 0 0 1 0 4h-3" />
          <path d="M12 11v4" />
          <path d="M9 20h6" />
          <path d="M10 15h4v3h-4z" />
        </>
      );
    case "ti-user-check":
      return (
        <>
          <circle cx="10" cy="8" r="3" />
          <path d="M4.5 19a5.5 5.5 0 0 1 11 0" />
          <path d="m16 11 2 2 3-3" />
        </>
      );
    case "ti-user-circle":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="10" r="3" />
          <path d="M7 18a5 5 0 0 1 10 0" />
        </>
      );
    case "ti-user-edit":
      return (
        <>
          <circle cx="9.5" cy="8" r="3" />
          <path d="M4 19a5.5 5.5 0 0 1 11 0" />
          <path d="m15 15 4-4 2 2-4 4-3 1z" />
        </>
      );
    case "ti-user-minus":
      return (
        <>
          <circle cx="10" cy="8" r="3" />
          <path d="M4.5 19a5.5 5.5 0 0 1 11 0" />
          <path d="M16 12h5" />
        </>
      );
    case "ti-user-plus":
      return (
        <>
          <circle cx="10" cy="8" r="3" />
          <path d="M4.5 19a5.5 5.5 0 0 1 11 0" />
          <path d="M18.5 10v6" />
          <path d="M15.5 13h6" />
        </>
      );
    case "ti-users":
      return (
        <>
          <circle cx="9" cy="9" r="3" />
          <circle cx="16.5" cy="10" r="2.5" />
          <path d="M4 19a5 5 0 0 1 10 0" />
          <path d="M14 19a4 4 0 0 1 6 0" />
        </>
      );
    case "ti-users-group":
      return (
        <>
          <circle cx="8" cy="9" r="2.5" />
          <circle cx="16" cy="9" r="2.5" />
          <circle cx="12" cy="7" r="2.5" />
          <path d="M3.5 18a4.5 4.5 0 0 1 9 0" />
          <path d="M11.5 18a4.5 4.5 0 0 1 9 0" />
        </>
      );
    case "ti-users-plus":
      return (
        <>
          <circle cx="8" cy="9" r="2.5" />
          <circle cx="14" cy="9" r="2.5" />
          <path d="M3.5 18a4.5 4.5 0 0 1 9 0" />
          <path d="M10 18a4.5 4.5 0 0 1 7 0" />
          <path d="M19 8v6" />
          <path d="M16 11h6" />
        </>
      );
    default:
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9h6v6H9z" />
        </>
      );
  }
}
