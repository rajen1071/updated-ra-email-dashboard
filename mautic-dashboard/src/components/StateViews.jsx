import { AlertTriangle, Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading data from Mautic..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-muted gap-3">
      <Loader2 className="animate-spin" size={26} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3 max-w-lg mx-auto">
      <AlertTriangle className="text-accent-red" size={26} />
      <div className="text-sm text-gray-300">Couldn't load this data from Mautic.</div>
      <div className="text-xs text-muted font-mono bg-panel border border-border rounded-lg px-3 py-2">
        {message}
      </div>
      <div className="text-xs text-muted">
        Check that MAUTIC_BASE_URL, MAUTIC_CLIENT_ID and MAUTIC_CLIENT_SECRET are set correctly
        in your environment variables.
      </div>
    </div>
  );
}
