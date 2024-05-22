import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
async function main() {
  //   const data = [
  //     { name: "Alice", points: 72 },
  //     { name: "Bob", points: 68 },
  //     { name: "Charlie", points: 70 },
  //     { name: "David", points: 74 },
  //     { name: "Eva", points: 69 },
  //     { name: "Fiona", points: 65 },
  //     { name: "George", points: 67 },
  //     { name: "Hannah", points: 71 },
  //     { name: "Ian", points: 73 },
  //     { name: "Julia", points: 66 },
  //   ];

  //   await prisma.$transaction(async (db) => {
  //     const leaderBoard = await db.leaderBoard.create({
  //       data: {
  //         date: new Date(),
  //       },
  //     });

  //     console.log(`Start seeding LeaderBoardPoints ...`);
  //     for (const item of data) {
  //       const leaderBoardPoint = await db.leaderBoardPoint.create({
  //         data: {
  //           name: item.name,
  //           points: item.points,
  //           leaderBoardId: leaderBoard.id,
  //         },
  //       });
  //       console.log(`Created LeaderBoardPoint with id: ${leaderBoardPoint.id}`);
  //     }
  //     console.log(`Seeding finished.`);
  //   });
  // }

  const listedEvents = await prisma.listedEvent.findMany();
  for (const event of listedEvents) {
    const packageGroup = await prisma.packageGroup.create({
      data: {
        name: "Default Group",
        listedEventId: event.id,
      },
    });

    // Update existing packages to belong to the default group
    await prisma.package.updateMany({
      where: { listedEventId: event.id },
      data: { packageGroupId: packageGroup.id },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
