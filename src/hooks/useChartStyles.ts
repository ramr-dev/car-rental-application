export function useChartStyles() {
  if (typeof window === "undefined") {
    return {
      grid: "#e2e8f0",
      axis: "#94a3b8",
      tooltip: {
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        fontSize: 13,
      },
    };
  }
  const cs = getComputedStyle(document.documentElement);
  const border = cs.getPropertyValue("--border").trim();
  const muted = cs.getPropertyValue("--muted-foreground").trim();
  const card = cs.getPropertyValue("--card").trim();
  return {
    grid: `oklch(${border})`,
    axis: `oklch(${muted})`,
    tooltip: {
      background: `oklch(${card})`,
      border: `1px solid oklch(${border})`,
      borderRadius: 12,
      fontSize: 13,
    },
  };
}
