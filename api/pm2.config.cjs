module.exports = {
    apps: [
        {
            name: "api-feridinha.com V2",
            script: "./src/index.ts",
            interpreter: "bun",
            env: {
                PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`, // Add "~/.bun/bin/bun" to PATH
            },
        },
    ],
};
