FROM oven/bun:latest

WORKDIR /app
# RUN apt update -y && apt install git -y
COPY ./client .
COPY .env .env
RUN ls -la
RUN bun install
RUN bun run build

EXPOSE 3000

CMD ["sh", "-c", "bun x next start"]