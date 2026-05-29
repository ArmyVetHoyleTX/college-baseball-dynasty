// Batting average: .312
export function fmtAvg(h: number, ab: number): string {
  if (ab === 0) return ".---";
  const avg = h / ab;
  return "." + Math.round(avg * 1000).toString().padStart(3, "0");
}

// ERA: 3.45
export function fmtEra(er: number, ipThirds: number): string {
  if (ipThirds === 0) return "-.-";
  const ip = ipThirds / 3;
  const era = (er / ip) * 9;
  return era.toFixed(2);
}

// OBP: .412
export function fmtObp(h: number, bb: number, hbp: number, pa: number): string {
  if (pa === 0) return ".---";
  const obp = (h + bb + hbp) / pa;
  return "." + Math.round(obp * 1000).toString().padStart(3, "0");
}

// Innings pitched: 47.1 (47 and one third)
export function fmtIp(ipThirds: number): string {
  const full = Math.floor(ipThirds / 3);
  const rem = ipThirds % 3;
  return rem === 0 ? `${full}.0` : `${full}.${rem}`;
}

// WHIP
export function fmtWhip(h: number, bb: number, ipThirds: number): string {
  if (ipThirds === 0) return "-.--";
  const ip = ipThirds / 3;
  return ((h + bb) / ip).toFixed(2);
}

// FIP
export function fmtFip(hr: number, bb: number, hbp: number, k: number, ipThirds: number): string {
  if (ipThirds === 0) return "-.--";
  const ip = ipThirds / 3;
  const fip = (13 * hr + 3 * (bb + hbp) - 2 * k) / ip + 3.1;
  return fip.toFixed(2);
}

// Win-Loss record: "28-14"
export function fmtRecord(wins: number, losses: number): string {
  return `${wins}-${losses}`;
}

// Prestige to letter grade
export function prestigeGrade(prestige: number): string {
  if (prestige >= 90) return "A+";
  if (prestige >= 80) return "A";
  if (prestige >= 70) return "B+";
  if (prestige >= 60) return "B";
  if (prestige >= 50) return "C+";
  if (prestige >= 40) return "C";
  if (prestige >= 30) return "D";
  return "F";
}

// Rating to letter grade (for display)
export function ratingGrade(rating: number): string {
  if (rating >= 90) return "A";
  if (rating >= 80) return "B+";
  if (rating >= 70) return "B";
  if (rating >= 60) return "C+";
  if (rating >= 50) return "C";
  if (rating >= 40) return "D+";
  if (rating >= 30) return "D";
  return "F";
}

// Star emoji strings
export function starString(stars: number): string {
  return "★".repeat(stars) + "☆".repeat(5 - stars);
}

// Ordinal suffix
export function ordinal(n: number): string {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// NIL value formatting
export function fmtNil(valueK: number): string {
  if (valueK >= 1000) return `$${(valueK / 1000).toFixed(1)}M`;
  return `$${valueK}K`;
}
