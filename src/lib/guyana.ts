// Guyana's 10 administrative regions, for the taxi "service area" picker.
export const GUYANA_REGIONS: string[] = [
  "Region 1 - Barima-Waini",
  "Region 2 - Pomeroon-Supenaam",
  "Region 3 - Essequibo Islands-West Demerara",
  "Region 4 - Demerara-Mahaica",
  "Region 5 - Mahaica-Berbice",
  "Region 6 - East Berbice-Corentyne",
  "Region 7 - Cuyuni-Mazaruni",
  "Region 8 - Potaro-Siparuni",
  "Region 9 - Upper Takutu-Upper Essequibo",
  "Region 10 - Upper Demerara-Berbice",
];

export const OTHER_REGION_VALUE = "__other__";

// Rough town/village → administrative-region lookup, used to filter the
// browse feed to the region a buyer picks in the header. Listings only
// store a free-text location (e.g. "Linden"), not a region, so this is how
// "Region 10" is matched up with the towns that fall in it. A location we
// don't recognize here just won't match any region filter.
export const REGION_TOWNS: Record<string, string[]> = {
  "Region 1": ["Mabaruma", "Port Kaituma", "Moruca", "Kumaka", "Matthews Ridge"],
  "Region 2": ["Anna Regina", "Charity", "Suddie", "Adventure", "Queenstown"],
  "Region 3": [
    "Vreed-en-Hoop",
    "Vreed en Hoop",
    "Parika",
    "Leguan",
    "Wakenaam",
    "Uitvlugt",
    "Klein Pouderoyen",
    "Patentia",
  ],
  "Region 4": [
    "Georgetown",
    "Diamond",
    "Mahaica",
    "Timehri",
    "Buxton",
    "Kitty",
    "Providence",
    "Eccles",
    "Agricola",
    "Soesdyke",
  ],
  "Region 5": ["Mahaicony", "Rosignol", "Fort Wellington", "Bath Settlement", "Blairmont"],
  "Region 6": ["New Amsterdam", "Corriverton", "Skeldon", "Fyrish", "Rose Hall", "Port Mourant", "Springlands"],
  "Region 7": ["Bartica", "Kamarang", "Issano", "Kartabo"],
  "Region 8": ["Mahdia", "Kato", "Paramakatoi", "Monkey Mountain"],
  "Region 9": ["Lethem", "Annai", "Aishalton", "Sand Creek"],
  "Region 10": ["Linden", "Wismar", "Mackenzie", "Ituni", "Kwakwani"],
};
