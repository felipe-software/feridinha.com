import { myEnv } from "@/config/env";
import logger from "@/config/logger";

import axios from "axios";
const isDisabled = !myEnv.CLOUDFLARE_PURGE_CACHE_TOKEN || !myEnv.CLOUDFLARE_PURGE_ZONE_ID;
export const acceptAnyStatus = () => true;

const apiClient = axios.create({
    baseURL: "https://api.cloudflare.com/client/v4",
    headers: {
        Authorization: `Bearer ${myEnv.CLOUDFLARE_PURGE_CACHE_TOKEN}`,
    },
    validateStatus: acceptAnyStatus,
});

export const purgeCacheFromCdn = async (
    filename: string,
    client: Pick<typeof apiClient, "post"> = apiClient,
    disabled = isDisabled,
): Promise<boolean> => {
    if (disabled) {
        logger.warn(`Cloudflare API is disabled, can't cache from ${filename}`);
        return false;
    }
    const url = `${myEnv.S3_RESULT_URL}/${filename}`;

    logger.info({ msg: "Deletando cache de CDN", url, filename });

    const response = await client.post(`/zones/${myEnv.CLOUDFLARE_PURGE_ZONE_ID}/purge_cache`, {
        files: [url],
    });
    if (!response.data?.success) {
        logger.error({
            zoneId: myEnv.CLOUDFLARE_PURGE_ZONE_ID,
            msg: "Erro ao tentar apagar cache da cloudflare",
            filename,
            url,
        });
    }
    return response.data?.success;
};

const cloudflare = { purgeCacheFromCdn };
export default cloudflare;
