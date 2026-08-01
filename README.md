<p align="center">
  <img width="620" height="349" src="https://f.feridinha.com/gdPwm.png">
</p>

# Feridinha.com

The most overengineered file hosting service for Twitch Users

[![Deploy Production IRIS](https://github.com/felipe-software/feridinha.com/actions/workflows/deploy.yaml/badge.svg?branch=main)](https://github.com/felipe-software/feridinha.com/actions/workflows/deploy.yaml)

## Features

- Twitch Account support
- Super fast uploads (uploads to memory and gives you a link instantly)
- Automatically uploads the file to a CDN (S3) and cleans the memory cache
- Supports albums
- When a file is deleted, the Cloudflare cache is purged
- Integration keys for using with Chatterino, Sharex and other clients
- Profile customization and achievements
- Profile Dashboard with your created uploads and albums
- [Chatterino link resolver custom preview content](https://a.feridinha.com/PHeG6.png)

## Env
This project uses zod to validate the API .env, search for the `src/config/env.ts` file to understand more.
```js
DATABASE_URL: z.string(), // The postgres database url. Fully required
TWITCH_CLIENT_ID: z.string(), // Twitch App. Fully required for authentication
TWITCH_SECRET: z.string(), // Twitch App. Fully required for authentication
TMI_ACCESS_TOKEN: z.string(), // Twitch Bot. Fully required for authentication
TMI_CLIENT_ID: z.string(), // Twitch Bot. Fully required for authentication
TWITCH_REDIRECT_URL: z.string(), // Twitch App. Fully required for authentication
CLIENT_URL: z.string(), // The front-end URL. Fully required for authentication. Feridinha.com for Production and localhost:5173 for dev (for example)
JWT_SECRET: z.string(), // Jwt secret. Fully required for authentication
IMAGE_PREFIX_URL: z.string().endsWith("/"), // The prefix for the image result. For example: "https://f.feridinha.com/" + imageName. The imageName will be appended to the prefix.
SENTRY_DSN: z.string(), // Sentry stuff. For monitoring errors.
NODE_ENV: z.enum(["development", "production"]), // Used for changing the logging behavior dependending on the env

S3_REGION: z.string(),  // S3 Credencial. Fully required for uploading
S3_ENDPOINT: z.string(), // S3 Credencial. Fully required for uploading
S3_ACCESS_KEY_ID: z.string(), // S3 Credencial. Fully required for uploading
S3_SECRET_ACCESS_KEY: z.string(), // S3 Credencial. Fully required for uploading
S3_BUCKET: z.string(), // S3 Credencial. Fully required for uploading
S3_RESULT_URL: z.string(), // The prefix for the image result. For example: "https://c.feridinha.com/" + imageName. The imageName will be appended to the result url.

CLOUDFLARE_PURGE_CACHE_TOKEN: z.string(), // Cloudflare CDN token for purging cache when someone deletes an image
CLOUDFLARE_PURGE_ZONE_ID: z.string(), // Cloudflare CDN token for purging cache when someone deletes an image

DELETE_REPLACER_PATH: z.string().default(path.join(process.cwd(), "cache")), // The image that will be copyied to the destination when someone delestes an image
UPLOAD_PATH: z.string().default(path.join(process.cwd(), "uploads")), // The path where stuff will be stored, not used anymore

ENCRYPTION_KEY: z.string().length(32), // Used for generating delete tokens
ENCRYPTION_IV: z.string().length(16), // Used for generating delete tokens
PORT: z.coerce.number().optional().default(9999), // Delete port

MONGODB_OLD_URL: z.string().optional(), // Old mongodb url, used for the migration script 'mongo_migrator.ts'
COOKIE_DOMAIN: z.string().optional().default("localhost"), // The domain for the authentication token. feridinha.com for production, localhost for dev

LOKI_URL: z.string().optional(), // The url for LOKI (logs)
LOKI_USER: z.string().optional(), // The http user for LOKI (logs)
LOKI_PASSWORD: z.string().optional(), // The http password for LOKI (logs)

PROXY_TRUST: z.coerce.number().optional().default(0), // How many proxies will the API trust?
```
