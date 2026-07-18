import logger from "@/config/logger";
import { PrismaClient } from "@prisma/client";

const database = new PrismaClient({ log: ["error"] });
database
    .$connect()
    .then(() => logger.info("Database conectado"))
    .catch((err) => {
        logger.fatal({ msg: "Erro ao conectar database", err });
        process.exit(1)
    });

export default database;
