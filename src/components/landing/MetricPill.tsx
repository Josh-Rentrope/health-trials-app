interface MetricPillProps {
  value: string; // e.g., ">40,000"
  label: string; // e.g., "Patients searching monthly"
}

export const MetricPill = ({ value, label }: MetricPillProps) => {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-primary sm:text-4xl">{value}</p>
      <p className="mt-1 text-sm leading-tight text-muted-foreground">{label}</p>
    </div>
  );
};