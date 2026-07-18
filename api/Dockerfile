FROM oven/bun:latest

WORKDIR /app
RUN apt update -y && apt install git -y
COPY . .
RUN ls -la
RUN bun install

EXPOSE 3000

CMD ["sh", "-c", "bun x prisma migrate deploy && bun x prisma generate && bun start"]