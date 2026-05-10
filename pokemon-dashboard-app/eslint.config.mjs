import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores(['.next/**', 'out/**', 'dist/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      // Static export uses <img> for unoptimized sprites; next/image is not suitable
      '@next/next/no-img-element': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      'tailwindcss/no-custom-classes': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
])

export default eslintConfig
