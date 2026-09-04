import { Palette } from "lucide-react";
import { THEMES, useTheme } from "../context/ThemeContext";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg card text-sm text-gray-300">
      <Palette size={15} />
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="bg-transparent outline-none text-gray-300 cursor-pointer"
      >
        {THEMES.map((t) => (
          <option key={t.id} value={t.id} className="bg-panel text-gray-200">
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
