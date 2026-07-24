import env from "@/config/env";
import database from "@/services/database";
import { ApiError } from "@/utils/promises";
import { createSecretKey } from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AUTHENTICATED_USER_INCLUDE, type AuthenticatedUser } from "@/models/userModel";

interface JwtData extends JwtPayload {
    sessionId: string;
}

const secretKey = createSecretKey(env.JWT_SECRET, "utf-8");

const createJwt = async (sessionId: string) => {
    const token = jwt.sign({ sessionId }, secretKey, { expiresIn: "30d", algorithm: "HS256" });
    return token;
};

const verifyJwt = async (token: string) => {
    const payload = jwt.verify(token, secretKey, { algorithms: ["HS256"] });
    return payload as JwtData;
};

const verify = async (token: string): Promise<AuthenticatedUser> => {
    const payload = (await verifyJwt(token)) as JwtData;

    const user = await database.user.findFirst({
        where: { sessions: { has: payload.sessionId } },
        include: AUTHENTICATED_USER_INCLUDE,
    });

    if (!user) {
        throw new ApiError({ name: "session_not_found", message: "Session not found (2)", code: "session_not_found" });
    }

    return user;
};

const session = { createJwt, verify };
export default session;
