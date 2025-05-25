import babel from '@rollup/plugin-babel' // Transpiles modern JavaScript code
import { nodeResolve } from '@rollup/plugin-node-resolve' // Allows Rollup to resolve modules from node_modules
import commonjs from '@rollup/plugin-commonjs' // Converts CommonJS modules to ES6, allowing them to be included in the bundle.
import terser from '@rollup/plugin-terser';
import typescript from 'rollup-plugin-typescript2' // Compiles TypeScript files
import copy from 'rollup-plugin-copy' // Copy essential files
import path from 'path'; // Path declaration
import json from '@rollup/plugin-json';

export default [
  {
    input: 'src/index.ts', // Entry point for CommonJS and ESM builds
    output: [
      {
        dir: 'dist/cjs', // Output directory for CommonJS format
        format: 'cjs', // CommonJS format (for Node.js)
        preserveModules: true, // Keep the original module structure
        exports: 'auto', // Auto-detect export style
        sourcemap: true // Enable sourcemap
      },
      {
        dir: 'dist/esm', // Output directory for ESM format
        format: 'es', // ES Module format
        preserveModules: true, // Keep the original module structure
        exports: 'auto', // Auto-detect export style
        sourcemap: true // Enable sourcemap
      }
    ],
    plugins: [
      json(),
      commonjs(),
      typescript({
        tsconfig: path.resolve(__dirname, './tsconfig.json'),
      }),
      babel({
        exclude: 'node_modules/**/*',
        babelHelpers: 'runtime',
        plugins: ['@babel/plugin-transform-runtime']
      }),
      terser(),
    ]
  }
];
