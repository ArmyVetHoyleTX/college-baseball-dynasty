export interface ConferenceDefinition {
  id: string;
  name: string;
  shortName: string;
  prestige: number; // 1–100
  autoRpiBonus: number; // RPI schedule strength boost from conference quality
}

export const CONFERENCES: ConferenceDefinition[] = [
  { id: "acc",     name: "Atlantic Coast Conference",     shortName: "ACC",     prestige: 90, autoRpiBonus: 0.08 },
  { id: "sec",     name: "Southeastern Conference",       shortName: "SEC",     prestige: 95, autoRpiBonus: 0.10 },
  { id: "big12",   name: "Big 12 Conference",             shortName: "Big 12",  prestige: 80, autoRpiBonus: 0.06 },
  { id: "pac12",   name: "Pac-12 Conference",             shortName: "Pac-12",  prestige: 78, autoRpiBonus: 0.05 },
  { id: "big10",   name: "Big Ten Conference",            shortName: "Big Ten", prestige: 72, autoRpiBonus: 0.04 },
  { id: "aac",     name: "American Athletic Conference",  shortName: "AAC",     prestige: 68, autoRpiBonus: 0.03 },
  { id: "wcc",     name: "West Coast Conference",         shortName: "WCC",     prestige: 65, autoRpiBonus: 0.03 },
  { id: "conf_usa",name: "Conference USA",                shortName: "C-USA",   prestige: 60, autoRpiBonus: 0.02 },
  { id: "sun_belt",name: "Sun Belt Conference",           shortName: "Sun Belt",prestige: 62, autoRpiBonus: 0.02 },
  { id: "mwc",     name: "Mountain West Conference",      shortName: "MWC",     prestige: 58, autoRpiBonus: 0.01 },
  { id: "mac",     name: "Mid-American Conference",       shortName: "MAC",     prestige: 50, autoRpiBonus: 0.00 },
  { id: "big_east",name: "Big East Conference",           shortName: "Big East",prestige: 48, autoRpiBonus: 0.00 },
  { id: "big_west",name: "Big West Conference",           shortName: "Big West",prestige: 55, autoRpiBonus: 0.01 },
  { id: "socon",   name: "Southern Conference",           shortName: "SoCon",   prestige: 52, autoRpiBonus: 0.00 },
  { id: "ivy",     name: "Ivy League",                    shortName: "Ivy",     prestige: 45, autoRpiBonus: 0.00 },
  { id: "patriot", name: "Patriot League",                shortName: "Patriot", prestige: 40, autoRpiBonus: 0.00 },
  { id: "ovc",     name: "Ohio Valley Conference",        shortName: "OVC",     prestige: 42, autoRpiBonus: 0.00 },
  { id: "swac",    name: "Southwestern Athletic Conference", shortName: "SWAC", prestige: 38, autoRpiBonus: 0.00 },
  { id: "meac",    name: "Mid-Eastern Athletic Conference", shortName: "MEAC",  prestige: 36, autoRpiBonus: 0.00 },
  { id: "maac",    name: "Metro Atlantic Athletic Conference", shortName: "MAAC",prestige: 38, autoRpiBonus: 0.00 },
  { id: "horizonl",name: "Horizon League",                shortName: "Horizon", prestige: 40, autoRpiBonus: 0.00 },
  { id: "america_east", name: "America East Conference",  shortName: "AE",      prestige: 38, autoRpiBonus: 0.00 },
  { id: "wac",     name: "Western Athletic Conference",   shortName: "WAC",     prestige: 44, autoRpiBonus: 0.00 },
  { id: "asun",    name: "ASUN Conference",               shortName: "ASUN",    prestige: 46, autoRpiBonus: 0.00 },
  { id: "mvsun",   name: "Missouri Valley Conference",    shortName: "MVC",     prestige: 44, autoRpiBonus: 0.00 },
  { id: "southland",name: "Southland Conference",         shortName: "SLC",     prestige: 42, autoRpiBonus: 0.00 },
];

export function getConference(id: string): ConferenceDefinition | undefined {
  return CONFERENCES.find((c) => c.id === id);
}
