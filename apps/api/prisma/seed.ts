import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const presets = [
    {
      name: "Box Breathing",
      description: "Equal inhale, hold, exhale, hold — great for focus and calm.",
      inhale: 4,
      hold: 4,
      exhale: 4,
      holdAfterExhale: 4,
    },
    {
      name: "4-7-8 Relax",
      description: "Longer exhale to activate the parasympathetic nervous system.",
      inhale: 4,
      hold: 7,
      exhale: 8,
      holdAfterExhale: 0,
    },
    {
      name: "Coherent Breathing",
      description: "Equal inhale and exhale at 5 seconds each.",
      inhale: 5,
      hold: 0,
      exhale: 5,
      holdAfterExhale: 0,
    },
  ];

  for (const preset of presets) {
    await prisma.breathingPattern.upsert({
      where: { id: `preset-${preset.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `preset-${preset.name.toLowerCase().replace(/\s+/g, "-")}`,
        userId: null,
        ...preset,
      },
    });
  }

  console.log("Seeded built-in presets.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
