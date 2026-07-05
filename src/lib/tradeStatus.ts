export function getStatusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (s === "WIN") return "bg-green-500";
  if (s === "LOSS") return "bg-red-500";
  if (s === "PENDING") return "bg-zinc-400";
  if (s === "BREAK_EVEN") return "bg-zinc-500";
  if (s === "CANCELED") return "bg-zinc-600";
  return "bg-zinc-500";
}

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export function getPositionBadgeClass(position: string): string {
  const p = position.toUpperCase();
  if (p === "LONG") return "bg-zinc-700";
  if (p === "SHORT") return "bg-zinc-500";
  return "bg-zinc-600";
}
