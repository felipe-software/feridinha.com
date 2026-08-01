import { myEnv } from "@/config/env";
import logger from "@/config/logger";
import app from "./app";
import tmpUtils from "@/utils/tmp";
import { redisClient } from "@/services/redis";

if (import.meta.main) {
    tmpUtils.ensureDirsExist();
    app.listen(myEnv.PORT, () => {
        logger.info(`Servidor rodando em ${myEnv.PORT}`);
    });

    setInterval(() => {
        Bun.gc(true);
    }, 5 * 60 * 1000); // Fixes pm2 memory leak issues with custom interpreter xdddd GOD PLEASE HELP ME BECAUSE I SINNED
}

export default app; 