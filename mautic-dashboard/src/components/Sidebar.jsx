import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Folder,
  FileText,
  Send,
  Newspaper,
  ShieldAlert,
  MailX,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const mainNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/email-by-category", label: "Email By Category", icon: Folder },
  { to: "/form-submissions", label: "Form Submissions", icon: FileText },
  { to: "/nurture-emails", label: "Nurture Emails", icon: Send },
  { to: "/newsletter-blog", label: "Newsletter & Blog", icon: Newspaper },
  { to: "/deliverability", label: "Deliverability (Bounced/DNC)", icon: ShieldAlert },
  { to: "/bounced-contacts", label: "Bounced Contacts", icon: MailX },
];

const STORAGE_KEY = "sidebar-collapsed";

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function NavItem({ to, label, icon: Icon, collapsed }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 py-2.5 rounded-lg text-sm transition-colors ${
          collapsed ? "justify-center px-0" : "px-3"
        } ${
          isActive
            ? "bg-brand/15 text-brand font-medium"
            : "text-muted hover:bg-white/5 hover:text-gray-200"
        }`
      }
    >
      <Icon size={17} strokeWidth={2} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

export default function Sidebar() {
  // Collapsed = icon-only rail. Remembered per browser.
  const [collapsed, setCollapsed] = useState(readCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // Storage unavailable (e.g. private mode) — just don't remember it.
    }
  }, [collapsed]);

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-64"
      } shrink-0 bg-sidebar border-r border-border h-screen sticky top-0 flex flex-col overflow-y-auto overflow-x-hidden transition-[width] duration-200`}
    >
      <div
        className={`py-5 flex items-center border-b border-border ${
          collapsed ? "justify-center px-2" : "justify-between gap-2 px-5"
        }`}
      >
        {!collapsed && (
          <img
            src="https://g1.restaurantassociation.com/media/images/RA-Newsletter/May-26/RA-Logo.png"
            alt="Restaurant Association"
            className="max-h-10 w-auto min-w-0"
          />
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 rounded-lg text-muted hover:bg-white/5 hover:text-gray-200 shrink-0"
          title={collapsed ? "Show menu" : "Hide menu"}
          aria-label={collapsed ? "Show menu" : "Hide menu"}
          aria-expanded={!collapsed}
        >
          <ToggleIcon size={18} />
        </button>
      </div>

      <div className={`pt-5 flex-1 ${collapsed ? "px-2" : "px-3"}`}>
        {!collapsed && <div className="px-2 text-[11px] tracking-wider text-muted mb-2">MAIN</div>}
        <nav className="flex flex-col gap-1">
          {mainNav.map((item) => (
            <NavItem key={item.to} {...item} collapsed={collapsed} />
          ))}
        </nav>
      </div>

      {!collapsed && (
        <div className="px-4 py-4 border-t border-border text-xs text-muted">
          Data source: Mautic API
        </div>
      )}
    </aside>
  );
}
