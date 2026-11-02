const sourceLoadModes = {};
let asmeSearchTimer = null;
const DATA_PATHS = ["source_information/", "../source_information/"];
    const state = { pipes: {}, flanges: {}, wps: {}, compounds: [], engineering: { materials: [], boltMaterials: [], boltSizes: [] }, asmeTable1A: { temperatureColumnsC: [], rows: [] } };
    const standardNps = ["1/8","1/4","3/8","1/2","3/4","1","1.25","1.5","2","2.5","3","3.5","4","5","6","8","10","12","14","16","18","20","22","24","26","28","30","32","34","36","38","40","42","44","46","48"];
    const npsToDn = {
      "1/8": 6, "1/4": 8, "3/8": 10, "1/2": 15, "3/4": 20, "1": 25, "1.25": 32, "1.5": 40,
      "2": 50, "2.5": 65, "3": 80, "3.5": 90, "4": 100, "5": 125, "6": 150, "8": 200,
      "10": 250, "12": 300, "14": 350, "16": 400, "18": 450, "20": 500, "22": 550, "24": 600,
      "26": 650, "28": 700, "30": 750, "32": 800, "34": 850, "36": 900, "38": 950, "40": 1000,
      "42": 1050, "44": 1100, "46": 1150, "48": 1200
    };
    const npsOdFallbackMm = {
      "26": 660.4, "28": 711.2, "30": 762.0, "32": 812.8, "34": 863.6, "36": 914.4,
      "38": 965.2, "40": 1016.0, "42": 1066.8, "44": 1117.6, "46": 1168.4, "48": 1219.2
    };
    const elbowDimensions90 = {
      "1/2": { long: 38, short: null }, "3/4": { long: 38, short: null }, "1": { long: 38, short: 25 },
      "1.25": { long: 48, short: 32 }, "1.5": { long: 57, short: 38 }, "2": { long: 76, short: 51 },
      "2.5": { long: 95, short: 64 }, "3": { long: 114, short: 76 }, "3.5": { long: 133, short: 89 },
      "4": { long: 152, short: 102 }, "5": { long: 190, short: 127 }, "6": { long: 229, short: 152 },
      "8": { long: 305, short: 203 }, "10": { long: 381, short: 254 }, "12": { long: 457, short: 305 },
      "14": { long: 533, short: 356 }, "16": { long: 610, short: 406 }, "18": { long: 686, short: 457 },
      "20": { long: 762, short: 508 }, "22": { long: 838, short: 559 }, "24": { long: 914, short: 610 },
      "26": { long: 991, short: 660 }, "28": { long: 1067, short: 711 }, "30": { long: 1143, short: 762 },
      "32": { long: 1219, short: 813 }, "34": { long: 1295, short: 864 }, "36": { long: 1372, short: 914 },
      "38": { long: 1448, short: 965 }, "40": { long: 1524, short: 1016 }, "42": { long: 1600, short: 1067 },
      "44": { long: 1676, short: 1118 }, "46": { long: 1753, short: 1168 }, "48": { long: 1829, short: 1219 }
    };
    const titles = {
      compoundCalculator: ["Compound", "Calculate geometry volume directly, then select and compare compounds for quantities and service limits."],
      materialGuideLookup: ["Material Guide by Temperature", "Display material guide values for a selected design temperature range in degrees Celsius."],
      asmeTable1A: ["ASME Table 1A", "Search and filter ASME BPVC II - Part D Table 1A allowable stress values for ferrous materials."],
      pipeScheduleLookup: ["Pipe Schedule", "Look up outside diameter and schedule wall thickness by NPS."],
      elbowDimensions: ["90° Elbows", "Look up 90 degree long-radius and short-radius elbow center-to-end dimensions up to NPS 48."],
      ansiFlanges: ["ANSI Flanges", "Look up ANSI B16.5 weld neck and slip-on flange dimensions."],
      sans347Hazard: ["SANS 347 Hazard Category", "Screen piping and volume hazard categories using pressure, fluid group, line size and volume."],
      weldingProcedure: ["WPS Library", "Review welding procedure variables from the source information."],
      unitConverter: ["Unit Converter", "Convert length, volume, pressure, and calculate simple volumes."],
      nonCircularCalc: ["Non-Circular", "Check a rectangular endplate and a supplied shell thickness requirement."],
      circularCalc: ["Circular", "Check internal-pressure shell and endplate thickness for the workbook geometry."],
      boltStandaloneCalc: ["Bolt Standalone", "Check pressure load per bolt and compare torque estimates."],
      boltNutReference: ["Bolt and Nut Table", "Look up Appendix H - PCC 1 - Table H-1 bolting and nut dimensions by nominal bolt size."]
    };

    const boltNutTable = [
      { size: "M5", rootArea: "13,9", boltOD: "5", wFlats: "", bwCorner: "", pitch: "", thk: "", tensileArea: "" },
      { size: "M6", rootArea: "18,9", boltOD: "6", wFlats: "", bwCorner: "", pitch: "", thk: "", tensileArea: "" },
      { size: "M8", rootArea: "30,9", boltOD: "8", wFlats: "13", bwCorner: "14,2", pitch: "1,25", thk: "8", tensileArea: "36,6" },
      { size: "M10", rootArea: "49,5", boltOD: "10", wFlats: "17", bwCorner: "19,6", pitch: "1,5", thk: "10", tensileArea: "58" },
      { size: "M12", rootArea: "72", boltOD: "12", wFlats: "19", bwCorner: "21,9", pitch: "1,75", thk: "12", tensileArea: "84" },
      { size: "M14", rootArea: "100", boltOD: "14", wFlats: "22", bwCorner: "25,4", pitch: "2", thk: "14", tensileArea: "115" },
      { size: "M16", rootArea: "138", boltOD: "16", wFlats: "24", bwCorner: "27,7", pitch: "2", thk: "16", tensileArea: "157" },
      { size: "M18", rootArea: "168", boltOD: "18", wFlats: "27", bwCorner: "31,2", pitch: "2,5", thk: "18", tensileArea: "192" },
      { size: "M20", rootArea: "217", boltOD: "20", wFlats: "30", bwCorner: "34,6", pitch: "2,5", thk: "20", tensileArea: "245" },
      { size: "M22", rootArea: "272", boltOD: "22", wFlats: "32", bwCorner: "36,9", pitch: "2,5", thk: "22", tensileArea: "303" },
      { size: "M24", rootArea: "313", boltOD: "24", wFlats: "36", bwCorner: "41,6", pitch: "3", thk: "24", tensileArea: "353" },
      { size: "M27", rootArea: "414", boltOD: "27", wFlats: "41", bwCorner: "47,2", pitch: "3", thk: "27", tensileArea: "459" },
      { size: "M30", rootArea: "503", boltOD: "30", wFlats: "46", bwCorner: "53,1", pitch: "3,5", thk: "30", tensileArea: "561" },
      { size: "M33", rootArea: "629", boltOD: "33", wFlats: "50", bwCorner: "57,8", pitch: "3,5", thk: "33", tensileArea: "694" },
      { size: "M36", rootArea: "738", boltOD: "36", wFlats: "55", bwCorner: "63,6", pitch: "4", thk: "36", tensileArea: "817" },
      { size: "M39", rootArea: "890", boltOD: "39", wFlats: "60", bwCorner: "69,3", pitch: "4", thk: "39", tensileArea: "976" },
      { size: "M42", rootArea: "1018", boltOD: "42", wFlats: "65", bwCorner: "75", pitch: "4,5", thk: "42", tensileArea: "1121" },
      { size: "M45", rootArea: "1195", boltOD: "45", wFlats: "70", bwCorner: "80,9", pitch: "4,5", thk: "45", tensileArea: "1306" },
      { size: "M48", rootArea: "1343", boltOD: "48", wFlats: "75", bwCorner: "86,7", pitch: "5", thk: "48", tensileArea: "1473" },
      { size: "M52", rootArea: "1615", boltOD: "52", wFlats: "80", bwCorner: "92,4", pitch: "5", thk: "52", tensileArea: "1758" },
      { size: "M56", rootArea: "1863", boltOD: "56", wFlats: "85", bwCorner: "98,2", pitch: "5,5", thk: "56", tensileArea: "2030" },
      { size: "M60", rootArea: "N/A", boltOD: "", wFlats: "90", bwCorner: "105", pitch: "5,5", thk: "60", tensileArea: "N/A" },
      { size: "M64", rootArea: "2467", boltOD: "64", wFlats: "95", bwCorner: "110", pitch: "6", thk: "64", tensileArea: "2676" },
      { size: "M68", rootArea: "N/A", boltOD: "", wFlats: "100", bwCorner: "116", pitch: "6", thk: "68", tensileArea: "N/A" },
      { size: "M70", rootArea: "N/A", boltOD: "70", wFlats: "", bwCorner: "", pitch: "", thk: "70", tensileArea: "N/A" },
      { size: "M72", rootArea: "3222", boltOD: "72", wFlats: "105", bwCorner: "121", pitch: "6", thk: "72", tensileArea: "3460" },
      { size: "M76", rootArea: "3969", boltOD: "76", wFlats: "110", bwCorner: "127", pitch: "6", thk: "76", tensileArea: "N/A" },
      { size: "M80", rootArea: "4077", boltOD: "", wFlats: "115", bwCorner: "133", pitch: "6", thk: "80", tensileArea: "4344" },
      { size: "M82", rootArea: "N/A", boltOD: "82", wFlats: "", bwCorner: "", pitch: "", thk: "82", tensileArea: "N/A" },
      { size: "M85", rootArea: "N/A", boltOD: "", wFlats: "120", bwCorner: "138", pitch: "6", thk: "85", tensileArea: "N/A" },
      { size: "M90", rootArea: "5287", boltOD: "90", wFlats: "130", bwCorner: "150", pitch: "6", thk: "90", tensileArea: "5591" },
      { size: "M95", rootArea: "N/A", boltOD: "95", wFlats: "135", bwCorner: "155", pitch: "6", thk: "95", tensileArea: "N/A" },
      { size: "M100", rootArea: "6652", boltOD: "100", wFlats: "145", bwCorner: "167", pitch: "6", thk: "100", tensileArea: "6995" },
      { size: "1/2", rootArea: "81", boltOD: "12,7", wFlats: "22,23", bwCorner: "25,65", pitch: "1,954", thk: "12,8", tensileArea: "92" },
      { size: "5/8", rootArea: "130", boltOD: "15,88", wFlats: "26,99", bwCorner: "31,17", pitch: "2,309", thk: "16,03", tensileArea: "146" },
      { size: "3/4", rootArea: "195", boltOD: "19,05", wFlats: "31,75", bwCorner: "36,65", pitch: "2,54", thk: "19,25", tensileArea: "215" },
      { size: "7/8", rootArea: "271", boltOD: "22,23", wFlats: "36,53", bwCorner: "42,16", pitch: "2,822", thk: "22,48", tensileArea: "298" },
      { size: "1", rootArea: "356", boltOD: "25,4", wFlats: "41,28", bwCorner: "47,65", pitch: "3,175", thk: "25,71", tensileArea: "391" },
      { size: "1-1/8", rootArea: "470", boltOD: "28,58", wFlats: "46,03", bwCorner: "53,16", pitch: "3,175", thk: "28,93", tensileArea: "510" },
      { size: "1-1/4", rootArea: "599", boltOD: "31,75", wFlats: "50,8", bwCorner: "58,65", pitch: "3,175", thk: "31,78", tensileArea: "645" },
      { size: "1-3/8", rootArea: "745", boltOD: "34,93", wFlats: "55,58", bwCorner: "64,16", pitch: "3,175", thk: "35", tensileArea: "795" },
      { size: "1-1/2", rootArea: "907", boltOD: "38,1", wFlats: "60,33", bwCorner: "69,65", pitch: "3,175", thk: "38,23", tensileArea: "963" },
      { size: "1-5/8", rootArea: "1084", boltOD: "41,28", wFlats: "65,08", bwCorner: "75,16", pitch: "3,175", thk: "41,45", tensileArea: "1148" },
      { size: "1-3/4", rootArea: "1277", boltOD: "44,45", wFlats: "69,85", bwCorner: "80,65", pitch: "3,175", thk: "44,68", tensileArea: "1342" },
      { size: "1-7/8", rootArea: "1486", boltOD: "47,63", wFlats: "74,63", bwCorner: "86,16", pitch: "3,175", thk: "47,9", tensileArea: "1555" },
      { size: "2", rootArea: "1711", boltOD: "50,8", wFlats: "79,38", bwCorner: "91,64", pitch: "3,175", thk: "51,13", tensileArea: "1787" },
      { size: "2-1/4", rootArea: "2208", boltOD: "57,15", wFlats: "88,9", bwCorner: "102,64", pitch: "3,175", thk: "57,18", tensileArea: "2297" },
      { size: "2-1/2", rootArea: "2769", boltOD: "63,5", wFlats: "98,43", bwCorner: "113,64", pitch: "3,175", thk: "63,63", tensileArea: "2865" },
      { size: "2-3/4", rootArea: "3393", boltOD: "69,85", wFlats: "107,95", bwCorner: "124,64", pitch: "3,175", thk: "70,08", tensileArea: "3503" },
      { size: "3", rootArea: "4080", boltOD: "76,2", wFlats: "117,48", bwCorner: "135,64", pitch: "3,175", thk: "76,53", tensileArea: "4200" },
      { size: "3-1/4", rootArea: "4831", boltOD: "82,55", wFlats: "127", bwCorner: "146,66", pitch: "3,175", thk: "82,6", tensileArea: "4961" },
      { size: "3-1/2", rootArea: "5645", boltOD: "88,9", wFlats: "136,53", bwCorner: "157,66", pitch: "3,175", thk: "89,05", tensileArea: "5781" },
      { size: "3-3/4", rootArea: "6522", boltOD: "95,25", wFlats: "146,05", bwCorner: "168,66", pitch: "3,175", thk: "95,5", tensileArea: "6671" },
      { size: "4", rootArea: "7462", boltOD: "101,6", wFlats: "155,58", bwCorner: "179,65", pitch: "3,175", thk: "101,96", tensileArea: "7619" }
    ];

    const fmt = (value, digits = 2) => Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
    const fmtComma = (value, digits = 1) => fmt(value, digits).replace(".", ",");
    const fToC = value => (value - 32) * 5 / 9;
    const cToF = value => value * 9 / 5 + 32;
    const byId = id => document.getElementById(id);
    const num = numericInputValue;
    const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    const APP_VERSION = "v2.1.0";
    const SOURCE_DATA_VERSION = "2026.11.02";
    const THEME_KEY = "beruapp-theme";
    const UNIT_KEY = "beruapp-unit-mode";
    let unitMode = "mixed";
    const materialGuideRows = [
      { band: "Cryogenic", range: "-425 to -321", min: -425, max: -321, material: "Stainless steel", plate: "SA-240-304, 304L, 347, 316, 316L", pipe: "SA-312-304, 304L, 347, 316, 316L", forgings: "SA-182-304, 304L, 347, 316, 316L", fittings: "SA-403-304, 304L, 347, 316, 316L", bolting: "SA-320-B8 with SA-194-8" },
      { band: "Cryogenic", range: "-320 to -151", min: -320, max: -151, material: "9 nickel", plate: "SA-353", pipe: "SA-333-8", forgings: "SA-522-1", fittings: "SA-420-WPL8", bolting: "SA-320-B8 with SA-194-8" },
      { band: "Low temperature", range: "-150 to -76", min: -150, max: -76, material: "3-1/2 nickel", plate: "SA-203-D", pipe: "SA-333-3", forgings: "SA-350-LF3", fittings: "SA-420-WPL3", bolting: "SA-320-L7 with SA-194-4" },
      { band: "Low temperature", range: "-75 to -51", min: -75, max: -51, material: "2-1/2 nickel", plate: "SA-203-A", pipe: "SA-333-3", forgings: "SA-350-LF3", fittings: "SA-420-WPL3", bolting: "SA-320-L7 with SA-194-4" },
      { band: "Low temperature", range: "-50 to -21", min: -50, max: -21, material: "Carbon steel", plate: "SA-516-55, 60 to SA-20", pipe: "SA-333-6", forgings: "SA-350-LF2", fittings: "SA-420-WPL6", bolting: "SA-320-L7 with SA-194-4" },
      { band: "Low temperature", range: "-20 to 4", min: -20, max: 4, material: "Carbon steel", plate: "SA-516-All", pipe: "SA-333-1 or 6", forgings: "SA-350-LF2", fittings: "SA-420-WPL6", bolting: "" },
      { band: "Low temperature", range: "5 to 32", min: 5, max: 32, material: "Carbon steel", plate: "SA-285-C", pipe: "", forgings: "", fittings: "", bolting: "" },
      { band: "Intermediate", range: "33 to 60 / 61 to 775", min: 33, max: 775, material: "Carbon steel", plate: "SA-516-All; SA-515-All; SA-455-II", pipe: "SA-53-B; SA-106-B", forgings: "SA-105; SA-181-60,70", fittings: "SA-234-WPB", bolting: "SA-193-B7 with SA-194-2H" },
      { band: "Elevated temperature", range: "776 to 875", min: 776, max: 875, material: "C-1/2Mo", plate: "SA-204-B", pipe: "SA-335-P1", forgings: "SA-182-F1", fittings: "SA-234-WP1", bolting: "SA-193-B7 with SA-194-2H" },
      { band: "Elevated temperature", range: "876 to 1000", min: 876, max: 1000, material: "1Cr-1/2Mo", plate: "SA-387-12-1", pipe: "SA-335-P12", forgings: "SA-182-F12", fittings: "SA-234-WP12", bolting: "SA-193-B7 with SA-194-2H" },
      { band: "Elevated temperature", range: "876 to 1000", min: 876, max: 1000, material: "1-1/4Cr-1/2Mo", plate: "SA-387-11-2", pipe: "SA-335-P11", forgings: "SA-182-F11", fittings: "SA-234-WP11", bolting: "SA-193-B7 with SA-194-2H" },
      { band: "Elevated temperature", range: "1001 to 1100", min: 1001, max: 1100, material: "2-1/4Cr-1Mo", plate: "SA-387-22-1", pipe: "SA-335-P22", forgings: "SA-182-F22", fittings: "SA-234-WP22", bolting: "SA-193-B5 with SA-194-3" },
      { band: "Elevated temperature", range: "1101 to 1500", min: 1101, max: 1500, material: "Stainless steel", plate: "SA-240-347H", pipe: "SA-312-347H", forgings: "SA-182-347H", fittings: "SA-403-347H", bolting: "SA-193-BB with SA-194-B" },
      { band: "Elevated temperature", range: "1101 to 1500", min: 1101, max: 1500, material: "Incoloy", plate: "SB-424", pipe: "SB-423", forgings: "SB-425", fittings: "SB-366", bolting: "SA-193-BB with SA-194-B" },
      { band: "Elevated temperature", range: "Above 1500", min: 1500, max: Infinity, minExclusive: true, material: "Inconel", plate: "SB-443", pipe: "SB-444", forgings: "SB-446", fittings: "SB-366", bolting: "SA-193-BB with SA-194-B" }
    ];
    const asmeFilterFields = [
      { id: "asmeFilterComposition", key: "nominalComposition" },
      { id: "asmeFilterProductForm", key: "productForm" },
      { id: "asmeFilterSpec", key: "specNo" },
      { id: "asmeFilterTypeGrade", key: "typeGrade" },
      { id: "asmeFilterUnsAlloy", key: "alloyDesigUnsNo" },
      { id: "asmeFilterPNo", key: "pNo" },
      { id: "asmeFilterGroup", key: "groupNo" },
      { id: "asmeFilterMinTensile", key: "minTensileStrengthMpa", format: value => displayStressMpa(Number(value)) },
      { id: "asmeFilterMinYield", key: "minYieldStrengthMpa", format: value => displayStressMpa(Number(value)) }
    ];
    const unitDefinitions = {
      metric: "Metric only",
      imperial: "Imperial only",
      mixed: "Mixed metric/imperial"
    };
    const mmToIn = value => value / 25.4;
    const mm2ToIn2 = value => value / 645.16;
    const mm3ToIn3 = value => value / 16387.064;
    const nToLbf = value => value * 0.2248089431;
    const kgToLb = value => value * 2.2046226218;
    const nmToLbft = value => value * 0.7375621493;
    const mpaToKsi = value => value * 0.1450377377;
    const kpaToPsi = value => value * 0.1450377377;
    const cToDisplayF = value => cToF(value);

    function formatUnit(metricValue, metricUnit, imperialValue, imperialUnit, metricDigits = 2, imperialDigits = 2) {
      return formatPreferredUnit(metricValue, metricUnit, imperialValue, imperialUnit, metricDigits, imperialDigits);
    }

    const displayLengthMm = (value, metricDigits = 2, imperialDigits = 3) => formatUnit(value, "mm", mmToIn(value), "in", metricDigits, imperialDigits);
    const displayAreaMm2 = (value, metricDigits = 2, imperialDigits = 4) => formatUnit(value, "mm²", mm2ToIn2(value), "in²", metricDigits, imperialDigits);
    const displayVolumeMm3 = (value, metricDigits = 2, imperialDigits = 3) => formatUnit(value, "mm³", mm3ToIn3(value), "in³", metricDigits, imperialDigits);
    const displayVolumeL = (value, metricDigits = 2, imperialDigits = 3) => formatUnit(value, "L", value * 0.2641720524, "US gal", metricDigits, imperialDigits);
    const displayPressureKpa = (value, metricDigits = 2, imperialDigits = 2) => formatUnit(value, "kPa", kpaToPsi(value), "psi", metricDigits, imperialDigits);
    const displayStressMpa = (value, metricDigits = 2, imperialDigits = 3) => formatUnit(value, "MPa", mpaToKsi(value), "ksi", metricDigits, imperialDigits);
    const displayForceN = (value, metricDigits = 2, imperialDigits = 2) => formatUnit(value, "N", nToLbf(value), "lbf", metricDigits, imperialDigits);
    const displayTorqueNm = (value, metricDigits = 0, imperialDigits = 0) => formatUnit(value, "N·m", nmToLbft(value), "lb-ft", metricDigits, imperialDigits);
    const displayWeightKg = (value, metricDigits = 3, imperialDigits = 3) => formatUnit(value, "kg", kgToLb(value), "lb", metricDigits, imperialDigits);

    function displayTempC(value, digits = 0) { return formatUnit(value, "°C", cToDisplayF(value), "°F", digits, digits); }

    function displayNps(nps, odMm = null) {
      const dn = npsToDn[nps];
      const size = `NPS ${nominalFraction(nps)}${dn ? ` · DN ${dn}` : ""}`;
      return odMm ? `${size} (${displayLengthMm(odMm, 1, 3)} OD)` : size;
    }
    const liveCalculators = [
      {
        fields: ["compoundSelect", "clampLength", "clampWidth", "grooveWidth", "grooveDepth", "grooveBoreOD1", "grooveBoreCount1", "grooveBoreOD2", "grooveBoreCount2", "grooveBoreOD3", "grooveBoreCount3"],
        required: ["clampLength", "clampWidth", "grooveWidth", "grooveDepth"],
        resultIds: ["resultGroove"],
        workingId: "workingGroove",
        calculate: calculateGrooveVolume
      },
      {
        fields: ["compoundSelect", "internalLength", "clampID", "pipeOD2"],
        required: ["internalLength", "clampID", "pipeOD2"],
        resultIds: ["resultVoid"],
        workingId: "workingVoid",
        calculate: calculateVoidVolume
      },
      {
        fields: ["compoundSelect", "sqLength", "sqDepth", "sqWidth", "pipeOD3", "pipeLength"],
        required: ["sqLength", "sqDepth", "sqWidth", "pipeOD3", "pipeLength"],
        resultIds: ["resultSquareVoid"],
        workingId: "workingSquareVoid",
        calculate: calculateSquareVoidVolume
      },
      {
        fields: ["compoundSelect", "cavityVolumeInput", "existingVolumeInput"],
        required: ["cavityVolumeInput", "existingVolumeInput"],
        resultIds: ["resultDifference"],
        workingId: "workingDifference",
        calculate: calculateDifferenceVolume
      },
      {
        fields: ["rectLength", "rectWidth", "rectHeight"],
        required: ["rectLength", "rectWidth", "rectHeight"],
        resultIds: ["rectVolumeResult"],
        calculate: calcRectangularVolume
      },
      {
        fields: ["cylDiameter", "cylLength"],
        required: ["cylDiameter", "cylLength"],
        resultIds: ["cylVolumeResult"],
        calculate: calcCylindricalVolume
      },
      {
        fields: ["unitAnnularOD", "unitAnnularID"],
        required: ["unitAnnularOD", "unitAnnularID"],
        resultIds: ["unitAnnularAreaResult"],
        calculate: () => calculateAnnularArea("unitAnnularOD", "unitAnnularID", "unitAnnularAreaResult")
      },
      {
        fields: ["sansPressure", "sansVolume", "sansServiceType", "sansLineSize"],
        required: ["sansPressure", "sansVolume", "sansServiceType", "sansLineSize"],
        resultIds: ["sansHazardResult"],
        calculate: calculateSans347Hazard
      },
      {
        fields: ["ncPressure", "ncTemp", "ncCA", "ncMaterial", "ncEndJoint", "ncH", "ncSmallH", "ncTr", "ncT1a", "ncT2a", "ncEndActual"],
        required: ["ncPressure", "ncTemp", "ncCA", "ncMaterial", "ncEndJoint", "ncH", "ncSmallH", "ncTr", "ncT1a", "ncT2a", "ncEndActual"],
        resultIds: ["nonCircularResult"],
        calculate: calculateNonCircular
      },
      {
        fields: ["circPressure", "circTemp", "circCA", "circShellMaterial", "circEndMaterial", "circJoint", "circOD", "circID", "circShellActual", "circEndActual"],
        required: ["circPressure", "circTemp", "circCA", "circShellMaterial", "circEndMaterial", "circJoint", "circOD", "circID", "circShellActual", "circEndActual"],
        resultIds: ["circularResult"],
        calculate: calculateCircular
      },
      {
        fields: ["boltPressure", "boltTemp", "boltMaterial", "boltArea", "boltCount", "boltSize", "boltClearance", "boltPreload", "boltFriction"],
        required: ["boltPressure", "boltTemp", "boltMaterial", "boltArea", "boltCount", "boltSize", "boltClearance", "boltPreload", "boltFriction"],
        resultIds: ["boltStandaloneResult"],
        calculate: calculateBoltStandalone
      }
    ];

    function applyTheme(theme, persist = true) {
      const selected = theme === "dark" ? "dark" : "light";
      document.body.dataset.theme = selected;
      document.querySelectorAll("[data-theme-choice]").forEach(button => {
        const active = button.dataset.themeChoice === selected;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      if (persist) {
        try { localStorage.setItem(THEME_KEY, selected); } catch {}
      }
    }

    function initTheme() {
      let saved = "";
      try { saved = localStorage.getItem(THEME_KEY) || ""; } catch {}
      applyTheme(saved || "light", false);
    }

    function applyUnitMode(mode, persist = true) {
      unitMode = unitDefinitions[mode] ? mode : "mixed";
      document.body.dataset.units = unitMode;
      document.querySelectorAll("[data-unit-choice]").forEach(button => {
        const active = button.dataset.unitChoice === unitMode;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      if (persist) {
        try { localStorage.setItem(UNIT_KEY, unitMode); } catch {}
      }
      refreshUnitDisplays();
    }

    function initUnitMode() {
      let saved = "";
      try { saved = localStorage.getItem(UNIT_KEY) || ""; } catch {}
      applyUnitMode(saved || "mixed", false);
    }

    function refreshUnitDisplays() {
      if (!byId("npsSelect") || !Object.keys(state.pipes).length) return;
      populatePipeSelects();
      populateMaterialGuideControls();
      populateAsmeControls();
      populateAsmeTemperatures();
      updatePipeOdPanel();
      showPipeData();
      showElbowData();
      calculateSans347Hazard();
      showFlangeData();
      renderSelectedCompoundSummary();
      showMaterialGuideByTemp();
      renderAsmeTable();
      runAllLiveCalculators();
      if (byId("inputUnitMode")) { updateUnitBanners(); showBoltNutData(); }
    }

    function fieldHasValue(id) {
      const element = byId(id);
      return Boolean(element && String(element.value).trim() !== "");
    }

    function hideLiveOutputs(config) {
      config.resultIds.forEach(id => {
        const element = byId(id);
        if (!element) return;
        element.textContent = "";
        element.innerHTML = "";
        element.style.display = "none";
      });
      if (config.workingId) {
        const working = byId(config.workingId);
        if (working) working.style.display = "none";
      }
    }

    function runLiveCalculator(config) {
      const view = byId(config.resultIds[0]).closest('.view');
      const file = toolData[view.id];
      if (file && datasetStatus[file]?.ok === false) {
        config.resultIds.forEach(id => showHtml(id, '<p class="empty-state">Source data for this tool is unavailable. Use Retry source data in Settings.</p>'));
        return;
      }
      if (config.required.some(id => !fieldHasValue(id))) {
        hideLiveOutputs(config);
        const missing = config.required.filter(id => !fieldHasValue(id)).map(id => byId(id)?.closest('label')?.childNodes[0]?.textContent.trim() || id);
        config.resultIds.forEach(id => showHtml(id, `<p class="empty-state">Enter ${missing.map(esc).join(', ')} to see the result.</p>`));
        return;
      }
      if (config.workingId) byId(config.workingId).style.display = 'none';
      try { config.calculate(); }
      catch(error) { showErrors(config.resultIds[0], config.workingId, [error.message]); }
    }

    function runLiveForTarget(id) {
      liveCalculators
        .filter(config => config.fields.includes(id))
        .forEach(runLiveCalculator);
    }

    function runAllLiveCalculators() {
      liveCalculators.forEach(runLiveCalculator);
      convertLength();
      convertVolume();
      convertPressure();
      if (byId("temperatureInput")) convertTemperature();
    }

    function setMobileNav(open) {
      const wasOpen = document.body.classList.contains('nav-open');
      document.body.classList.toggle('nav-open', open);
      const toggle = document.querySelector('[data-mobile-nav-toggle]');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      const mobile = matchMedia('(max-width: 860px)').matches;
      byId('mainContent').inert = open && mobile;
      if (open && mobile) byId('toolSearch').focus();
      else if (wasOpen && mobile) toggle.focus();
    }

    function scheduleAsmeRender() {
      window.clearTimeout(asmeSearchTimer);
      asmeSearchTimer = window.setTimeout(renderAsmeTable, 120);
    }

    document.addEventListener("click", event => {
      const mobileNavToggle = event.target.closest("[data-mobile-nav-toggle]");
      if (mobileNavToggle) {
        setMobileNav(!document.body.classList.contains("nav-open"));
        return;
      }

      if (event.target.closest("[data-mobile-nav-close]")) {
        setMobileNav(false);
        return;
      }

      const settingsToggle = event.target.closest("[data-settings-toggle]");
      if (settingsToggle) {
        const panel = byId("settingsPanel");
        const isOpen = !panel.hidden;
        panel.hidden = isOpen;
        settingsToggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
        return;
      }

      if (!event.target.closest(".settings-menu")) {
        const panel = byId("settingsPanel");
        const trigger = document.querySelector("[data-settings-toggle]");
        if (panel && trigger) {
          panel.hidden = true;
          trigger.setAttribute("aria-expanded", "false");
        }
      }

      const themeChoice = event.target.closest("[data-theme-choice]");
      if (themeChoice) {
        applyTheme(themeChoice.dataset.themeChoice);
        return;
      }

      const unitChoice = event.target.closest("[data-unit-choice]");
      if (unitChoice) {
        applyUnitMode(unitChoice.dataset.unitChoice);
        return;
      }

      const nav = event.target.closest("[data-view]");
      if (nav) {
        navigate(nav.dataset.view, nav);
        setMobileNav(false);
      }

      const action = event.target.closest("[data-action]");
      if (action && action.dataset.action !== "applyAppUpdate") window[action.dataset.action]?.();
      if (action?.dataset.action === "applyAppUpdate") applyAppUpdate();
    });

    document.addEventListener("change", event => {
      if (event.target.id === "compoundType") updateCompoundFluidGroups();
      if (event.target.id === "compoundFluidGroup") updateCompoundOptions();
      if (event.target.id === "compoundSelect") updateCompoundSelection();
      if (event.target.id === "compoundCalculatorSelect") { showSelectedCompoundCalculator(); runAllLiveCalculators(); }
      if (event.target.id === "npsSelect") showPipeData();
      if (["npsElbowSelect", "elbowRadiusSelect"].includes(event.target.id)) showElbowData();
      if (["sansServiceType", "sansLineSize"].includes(event.target.id)) calculateSans347Hazard();
      if (["npsFlangeSelect", "classFlangeSelect", "typeFlangeSelect"].includes(event.target.id)) { syncFlangeOptions(); showFlangeData(); }
      if (event.target.id === "boltNutSizeSelect") showBoltNutData();
      if (event.target.id === "wpsSelect") showWpsData();
      if (event.target.id === "guideTempRange") showMaterialGuideByTemp();
      if (event.target.id.startsWith("asmeFilter")) { asmePage = 0; renderAsmeTable(); }
      if (["lengthFrom", "lengthTo"].includes(event.target.id)) convertLength();
      if (["volumeFrom", "volumeTo"].includes(event.target.id)) convertVolume();
      if (["pressureFrom", "pressureTo"].includes(event.target.id)) convertPressure();
      runLiveForTarget(event.target.id);
    });

    document.addEventListener("input", event => {
      if (event.target.id === "lengthInput") convertLength();
      if (event.target.id === "volumeInput") convertVolume();
      if (event.target.id === "pressureInput") convertPressure();
      if (["sansPressure", "sansVolume"].includes(event.target.id)) calculateSans347Hazard();
      if (event.target.id === "asmeSearch") { asmePage = 0; scheduleAsmeRender(); }
      runLiveForTarget(event.target.id);
    });

    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      setMobileNav(false);
      const panel = byId("settingsPanel");
      const trigger = document.querySelector("[data-settings-toggle]");
      if (panel && trigger) {
        panel.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }
    });

    initTheme();
    initUnitMode();
    byId("appVersionText").textContent = APP_VERSION;
    byId("sourceDataVersionText").textContent = SOURCE_DATA_VERSION;

    function setSourceStatus(ok) {
      const mainStatus = byId("dataStatus");
      const panelStatus = byId("dataStatusPanel");
      const label = byId("dataStatusText");
      [mainStatus, panelStatus].forEach(status => {
        if (!status) return;
        status.textContent = ok ? "✓" : "!";
        status.classList.toggle("error", !ok);
      });
      if (mainStatus) {
        mainStatus.setAttribute("aria-label", ok ? "Source data loaded" : "Source data unavailable");
        mainStatus.setAttribute("title", ok ? "Source data loaded" : "Source data unavailable");
      }
      if (label) label.textContent = ok ? "Source data loaded" : "Source data unavailable";
    }

    async function loadDatabases(retry = false) {
      if (currentLoad) return currentLoad;
      const preserved = Object.fromEntries([...document.querySelectorAll('.view')].map(view => [view.id, inputSnapshot(view)]));
      const files = ['pipes.json','flanges.json','wps.json','compounds.json','engineering_calcs.json','asme_table_1a.json'];
      currentLoad = (async () => {
        const loaded = await Promise.allSettled(files.map(file => fetchJson(file)));
        loaded.forEach((result, index) => {
          const file = files[index];
          datasetStatus[file] = { ok: result.status === 'fulfilled', mode: result.status === 'fulfilled' ? sourceLoadModes[file] : 'unavailable' };
          if (result.status !== 'fulfilled') return;
          const key = { 'pipes.json':'pipes','flanges.json':'flanges','wps.json':'wps','compounds.json':'compounds','engineering_calcs.json':'engineering','asme_table_1a.json':'asmeTable1A' }[file];
          state[key] = result.value;
        });
        const initialise = [populateCompoundTypes,populatePipeSelects,populateWpsDropdown,populateWpsFilters,populateMaterialGuideControls,populateAsmeControls,populateAsmeTemperatures,populateUnitSelects,populateEngineeringSelects,populateBoltNutSelect];
        initialise.forEach(fn => { try { fn(); } catch(error) { console.error(fn.name, error); } });
        if (retry) for (const view of document.querySelectorAll('.view')) restoreValues(preserved[view.id], view);
        syncFlangeOptions(); updatePipeOdPanel(); showPipeData(); showElbowData(); showWpsData(); showMaterialGuideByTemp(); showBoltNutData(); renderAsmeTable(); updateCompoundScreen(); runAllLiveCalculators();
        const failed = files.filter(file => !datasetStatus[file].ok);
        setSourceStatus(!failed.length);
        byId('dataStatusText').textContent = failed.length ? `${files.length - failed.length}/${files.length} datasets available. Retry to recover missing tools.` : 'All source datasets available';
        byId('datasetDetails').innerHTML = files.map(file => `<div>${esc(file)}: ${esc(datasetStatus[file].mode)}</div>`).join('');
        for (const view of document.querySelectorAll('.view')) {
          const draft = readStored('draft-' + view.id, null);
          if (!retry && draft?.schema === 2) { restoreFieldUnits(draft.fieldUnits, view, draft.inputUnits); restoreValues(draft.values, view); }
        }
        if (retry) notifyUser(failed.length ? 'Some data remains unavailable. Other tools can still be used.' : 'Source data reloaded. Inputs retained.');
      })();
      try { await currentLoad; } finally { currentLoad = null; }
    }

    async function fetchJson(file) {
      for (const path of DATA_PATHS) {
        try {
          const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 4000);
          let response;
          try { response = await fetch(path + file, {cache:'no-store',signal:controller.signal}); }
          finally { clearTimeout(timeout); }
          if (!response.ok) continue;
          const data = JSON.parse((await response.text()).replace(/^\uFEFF/, ''));
          validateDataset(file, data); sourceLoadModes[file] = navigator.onLine ? 'JSON reference' : 'Offline cached reference'; return data;
        } catch(error) { /* Try the next local path, then the generated bundle. */ }
      }
      const bundled = window.BERUAPP_SOURCE_DATA?.[file];
      if (window.BERUAPP_SOURCE_META?.appVersion === APP_VERSION && bundled) {
        validateDataset(file, bundled); sourceLoadModes[file] = 'Packaged fallback'; return bundled;
      }
      throw new Error(`Could not load a valid ${file}.`);
    }

    function navigate(viewId, element, updateHistory = true, focus = true) {
      if (!titles[viewId]) return;
      document.querySelectorAll('.view').forEach(view => view.classList.toggle('active',view.id === viewId));
      document.querySelectorAll('.nav-item').forEach(button => { const selected=button.dataset.view === viewId; button.classList.toggle('active',selected); if(selected) {button.setAttribute('aria-current','page'); button.closest('details').open=true;} else button.removeAttribute('aria-current'); });
      byId('viewTitle').textContent=titles[viewId][0]; byId('viewDescription').textContent=titles[viewId][1]; byId('viewDescription').style.display=titles[viewId][1]?'block':'none';
      setMobileNav(false);
      if(updateHistory && location.hash !== '#'+viewId) history.pushState(null,'','#'+viewId);
      if (byId('quickTools')) rememberTool(viewId);
      byId('workspaceMessage').textContent='';
      if(focus) { byId('viewTitle').focus(); window.scrollTo({top:0,behavior:'auto'}); }
    }

    function populatePipeSelects() {
      const selectedPipe = byId("npsSelect")?.value || "";
      const selectedElbow = byId("npsElbowSelect")?.value || "";
      const selectedSans = byId("sansLineSize")?.value || "";
      const selectedFlange = byId("npsFlangeSelect")?.value || "";
      const options = standardNps.filter(size => state.pipes[size]).map(size => `<option value="${esc(size)}">${esc(displayNps(size))}</option>`).join("");
      byId("npsSelect").innerHTML = `<option value="" selected disabled hidden>Select pipe size</option>${options}`;
      byId("npsElbowSelect").innerHTML = standardNps
        .filter(size => elbowDimensions90[size])
        .map(size => `<option value="${esc(size)}">${esc(displayNps(size))}</option>`).join("");
      byId("sansLineSize").innerHTML = standardNps
        .filter(size => npsToDn[size])
        .map(size => `<option value="${esc(size)}">${esc(formatNpsWithOd(size))}</option>`).join("");
      const flangeOptions = Object.keys(state.flanges)
        .map(key => key.replace("NPS_", ""))
        .map(size => `<option value="${esc(size)}">${esc(displayNps(size))}</option>`).join("");
      byId("npsFlangeSelect").innerHTML = `<option value="" selected disabled hidden>Select pipe size</option>${flangeOptions}`;
      if (selectedPipe) byId("npsSelect").value = selectedPipe;
      if (selectedElbow) byId("npsElbowSelect").value = selectedElbow;
      if (selectedSans) byId("sansLineSize").value = selectedSans;
      if (selectedFlange) byId("npsFlangeSelect").value = selectedFlange;
    }

    function updatePipeOdPanel() {
      const panel = byId("pipeOdPanel");
      if (!panel) return;
      const nps = byId("npsSelect").value;
      const od = state.pipes[nps]?.od;
      panel.innerHTML = `<span>Outside diameter (OD)</span><strong>${od ? displayLengthMm(od, 1, 3) : "Select a size"}</strong>`;
    }

    function populateWpsDropdown() {
      byId("wpsSelect").innerHTML = `<option value="" selected disabled hidden>Select WPS</option>` +
        Object.keys(state.wps).map(key => `<option value="${esc(key)}">${esc(key)}</option>`).join("");
    }

    function populateMaterialGuideControls() {
      const selected = byId("guideTempRange")?.value || "";
      const groups = materialGuideRows.reduce((acc, row) => {
        const key = materialGuideRangeKey(row);
        if (!acc.some(item => item.key === key)) {
          acc.push({ key, label: `${row.band} - ${materialGuideRangeC(row)}` });
        }
        return acc;
      }, []);
      byId("guideTempRange").innerHTML = groups
        .map((group, index) => `<option value="${esc(group.key)}" ${index === 0 ? "selected" : ""}>${esc(group.label)}</option>`)
        .join("");
      if (selected) byId("guideTempRange").value = selected;
    }

    function populateBoltNutSelect() {
      const selected = byId("boltNutSizeSelect")?.value || "";
      byId("boltNutSizeSelect").innerHTML = `<option value="" selected disabled hidden>Select bolt size</option>` +
        boltNutTable.map(row => `<option value="${esc(row.size)}">${esc(row.size.startsWith("M") ? row.size : row.size + " in")}</option>`).join("");
      if (selected) byId("boltNutSizeSelect").value = selected;
    }

    function populateAsmeControls() {
      asmeFilterFields.forEach(field => {
        const selected = byId(field.id)?.value || "";
        const values = uniqueSortedAsmeValues(field.key);
        byId(field.id).innerHTML = `<option value="">All</option>` +
          values.map(value => `<option value="${esc(value)}">${esc(field.format ? field.format(value) : value)}</option>`).join("");
        if (selected) byId(field.id).value = selected;
      });
    }

    function uniqueSortedAsmeValues(key) {
      return [...new Set((state.asmeTable1A.rows || [])
        .map(row => row[key])
        .filter(value => value != null && value !== "")
        .map(value => String(value)))]
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    }

    function populateUnitSelects() {
      fillOptions("lengthFrom", [["mm","mm"],["cm","cm"],["m","m"],["km","km"],["inch","inch"],["foot","foot"],["yard","yard"],["mile","mile"]], "mm");
      fillOptions("lengthTo", [["mm","mm"],["cm","cm"],["m","m"],["km","km"],["inch","inch"],["foot","foot"],["yard","yard"],["mile","mile"]], "inch");
      fillOptions("volumeFrom", [["mm3","mm3"],["cm3","cm3"],["L","L"],["m3","m3"],["in3","in3"],["ft3","ft3"],["us_gal","US gal"]], "mm3");
      fillOptions("volumeTo", [["mm3","mm3"],["cm3","cm3"],["L","L"],["m3","m3"],["in3","in3"],["ft3","ft3"],["us_gal","US gal"]], "L");
      fillOptions("pressureFrom", [["Pa","Pa"],["kPa","kPa"],["MPa","MPa"],["bar","bar"],["psi","psi"]], "bar");
      fillOptions("pressureTo", [["Pa","Pa"],["kPa","kPa"],["MPa","MPa"],["bar","bar"],["psi","psi"]], "kPa");
    }

    function fillOptions(id, options, selected) {
      byId(id).innerHTML = options.map(([value, label]) => `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`).join("");
    }

    function populateEngineeringSelects() {
      const materialOptions = state.engineering.materials.map(material => [material.name, material.name]);
      const boltMaterialOptions = state.engineering.boltMaterials.map(material => [material.name, material.name]);
      const boltSizeOptions = state.engineering.boltSizes
        .filter(size => Number.isFinite(Number(size.rootArea)) && Number.isFinite(Number(size.boltOD)) && Number.isFinite(Number(size.pitch)) && Number.isFinite(Number(size.tensileArea)))
        .map(size => [size.size, size.size.startsWith('M') ? size.size : `${size.size} in`]);

      ["ncMaterial", "circShellMaterial", "circEndMaterial"].forEach(id => fillOptions(id, materialOptions, "SA-516 Gr 70"));
      fillOptions("boltMaterial", boltMaterialOptions, "SA-193 Gr B7");
      fillOptions("boltSize", boltSizeOptions, "M16");
    }

    function showResult(id, text) {
      const element=byId(id);
      element.textContent = /(?:NaN|Infinity|∞)/.test(text) ? 'Dimensions exceed the supported numeric range. Enter smaller finite values.' : text;
      element.style.display='block';
    }

    function showHtml(id, html) {
      const element = byId(id);
      element.innerHTML = html;
      element.style.display = "block";
    }

    function showErrors(resultId, workingId, errors) {
      showHtml(resultId, `<span class="error-text">${errors.map(esc).join("<br>")}</span>`);
      const working = byId(workingId);
      if (working) working.style.display = "none";
    }

    function validatePositive(fields) {
      const errors=[];
      fields.forEach(([id,label]) => { const value=num(id), invalid=!Number.isFinite(value)||value<=0; byId(id)?.setAttribute('aria-invalid',String(invalid)); if(invalid) errors.push(`${label} must be a positive number.`); });
      return errors;
    }

    function compoundQuantity(volumeMm3) {
      const compound = selectedCompound();
      if (!compound) return null;
      const sticks = Math.ceil(volumeMm3 / compound.volumeMm3);
      return {
        compound,
        sticks,
        boxes: Math.ceil(sticks / 10),
        weightKg: volumeMm3 * compound.densityKgPerMm3
      };
    }

    function compoundResultLines(volumeMm3) {
      const quantity=compoundQuantity(volumeMm3);
      if(!quantity) return 'Select a compound to calculate sticks, boxes and weight.';
      return [`Compound: ${quantity.compound.product}`,`Sticks required: ${quantity.sticks}`,`Boxes required: ${quantity.boxes} (10 sticks/box)`,`Net fill mass: ${displayWeightKg(quantity.weightKg)}`,`Whole-stick purchase mass: ${displayWeightKg(quantity.sticks*quantity.compound.volumeMm3*quantity.compound.densityKgPerMm3)}`,`Service screening: ${compoundAssessment(quantity.compound)}`].join('\n');
    }

    function getGrooveBores() {
      const errors = [];
      const bores = [1, 2, 3].map(index => {
        const countElement = byId(`grooveBoreCount${index}`);
        const odElement = byId(`grooveBoreOD${index}`);
        const countRaw = countElement ? countElement.value.trim() : "";
        const odRaw = odElement ? odElement.value.trim() : "";
        const count = countRaw === "" ? 0 : Number(countRaw);
        const diameter = odRaw === "" ? NaN : num(`grooveBoreOD${index}`);

        if (!Number.isInteger(count) || count < 0) {
          errors.push(`Bore ${index} count must be zero or a whole number.`);
        }
        if (count > 0 && (!Number.isFinite(diameter) || diameter <= 0)) {
          errors.push(`Bore ${index} OD must be a positive number when its count is greater than zero.`);
        }
        if (count === 0 && odRaw && (!Number.isFinite(diameter) || diameter <= 0)) {
          errors.push(`Bore ${index} OD must be a positive number.`);
        }

        return { index, count: Number.isInteger(count) && count > 0 ? count : 0, diameter };
      }).filter(bore => bore.count > 0);

      return { bores, errors };
    }

    function grooveValues() {
      const { bores } = getGrooveBores();
      const values = {
        clampLength: num("clampLength"),
        clampWidth: num("clampWidth"),
        grooveWidth: num("grooveWidth"),
        grooveDepth: num("grooveDepth"),
        bores,
        totalBores: bores.reduce((sum, bore) => sum + bore.count, 0),
        stickVolume: selectedCompound()?.volumeMm3 || null
      };
      const initialPerimeter = 2 * (values.clampLength + values.clampWidth);
      const perimeterReduction = values.bores.reduce((sum, bore) => sum + bore.count * bore.diameter, 0);
      const adjustedPerimeter = initialPerimeter - perimeterReduction;
      const mainGrooveVolume = adjustedPerimeter * values.grooveWidth * values.grooveDepth;
      const boreDetails = values.bores.map(bore => {
        const boreOuterRadius = bore.diameter / 2 + values.grooveDepth;
        const boreInnerRadius = bore.diameter / 2;
        const volumeSingle = Math.PI * (boreOuterRadius ** 2 - boreInnerRadius ** 2) * values.grooveWidth;
        return { ...bore, boreOuterRadius, boreInnerRadius, volumeSingle, totalVolume: volumeSingle * bore.count };
      });
      const totalBoreVolume = boreDetails.reduce((sum, bore) => sum + bore.totalVolume, 0);
      const total = mainGrooveVolume + totalBoreVolume;
      return { ...values, boreDetails, initialPerimeter, perimeterReduction, adjustedPerimeter, mainGrooveVolume, totalBoreVolume, total, sticks: values.stickVolume ? Math.ceil(total / values.stickVolume) : null, boxes: values.stickVolume ? Math.ceil(Math.ceil(total / values.stickVolume) / 10) : null };
    }

    function calculateGrooveVolume() {
      const errors = validatePositive([["clampLength","Clamp length"],["clampWidth","Clamp width"],["grooveWidth","Groove width"],["grooveDepth","Groove depth"]]);
      errors.push(...getGrooveBores().errors);
      if (errors.length) return showErrors("resultGroove", "workingGroove", errors);
      const g = grooveValues();
      if (!Number.isFinite(g.total)) return showErrors("resultGroove", "workingGroove", ["Dimensions exceed the supported numeric range."]);
      if (g.adjustedPerimeter <= 0 && g.totalBores > 0) return showErrors("resultGroove", "workingGroove", ["Adjusted perimeter is not positive. Reduce bore counts/ODs or check clamp dimensions."]);
      showResult("resultGroove", `Total sealing groove volume: ${displayVolumeMm3(g.total)}\nTotal bores: ${g.totalBores}\n${compoundResultLines(g.total)}`);
    }

    function showGrooveWorking() {
      calculateGrooveVolume();
      if(byId('resultGroove').querySelector('.error-text')) return;
      const g=grooveValues();
      toggleGeometryWorking('workingGroove',`Dimensions in this working are in mm.\nPerimeter = 2(L + W) = ${g.initialPerimeter} mm\nBore deduction = Σ(count × OD) = ${g.perimeterReduction} mm\nMain groove = (perimeter − deduction) × width × depth = ${displayVolumeMm3(g.mainGrooveVolume)}\nBore grooves = Σ[π((OD/2 + depth)² − (OD/2)²) × width × count] = ${displayVolumeMm3(g.totalBoreVolume)}\nTotal = ${displayVolumeMm3(g.total)}\n${compoundResultLines(g.total)}`);
    }

    function calculateVoidVolume() {
      const errors = validatePositive([["internalLength","Internal length"],["clampID","Clamp ID"],["pipeOD2","Pipe OD"]]);
      if (!errors.length && num("clampID") <= num("pipeOD2")) errors.push("Clamp ID must be larger than pipe OD.");
      if (errors.length) return showErrors("resultVoid", "workingVoid", errors);
      const volume = Math.PI * ((num("clampID") / 2) ** 2 - (num("pipeOD2") / 2) ** 2) * num("internalLength");
      showResult("resultVoid", `Total void volume: ${displayVolumeMm3(volume)}\n${compoundResultLines(volume)}`);
    }

    function showVoidWorking() {
      calculateVoidVolume(); if(byId('resultVoid').querySelector('.error-text')) return;
      const volume=Math.PI/4*(num('clampID')**2-num('pipeOD2')**2)*num('internalLength');
      toggleGeometryWorking('workingVoid',`V = π/4 × (clamp ID² − pipe OD²) × internal length\nV = ${displayVolumeMm3(volume)}\n${compoundResultLines(volume)}`);
    }

    function calculateSquareVoidVolume() {
      const errors = validatePositive([["sqLength","Cavity length"],["sqDepth","Cavity depth"],["sqWidth","Cavity width"],["pipeOD3","Pipe OD"],["pipeLength","Pipe length"]]);
      if (!errors.length && num("pipeOD3") > Math.min(num("sqWidth"), num("sqDepth"))) errors.push("Pipe OD must fit within the cavity width and depth.");
      if (!errors.length && num("pipeLength") > num("sqLength")) errors.push("Pipe length cannot exceed cavity length.");
      if (errors.length) return showErrors("resultSquareVoid", "workingSquareVoid", errors);
      const cavity = num("sqLength") * num("sqDepth") * num("sqWidth");
      const pipe = Math.PI * (num("pipeOD3") / 2) ** 2 * num("pipeLength");
      const net = cavity - pipe;
      if (net <= 0) return showErrors("resultSquareVoid", "workingSquareVoid", ["Net volume is not positive. Check the cavity and pipe dimensions."]);
      showResult("resultSquareVoid", `Net void volume: ${displayVolumeMm3(net)}\n${compoundResultLines(net)}`);
    }

    function showSquareWorking() {
      calculateSquareVoidVolume(); if(byId('resultSquareVoid').querySelector('.error-text')) return;
      const cavity=num('sqLength')*num('sqWidth')*num('sqDepth'), pipe=Math.PI/4*num('pipeOD3')**2*num('pipeLength');
      toggleGeometryWorking('workingSquareVoid',`Cavity = length × width × depth = ${displayVolumeMm3(cavity)}\nPipe = π/4 × pipe OD² × pipe length = ${displayVolumeMm3(pipe)}\nNet void = cavity − pipe = ${displayVolumeMm3(cavity-pipe)}\n${compoundResultLines(cavity-pipe)}`);
    }

    function calculateDifferenceVolume() {
      const errors = validatePositive([["cavityVolumeInput","Cavity volume"]]);
      const existing = num("existingVolumeInput");
      if (!Number.isFinite(existing) || existing < 0) errors.push("Existing volume must be zero or higher.");
      if (!errors.length && num("cavityVolumeInput") <= existing) errors.push("Cavity volume must be greater than existing volume.");
      if (errors.length) return showErrors("resultDifference", "workingDifference", errors);
      const net = num("cavityVolumeInput") - existing;
      showResult("resultDifference", `Net volume to fill: ${displayVolumeMm3(net)}\n${compoundResultLines(net)}`);
    }

    function showDifferenceWorking() {
      calculateDifferenceVolume(); if(byId('resultDifference').querySelector('.error-text')) return;
      const difference=num('cavityVolumeInput')-num('existingVolumeInput');
      toggleGeometryWorking('workingDifference',`Net void = cavity volume − existing volume\n${displayVolumeMm3(num('cavityVolumeInput'))} − ${displayVolumeMm3(num('existingVolumeInput'))} = ${displayVolumeMm3(difference)}\n${compoundResultLines(difference)}`);
    }

    function showPipeData() {
      renderPipeReference();
    }

    function showElbowData() {
      const nps = byId("npsElbowSelect").value;
      const radius = byId("elbowRadiusSelect").value;
      const data = elbowDimensions90[nps];
      if (!data) return showHtml("elbowResult", `<div class="notice error-text">Please select a line size.</div>`);
      const centerToEnd = data[radius];
      if (!centerToEnd) {
        return showHtml("elbowResult", `<div class="notice">Short-radius 90 degree elbow dimensions start at NPS 1 in this lookup.</div>`);
      }
      const label = radius === "long" ? "Long radius" : "Short radius";
      showHtml("elbowResult", `<table><thead><tr><th>Parameter</th><th>Value</th></tr></thead><tbody>
        <tr><td>Fitting</td><td><strong>90 deg elbow</strong></td></tr>
        <tr><td>Line size</td><td>${esc(displayNps(nps))}</td></tr>
        <tr><td>DN</td><td>${npsToDn[nps] ? `DN ${npsToDn[nps]}` : "-"}</td></tr>
        <tr><td>Radius type</td><td>${label}</td></tr>
        <tr><td>Center-to-end dimension A</td><td><strong>${displayLengthMm(centerToEnd, 0, 3)}</strong></td></tr>
      </tbody></table>`);
    }

    function showFlangeData() {
      const nps = byId("npsFlangeSelect").value;
      const cls = byId("classFlangeSelect").value;
      const type = byId("typeFlangeSelect").value;
      if (!nps) {
        byId("flangeResult").style.display = "none";
        byId("flangeResult").innerHTML = "";
        return;
      }
      const data = state.flanges[`NPS_${nps}`]?.[`CLASS_${cls}`]?.[type];
      if (!data) return showHtml("flangeResult", `<span class="error-text">Data is not available for this flange combination.</span>`);
      const labels = {
        O: "Flange OD (O)", C: "Minimum thickness (C)", X: "Hub diameter (X)", A_Bore_WN: "Bore (A - WN)",
        B_Bore_SO: "Bore (B - SO)", Y: "Hub length (Y)", K: "Bolt circle diameter (K)", R: "Raised face diameter (R)",
        RF_Height: "Raised face height", Bolt_Hole_Dia: "Bolt hole diameter", Num_Bolts: "Number of bolts", Bolt_Size: "Bolt size", Bronze_Size: "Bolt size"
      };
      const rows = Object.entries(data).map(([key, value]) => {
        const isCount = key === "Num_Bolts";
        const isBolt = key === "Bolt_Size" || key === "Bronze_Size";
        const display = value == null ? "Not supplied in source" : isCount ? value : isBolt ? displayBoltSize(value) : displayLengthMm(value, 2, 3);
        return `<tr><td>${esc(labels[key] || key)}</td><td><strong>${esc(display)}</strong></td></tr>`;
      }).join("");
      showHtml("flangeResult", `<table><thead><tr><th>Dimension</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>`);
    }

    function showBoltNutData() {
      const size=byId('boltNutSizeSelect').value,data=boltNutTable.find(row=>row.size===size);
      if(!data) return showHtml('boltNutResult','<p class="empty-state">Select a bolt size to see dimensions.</p>');
      const rows=[['Nominal size',size.startsWith('M')?size:`${size} in`],...Object.entries({rootArea:'Root area',boltOD:'Recorded bolt diameter (not wrench size)',wFlats:'Across flats',bwCorner:'Across corners',pitch:'Thread pitch',thk:'Nut thickness',tensileArea:'Tensile area'}).map(([key,label])=>{const value=Number(String(data[key]).replace(',','.'));return [label,data[key]&&Number.isFinite(value)?boltReferenceValue(value, key, !size.startsWith('M')):'Not supplied in source'];})];
      showHtml('boltNutResult',`<table><caption>Recorded bolt and nut dimensions</caption><thead><tr><th>Parameter</th><th>Value</th></tr></thead><tbody>${rows.map(([k,v])=>`<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>`);
    }

    function getNpsOdMm(nps) {
      return state.pipes[nps]?.od || npsOdFallbackMm[nps] || null;
    }

    function formatSansOdMm(value) {
      return Number(value).toLocaleString("en-US", { maximumFractionDigits: 1 });
    }

    function formatNpsWithOd(nps) {
      const od = getNpsOdMm(nps);
      return displayNps(nps, od);
    }

    function calculateSans347VolumeCategory(pressure, volume, service) {
      const pv = pressure * volume;
      if (service === "dangerousGas") {
        if (pressure < 50) return "Not Regulated";
        if ((pressure < 20000 && volume < 1) || pv < 2000) return "SEP";
        if (volume >= 1 && pv >= 2000 && pv < 5000) return "CAT I";
        if (volume >= 1 && pv >= 5000 && pv < 20000) return "CAT II";
        if ((volume >= 1 && pv >= 20000 && pv < 100000) || (pressure >= 20000 && pressure < 100000 && volume < 1)) return "CAT III";
        if (pressure >= 100000 || pressure >= 50 || pv >= 100000) return "CAT IV";
      } else if (service === "nonDangerousGas") {
        if (pressure < 50) return "Not Regulated";
        if ((pressure < 100000 && volume < 1) || pv < 5000) return "SEP";
        if (volume >= 1 && pv >= 5000 && pv < 20000) return "CAT I";
        if (volume >= 1 && pv >= 20000 && pv < 100000) return "CAT II";
        if ((pressure >= 100000 && pressure < 300000 && volume < 1) || (volume >= 1 && pv >= 100000 && pv < 300000 && volume < 750) || (volume >= 750 && pv >= 100000 && volume < 2000 && pressure < 400) || (pressure >= 50 && pressure < 400 && volume >= 2000)) return "CAT III";
        if (pressure >= 300000 || pressure >= 400 || pv >= 300000) return "CAT IV";
      } else if (service === "dangerousLiquid") {
        if (pressure < 50) return "Not Regulated";
        if ((pressure < 50000 && volume < 1) || pv < 20000) return "SEP";
        if (pressure < 1000 && pv >= 20000) return "CAT I";
        if (pressure < 50000 && pressure >= 1000 && pv >= 20000 && volume >= 1) return "CAT II";
        if (pressure >= 50000 && volume < 1) return "CAT II";
        if (pressure >= 50000 && volume >= 1) return "CAT III";
      } else if (service === "nonDangerousLiquid") {
        if (pressure < 50) return "Not Regulated";
        if ((pressure < 100000 && volume < 10) || (pv < 1000000 && volume >= 10 && volume < 1000) || (volume >= 1000 && pressure >= 50 && pressure < 1000)) return "SEP";
        if ((pv >= 1000000 && pressure < 50000 && volume < 1000) || (volume >= 1000 && pressure >= 1000 && pressure < 50000)) return "CAT I";
        if (pressure >= 100000 && volume < 10) return "CAT I";
        if ((volume >= 10 && volume < 20 && pv >= 1000000) || (volume >= 20 && pressure >= 50000)) return "CAT II";
      }
      return "Undetermined";
    }

    function calculateSans347Hazard() {
      const pressure = num("sansPressure");
      const volume = num("sansVolume");
      const nps = byId("sansLineSize").value;
      const dn = npsToDn[nps];
      const service = byId("sansServiceType").value;
      const errors = [];
      if (!Number.isFinite(pressure) || pressure < 0) errors.push("Pressure must be zero or higher.");
      if (!Number.isFinite(volume) || volume < 0) errors.push("Volume must be zero or higher.");
      if (!dn) errors.push("Please select a line size.");
      if (errors.length) return showErrors("sansHazardResult", null, errors);

      const pd = pressure * dn;
      const pv = pressure * volume;
      let category = "Undetermined";
      if (service === "dangerousGas") {
        if (pressure < 50) category = "Not Regulated";
        else if (dn < 25) category = "SEP";
        else if (pd < 100000 && dn >= 25 && dn < 100) category = "CAT I";
        else if ((dn >= 25 && dn < 100 && pd >= 100000) || (dn >= 100 && dn < 350 && pd < 350000)) category = "CAT II";
        else if ((dn >= 100 && dn < 350 && pd >= 350000) || (dn >= 350 && pressure >= 50)) category = "CAT III";
      } else if (service === "nonDangerousGas") {
        if (pressure < 50) category = "Not Regulated";
        else if (dn < 32 || (dn >= 32 && pd < 100000)) category = "SEP";
        else if ((dn >= 32 && dn < 100 && pd >= 100000) || (dn >= 100 && pd >= 100000 && pd < 350000)) category = "CAT I";
        else if ((dn >= 100 && dn < 250 && pd >= 350000) || (dn >= 250 && pd >= 350000 && pd < 500000)) category = "CAT II";
        else if (dn >= 250 && pd >= 500000) category = "CAT III";
      } else if (service === "dangerousLiquid") {
        if (pressure < 50) category = "Not Regulated";
        else if (dn < 25 || (dn >= 25 && pd < 200000)) category = "SEP";
        else if (pd >= 200000 && pressure < 1000) category = "CAT I";
        else if ((dn >= 25 && dn < 200 && pd >= 200000 && pressure < 50000) || (dn >= 200 && pressure >= 1000 && pressure < 50000)) category = "CAT II";
        else if (pressure >= 50000 && dn >= 25) category = "CAT III";
      } else if (service === "nonDangerousLiquid") {
        if (pressure < 50) category = "Not Regulated";
        else if (dn < 200 || (dn >= 200 && dn < 500 && pd < 500000) || (dn >= 500 && pressure < 1000)) category = "SEP";
        else if ((dn >= 200 && dn < 500 && pd >= 500000 && pressure < 50000) || (dn >= 500 && pressure >= 1000 && pressure < 50000)) category = "CAT I";
        else if (dn >= 200 && pressure >= 50000) category = "CAT II";
      }

      const volumeCategory = calculateSans347VolumeCategory(pressure, volume, service);
      const serviceLabel = byId("sansServiceType").selectedOptions[0]?.textContent || "";
      const od = getNpsOdMm(nps);
      showHtml("sansHazardResult", `<table><thead><tr><th>Parameter</th><th>Value</th></tr></thead><tbody>
        <tr><td>Service type</td><td>${esc(serviceLabel)}</td></tr>
        <tr><td>Pressure PS</td><td>${displayPressureKpa(pressure, 2, 2)}</td></tr>
        <tr><td>Volume V</td><td>${displayVolumeL(volume, 2, 3)}</td></tr>
        <tr><td>Line size</td><td>${esc(displayNps(nps, od))}</td></tr>
        <tr><td>PS x DN</td><td>${fmt(pd, 0)}</td></tr>
        <tr><td>PS x V</td><td>${fmt(pv, 0)}</td></tr>
        <tr><td>Line size assessment</td><td><strong>${esc(category)}</strong></td></tr>
        <tr><td>Volume assessment</td><td><strong>${esc(volumeCategory)}</strong></td></tr>
      </tbody></table>`);
    }

    function displayBoltSize(size) { return `${size} in`; }

    function showWpsData() {
      const key = byId("wpsSelect").value;
      if (!key) {
        byId("wpsResult").style.display = "none";
        byId("wpsResult").innerHTML = "";
        return;
      }
      const wps = state.wps[key];
      const rows = Object.entries(wps).map(([field, value]) => `<tr><td>${esc(field)}</td><td><strong>${esc(value)}</strong></td></tr>`).join("");
      showHtml("wpsResult", `<table><thead><tr><th>WPS variable</th><th>Parameters</th></tr></thead><tbody>${rows}</tbody></table>`);
    }

    function asmeSearchText(row) {
      return [
        row.nominalComposition,
        row.productForm,
        row.specNo,
        row.typeGrade,
        row.alloyDesigUnsNo,
        row.classConditionTemper,
        row.pNo,
        row.groupNo,
        row.notes
      ].filter(value => value != null).join(" ").toLowerCase();
    }

    function matchesAsmeFilters(row) {
      return asmeFilterFields.every(field => {
        const selected = byId(field.id)?.value || "";
        return !selected || String(row[field.key] ?? "") === selected;
      });
    }

    function renderAsmeTable() {
      const wrap=byId('asmeTableWrap'),count=byId('asmeCount'); if(!byId('asmeTemperature')) return;
      const query=byId('asmeSearch').value.trim().toLowerCase(), temp=byId('asmeTemperature').value||'40';
      const matches=(state.asmeTable1A.rows||[]).filter(row=>(!query||asmeSearchText(row).includes(query))&&matchesAsmeFilters(row));
      const perPage=20,pages=Math.max(1,Math.ceil(matches.length/perPage));asmePage=Math.max(0,Math.min(asmePage,pages-1));
      const rows=matches.slice(asmePage*perPage,(asmePage+1)*perPage);
      count.textContent=`${matches.length.toLocaleString()} matches`;
      byId('asmePager').innerHTML=`<button class="secondary" data-action="previousAsmePage" ${asmePage===0?'disabled':''}>Previous</button><span>Page ${asmePage+1} of ${pages} · ${matches.length?asmePage*perPage+1:0}–${Math.min((asmePage+1)*perPage,matches.length)} of ${matches.length}</span><button class="secondary" data-action="nextAsmePage" ${asmePage===pages-1?'disabled':''}>Next</button>`;
      if(!rows.length) {wrap.innerHTML='<p class="empty-state">No material rows match. Clear filters or check source availability.</p>';return;}
      const cell=v=>v===null||v===undefined||v===''?'Not supplied':esc(v);
      const stress=row=>row.stressMpaByTempC?.[temp]==null?'Unavailable at this temperature':displayStressMpa(Number(row.stressMpaByTempC[temp]));
      if(byId('asmeLayout').value==='cards') {
        wrap.innerHTML=`<div class="asme-cards">${rows.map(row=>`<article class="asme-card"><h4>${cell(row.specNo)} · ${cell(row.typeGrade)} · ${cell(row.productForm)}</h4><dl><dt>Stress at ${esc(displayTempC(Number(temp)))}</dt><dd><strong>${esc(stress(row))}</strong></dd><dt>Composition</dt><dd>${cell(row.nominalComposition)}</dd><dt>UNS / alloy</dt><dd>${cell(row.alloyDesigUnsNo)}</dd><dt>P-No. / group</dt><dd>${cell(row.pNo)} / ${cell(row.groupNo)}</dd><dt>Min tensile</dt><dd>${row.minTensileStrengthMpa==null?'Not supplied':esc(displayStressMpa(Number(row.minTensileStrengthMpa)))}</dd><dt>Min yield</dt><dd>${row.minYieldStrengthMpa==null?'Not supplied':esc(displayStressMpa(Number(row.minYieldStrengthMpa)))}</dd></dl><details><summary>Restrictions and source notes</summary>${asmeDetails(row)}</details></article>`).join('')}</div>`;
      } else {
        wrap.innerHTML=`<table><caption>ASME imported material rows at ${esc(displayTempC(Number(temp)))}</caption><thead><tr><th>Spec. / grade</th><th>Product form</th><th>Composition</th><th>UNS</th><th>Stress</th><th>Min tensile</th><th>Min yield</th><th>Restrictions / notes</th></tr></thead><tbody>${rows.map(row=>`<tr><th scope="row">${cell(row.specNo)} / ${cell(row.typeGrade)}</th><td>${cell(row.productForm)}</td><td>${cell(row.nominalComposition)}</td><td>${cell(row.alloyDesigUnsNo)}</td><td>${esc(stress(row))}</td><td>${row.minTensileStrengthMpa==null?'Not supplied':esc(displayStressMpa(Number(row.minTensileStrengthMpa)))}</td><td>${row.minYieldStrengthMpa==null?'Not supplied':esc(displayStressMpa(Number(row.minYieldStrengthMpa)))}</td><td><details><summary>View row details</summary>${asmeDetails(row)}</details></td></tr>`).join('')}</tbody></table>`;
      }
    }

    function clearAsmeSearch() {
      const search = byId("asmeSearch");
      if (search) search.value = ""; asmePage = 0;
      asmeFilterFields.forEach(field => {
        const select = byId(field.id);
        if (select) select.value = "";
      });
      renderAsmeTable();
      search?.focus();
    }

    function compoundType(compound) {
      return compound.product.startsWith("JNL") ? "JNL compounds" : "Standard compounds";
    }

    function populateCompoundTypes() {
      const available = new Set(state.compounds.map(compoundType));
      const types = ["JNL compounds", "Standard compounds"].filter(type => available.has(type));
      byId("compoundType").innerHTML = `<option value="" selected disabled hidden>Select compound type</option>` +
        types.map(type => `<option value="${esc(type)}">${esc(type)}</option>`).join("");
    }

    function resetCompoundChoice() {
      const compoundSelect = byId("compoundSelect");
      compoundSelect.innerHTML = `<option value="" selected disabled hidden>Select compound</option>`;
      compoundSelect.disabled = true;
      byId("compoundCalculatorSelect").disabled = false;
      byId("compoundInformation").hidden = true;
      byId("compoundInformation").open = false;
      showSelectedCompoundCalculator();
      runAllLiveCalculators();
    }

    function updateCompoundFluidGroups() {
      const type = byId("compoundType").value;
      const fluidSelect = byId("compoundFluidGroup");
      const groups = [...new Set(state.compounds
        .filter(compound => compoundType(compound) === type)
        .map(compound => compound.service))];
      fluidSelect.innerHTML = `<option value="" selected disabled hidden>Select fluid group</option>` +
        groups.map(group => `<option value="${esc(group)}">${esc(group)}</option>`).join("");
      fluidSelect.disabled = !type;
      fluidSelect.value = "";
      resetCompoundChoice();
    }

    function updateCompoundOptions() {
      const group = byId("compoundFluidGroup").value;
      const type = byId("compoundType").value;
      const select = byId("compoundSelect");
      const matches = state.compounds.filter(compound =>
        compound.service === group && compoundType(compound) === type
      );
      select.innerHTML = `<option value="" selected disabled hidden>Select compound</option>` +
        matches.map(compound => `<option value="${esc(compound.product)}">${esc(compound.product)}</option>`).join("");
      select.disabled = !group || !type;
      byId("compoundCalculatorSelect").disabled = false;
      byId("compoundInformation").hidden = true;
      byId("compoundInformation").open = false;
      showSelectedCompoundCalculator();
      runAllLiveCalculators();
    }

    function selectedCompound() {
      const product = byId("compoundSelect")?.value || "";
      return state.compounds.find(compound => compound.product === product) || null;
    }

    function updateCompoundSelection() {
      const compound = selectedCompound();
      const calculatorSelect = byId("compoundCalculatorSelect");
      calculatorSelect.disabled = false;
      showSelectedCompoundCalculator();
      if (!compound) {
        byId("compoundInformation").hidden = true;
        byId("compoundInformation").open = false;
        runAllLiveCalculators();
        return;
      }
      byId("compoundInformation").hidden = false;
      byId("compoundInformationLabel").textContent = `${compound.product} information`;
      renderSelectedCompoundSummary();
      runAllLiveCalculators();
    }

    function renderSelectedCompoundSummary() {
      const compound = selectedCompound();
      if (!compound) return;
      showHtml("compoundSelectionSummary", metricsHtml([
        { label: "Selected compound", value: compound.product },
        { label: "Service", value: compound.service },
        { label: "Temperature", value: compound.temperature },
        { label: "Maximum pressure", value: displayPressureKpa(compound.pressureBar * 100) },
        { label: "Re-injection", value: compound.reinjection },
        { label: "Unit volume", value: displayVolumeMm3(compound.volumeMm3) },
        { label: "Density", value: `${fmt(compound.densityKgPerMm3 * 1e6, 5)} g/cm3` }
      ]));
    }

    function showSelectedCompoundCalculator() {
      const selected = byId("compoundCalculatorSelect")?.value || "";
      document.querySelectorAll("[data-compound-calculator]").forEach(panel => {
        panel.hidden = panel.dataset.compoundCalculator !== selected;
      });
    }

    function materialGuideRangeC(row) {
      if (row.max === Infinity) return `Above ${displayTempC(fToC(row.min), 0)}`;
      return `${displayTempC(fToC(row.min), 0)} to ${displayTempC(fToC(row.max), 0)}`;
    }

    function materialGuideRangeKey(row) {
      return `${row.min}|${row.max}|${row.minExclusive ? 1 : 0}|${row.band}`;
    }

    function showMaterialGuideByTemp() {
      const selectedRange = byId("guideTempRange")?.value || "";
      const matches = materialGuideRows.filter(row => materialGuideRangeKey(row) === selectedRange);

      if (!matches.length) {
        return showHtml("guideTempResult", `<div class="notice">Select a design temperature range to display the material guide.</div>`);
      }

      const cell = value => value ? esc(value) : `<span class="muted-cell">Not supplied in source PDF</span>`;
      const rows = matches.map(row => `
        <article class="guide-card">
          <header>
            <span>${esc(row.band)}</span>
            <strong>${esc(materialGuideRangeC(row))}</strong>
          </header>
          <dl class="guide-fields">
            <div class="guide-field"><dt>Material</dt><dd><strong>${esc(row.material)}</strong></dd></div>
            <div class="guide-field"><dt>Plate</dt><dd>${cell(row.plate)}</dd></div>
            <div class="guide-field"><dt>Pipe</dt><dd>${cell(row.pipe)}</dd></div>
            <div class="guide-field"><dt>Forgings</dt><dd>${cell(row.forgings)}</dd></div>
            <div class="guide-field"><dt>Fittings</dt><dd>${cell(row.fittings)}</dd></div>
            <div class="guide-field"><dt>Bolting</dt><dd>${cell(row.bolting)}</dd></div>
          </dl>
        </article>`).join("");

      showHtml("guideTempResult", `
        <p><strong>${esc(materialGuideRangeC(matches[0]))}: ${matches.length} material guide row${matches.length === 1 ? "" : "s"}.</strong></p>
        <div class="guide-list">${rows}</div>`);
    }

    function convertLength() {
      convertUnit("lengthInput", "lengthFrom", "lengthTo", "lengthResult", { mm: 1, cm: 10, m: 1000, km: 1000000, inch: 25.4, foot: 304.8, yard: 914.4, mile: 1609344 }, "mm");
    }

    function convertVolume() {
      convertUnit("volumeInput", "volumeFrom", "volumeTo", "volumeResult", { mm3: 0.000001, cm3: 0.001, L: 1, m3: 1000, in3: 0.016387064, ft3: 28.3168466, us_gal: 3.785411784 }, "L");
    }

    function convertPressure() {
      convertUnit("pressureInput", "pressureFrom", "pressureTo", "pressureResult", { Pa: 1, kPa: 1000, MPa: 1000000, bar: 100000, psi: 6894.757293168 }, "Pa");
    }

    function convertUnit(inputId, fromId, toId, resultId, units) {
      const value = num(inputId);
      if (!Number.isFinite(value)) {
        byId(resultId).style.display = "none";
        byId(resultId).textContent = "";
        return;
      }
      const from = byId(fromId).value;
      const to = byId(toId).value;
      const converted = value * units[from] / units[to];
      showResult(resultId, `${fmt(value, 6)} ${from} = ${fmt(converted, 6)} ${to}`);
    }

    function calcRectangularVolume() {
      const errors = validatePositive([["rectLength", "Length"], ["rectWidth", "Width"], ["rectHeight", "Height"]]);
      if (errors.length) return showHtml("rectVolumeResult", `<span class="error-text">${errors.map(esc).join("<br>")}</span>`);
      const volume = num("rectLength") * num("rectWidth") * num("rectHeight");
      showResult("rectVolumeResult", `Volume: ${displayVolumeMm3(volume)}`);
    }

    function calcCylindricalVolume() {
      const errors = validatePositive([["cylDiameter", "Diameter"], ["cylLength", "Length"]]);
      if (errors.length) return showHtml("cylVolumeResult", `<span class="error-text">${errors.map(esc).join("<br>")}</span>`);
      const volume = Math.PI * (num("cylDiameter") / 2) ** 2 * num("cylLength");
      showResult("cylVolumeResult", `Volume: ${displayVolumeMm3(volume)}`);
    }

    function calculateAnnularArea(odId, idId, resultId) {
      const errors = validatePositive([[odId, "OD"], [idId, "ID"]]);
      const od = num(odId);
      const id = num(idId);
      if (!errors.length && od <= id) errors.push("OD must be larger than ID.");
      if (errors.length) return showHtml(resultId, `<span class="error-text">${errors.map(esc).join("<br>")}</span>`);
      const area = Math.PI * (od ** 2 - id ** 2) / 4;
      showResult(resultId, `Annular area: ${displayAreaMm2(area)}`);
    }

    function interpStress(collection, name, temp) { return BeruMath.stressAt(collection,name,temp); }

    function boltSize(sizeName) {
      return state.engineering.boltSizes.find(size => size.size === sizeName);
    }

    function recommendBoltSize(requiredArea) {
      return state.engineering.boltSizes
        .filter(size => Number.isFinite(Number(size.rootArea)) && Number(size.rootArea) >= requiredArea)
        .sort((a, b) => Number(a.rootArea) - Number(b.rootArea))[0];
    }

    function metricsHtml(metrics) {
      return `<div class="mini-results">${metrics.map(metric => `
        <div class="metric">
          <span>${esc(metric.label)}</span>
          <strong>${esc(metric.value)}</strong>
        </div>`).join("")}</div>`;
    }

    function calculateNonCircular() {
      const material=interpStress(state.engineering.materials,byId('ncMaterial').value,num('ncTemp'));
      if(material.error) return showErrors('nonCircularResult',null,[material.error]);
      const result=BeruMath.nonCircular({pressure:num('ncPressure'),H:num('ncH'),h:num('ncSmallH'),ca:num('ncCA'),requiredShell:num('ncTr'),shortActual:num('ncT1a'),longActual:num('ncT2a'),endActual:num('ncEndActual'),stress:material.stress,efficiency:byId('ncEndJoint').value==='Machined'?1:0.7});
      showHtml('nonCircularResult', metricsHtml([{label:'Required endplate thickness',value:displayLengthMm(result.requiredEnd)},{label:'Allowable material stress',value:displayStressMpa(material.stress)},{label:'Attachment factor C',value:fmt(result.C,4)},{label:'Rectangular factor Z',value:fmt(result.Z,4)}]) + thicknessCheck('Endplate',result.endActual,result.requiredEnd)+thicknessCheck('Shell against supplied requirement',result.actualShell,result.requiredShell)+stressReadout(material)+formulaDetails(`<p>Hc = H + 2CA; hc = h + 2CA.</p><p>C = max(0.33 × required shell / minimum actual shell, 0.2) = ${fmt(result.C,4)}.</p><p>Z = min(3.4 − 2.4Hc/hc, 2.5) = ${fmt(result.Z,4)}.</p><p>Endplate thickness = Hc × √(ZCP / SEp) + CA = ${esc(displayLengthMm(result.requiredEnd))}.</p>`));
    }

    function calculateCircular() {
      const shell=interpStress(state.engineering.materials,byId('circShellMaterial').value,num('circTemp')), end=interpStress(state.engineering.materials,byId('circEndMaterial').value,num('circTemp'));
      if(shell.error||end.error) return showErrors('circularResult',null,[shell.error,end.error].filter(Boolean));
      const r=BeruMath.circular({pressure:num('circPressure'),od:num('circOD'),id:num('circID'),actualShell:num('circShellActual'),endActual:num('circEndActual'),ca:num('circCA'),shellStress:shell.stress,endStress:end.stress,efficiency:Number(byId('circJoint').value)});
      showHtml('circularResult',metricsHtml([{label:'Required shell thickness (governing basis)',value:displayLengthMm(r.requiredShell)},{label:'Required endplate thickness',value:displayLengthMm(r.requiredEnd)},{label:'ID basis — UG-27',value:displayLengthMm(r.tId)},{label:'OD basis — Appendix 1-1',value:displayLengthMm(r.tOd)},{label:'Shell allowable stress',value:displayStressMpa(shell.stress)},{label:'Endplate allowable stress',value:displayStressMpa(end.stress)},{label:'Attachment factor Cf',value:fmt(r.cf,4)}])+thicknessCheck('Cylinder',r.actualShell,r.requiredShell)+thicknessCheck('Endplate',r.endActual,r.requiredEnd)+stressReadout(shell)+stressReadout(end)+formulaDetails(`<p>Ri,c = ID/2 + CA. Ro = OD/2.</p><p>tID = P × Ri,c / (S × E − 0.6P) + CA = ${esc(displayLengthMm(r.tId))}.</p><p>tOD = P × Ro / (S × E + 0.4P) + CA = ${esc(displayLengthMm(r.tOd))}.</p><p>Cf = max(0.33tID/tactual, 0.33tOD/tactual, 0.2) = ${fmt(r.cf,4)}.</p><p>Endplate = (ID + 2CA) × √(Cf × P / (Send × E)) + CA = ${esc(displayLengthMm(r.requiredEnd))}.</p>`));
    }

    function calculateBoltStandalone() {
      const mat=interpStress(state.engineering.boltMaterials,byId('boltMaterial').value,num('boltTemp')),size=boltSize(byId('boltSize').value);
      if(mat.error||!size) return showErrors('boltStandaloneResult',null,[mat.error||'Select a bolt with complete dimensional data.']);
      const r=BeruMath.bolts({pressure:num('boltPressure'),area:num('boltArea'),count:num('boltCount'),preload:num('boltPreload'),friction:num('boltFriction'),clearance:num('boltClearance'),stress:mat.stress,yieldStress:Number(mat.row.yield),size});
      const recommended=recommendBoltSize(r.requiredArea), pass=r.actualStress<=mat.stress;
      showHtml('boltStandaloneResult',metricsHtml([{label:'Target torque estimate — Appendix J method',value:displayTorqueNm(r.targetTorque,2,2)},{label:'Tightening torque estimate — K method',value:displayTorqueNm(r.tighteningTorque,2,2)},{label:'Parting-load torque estimate (1.1 × nominal load)',value:displayTorqueNm(r.partingTorque,2,2)},{label:'Nominal load per bolt',value:displayForceN(r.load)},{label:'Available root area',value:displayAreaMm2(r.rootArea)},{label:'Required root area',value:displayAreaMm2(r.requiredArea)},{label:'Actual bolt stress',value:displayStressMpa(r.actualStress)},{label:'Allowable stress',value:displayStressMpa(mat.stress)},{label:'Smallest recorded size meeting root-area requirement',value:recommended ? nominalBoltLabel(recommended.size) : 'No recorded size meets the area requirement'},{label:'Torque coefficient K',value:fmt(r.K,4)}])+`<div class="check-card ${pass?'':'fail'}"><strong>Pressure stress: ${pass?'within recorded allowable stress':'exceeds recorded allowable stress'}</strong>Stress margin: ${esc(displayStressMpa(mat.stress-r.actualStress))}. This check covers uniform pressure loading.</div><div class="check-card ${r.preloadForce>=r.partingForce?'':'fail'}"><strong>Selected preload: ${r.preloadForce>=r.partingForce?'meets parting-load estimate':'below parting-load estimate'}</strong>Selected ${esc(displayForceN(r.preloadForce))}; parting-load estimate ${esc(displayForceN(r.partingForce))}.</div>`+stressReadout(mat)+`<p class="support-note">The three torque estimates are separate methods, not minimum and maximum permitted torques. Yield strength is the recorded value (${esc(displayStressMpa(mat.row.yield))}), without temperature correction. Assembly limits require the applicable bolting procedure.</p>`+formulaDetails(`<p>Fn = P × A / N = ${esc(displayForceN(r.load))}; Arequired = Fn / S = ${esc(displayAreaMm2(r.requiredArea))}.</p><p>Fp = preload% × Sy × tensile area = ${esc(displayForceN(r.preloadForce))}.</p><p>Pitch diameter dp = d − 6√3p/16. Helix angle λ = atan[p/(πdp)] = ${fmt(r.lambdaDegrees,4)}°; calculations use radians.</p><p>TJ = Fp × (0.16p + 0.58μdp + Deμ/2) / 1000 = ${esc(displayTorqueNm(r.targetTorque,2,2))}.</p><p>K = {[0.5dp × (tanλ + μ/cosβ)/(1 − μtanλ/cosβ)] + 0.625μd}/d, with β = 30°.</p><p>TK = FpKd/1000 = ${esc(displayTorqueNm(r.tighteningTorque,2,2))}; Tparting = (1.1Fn)Kd/1000 = ${esc(displayTorqueNm(r.partingTorque,2,2))}.</p>`));
    }

    initEnhancements();
    loadDatabases();

    if ('serviceWorker' in navigator && location.protocol !== 'file:' && location.hostname !== 'beruapp.local') {
      navigator.serviceWorker.addEventListener('controllerchange', () => { if(window.__beruappRefreshing) return; window.__beruappRefreshing=true; recordDraft(); location.reload(); });
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').then(registration => {
          if(registration.waiting) { byId('updateStatus').textContent='App update available.'; showUpdateButton(); }
          registration.addEventListener('updatefound', () => {
            const worker=registration.installing;
            worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller){byId('updateStatus').textContent='App update available.';showUpdateButton();}});
          });
        }).catch(()=>{byId('updateStatus').textContent='Offline installation is unavailable in this browser.';});
      });
    }
