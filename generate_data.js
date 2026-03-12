const fs = require('fs');
const path = require('path');

// Years: 2021-2033
const years = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

// US-only geography (no regions)
const geography = "U.S.";

// New segment definitions with market share splits
const segmentTypes = {
  "By Program Type": {
    "STEM & STEAM Enrichment": 0.20,
    "Coding & Computational Thinking": 0.18,
    "Reading, Writing & Language Development": 0.15,
    "Social & Emotional Learning (SEL)": 0.12,
    "Critical Thinking & Creativity Programs": 0.10,
    "21st-Century Skills & Innovation Labs": 0.10,
    "Environmental & Sustainability Education": 0.08,
    "Others (Leadership & Collaboration Skills, Cultural & Global Awareness, etc.)": 0.07
  },
  "By Age Group": {
    "Early Childhood Education (ECE) (Ages 3 to 5)": 0.12,
    "Lower Primary (Grades K to 3 / Ages 5 to 8)": 0.22,
    "Upper Primary (Grades 4 to 6 / Ages 9 to 11)": 0.25,
    "Lower Secondary / Middle School (Grades 7 to 9 / Ages 12 to 14)": 0.23,
    "Upper Secondary / High School (Grades 10 to 12 / Ages 15 to 18)": 0.18
  },
  "By Delivery Model": {
    "School-Integrated Programs": 0.30,
    "Community Learning Centers": 0.20,
    "Private Learning & Tutoring Centers": 0.18,
    "Online / Digital Learning Platforms": 0.17,
    "Blended / Hybrid Models": 0.15
  },
  "By End User": {
    "Primary / Elementary School Students": 0.35,
    "Middle School Students": 0.28,
    "High School Students": 0.25,
    "Students with Special Educational Needs (SEN)": 0.12
  }
};

// US base value (USD Million) for 2021
const baseValue = 450;

// Growth rate (CAGR) for US
const growthRate = 0.125;

// Segment-specific growth multipliers (relative to regional base CAGR)
const segmentGrowthMultipliers = {
  "By Program Type": {
    "STEM & STEAM Enrichment": 1.15,
    "Coding & Computational Thinking": 1.25,
    "Reading, Writing & Language Development": 0.90,
    "Social & Emotional Learning (SEL)": 1.10,
    "Critical Thinking & Creativity Programs": 1.05,
    "21st-Century Skills & Innovation Labs": 1.20,
    "Environmental & Sustainability Education": 1.08,
    "Others (Leadership & Collaboration Skills, Cultural & Global Awareness, etc.)": 0.95
  },
  "By Age Group": {
    "Early Childhood Education (ECE) (Ages 3 to 5)": 0.95,
    "Lower Primary (Grades K to 3 / Ages 5 to 8)": 1.02,
    "Upper Primary (Grades 4 to 6 / Ages 9 to 11)": 1.05,
    "Lower Secondary / Middle School (Grades 7 to 9 / Ages 12 to 14)": 1.08,
    "Upper Secondary / High School (Grades 10 to 12 / Ages 15 to 18)": 1.12
  },
  "By Delivery Model": {
    "School-Integrated Programs": 0.95,
    "Community Learning Centers": 1.00,
    "Private Learning & Tutoring Centers": 1.05,
    "Online / Digital Learning Platforms": 1.30,
    "Blended / Hybrid Models": 1.18
  },
  "By End User": {
    "Primary / Elementary School Students": 1.00,
    "Middle School Students": 1.05,
    "High School Students": 1.08,
    "Students with Special Educational Needs (SEN)": 1.15
  }
};

// Volume multiplier: units per USD Million (enrollment units per $1M for education programs)
const volumePerMillionUSD = 1200;

// Seeded pseudo-random for reproducibility
let seed = 42;
function seededRandom() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

function addNoise(value, noiseLevel = 0.03) {
  return value * (1 + (seededRandom() - 0.5) * 2 * noiseLevel);
}

function roundTo1(val) {
  return Math.round(val * 10) / 10;
}

function roundToInt(val) {
  return Math.round(val);
}

function generateTimeSeries(baseValue, growthRate, roundFn) {
  const series = {};
  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const rawValue = baseValue * Math.pow(1 + growthRate, i);
    series[year] = roundFn(addNoise(rawValue));
  }
  return series;
}

function generateData(isVolume) {
  const data = {};
  const roundFn = isVolume ? roundToInt : roundTo1;
  const multiplier = isVolume ? volumePerMillionUSD : 1;
  const usBase = baseValue * multiplier;

  // Generate US-only data
  data[geography] = {};
  for (const [segType, segments] of Object.entries(segmentTypes)) {
    data[geography][segType] = {};
    for (const [segName, share] of Object.entries(segments)) {
      const segGrowth = growthRate * segmentGrowthMultipliers[segType][segName];
      const segBase = usBase * share;
      data[geography][segType][segName] = generateTimeSeries(segBase, segGrowth, roundFn);
    }
  }

  return data;
}

// Generate both datasets
seed = 42;
const valueData = generateData(false);
seed = 7777;
const volumeData = generateData(true);

// Write files
const outDir = path.join(__dirname, 'public', 'data');
fs.writeFileSync(path.join(outDir, 'value.json'), JSON.stringify(valueData, null, 2));
fs.writeFileSync(path.join(outDir, 'volume.json'), JSON.stringify(volumeData, null, 2));

console.log('Generated value.json and volume.json successfully');
console.log('Geographies:', Object.keys(valueData));
console.log('Segment types:', Object.keys(valueData['U.S.']));
console.log('Sample - U.S., By Program Type:', JSON.stringify(valueData['U.S.']['By Program Type'], null, 2));
