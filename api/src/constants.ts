import { UserRole } from "@prisma/client";

const generalExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".mp3",
    ".mp4",
    ".mkv",
    ".ogg",
    ".webp",
    ".mov",
    ".wav",
    ".avif"
]

const whitelistedExtensions = [
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
    ".mov",
    ".webm",
    ".pdf",
    ".json",
    ".txt",
    ".csv"
].concat(generalExtensions)

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
    "feridinha"
];

const admins = ["feridinha"];

const bughunters = ["ghiletofar", "diangez", "lobisco25", "feridinha", "ojack18"];

const suggesters = ["ghiletofar", "diangez", "lobisco25", "opeepo", "feridinha", "nevilsz"];

const fileLimitPerRole: Record<UserRole, number> = {
    [UserRole.ADMIN]: 100 * 1024 * 1024,
    [UserRole.USER]: 100 * 1024 * 1024,
    [UserRole.ANONYMOUS]: 15 * 1024 * 1024,
};

const constants = {
    whitelistedExtensions,
    users: {
        bughunters,
        suggesters,
        admins,
        founders,
    },
    upload: {
        fileLimitPerRole
    }
};


export default constants;
