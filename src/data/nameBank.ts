export const FIRST_NAMES_MALE = [
  "Jake","Tyler","Chase","Drew","Cole","Austin","Blake","Bryce","Hunter","Mason",
  "Logan","Ryan","Connor","Dylan","Ethan","Lucas","Noah","Owen","Liam","Carter",
  "Jackson","Caleb","Aiden","Nolan","Brady","Grant","Reid","Tanner","Colt","Bo",
  "Garrett","Trey","Cade","Zach","Josh","Kyle","Sean","Wes","Travis","Brett",
  "Clay","Wade","Beau","Jace","Cruz","Marco","Luis","Jose","Miguel","Carlos",
  "Diego","Jorge","Andres","Ricky","Eduardo","Hector","Felix","Raul","Juan","Tony",
  "Marcus","Darius","DeShawn","Malik","Jordan","Derrick","Jaylen","Tre","Dre","Cam",
  "Spencer","Eli","Henry","Charlie","Will","Sam","Max","Alex","Zane","Ryder",
  "Finn","Declan","Ian","Aaron","Nathan","Adam","Braden","Jared","Kevin","Scott",
  "Preston","Holden","Easton","Paxton","Sutton","Camden","Hudson","Hayden","Brendan","Shane",
];

export const LAST_NAMES = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Taylor",
  "Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Young","Walker","Hall",
  "Allen","King","Wright","Lopez","Scott","Green","Adams","Baker","Nelson","Carter",
  "Mitchell","Perez","Roberts","Turner","Phillips","Campbell","Parker","Evans","Edwards","Collins",
  "Stewart","Morris","Rogers","Reed","Cook","Morgan","Bell","Murphy","Bailey","Cooper",
  "Richardson","Cox","Howard","Ward","Torres","Peterson","Gray","Ramirez","James","Watson",
  "Brooks","Kelly","Sanders","Price","Bennett","Wood","Barnes","Ross","Henderson","Coleman",
  "Jenkins","Perry","Powell","Long","Patterson","Hughes","Flores","Washington","Butler","Simmons",
  "Foster","Gonzalez","Bryant","Alexander","Russell","Griffin","Diaz","Hayes","Myers","Ford",
  "Hamilton","Graham","Sullivan","Wallace","Woods","Cole","West","Jordan","Owens","Reynolds",
  "Fisher","Ellis","Harrison","Gibson","McDonald","Cruz","Marshall","Ortiz","Gomez","Murray",
  "Freeman","Wells","Webb","Simpson","Stevens","Tucker","Porter","Hunter","Hicks","Crawford",
  "Henry","Boyd","Mason","Morales","Kennedy","Warren","Dixon","Ramos","Reyes","Burns",
  "Gordon","Shaw","Holmes","Rice","Robertson","Henderson","Patterson","Cunningham","Arnold","Hanson",
];

export const STATES = [
  "TX","FL","CA","GA","NC","SC","LA","TN","AL","MS",
  "OH","MI","PA","NY","IL","VA","AZ","CO","WA","OR",
  "MO","AR","KY","IN","NJ","MD","OK","NM","NV","UT",
  "MN","WI","IA","KS","NE","CT","MA","ME","NH","VT",
  "HI","AK","ID","MT","WY","ND","SD","DE","RI","WV",
];

export function randomName(seed?: number): string {
  const r = () => (seed !== undefined ? lcg(seed++) : Math.random());
  const fn = FIRST_NAMES_MALE[Math.floor(r() * FIRST_NAMES_MALE.length)];
  const ln = LAST_NAMES[Math.floor(r() * LAST_NAMES.length)];
  return `${fn} ${ln}`;
}

// Simple LCG for seeded deterministic generation
function lcg(seed: number): number {
  return ((seed * 1664525 + 1013904223) & 0xffffffff) / 0xffffffff;
}
