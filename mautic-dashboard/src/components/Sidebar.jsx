import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Folder,
  FileText,
  Send,
  Newspaper,
  ShieldAlert,
  Users,
  BarChart3,
  Mail,
  Tags,
} from "lucide-react";

const mainNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/email-by-category", label: "Email By Category", icon: Folder },
  { to: "/form-submissions", label: "Form Submissions", icon: FileText },
  { to: "/nurture-emails", label: "Nurture Emails", icon: Send },
  { to: "/newsletter-blog", label: "Newsletter & Blog", icon: Newspaper },
  { to: "/deliverability", label: "Deliverability (Bounce/DNC)", icon: ShieldAlert },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

const configNav = [
  { to: "/email-templates", label: "Email Templates", icon: Mail },
  { to: "/tags", label: "Tags Management", icon: Tags },
];

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
          isActive
            ? "bg-accent-blue/15 text-accent-blue font-medium"
            : "text-muted hover:bg-white/5 hover:text-gray-200"
        }`
      }
    >
      <Icon size={17} strokeWidth={2} />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-sidebar border-r border-border h-screen sticky top-0 flex flex-col overflow-y-auto">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-400 via-red-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
          RA
        </div>
        <div>
          <div className="text-sm font-semibold text-white leading-tight">Restaurant</div>
          <div className="text-sm font-semibold text-white leading-tight">Association</div>
        </div>
      </div>

      <div className="px-3 pt-5 flex-1">
        <div className="px-2 text-[11px] tracking-wider text-muted mb-2">MAIN</div>
        <nav className="flex flex-col gap-1">
          {mainNav.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="px-2 text-[11px] tracking-wider text-muted mt-6 mb-2">CONFIGURATION</div>
        <nav className="flex flex-col gap-1">
          {configNav.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
      </div>

      <div className="px-4 py-4 border-t border-border text-xs text-muted">
        Data source: Mautic API
      </div>
    </aside>
  );
}
