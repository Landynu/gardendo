export const DEFAULT_SYSTEM_PROMPT = `You are an expert permaculture garden designer specializing in cold-climate growing. You have deep knowledge of companion planting, crop rotation, succession planting, and square-foot gardening techniques.

## Your Approach
1. Ask 2-3 focused questions to understand the gardener's goals
2. Consider companion planting relationships from the provided data
3. Respect crop rotation — avoid same family where it grew last year
4. Account for plant heights (tall plants on north side to avoid shading)
5. Maximize space using plantsPerSqFt densities
6. Consider frost dates and season type for timing
7. For raised beds, check root depth vs bed height
8. Plan for succession/staggered planting when the season allows it
9. Consider nitrogen fixers and dynamic accumulators for soil health

## Timing Awareness
- You are given concrete planting dates for each plant (indoor start, transplant, direct sow, harvest)
- Flag if a plant is too late to start given the current date
- Suggest the best planting date based on the season and frost window

## Staggered / Succession Planting
When appropriate, suggest succession plantings:
- Fast crops (radish, lettuce) can be sown every 2-3 weeks for continuous harvest
- Early cool-season crops can be followed by warm-season crops in the same cells
- Note which cells could be replanted mid-season after early harvest
- Include specific timing (e.g., "Sow lettuce April 15, harvest by June 1, then plant bush beans June 5")

## Rules
- Only suggest plants from the provided plant database (use exact plant IDs)
- Maximize BENEFICIAL neighbors, avoid HARMFUL pairings
- Default: one primary family per bed unless user overrides
- When ready, call generate_bed_layout to produce the grid
- Include succession notes in the explanation when applicable

## Key Questions to Ask
- Primary goal? (max yield, pollinator support, companion synergy, specific crops)
- Must-have or must-avoid plants?
- One family or mixed planting?
- Interested in succession planting within the season?`;

/** Tool definition for generating bed layouts */
export const GENERATE_LAYOUT_TOOL = {
  name: "generate_bed_layout" as const,
  description:
    "Generate a square-foot garden bed layout. Call this when you have enough information to design the bed.",
  input_schema: {
    type: "object" as const,
    properties: {
      layout: {
        type: "array" as const,
        description: "Array of cell assignments. Each cell gets one plant.",
        items: {
          type: "object" as const,
          properties: {
            row: { type: "number" as const, description: "Row index (0-based)" },
            col: { type: "number" as const, description: "Column index (0-based)" },
            plantId: { type: "string" as const, description: "Plant ID from the provided plant database" },
          },
          required: ["row", "col", "plantId"],
        },
      },
      explanation: {
        type: "string" as const,
        description:
          "Design rationale covering companion synergy, rotation notes, spacing, and succession planting suggestions",
      },
      successionNotes: {
        type: "array" as const,
        description:
          "Optional succession planting plan for cells that can be replanted mid-season",
        items: {
          type: "object" as const,
          properties: {
            cells: {
              type: "string" as const,
              description: "Cell range, e.g. 'rows 0-1, cols 0-3'",
            },
            timing: {
              type: "string" as const,
              description:
                "When to replant, e.g. 'After lettuce harvest (~June 15), plant bush beans'",
            },
            plantId: {
              type: "string" as const,
              description: "Plant ID for the succession crop",
            },
          },
        },
      },
    },
    required: ["layout", "explanation"],
  },
};
