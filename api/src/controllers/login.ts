import env, { myEnv } from "@/config/env";
import constants from "@/constants";
import session from "@/handlers/session";
import database from "@/services/database";
import twitch, { twitchCallbackSchema } from "@/services/twitch";
import { tryP } from "@/utils/promises";
import { RequestHandler } from "express";
import crypto from "crypto";
import { achievementsOrder } from "@/handlers/achievements";
import achievements from "@/handlers/achievements";
import { ExternalServiceError } from "@/utils/httpErrors";
import { readCookie } from "@/utils/cookies";
import { randomBytes, timingSafeEqual } from "crypto";

export const OAUTH_STATE_COOKIE = "fd_oauth_state";
const OAUTH_STATE_MAX_AGE = 10 * 60 * 1000;
const TOKEN_COOKIE_MAX_AGE = 2 * 60 * 1000;

export const createOAuthState = () => randomBytes(32).toString("base64url");

export const oauthStatesMatch = (expected: string | undefined, received: unknown) => {
    if (!expected || typeof received !== "string") return false;
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
};

const oauthCookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: myEnv.NODE_ENV === "production",
    path: "/login/twitch",
};

const sendTwitchError = (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1], error: unknown) => {
    const status = error instanceof ExternalServiceError ? error.upstreamStatus : 502;
    return res.status(status).error(req.t("auth.oauthUpstreamError"), "oauth_upstream_error");
};

const twitchRedirect: RequestHandler = (req, res) => {
    const state = createOAuthState();
    res.cookie(OAUTH_STATE_COOKIE, state, { ...oauthCookieOptions, maxAge: OAUTH_STATE_MAX_AGE });
    res.redirect(twitch.getRedirectUrl(state));
};

const twitchCallback: RequestHandler = async (req, res) => {
    const storedState = readCookie(req.headers.cookie, OAUTH_STATE_COOKIE);
    res.clearCookie(OAUTH_STATE_COOKIE, oauthCookieOptions);
    if (!oauthStatesMatch(storedState, req.query.state)) {
        return res.status(400).error(req.t("auth.oauthStateInvalid"), "oauth_state_invalid");
    }

    const query = twitchCallbackSchema.parse(req.query);

    const [authError, authData] = await tryP(twitch.fetchAuthDataFromCallback(query.code));
    if (authError) return sendTwitchError(req, res, authError);

    const [tokenError, tokenData] = await tryP(twitch.fetchTokenData(authData.access_token));
    if (tokenError) return sendTwitchError(req, res, tokenError);

    const [colorError, coloredUser] = await tryP(twitch.fetchUserColor(tokenData.user_id));
    if (colorError) return sendTwitchError(req, res, colorError);

    const [fetchUserDataError, userData] = await tryP(twitch.fetchUserData(coloredUser.user_login));
    if (fetchUserDataError) return sendTwitchError(req, res, fetchUserDataError);

    const defaultColors = coloredUser?.color || "#FFFFFF";
    const readableName = twitch.getReadableDisplayName(coloredUser.user_login, coloredUser.user_name);
    const user = await database.user.upsert({
        create: {
            twitchId: tokenData.user_id,
            name: readableName,
            color: defaultColors,
            profileImage: userData.profile_image_url,
        },
        update: { name: readableName },
        where: { twitchId: tokenData.user_id },
    });

    const sessionId = crypto.randomUUID();
    const token = await session.createJwt(sessionId);

    const latestUser = await database.user.update({
        where: { id: user.id },
        data: { sessions: { push: sessionId } },
        include: { uploads: true, achievements: true },
    });

    req.session = { user: latestUser };
    res.cookie("Token", token, {
        httpOnly: false,
        sameSite: "lax",
        secure: myEnv.NODE_ENV === "production",
        path: "/",
        domain: myEnv.COOKIE_DOMAIN,
        maxAge: TOKEN_COOKIE_MAX_AGE,
    });
    res.redirect(env.CLIENT_URL + "/");
    // res.success("Login realizado com sucesso", { user, token }, "login_made")
};

const validateLogin: RequestHandler = async (req, res) => {
    await achievements.handleUpdate(req.session.user!, { context: "login" });
    const allAchievements = await database.achievement.findMany({});
    const userAchievementsIds = req.session.user!.achievements.map((a) => a.id);

    const resultAchievements = allAchievements
        .map((achievement) => {
            const order = (achievementsOrder as any)[achievement.id] as number;
            if (userAchievementsIds.includes(achievement.id)) return { ...achievement, order };
            return { ...achievement, secretUrl: null, description: null, order };
        })
        .toSorted((a, b) => a.order - b.order);
    const readableLimit = constants.upload.fileLimitPerRole[req.session.user!.role] / 1024 / 1024;
    res.success(null, { ...req.session.user!, achievements: resultAchievements, readableLimit });
};

const loginController = { validateLogin, twitchCallback, twitchRedirect };

export default loginController;
