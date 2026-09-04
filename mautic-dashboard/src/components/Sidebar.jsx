import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Folder,
  FileText,
  Send,
  Newspaper,
  ShieldAlert,
} from "lucide-react";

const mainNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/email-by-category", label: "Email By Category", icon: Folder },
  { to: "/form-submissions", label: "Form Submissions", icon: FileText },
  { to: "/nurture-emails", label: "Nurture Emails", icon: Send },
  { to: "/newsletter-blog", label: "Newsletter & Blog", icon: Newspaper },
  { to: "/deliverability", label: "Deliverability (Bounce/DNC)", icon: ShieldAlert },
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
      <div className="px-5 py-5 flex items-center border-b border-border">
        <img
          src="https://g1.restaurantassociation.com/media/images/RA-Newsletter/May-26/RA-Logo.png"
          alt="Restaurant Association"
          className="max-h-10 w-auto"
        />
      </div>

      <div className="px-3 pt-5 flex-1">
        <div className="px-2 text-[11px] tracking-wider text-muted mb-2">MAIN</div>
        <nav className="flex flex-col gap-1">
          {mainNav.map((item) => (
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
