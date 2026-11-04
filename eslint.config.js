// import js from '@eslint/js'
// import globals from 'globals'
// import reactHooks from 'eslint-plugin-react-hooks'
// import reactRefresh from 'eslint-plugin-react-refresh'
// import { defineConfig, globalIgnores } from 'eslint/config'

// export default defineConfig([
//   globalIgnores(['dist']),
//   {
//     files: ['**/*.{js,jsx}'],
//     extends: [
//       js.configs.recommended,
//       reactHooks.configs.flat.recommended,
//       reactRefresh.configs.vite,
//     ],
//     languageOptions: {
//       globals: globals.browser,
//       parserOptions: { ecmaFeatures: { jsx: true } },
//     },
//   },
// ])




import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  
  // 1. FRONTEND CONFIG (Applies to all JS/JSX except the server folder)
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['server/**/*.{js,jsx}'], // 👈 Tell the React config to ignore your Node server
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },

  // 2. BACKEND CONFIG (Applies specifically to your Node.js server folder)
  {
    files: ['server/**/*.{js,jsx}'], // 👈 Target your server folder
    extends: [js.configs.recommended], // Only use standard JS rules, no React rules
    languageOptions: {
      sourceType: 'commonjs', // 👈 Tells ESLint that this folder uses CommonJS (require/exports)
      globals: {
        ...globals.node, // 👈 Injects 'require', 'module', 'process', etc.
      },
    },
  },
])
