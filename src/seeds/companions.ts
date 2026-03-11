import { type DbSeedFn } from "wasp/server";

// Companion planting relationships derived from standard companion planting charts.
// Each entry: [plantNameA, plantNameB, type, optional notes]
// "BENEFICIAL" = good companions (smiley on chart)
// "HARMFUL" = antagonistic (X on chart)
//
// This seed is ADDITIVE ONLY — it never deletes existing relationships.
// User-created or user-edited relationships are always preserved.
type Relationship = [string, string, "BENEFICIAL" | "HARMFUL", string?];

const relationships: Relationship[] = [
  // ═══════════════════════════════════════════════
  // TOMATO companions
  // ═══════════════════════════════════════════════
  [
    "Tomato",
    "Basil",
    "BENEFICIAL",
    "Basil repels aphids and flies, may improve flavor",
  ],
  ["Tomato", "Carrot", "BENEFICIAL", "Tomatoes repel carrot fly"],
  ["Tomato", "Parsley", "BENEFICIAL", "Attracts beneficial insects"],
  ["Tomato", "Chives", "BENEFICIAL", "Chives repel aphids"],
  ["Tomato", "Garlic", "BENEFICIAL", "Garlic deters red spider mites"],
  ["Tomato", "Onion", "BENEFICIAL", "Onions repel many pests"],
  ["Tomato", "Pepper", "BENEFICIAL", "Similar growing requirements"],
  ["Tomato", "Lettuce", "BENEFICIAL", "Lettuce benefits from tomato shade"],
  ["Tomato", "Spinach", "BENEFICIAL", "Good ground cover under tomatoes"],
  ["Tomato", "Celery", "BENEFICIAL", "Celery repels cabbage white butterfly"],
  [
    "Tomato",
    "Marigold",
    "BENEFICIAL",
    "Marigolds repel nematodes and whiteflies",
  ],
  ["Tomato", "Nasturtium", "BENEFICIAL", "Trap crop for aphids"],
  [
    "Tomato",
    "Borage",
    "BENEFICIAL",
    "Repels tomato hornworm, attracts pollinators",
  ],
  ["Tomato", "Sage", "BENEFICIAL", "Sage deters flea beetles"],
  ["Tomato", "Thyme", "BENEFICIAL", "Deters whiteflies"],
  ["Tomato", "Mint", "BENEFICIAL", "Repels aphids and ants"],
  ["Tomato", "Fennel", "HARMFUL", "Fennel inhibits tomato growth"],
  ["Tomato", "Potato", "HARMFUL", "Share blight and attract same pests"],
  ["Tomato", "Cabbage", "HARMFUL", "Tomatoes inhibit brassica growth"],
  [
    "Tomato",
    "Corn",
    "HARMFUL",
    "Attract the same pests (tomato hornworm/corn earworm)",
  ],
  ["Tomato", "Kohlrabi", "HARMFUL", "Stunts tomato growth"],
  ["Tomato", "Dill", "HARMFUL", "Mature dill inhibits tomato growth"],

  // ═══════════════════════════════════════════════
  // PEPPER companions
  // ═══════════════════════════════════════════════
  ["Pepper", "Basil", "BENEFICIAL", "Repels aphids, spider mites, and flies"],
  ["Pepper", "Carrot", "BENEFICIAL", "Good use of space"],
  ["Pepper", "Onion", "BENEFICIAL", "Onions deter many pests"],
  ["Pepper", "Spinach", "BENEFICIAL", "Good ground cover"],
  ["Pepper", "Marigold", "BENEFICIAL", "Deters pests"],
  ["Pepper", "Eggplant", "BENEFICIAL", "Similar growing needs"],
  ["Pepper", "Fennel", "HARMFUL", "Fennel inhibits pepper growth"],

  // ═══════════════════════════════════════════════
  // BEANS companions (applies to bush + climbing)
  // ═══════════════════════════════════════════════
  ["Beans", "Corn", "BENEFICIAL", "Three Sisters: beans fix nitrogen for corn"],
  ["Beans", "Zucchini", "BENEFICIAL", "Three Sisters: squash shades soil"],
  ["Beans", "Summer Squash", "BENEFICIAL", "Three Sisters companion"],
  ["Beans", "Winter Squash", "BENEFICIAL", "Three Sisters companion"],
  ["Beans", "Pumpkin", "BENEFICIAL", "Three Sisters companion"],
  ["Beans", "Cucumber", "BENEFICIAL", "Beans fix nitrogen, cucumbers benefit"],
  ["Beans", "Potato", "BENEFICIAL", "Beans deter Colorado potato beetle"],
  ["Beans", "Carrot", "BENEFICIAL", "Good companions"],
  ["Beans", "Cabbage", "BENEFICIAL", "Beans provide nitrogen to brassicas"],
  ["Beans", "Cauliflower", "BENEFICIAL", "Nitrogen fixing benefits brassicas"],
  ["Beans", "Broccoli", "BENEFICIAL", "Nitrogen fixing benefits brassicas"],
  [
    "Beans",
    "Brussels Sprouts",
    "BENEFICIAL",
    "Nitrogen fixing benefits brassicas",
  ],
  ["Beans", "Kale", "BENEFICIAL", "Nitrogen fixing benefits brassicas"],
  ["Beans", "Lettuce", "BENEFICIAL", "Good use of space"],
  ["Beans", "Radish", "BENEFICIAL", "Radish matures before beans need space"],
  ["Beans", "Spinach", "BENEFICIAL", "Spinach benefits from bean shade"],
  ["Beans", "Beet", "BENEFICIAL", "Good companions"],
  ["Beans", "Celery", "BENEFICIAL", "Good companions"],
  ["Beans", "Eggplant", "BENEFICIAL", "Beans deter Colorado potato beetle"],
  ["Beans", "Strawberry", "BENEFICIAL", "Beans fix nitrogen for strawberries"],
  ["Beans", "Nasturtium", "BENEFICIAL", "Trap crop for aphids"],
  ["Beans", "Rosemary", "BENEFICIAL", "Rosemary deters bean beetles"],
  ["Beans", "Marigold", "BENEFICIAL", "Deters bean beetles"],
  ["Beans", "Borage", "BENEFICIAL", "Attracts pollinators"],
  ["Beans", "Onion", "HARMFUL", "Onions inhibit bean growth"],
  ["Beans", "Garlic", "HARMFUL", "Garlic inhibits bean growth"],
  ["Beans", "Chives", "HARMFUL", "Alliums inhibit bean growth"],
  ["Beans", "Fennel", "HARMFUL", "Fennel inhibits most plants"],
  ["Beans", "Sunflower", "HARMFUL", "Sunflower allelopathy inhibits beans"],

  // ═══════════════════════════════════════════════
  // PEAS companions
  // ═══════════════════════════════════════════════
  ["Peas", "Carrot", "BENEFICIAL", "Peas fix nitrogen for carrots"],
  ["Peas", "Corn", "BENEFICIAL", "Corn provides support, peas fix nitrogen"],
  ["Peas", "Cucumber", "BENEFICIAL", "Peas fix nitrogen"],
  ["Peas", "Radish", "BENEFICIAL", "Quick harvest before peas fill in"],
  ["Peas", "Turnip", "BENEFICIAL", "Good companions"],
  ["Peas", "Beans", "BENEFICIAL", "Both fix nitrogen"],
  [
    "Peas",
    "Spinach",
    "BENEFICIAL",
    "Peas provide shade for cool-season spinach",
  ],
  ["Peas", "Lettuce", "BENEFICIAL", "Good shade and space sharing"],
  ["Peas", "Potato", "BENEFICIAL", "Good companions"],
  ["Peas", "Mint", "BENEFICIAL", "Mint repels pea moth"],
  ["Peas", "Onion", "HARMFUL", "Onions inhibit pea growth"],
  ["Peas", "Garlic", "HARMFUL", "Garlic inhibits pea growth"],
  ["Peas", "Chives", "HARMFUL", "Alliums inhibit pea growth"],

  // ═══════════════════════════════════════════════
  // CUCUMBER companions
  // ═══════════════════════════════════════════════
  ["Cucumber", "Corn", "BENEFICIAL", "Corn provides windbreak"],
  ["Cucumber", "Dill", "BENEFICIAL", "Dill attracts beneficial insects"],
  ["Cucumber", "Lettuce", "BENEFICIAL", "Good space companions"],
  ["Cucumber", "Radish", "BENEFICIAL", "Radish deters cucumber beetles"],
  ["Cucumber", "Sunflower", "BENEFICIAL", "Sunflowers attract pollinators"],
  ["Cucumber", "Nasturtium", "BENEFICIAL", "Trap crop for aphids"],
  ["Cucumber", "Marigold", "BENEFICIAL", "Deters pests"],
  ["Cucumber", "Onion", "BENEFICIAL", "Onions repel pests"],
  ["Cucumber", "Garlic", "BENEFICIAL", "Garlic repels pests"],
  ["Cucumber", "Celery", "BENEFICIAL", "Good companions"],
  ["Cucumber", "Potato", "HARMFUL", "Compete for nutrients, share diseases"],
  ["Cucumber", "Sage", "HARMFUL", "Sage inhibits cucumber growth"],
  ["Cucumber", "Fennel", "HARMFUL", "Fennel inhibits most plants"],

  // ═══════════════════════════════════════════════
  // CARROT companions
  // ═══════════════════════════════════════════════
  ["Carrot", "Chives", "BENEFICIAL", "Chives deter carrot fly"],
  ["Carrot", "Lettuce", "BENEFICIAL", "Good space companions"],
  ["Carrot", "Onion", "BENEFICIAL", "Onions repel carrot fly"],
  ["Carrot", "Radish", "BENEFICIAL", "Radish loosens soil for carrots"],
  ["Carrot", "Rosemary", "BENEFICIAL", "Rosemary repels carrot fly"],
  ["Carrot", "Sage", "BENEFICIAL", "Sage repels carrot fly"],
  ["Carrot", "Dill", "HARMFUL", "Dill cross-pollinates and stunts carrots"],
  ["Carrot", "Fennel", "HARMFUL", "Fennel inhibits carrot growth"],

  // ═══════════════════════════════════════════════
  // BEET companions
  // ═══════════════════════════════════════════════
  ["Beet", "Lettuce", "BENEFICIAL", "Good space and shade companions"],
  ["Beet", "Onion", "BENEFICIAL", "Onions deter pests"],
  ["Beet", "Garlic", "BENEFICIAL", "Garlic deters pests"],
  ["Beet", "Cabbage", "BENEFICIAL", "Good companions"],
  ["Beet", "Broccoli", "BENEFICIAL", "Good companions"],
  ["Beet", "Cauliflower", "BENEFICIAL", "Good companions"],
  ["Beet", "Kale", "BENEFICIAL", "Good companions"],
  ["Beet", "Kohlrabi", "BENEFICIAL", "Good companions"],
  ["Beet", "Swiss Chard", "BENEFICIAL", "Related plants, grow well together"],
  ["Beet", "Mint", "BENEFICIAL", "Mint improves beet health"],

  // ═══════════════════════════════════════════════
  // POTATO companions
  // ═══════════════════════════════════════════════
  ["Potato", "Cabbage", "BENEFICIAL", "Potato deters cabbage pests"],
  ["Potato", "Corn", "BENEFICIAL", "Good companions"],
  ["Potato", "Marigold", "BENEFICIAL", "Marigolds repel nematodes"],
  ["Potato", "Spinach", "BENEFICIAL", "Good ground cover"],
  ["Potato", "Lettuce", "BENEFICIAL", "Good ground cover"],
  ["Potato", "Radish", "BENEFICIAL", "Radish matures quickly"],
  ["Potato", "Pumpkin", "HARMFUL", "Compete for nutrients"],
  ["Potato", "Sunflower", "HARMFUL", "Sunflower allelopathy"],
  ["Potato", "Fennel", "HARMFUL", "Fennel inhibits potato growth"],

  // ═══════════════════════════════════════════════
  // LETTUCE companions
  // ═══════════════════════════════════════════════
  ["Lettuce", "Chives", "BENEFICIAL", "Chives repel aphids"],
  ["Lettuce", "Onion", "BENEFICIAL", "Onions repel pests"],
  ["Lettuce", "Radish", "BENEFICIAL", "Good space companions"],
  ["Lettuce", "Strawberry", "BENEFICIAL", "Good ground-level companions"],
  ["Lettuce", "Marigold", "BENEFICIAL", "Deters slugs and aphids"],
  ["Lettuce", "Dill", "BENEFICIAL", "Dill attracts beneficial insects"],
  ["Lettuce", "Garlic", "BENEFICIAL", "Garlic repels aphids"],

  // ═══════════════════════════════════════════════
  // CABBAGE / BRASSICA companions
  // ═══════════════════════════════════════════════
  ["Cabbage", "Celery", "BENEFICIAL", "Celery repels cabbage white butterfly"],
  ["Cabbage", "Chamomile", "BENEFICIAL", "Improves growth and flavor"],
  ["Cabbage", "Dill", "BENEFICIAL", "Attracts beneficial wasps"],
  ["Cabbage", "Lettuce", "BENEFICIAL", "Good space companion"],
  ["Cabbage", "Onion", "BENEFICIAL", "Onions deter cabbage pests"],
  ["Cabbage", "Spinach", "BENEFICIAL", "Good ground cover"],
  ["Cabbage", "Thyme", "BENEFICIAL", "Thyme deters cabbage worm"],
  ["Cabbage", "Mint", "BENEFICIAL", "Mint deters cabbage moth"],
  ["Cabbage", "Rosemary", "BENEFICIAL", "Rosemary repels cabbage moth"],
  ["Cabbage", "Sage", "BENEFICIAL", "Sage repels cabbage moth"],
  ["Cabbage", "Nasturtium", "BENEFICIAL", "Trap crop for cabbage pests"],
  ["Cabbage", "Marigold", "BENEFICIAL", "Deters pests"],
  ["Cabbage", "Strawberry", "HARMFUL", "Compete and attract same pests"],
  ["Cabbage", "Fennel", "HARMFUL", "Fennel inhibits brassica growth"],

  ["Broccoli", "Celery", "BENEFICIAL", "Celery repels cabbage white butterfly"],
  ["Broccoli", "Chamomile", "BENEFICIAL", "Improves growth"],
  ["Broccoli", "Dill", "BENEFICIAL", "Attracts beneficial wasps"],
  ["Broccoli", "Onion", "BENEFICIAL", "Onions deter pests"],
  ["Broccoli", "Rosemary", "BENEFICIAL", "Rosemary repels cabbage moth"],
  ["Broccoli", "Sage", "BENEFICIAL", "Sage repels cabbage moth"],
  ["Broccoli", "Thyme", "BENEFICIAL", "Thyme deters cabbage worm"],
  ["Broccoli", "Nasturtium", "BENEFICIAL", "Trap crop"],

  [
    "Cauliflower",
    "Celery",
    "BENEFICIAL",
    "Celery repels cabbage white butterfly",
  ],
  ["Cauliflower", "Onion", "BENEFICIAL", "Onions deter pests"],
  ["Cauliflower", "Spinach", "BENEFICIAL", "Good ground cover"],

  ["Brussels Sprouts", "Celery", "BENEFICIAL", "Celery repels cabbage pests"],
  ["Brussels Sprouts", "Onion", "BENEFICIAL", "Onions deter pests"],
  ["Brussels Sprouts", "Sage", "BENEFICIAL", "Sage repels cabbage moth"],
  ["Brussels Sprouts", "Thyme", "BENEFICIAL", "Thyme deters cabbage worm"],
  ["Brussels Sprouts", "Nasturtium", "BENEFICIAL", "Trap crop"],

  ["Kale", "Celery", "BENEFICIAL", "Celery repels cabbage pests"],
  ["Kale", "Cucumber", "BENEFICIAL", "Good companions"],
  ["Kale", "Lettuce", "BENEFICIAL", "Good space companions"],
  ["Kale", "Onion", "BENEFICIAL", "Onions deter pests"],
  ["Kale", "Potato", "BENEFICIAL", "Potato deters flea beetles"],

  ["Kohlrabi", "Onion", "BENEFICIAL", "Onions deter pests"],

  // ═══════════════════════════════════════════════
  // SQUASH / MELON companions
  // ═══════════════════════════════════════════════
  ["Zucchini", "Corn", "BENEFICIAL", "Three Sisters: squash shades soil"],
  ["Zucchini", "Nasturtium", "BENEFICIAL", "Trap crop for squash bugs"],
  ["Zucchini", "Marigold", "BENEFICIAL", "Deters pests"],
  ["Zucchini", "Radish", "BENEFICIAL", "Trap crop for flea beetles"],
  ["Zucchini", "Borage", "BENEFICIAL", "Attracts pollinators"],

  ["Summer Squash", "Corn", "BENEFICIAL", "Three Sisters companion"],
  ["Summer Squash", "Nasturtium", "BENEFICIAL", "Trap crop"],
  ["Summer Squash", "Borage", "BENEFICIAL", "Attracts pollinators"],

  ["Winter Squash", "Corn", "BENEFICIAL", "Three Sisters companion"],
  ["Winter Squash", "Nasturtium", "BENEFICIAL", "Trap crop"],
  ["Winter Squash", "Borage", "BENEFICIAL", "Attracts pollinators"],

  ["Pumpkin", "Corn", "BENEFICIAL", "Three Sisters companion"],
  ["Pumpkin", "Nasturtium", "BENEFICIAL", "Trap crop"],
  ["Pumpkin", "Marigold", "BENEFICIAL", "Deters pests"],
  ["Pumpkin", "Borage", "BENEFICIAL", "Attracts pollinators"],

  ["Melon", "Corn", "BENEFICIAL", "Corn provides windbreak"],
  ["Melon", "Nasturtium", "BENEFICIAL", "Trap crop for aphids"],
  ["Melon", "Sunflower", "BENEFICIAL", "Attracts pollinators"],
  ["Melon", "Radish", "BENEFICIAL", "Deters flea beetles"],

  // ═══════════════════════════════════════════════
  // ONION / GARLIC companions
  // ═══════════════════════════════════════════════
  ["Onion", "Strawberry", "BENEFICIAL", "Onions deter pests from strawberries"],
  ["Garlic", "Strawberry", "BENEFICIAL", "Garlic deters pests"],
  ["Garlic", "Cabbage", "BENEFICIAL", "Garlic deters cabbage pests"],
  ["Garlic", "Lettuce", "BENEFICIAL", "Garlic repels aphids"],
  ["Garlic", "Spinach", "BENEFICIAL", "Good companions"],

  // ═══════════════════════════════════════════════
  // RADISH companions
  // ═══════════════════════════════════════════════
  ["Radish", "Spinach", "BENEFICIAL", "Good companions"],

  // ═══════════════════════════════════════════════
  // ROOT VEGETABLE companions
  // ═══════════════════════════════════════════════
  ["Parsnip", "Onion", "BENEFICIAL", "Onions deter pests"],
  ["Parsnip", "Radish", "BENEFICIAL", "Radish marks rows"],
  ["Turnip", "Peas", "BENEFICIAL", "Peas fix nitrogen"],
  ["Rutabaga", "Onion", "BENEFICIAL", "Onions deter pests"],

  // ═══════════════════════════════════════════════
  // HERB companions
  // ═══════════════════════════════════════════════
  ["Cilantro", "Beans", "BENEFICIAL", "Attracts beneficial insects"],
  ["Cilantro", "Peas", "BENEFICIAL", "Attracts beneficial insects"],
  ["Cilantro", "Spinach", "BENEFICIAL", "Good companions"],
  ["Cilantro", "Lettuce", "BENEFICIAL", "Repels aphids"],
  ["Oregano", "Pepper", "BENEFICIAL", "Repels aphids"],
  ["Oregano", "Tomato", "BENEFICIAL", "Repels pests"],
  ["Lavender", "Cabbage", "BENEFICIAL", "Repels cabbage moth"],
  ["Lavender", "Lettuce", "BENEFICIAL", "Attracts pollinators"],
  ["Chamomile", "Onion", "BENEFICIAL", "Improves flavor"],
  ["Lemon Balm", "Tomato", "BENEFICIAL", "Attracts pollinators"],

  // ═══════════════════════════════════════════════
  // FLOWER companions
  // ═══════════════════════════════════════════════
  ["Sunflower", "Corn", "BENEFICIAL", "Both tall growers, attract pollinators"],
  ["Sunflower", "Lettuce", "BENEFICIAL", "Sunflowers provide shade"],
  ["Sunflower", "Zucchini", "BENEFICIAL", "Attracts pollinators"],
  ["Marigold", "Cucumber", "BENEFICIAL", "Deters pests"],
  ["Marigold", "Pepper", "BENEFICIAL", "Deters pests"],
  ["Marigold", "Eggplant", "BENEFICIAL", "Deters pests"],
  ["Nasturtium", "Radish", "BENEFICIAL", "Trap crop for flea beetles"],
  ["Calendula", "Tomato", "BENEFICIAL", "Attracts beneficial insects"],
  ["Calendula", "Beans", "BENEFICIAL", "Attracts beneficial insects"],
  ["Calendula", "Lettuce", "BENEFICIAL", "Deters pests"],
  ["Borage", "Strawberry", "BENEFICIAL", "Attracts pollinators, deters pests"],

  // ═══════════════════════════════════════════════
  // STRAWBERRY companions
  // ═══════════════════════════════════════════════
  ["Strawberry", "Spinach", "BENEFICIAL", "Good ground-level companions"],
  ["Strawberry", "Thyme", "BENEFICIAL", "Thyme repels pests"],
  ["Strawberry", "Sage", "BENEFICIAL", "Sage deters slugs"],
  ["Strawberry", "Chives", "BENEFICIAL", "Chives deter pests"],

  // ═══════════════════════════════════════════════
  // EGGPLANT companions
  // ═══════════════════════════════════════════════
  ["Eggplant", "Beans", "BENEFICIAL", "Beans deter Colorado potato beetle"],
  ["Eggplant", "Spinach", "BENEFICIAL", "Good ground cover"],
  ["Eggplant", "Thyme", "BENEFICIAL", "Deters garden moths"],

  // ═══════════════════════════════════════════════
  // SWISS CHARD companions
  // ═══════════════════════════════════════════════
  ["Swiss Chard", "Beans", "BENEFICIAL", "Beans fix nitrogen"],
  ["Swiss Chard", "Cabbage", "BENEFICIAL", "Good companions"],
  ["Swiss Chard", "Onion", "BENEFICIAL", "Onions deter pests"],
  ["Swiss Chard", "Lettuce", "BENEFICIAL", "Good space companions"],

  // ═══════════════════════════════════════════════
  // FENNEL — antagonistic with most plants
  // ═══════════════════════════════════════════════
  ["Fennel", "Dill", "HARMFUL", "Cross-pollinate and reduce seed quality"],
  ["Fennel", "Cabbage", "HARMFUL", "Fennel inhibits brassica growth"],
  ["Fennel", "Broccoli", "HARMFUL", "Fennel inhibits brassica growth"],
  ["Fennel", "Cauliflower", "HARMFUL", "Fennel inhibits brassica growth"],
  ["Fennel", "Peas", "HARMFUL", "Fennel inhibits pea growth"],
  ["Fennel", "Spinach", "HARMFUL", "Fennel inhibits spinach growth"],
  ["Fennel", "Eggplant", "HARMFUL", "Fennel inhibits eggplant growth"],

  // ═══════════════════════════════════════════════
  // CORN companions (beyond Three Sisters)
  // ═══════════════════════════════════════════════
  ["Corn", "Cucumber", "BENEFICIAL", "Corn provides windbreak"],
  ["Corn", "Melon", "BENEFICIAL", "Corn provides windbreak"],
  ["Corn", "Lettuce", "BENEFICIAL", "Corn provides shade"],

  // ═══════════════════════════════════════════════
  // COVER CROP companions
  // ═══════════════════════════════════════════════
  ["Crimson Clover", "Corn", "BENEFICIAL", "Fixes nitrogen"],
  ["Crimson Clover", "Cabbage", "BENEFICIAL", "Fixes nitrogen, living mulch"],
  [
    "Buckwheat",
    "Cucumber",
    "BENEFICIAL",
    "Attracts pollinators and beneficial insects",
  ],
  ["Buckwheat", "Strawberry", "BENEFICIAL", "Attracts pollinators"],
];

export const seedCompanions: DbSeedFn = async (prisma) => {
  // Build a lookup: plantName -> Plant[] (all varieties)
  const allPlants = await prisma.plant.findMany({
    select: { id: true, name: true, variety: true },
  });

  const plantsByName = new Map<
    string,
    { id: string; name: string; variety: string | null }[]
  >();
  for (const p of allPlants) {
    const existing = plantsByName.get(p.name) ?? [];
    existing.push(p);
    plantsByName.set(p.name, existing);
  }

  // Track what already exists so we skip those
  const existing = await prisma.companionPlant.findMany({
    select: { plantAId: true, plantBId: true },
  });
  const existingKeys = new Set(
    existing.map((e) => [e.plantAId, e.plantBId].sort().join(":")),
  );

  let added = 0;
  let skipped = 0;

  for (const [nameA, nameB, type, notes] of relationships) {
    const plantsA = plantsByName.get(nameA);
    const plantsB = plantsByName.get(nameB);

    if (!plantsA || !plantsB) continue;

    // Create relationships for all variety combinations
    for (const pA of plantsA) {
      for (const pB of plantsB) {
        if (pA.id === pB.id) continue;

        // Normalize key so A-B and B-A are the same
        const key = [pA.id, pB.id].sort().join(":");
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }
        existingKeys.add(key);

        const [firstId, secondId] = [pA.id, pB.id].sort();

        try {
          await prisma.companionPlant.create({
            data: {
              plantAId: firstId,
              plantBId: secondId,
              type,
              notes: notes ?? null,
            },
          });
          added++;
        } catch {
          // Skip duplicates (unique constraint)
          skipped++;
        }
      }
    }
  }

  console.log(
    `Companion seeding complete: ${added} added, ${skipped} already existed`,
  );
};
