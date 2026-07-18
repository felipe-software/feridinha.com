import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypeScript from "eslint-config-next/typescript"

export default defineConfig([
    ...nextVitals,
    ...nextTypeScript,
    {
        rules: {
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
            "react/display-name": "off",
            "react/no-children-prop": "off",
            "react/no-unescaped-entities": "off",
            "react-hooks/preserve-manual-memoization": "off",
            "react-hooks/set-state-in-effect": "off",
            "react-hooks/static-components": "off",
            "react-hooks/purity": "off",
            "prefer-const": "off",
        },
    },
    globalIgnores([".next/**", "dist/**", "out/**", "build/**", "next-env.d.ts"]),
])
