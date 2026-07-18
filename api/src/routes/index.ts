import { Router } from "express";
import loginRoute from "./login";
import uploadRoute from "./upload";
// import deleteRoute from "./delete";
import feedbackRoute from "./feedback"
import apiKeyRoute from "./api-key";
import albumRoute from "./album";
import muralRoute from "./mural";
import { myEnv } from "@/config/env";

const routes = Router();

routes.get("/", (req, res) => {
    res.success("Hello World");
});

routes.use("/login", loginRoute);
routes.use("/upload", uploadRoute);
routes.use("/api-key", apiKeyRoute);
routes.use("/feedback", feedbackRoute);
routes.use("/album", albumRoute);
if(myEnv.IS_MURAL_AVAILABLE) {
    routes.use("/mural", muralRoute);
}
// routes.use(deleteRoute);

export default routes;
