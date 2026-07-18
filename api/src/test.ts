// import database from "@/services/database";

// const uploads = await database.upload.findMany({
//     where: {
//         user: {
//             name: { equals: "feridinha", mode: "insensitive" },
//         },
//     },
// });

// for (const u of uploads) {
//     console.log(u.name)
//     await database.upload.update({
//         where: { name: u.name },
//         data: { name: `${u.name.split(".")[0]}.${u.name.split(".")[1]}` },
//     });
// }
