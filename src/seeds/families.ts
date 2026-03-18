import { type DbSeedFn } from "wasp/server";

// Botanical families and the genera (scientific name prefixes) that belong to them.
// Used to auto-assign families to existing seeded/imported plants.
const FAMILIES: {
  name: string;
  commonName: string;
  genera: string[];
}[] = [
  {
    name: "Solanaceae",
    commonName: "Nightshade family",
    genera: ["Solanum", "Capsicum"],
  },
  {
    name: "Brassicaceae",
    commonName: "Mustard / Cabbage family",
    genera: ["Brassica", "Raphanus"],
  },
  {
    name: "Cucurbitaceae",
    commonName: "Gourd family",
    genera: ["Cucumis", "Cucurbita"],
  },
  {
    name: "Fabaceae",
    commonName: "Legume family",
    genera: ["Phaseolus", "Pisum", "Vicia", "Trifolium", "Lathyrus"],
  },
  {
    name: "Apiaceae",
    commonName: "Carrot / Parsley family",
    genera: [
      "Daucus",
      "Pastinaca",
      "Apium",
      "Petroselinum",
      "Coriandrum",
      "Anethum",
      "Foeniculum",
    ],
  },
  {
    name: "Amaryllidaceae",
    commonName: "Onion family",
    genera: ["Allium"],
  },
  {
    name: "Asteraceae",
    commonName: "Daisy / Composite family",
    genera: [
      "Lactuca",
      "Helianthus",
      "Calendula",
      "Tagetes",
      "Cosmos",
      "Zinnia",
      "Rudbeckia",
      "Echinacea",
      "Matricaria",
      "Artemisia",
    ],
  },
  {
    name: "Lamiaceae",
    commonName: "Mint family",
    genera: [
      "Ocimum",
      "Mentha",
      "Origanum",
      "Thymus",
      "Salvia",
      "Lavandula",
      "Melissa",
    ],
  },
  {
    name: "Poaceae",
    commonName: "Grass family",
    genera: ["Zea", "Avena", "Secale"],
  },
  {
    name: "Rosaceae",
    commonName: "Rose family",
    genera: ["Fragaria", "Rubus", "Prunus", "Amelanchier"],
  },
  {
    name: "Grossulariaceae",
    commonName: "Gooseberry family",
    genera: ["Ribes"],
  },
  {
    name: "Amaranthaceae",
    commonName: "Amaranth family",
    genera: ["Beta", "Spinacia"],
  },
  {
    name: "Polygonaceae",
    commonName: "Buckwheat family",
    genera: ["Fagopyrum", "Rheum"],
  },
  {
    name: "Boraginaceae",
    commonName: "Borage family",
    genera: ["Borago"],
  },
  {
    name: "Tropaeolaceae",
    commonName: "Nasturtium family",
    genera: ["Tropaeolum"],
  },
  {
    name: "Caprifoliaceae",
    commonName: "Honeysuckle family",
    genera: ["Lonicera"],
  },
];

export const seedFamilies: DbSeedFn = async (prisma) => {
  console.log("Seeding plant families...");

  let familiesCreated = 0;
  let plantsLinked = 0;

  for (const { name, commonName, genera } of FAMILIES) {
    // Upsert family
    const family = await prisma.plantFamily.upsert({
      where: { name },
      update: { commonName },
      create: { name, commonName },
    });

    // Link plants whose scientificName starts with any of this family's genera
    for (const genus of genera) {
      const result = await prisma.plant.updateMany({
        where: {
          scientificName: { startsWith: genus },
          familyId: null,
        },
        data: { familyId: family.id },
      });
      plantsLinked += result.count;
    }

    familiesCreated++;
  }

  console.log(
    `Seeded ${familiesCreated} families, linked ${plantsLinked} plants.`,
  );
};
