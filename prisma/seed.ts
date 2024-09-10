// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();
// async function main() {
//   //   const data = [
//   //     { name: "Alice", points: 72 },
//   //     { name: "Bob", points: 68 },
//   //     { name: "Charlie", points: 70 },
//   //     { name: "David", points: 74 },
//   //     { name: "Eva", points: 69 },
//   //     { name: "Fiona", points: 65 },
//   //     { name: "George", points: 67 },
//   //     { name: "Hannah", points: 71 },
//   //     { name: "Ian", points: 73 },
//   //     { name: "Julia", points: 66 },
//   //   ];
//   //   await prisma.$transaction(async (db) => {
//   //     const leaderBoard = await db.leaderBoard.create({
//   //       data: {
//   //         date: new Date(),
//   //       },
//   //     });
//   //     console.log(`Start seeding LeaderBoardPoints ...`);
//   //     for (const item of data) {
//   //       const leaderBoardPoint = await db.leaderBoardPoint.create({
//   //         data: {
//   //           name: item.name,
//   //           points: item.points,
//   //           leaderBoardId: leaderBoard.id,
//   //         },
//   //       });
//   //       console.log(`Created LeaderBoardPoint with id: ${leaderBoardPoint.id}`);
//   //     }
//   //     console.log(`Seeding finished.`);
//   //   });
//   // }
//   // const listedEvents = await prisma.listedEvent.findMany();
//   // for (const event of listedEvents) {
//   //   const packageGroup = await prisma.packageGroup.create({
//   //     data: {
//   //       name: "Default Group",
//   //       listedEventId: event.id,
//   //     },
//   //   });
//   //   // Update existing packages to belong to the default group
//   //   await prisma.package.updateMany({
//   //     where: { listedEventId: event.id },
//   //     data: { packageGroupId: packageGroup.id },
//   //   });
//   // }

// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

// import { HolesNumber, PrismaClient } from "@prisma/client";
// import data from "./response_1717437828347.json";

// const prisma = new PrismaClient();

// async function main() {
//   // Seed Organizations
//   for (const org of data.organizations) {
//     await prisma.organization.create({
//       data: {
//         id: org.id,
//         name: org.name,
//         image: org.image,
//         location: org.location,
//         kitPrice: org.kitPrice,
//         teePrice: org.teePrice,
//       },
//     });
//   }

//   // Seed Listed Events
//   for (const event of data.listedEvents) {
//     await prisma.listedEvent.create({
//       data: {
//         id: event.id,
//         name: event.name,
//         location: event.location,
//         description: event.description,
//         image: event.image,
//         kitPrice: event.kitPrice,
//         startDate: new Date(event.startDate),
//         type: event.type,
//       },
//     });
//   }

//   // Seed Holes Prices
//   for (const holePrice of data.holesPrices) {
//     await prisma.holesPrices.create({
//       data: {
//         id: holePrice.id,
//         amount: holePrice.amount,
//         numberOfHoles: holePrice.numberOfHoles as HolesNumber,
//         organizationId: holePrice.organizationId,
//         listedEventId: holePrice.listedEventId,
//       },
//     });
//   }

//   // Seed Kit Prices
//   for (const kitPrice of data.kitsPrices) {
//     await prisma.kitPrices.create({
//       data: {
//         id: kitPrice.id,
//         amount: kitPrice.amount,
//         organizationId: kitPrice.organizationId,
//         listedEventId: kitPrice.listedEventId,
//       },
//     });
//   }

//   // Seed Package Groups
//   for (const packageGroup of data.packageGroups) {
//     await prisma.packageGroup.create({
//       data: {
//         id: packageGroup.id,
//         name: packageGroup.name,
//         listedEventId: packageGroup.listedEventId,
//       },
//     });
//   }

//   // Seed Packages
//   for (const pkg of data.packages) {
//     await prisma.package.create({
//       data: {
//         id: pkg.id,
//         amount: pkg.amount,
//         price: pkg.price,
//         name: pkg.name,
//         listedEventId: pkg.listedEventId,
//         packageGroupId: pkg.packageGroupId,
//       },
//     });
//   }

//   // Seed Partners
//   for (const partner of data.partners) {
//     await prisma.partner.create({
//       data: {
//         id: partner.id,
//         name: partner.name,
//         image: partner.image,
//         email: partner.email,
//         phone: partner.phone,
//         location: partner.location,
//         website: partner.website,
//         description: partner.description,
//       },
//     });
//   }

//   // Seed LeaderBoards
//   for (const leaderBoard of data.leaderBoards) {
//     await prisma.leaderBoard.create({
//       data: {
//         id: leaderBoard.id,
//         date: new Date(leaderBoard.date),
//       },
//     });
//   }

//   // Seed LeaderBoard Points
//   for (const point of data.leaderBoardPoints) {
//     await prisma.leaderBoardPoint.create({
//       data: {
//         id: point.id,
//         points: point.points,
//         leaderBoardId: point.leaderBoardId,
//         profileId: point.profileId,
//         name: point.name,
//       },
//     });
//   }
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
