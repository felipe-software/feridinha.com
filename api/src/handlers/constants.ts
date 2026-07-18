const generalExtensions = [".png", ".jpg", ".jpeg", ".gif", ".mp3", ".mp4", ".mkv", ".ogg", ".webp", ".mov"];

const extendedExtensions = [
    ".zip",
    ".rar",
    ".wav",
    ".7z",
    ".psd",
    ".xcf",
    ".ai",
    ".bmp",
    ".jar",
    ".xz",
    ".svg",
    ".gif",
    ".deb",
    ".test",
    ".mov",
    ".webm",
].concat(generalExtensions);

// exports.extensions = {
//     general: generalExtensions,
//     extendend: extendedExtensions,
// }

// exports.upload = {
//     recentUploads: 10,
//     anon: {
//         nameLength: 5,
//     },
//     user: {
//         nameLength: 5,
//     },
//     admin: {
//         nameLength: 5,
//     },
//     founder: {
//         nameLength: 5
//     }
// }

const founders = [
    "opeepo",
    "ghiletofar",
    "diangez",
    "calamita",
    "vesse__",
    "hellsysy",
    "mellopoppin",
    "srluul",
    "crayzzer__",
    "lobisco25",
    "guilhermerufino_",
    //"feridinha"
];

const admins = ["feridinha", "boletodosub"];

const bughunters = ["ghiletofar", "diangez", "lobisco25", "feridinha"];

const suggesters = ["ghiletofar", "diangez", "lobisco25", "boletodosub", "opeepo", "feridinha", "nevilsz"];

// const achievements = [
//     {
//         name: "O primeiro de muitos",
//         description: "Faça seu primeiro upload",
//         badge: "01.png",
//         checker: (req) => req.user.stats.total_uploads === 1,
//         type: "upload",
//     },
//     {
//         name: "Ainda não é o suficiente",
//         description: "Complete 20 uploads",
//         badge: "02.png",
//         checker: (req) => req.user.stats.total_uploads === 20,
//         type: "upload",
//     },
//     {
//         name: "Apoiando desde o começo",
//         description: "Seja um usuário desde o começo do projeto",
//         badge: "03.png",
//         checker: (req) => founders.includes(req.user.name.toLowerCase()),
//         type: "login",
//     },
//     {
//         name: "Na borda do antigo limite",
//         description: "Faça um upload maior que 4.99mb",
//         badge: "04.png",
//         checker: (req) => req.file.size / 1024 / 1024 > 4.99,
//         type: "upload",
//     },
//     {
//         name: "Diferente de Cyberpunk...",
//         description: "Reporte um bug",
//         badge: "05.png",
//         checker: (req) => bughunters.includes(req.user.name.toLowerCase()),
//         type: "login",
//     },
//     {
//         name: "Quem usa entende",
//         description: "Sugira uma feature que foi implementada",
//         badge: "06.png",
//         checker: (req) => suggesters.includes(req.user.name.toLowerCase()),
//         type: "login",
//     },
// ]

// exports.apiEndpoints = ["/upload", "/delete", "/user"]

// const constants = {
//     users: {
//         bughunters,
//         suggesters,
//         admins,
//         founders,
//     },
// };

// export default constants;
