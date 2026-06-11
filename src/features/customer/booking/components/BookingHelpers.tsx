export function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-card px-4 py-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <span className="flex-1 text-sm font-medium">{value}</span>
    </div>
  );
}

export function PriceRow({
  label,
  amount,
  muted,
  negative,
}: {
  label: string;
  amount: number;
  muted?: boolean;
  negative?: boolean;
}) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted-foreground" : negative ? "text-success" : ""}`}>
      <span>{label}</span>
      <span className={muted || negative ? "" : "font-medium"}>
        {negative ? "-" : ""}${amount.toLocaleString()}
      </span>
    </div>
  );
}

export function ConfirmationInfoBlock({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${highlight ? "text-success" : ""}`}>{value}</p>
    </div>
  );
}
