import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
const forbidden=['next','next/*','react','react/*','drizzle-orm','drizzle-orm/*','stripe','resend','**/adapters/**','**/composition/**'];
export default tseslint.config(
 {ignores:['node_modules/**','.next/**','coverage/**','docs/**','qa-results/**','test-results/**','playwright-report/**']},
 ...tseslint.configs.strict,
 {files:['**/*.{ts,tsx}'],rules:{'@typescript-eslint/no-explicit-any':'error','@typescript-eslint/ban-ts-comment':'error','@typescript-eslint/no-non-null-assertion':'error','max-lines':['error',{max:200}],'max-lines-per-function':['error',{max:40}], '@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}]}},
 {files:['src/core/**/*.{ts,tsx}'],rules:{'no-restricted-imports':['error',{patterns:forbidden}]}},
 {files:['src/app/**/*.{ts,tsx}'],plugins:{'@next/next':nextPlugin},rules:{'no-restricted-imports':['error',{patterns:['**/adapters/**','drizzle-orm','drizzle-orm/*','stripe','resend']}]}},
 {files:['src/**/*.ts','src/**/*.tsx'],rules:{'no-magic-numbers':['error',{ignore:[0,1,-1],ignoreArrayIndexes:true,ignoreTypeIndexes:true,enforceConst:true}]}},
 {files:['src/config/**/*.ts'],rules:{'no-magic-numbers':'off'}}
);
