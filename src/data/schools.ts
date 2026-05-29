import { School, FacilitiesLevel } from "../models/school";

type SchoolTemplate = Omit<School,
  "wins" | "losses" | "conferenceTitles" | "cwsAppearances" | "cwsTitles" |
  "nationalRank" | "recruitingRank" | "hallOfFame" | "isUserControlled" |
  "coaching" | "nilBudget" | "nilSpent" | "scholarshipsUsed"
>;

export const SCHOOL_TEMPLATES: SchoolTemplate[] = [
  // SEC — highest prestige
  { id: "lsu",     name: "Louisiana State University",    shortName: "LSU",    nickname: "Tigers",      conference: "sec",   division: "D1", prestige: 96, facilitiesLevel: 5, primaryColor: "#461D7C", secondaryColor: "#FDD023" },
  { id: "florida", name: "University of Florida",         shortName: "UF",     nickname: "Gators",      conference: "sec",   division: "D1", prestige: 92, facilitiesLevel: 5, primaryColor: "#0021A5", secondaryColor: "#FA4616" },
  { id: "vanderbilt", name: "Vanderbilt University",      shortName: "Vandy",  nickname: "Commodores",  conference: "sec",   division: "D1", prestige: 91, facilitiesLevel: 5, primaryColor: "#866D4B", secondaryColor: "#000000" },
  { id: "texas_am",name: "Texas A&M University",          shortName: "A&M",    nickname: "Aggies",      conference: "sec",   division: "D1", prestige: 90, facilitiesLevel: 5, primaryColor: "#500000", secondaryColor: "#FFFFFF" },
  { id: "arkansas",name: "University of Arkansas",        shortName: "ARK",    nickname: "Razorbacks",  conference: "sec",   division: "D1", prestige: 88, facilitiesLevel: 4, primaryColor: "#9D2235", secondaryColor: "#FFFFFF" },
  { id: "georgia", name: "University of Georgia",         shortName: "UGA",    nickname: "Bulldogs",    conference: "sec",   division: "D1", prestige: 87, facilitiesLevel: 4, primaryColor: "#BA0C2F", secondaryColor: "#000000" },
  { id: "mississippi_st", name: "Mississippi State University", shortName: "MSU", nickname: "Bulldogs", conference: "sec", division: "D1", prestige: 86, facilitiesLevel: 4, primaryColor: "#660000", secondaryColor: "#FFFFFF" },
  { id: "ole_miss",name: "University of Mississippi",     shortName: "Ole Miss",nickname: "Rebels",     conference: "sec",   division: "D1", prestige: 85, facilitiesLevel: 4, primaryColor: "#CE1126", secondaryColor: "#002147" },
  { id: "tennessee",name:"University of Tennessee",       shortName: "TENN",   nickname: "Volunteers",  conference: "sec",   division: "D1", prestige: 84, facilitiesLevel: 4, primaryColor: "#FF8200", secondaryColor: "#FFFFFF" },
  { id: "south_carolina", name: "University of South Carolina", shortName: "USC", nickname: "Gamecocks", conference: "sec", division: "D1", prestige: 86, facilitiesLevel: 4, primaryColor: "#73000A", secondaryColor: "#000000" },
  { id: "alabama", name: "University of Alabama",         shortName: "ALA",    nickname: "Crimson Tide",conference: "sec",   division: "D1", prestige: 80, facilitiesLevel: 4, primaryColor: "#9E1B32", secondaryColor: "#FFFFFF" },
  { id: "auburn",  name: "Auburn University",             shortName: "AUB",    nickname: "Tigers",      conference: "sec",   division: "D1", prestige: 79, facilitiesLevel: 4, primaryColor: "#0C2340", secondaryColor: "#E87722" },
  { id: "kentucky",name: "University of Kentucky",        shortName: "UK",     nickname: "Wildcats",    conference: "sec",   division: "D1", prestige: 76, facilitiesLevel: 3, primaryColor: "#0033A0", secondaryColor: "#FFFFFF" },
  { id: "missouri",name: "University of Missouri",        shortName: "MIZ",    nickname: "Tigers",      conference: "sec",   division: "D1", prestige: 74, facilitiesLevel: 3, primaryColor: "#F1B82D", secondaryColor: "#000000" },

  // ACC
  { id: "north_carolina", name: "University of North Carolina", shortName: "UNC", nickname: "Tar Heels", conference: "acc", division: "D1", prestige: 93, facilitiesLevel: 5, primaryColor: "#56A0D3", secondaryColor: "#FFFFFF" },
  { id: "clemson",name: "Clemson University",             shortName: "CU",     nickname: "Tigers",      conference: "acc",   division: "D1", prestige: 90, facilitiesLevel: 5, primaryColor: "#522D80", secondaryColor: "#F66733" },
  { id: "virginia",name:"University of Virginia",         shortName: "UVA",    nickname: "Cavaliers",   conference: "acc",   division: "D1", prestige: 88, facilitiesLevel: 4, primaryColor: "#232D4B", secondaryColor: "#E57200" },
  { id: "nc_state",name:"North Carolina State University",shortName: "NCSU",   nickname: "Wolfpack",    conference: "acc",   division: "D1", prestige: 85, facilitiesLevel: 4, primaryColor: "#CC0000", secondaryColor: "#FFFFFF" },
  { id: "georgia_tech", name: "Georgia Institute of Technology", shortName: "GT", nickname: "Yellow Jackets", conference: "acc", division: "D1", prestige: 84, facilitiesLevel: 4, primaryColor: "#003057", secondaryColor: "#B3A369" },
  { id: "miami_fl",name: "University of Miami",           shortName: "UM",     nickname: "Hurricanes",  conference: "acc",   division: "D1", prestige: 89, facilitiesLevel: 5, primaryColor: "#005030", secondaryColor: "#F47321" },
  { id: "fsu",     name: "Florida State University",      shortName: "FSU",    nickname: "Seminoles",   conference: "acc",   division: "D1", prestige: 88, facilitiesLevel: 4, primaryColor: "#782F40", secondaryColor: "#CEB888" },
  { id: "duke",    name: "Duke University",               shortName: "DUKE",   nickname: "Blue Devils",  conference: "acc",  division: "D1", prestige: 80, facilitiesLevel: 4, primaryColor: "#012169", secondaryColor: "#FFFFFF" },
  { id: "wake_forest", name: "Wake Forest University",   shortName: "WFU",    nickname: "Demon Deacons",conference: "acc",   division: "D1", prestige: 76, facilitiesLevel: 3, primaryColor: "#9E7E38", secondaryColor: "#000000" },
  { id: "virginia_tech", name: "Virginia Tech",          shortName: "VT",     nickname: "Hokies",      conference: "acc",   division: "D1", prestige: 75, facilitiesLevel: 3, primaryColor: "#861F41", secondaryColor: "#CF4420" },
  { id: "notre_dame", name: "University of Notre Dame",  shortName: "ND",     nickname: "Fighting Irish",conference: "acc",  division: "D1", prestige: 78, facilitiesLevel: 4, primaryColor: "#0C2340", secondaryColor: "#C99700" },
  { id: "boston_college", name: "Boston College",        shortName: "BC",     nickname: "Eagles",      conference: "acc",   division: "D1", prestige: 68, facilitiesLevel: 3, primaryColor: "#98002E", secondaryColor: "#BC9B6A" },
  { id: "pittsburgh", name: "University of Pittsburgh",  shortName: "PITT",   nickname: "Panthers",    conference: "acc",   division: "D1", prestige: 65, facilitiesLevel: 3, primaryColor: "#003594", secondaryColor: "#FFB81C" },
  { id: "louisville", name: "University of Louisville",  shortName: "UofL",   nickname: "Cardinals",   conference: "acc",   division: "D1", prestige: 83, facilitiesLevel: 4, primaryColor: "#AD0000", secondaryColor: "#000000" },
  { id: "syracuse",name: "Syracuse University",          shortName: "SYR",    nickname: "Orange",      conference: "acc",   division: "D1", prestige: 62, facilitiesLevel: 3, primaryColor: "#D44500", secondaryColor: "#000E54" },

  // Big 12
  { id: "texas",   name: "University of Texas",           shortName: "UT",     nickname: "Longhorns",   conference: "big12", division: "D1", prestige: 94, facilitiesLevel: 5, primaryColor: "#BF5700", secondaryColor: "#FFFFFF" },
  { id: "oklahoma",name: "University of Oklahoma",        shortName: "OU",     nickname: "Sooners",     conference: "big12", division: "D1", prestige: 87, facilitiesLevel: 4, primaryColor: "#841617", secondaryColor: "#FDF9D8" },
  { id: "tcu",     name: "Texas Christian University",    shortName: "TCU",    nickname: "Horned Frogs",conference: "big12", division: "D1", prestige: 89, facilitiesLevel: 4, primaryColor: "#4D1979", secondaryColor: "#A3A9AC" },
  { id: "oklahoma_st", name: "Oklahoma State University", shortName: "OSU",    nickname: "Cowboys",     conference: "big12", division: "D1", prestige: 84, facilitiesLevel: 4, primaryColor: "#FF6600", secondaryColor: "#000000" },
  { id: "baylor",  name: "Baylor University",             shortName: "BAY",    nickname: "Bears",       conference: "big12", division: "D1", prestige: 82, facilitiesLevel: 4, primaryColor: "#003015", secondaryColor: "#FFB81C" },
  { id: "west_virginia", name: "West Virginia University",shortName: "WVU",   nickname: "Mountaineers", conference: "big12",division: "D1", prestige: 70, facilitiesLevel: 3, primaryColor: "#002855", secondaryColor: "#EAAA00" },
  { id: "kansas",  name: "University of Kansas",          shortName: "KU",     nickname: "Jayhawks",    conference: "big12", division: "D1", prestige: 64, facilitiesLevel: 3, primaryColor: "#0051A5", secondaryColor: "#E8000D" },
  { id: "iowa_st", name: "Iowa State University",         shortName: "ISU",    nickname: "Cyclones",    conference: "big12", division: "D1", prestige: 66, facilitiesLevel: 3, primaryColor: "#C8102E", secondaryColor: "#F1BE48" },
  { id: "kansas_st", name: "Kansas State University",     shortName: "KSU",    nickname: "Wildcats",    conference: "big12", division: "D1", prestige: 65, facilitiesLevel: 3, primaryColor: "#512888", secondaryColor: "#FFFFFF" },
  { id: "texas_tech", name: "Texas Tech University",      shortName: "TTU",    nickname: "Red Raiders",  conference: "big12",division: "D1", prestige: 80, facilitiesLevel: 4, primaryColor: "#CC0000", secondaryColor: "#000000" },

  // Pac-12
  { id: "oregon_st", name: "Oregon State University",     shortName: "OSU",    nickname: "Beavers",     conference: "pac12", division: "D1", prestige: 90, facilitiesLevel: 4, primaryColor: "#DC4405", secondaryColor: "#000000" },
  { id: "arizona",name: "University of Arizona",          shortName: "UA",     nickname: "Wildcats",    conference: "pac12", division: "D1", prestige: 85, facilitiesLevel: 4, primaryColor: "#CC0033", secondaryColor: "#003366" },
  { id: "usc",     name: "University of Southern California", shortName: "USC", nickname: "Trojans",   conference: "pac12", division: "D1", prestige: 84, facilitiesLevel: 4, primaryColor: "#990000", secondaryColor: "#FFC72C" },
  { id: "stanford",name: "Stanford University",           shortName: "STAN",   nickname: "Cardinal",    conference: "pac12", division: "D1", prestige: 88, facilitiesLevel: 4, primaryColor: "#8C1515", secondaryColor: "#FFFFFF" },
  { id: "ucla",    name: "University of California, Los Angeles", shortName: "UCLA", nickname: "Bruins", conference: "pac12", division: "D1", prestige: 82, facilitiesLevel: 4, primaryColor: "#2D68C4", secondaryColor: "#F2A900" },
  { id: "cal",     name: "University of California, Berkeley", shortName: "CAL", nickname: "Golden Bears", conference: "pac12", division: "D1", prestige: 75, facilitiesLevel: 3, primaryColor: "#003262", secondaryColor: "#FDB515" },
  { id: "washington", name: "University of Washington",   shortName: "UW",     nickname: "Huskies",     conference: "pac12", division: "D1", prestige: 74, facilitiesLevel: 3, primaryColor: "#4B2E83", secondaryColor: "#B7A57A" },
  { id: "arizona_st", name: "Arizona State University",   shortName: "ASU",    nickname: "Sun Devils",  conference: "pac12", division: "D1", prestige: 78, facilitiesLevel: 3, primaryColor: "#8C1D40", secondaryColor: "#FFC627" },
  { id: "utah",    name: "University of Utah",            shortName: "UTAH",   nickname: "Utes",        conference: "pac12", division: "D1", prestige: 68, facilitiesLevel: 3, primaryColor: "#CC0000", secondaryColor: "#808080" },
  { id: "oregon",  name: "University of Oregon",          shortName: "ORE",    nickname: "Ducks",       conference: "pac12", division: "D1", prestige: 70, facilitiesLevel: 3, primaryColor: "#154733", secondaryColor: "#FEE123" },

  // Big Ten
  { id: "michigan", name: "University of Michigan",       shortName: "MICH",   nickname: "Wolverines",  conference: "big10", division: "D1", prestige: 78, facilitiesLevel: 4, primaryColor: "#00274C", secondaryColor: "#FFCB05" },
  { id: "ohio_st", name: "The Ohio State University",     shortName: "tOSU",   nickname: "Buckeyes",    conference: "big10", division: "D1", prestige: 80, facilitiesLevel: 4, primaryColor: "#BB0000", secondaryColor: "#666666" },
  { id: "indiana", name: "Indiana University",            shortName: "IU",     nickname: "Hoosiers",    conference: "big10", division: "D1", prestige: 74, facilitiesLevel: 3, primaryColor: "#990000", secondaryColor: "#CCCCCC" },
  { id: "maryland",name: "University of Maryland",        shortName: "UMD",    nickname: "Terrapins",   conference: "big10", division: "D1", prestige: 72, facilitiesLevel: 3, primaryColor: "#E03A3E", secondaryColor: "#FFD520" },
  { id: "rutgers", name: "Rutgers University",            shortName: "RU",     nickname: "Scarlet Knights", conference: "big10", division: "D1", prestige: 64, facilitiesLevel: 3, primaryColor: "#CC0033", secondaryColor: "#FFFFFF" },
  { id: "nebraska",name: "University of Nebraska",        shortName: "NEB",    nickname: "Cornhuskers", conference: "big10", division: "D1", prestige: 70, facilitiesLevel: 3, primaryColor: "#E41C38", secondaryColor: "#FFFFFF" },
  { id: "minnesota", name: "University of Minnesota",     shortName: "MINN",   nickname: "Golden Gophers", conference: "big10", division: "D1", prestige: 68, facilitiesLevel: 3, primaryColor: "#7A0019", secondaryColor: "#FFCC33" },

  // AAC / C-USA / Sun Belt
  { id: "dallas_baptist", name: "Dallas Baptist University", shortName: "DBU", nickname: "Patriots",  conference: "conf_usa", division: "D1", prestige: 82, facilitiesLevel: 4, primaryColor: "#CC0000", secondaryColor: "#FFFFFF" },
  { id: "rice",    name: "Rice University",               shortName: "RICE",   nickname: "Owls",        conference: "conf_usa", division: "D1", prestige: 75, facilitiesLevel: 3, primaryColor: "#002469", secondaryColor: "#C1A875" },
  { id: "la_tech", name: "Louisiana Tech University",     shortName: "LATech", nickname: "Bulldogs",    conference: "conf_usa", division: "D1", prestige: 68, facilitiesLevel: 3, primaryColor: "#002F6C", secondaryColor: "#E31837" },
  { id: "southern_miss", name: "University of Southern Mississippi", shortName: "USM", nickname: "Golden Eagles", conference: "conf_usa", division: "D1", prestige: 67, facilitiesLevel: 3, primaryColor: "#FFD046", secondaryColor: "#000000" },
  { id: "old_dominion", name: "Old Dominion University",  shortName: "ODU",    nickname: "Monarchs",    conference: "conf_usa", division: "D1", prestige: 60, facilitiesLevel: 2, primaryColor: "#003057", secondaryColor: "#A4D2E3" },

  // Louisiana schools
  { id: "louisiana", name: "University of Louisiana at Lafayette", shortName: "ULL", nickname: "Ragin' Cajuns", conference: "sun_belt", division: "D1", prestige: 78, facilitiesLevel: 4, primaryColor: "#CE181E", secondaryColor: "#0A0203" },
  { id: "southern_louisiana", name: "Southeastern Louisiana University", shortName: "SLU", nickname: "Lions", conference: "southland", division: "D1", prestige: 55, facilitiesLevel: 2, primaryColor: "#006341", secondaryColor: "#C8A96E" },

  // WCC
  { id: "gonzaga", name: "Gonzaga University",            shortName: "GU",     nickname: "Bulldogs",    conference: "wcc",   division: "D1", prestige: 58, facilitiesLevel: 2, primaryColor: "#002663", secondaryColor: "#C8102E" },
  { id: "saint_marys", name: "Saint Mary's College",      shortName: "SMC",    nickname: "Gaels",       conference: "wcc",   division: "D1", prestige: 54, facilitiesLevel: 2, primaryColor: "#002060", secondaryColor: "#BA0C2F" },
  { id: "pepperdine", name: "Pepperdine University",      shortName: "PEPP",   nickname: "Waves",       conference: "wcc",   division: "D1", prestige: 62, facilitiesLevel: 3, primaryColor: "#00205B", secondaryColor: "#E56020" },

  // Additional notable programs
  { id: "cal_state_fullerton", name: "Cal State Fullerton", shortName: "CSUF", nickname: "Titans",     conference: "big_west", division: "D1", prestige: 80, facilitiesLevel: 3, primaryColor: "#00274C", secondaryColor: "#FF8200" },
  { id: "long_beach_st", name: "Long Beach State",         shortName: "LBSU",   nickname: "Beach",       conference: "big_west", division: "D1", prestige: 72, facilitiesLevel: 3, primaryColor: "#00508F", secondaryColor: "#F7D000" },
  { id: "uc_santa_barbara", name: "UC Santa Barbara",     shortName: "UCSB",   nickname: "Gauchos",     conference: "big_west", division: "D1", prestige: 65, facilitiesLevel: 2, primaryColor: "#003660", secondaryColor: "#FFBC00" },
  { id: "fresno_st", name: "Fresno State",                 shortName: "FRES",   nickname: "Bulldogs",    conference: "mwc",   division: "D1", prestige: 70, facilitiesLevel: 3, primaryColor: "#CC0000", secondaryColor: "#002469" },
  { id: "san_diego_st", name: "San Diego State University",shortName: "SDSU",   nickname: "Aztecs",      conference: "mwc",   division: "D1", prestige: 65, facilitiesLevel: 3, primaryColor: "#A6192E", secondaryColor: "#000000" },

  // Fun lower-prestige programs to grow
  { id: "campbell",  name: "Campbell University",         shortName: "CAM",    nickname: "Camels",      conference: "big_east",division: "D1", prestige: 55, facilitiesLevel: 2, primaryColor: "#F36F21", secondaryColor: "#000000" },
  { id: "mercer",    name: "Mercer University",           shortName: "MER",    nickname: "Bears",       conference: "socon",  division: "D1", prestige: 50, facilitiesLevel: 2, primaryColor: "#F47920", secondaryColor: "#231F20" },
  { id: "winthrop",  name: "Winthrop University",         shortName: "WIN",    nickname: "Eagles",      conference: "big_east",division: "D1", prestige: 48, facilitiesLevel: 2, primaryColor: "#872434", secondaryColor: "#C7A600" },
  { id: "kennesaw_st", name: "Kennesaw State University", shortName: "KSU",    nickname: "Owls",        conference: "asun",  division: "D1", prestige: 46, facilitiesLevel: 1, primaryColor: "#FFCB05", secondaryColor: "#000000" },
  { id: "stetson",   name: "Stetson University",          shortName: "STET",   nickname: "Hatters",     conference: "asun",  division: "D1", prestige: 52, facilitiesLevel: 2, primaryColor: "#006747", secondaryColor: "#CBA135" },
];

export function getSchoolTemplate(id: string): SchoolTemplate | undefined {
  return SCHOOL_TEMPLATES.find((s) => s.id === id);
}

export function getSchoolsByConference(conferenceId: string): SchoolTemplate[] {
  return SCHOOL_TEMPLATES.filter((s) => s.conference === conferenceId);
}
