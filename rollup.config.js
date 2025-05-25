import { nodeResolve } from '@rollup/plugin-node-resolve' // Allows Rollup to resolve modules from node_modules
import commonjs from '@rollup/plugin-commonjs' // Converts CommonJS modules to ES6, allowing them to be included in the bundle.
import terser from '@rollup/plugin-terser';
import typescript from 'rollup-plugin-typescript2' // Compiles TypeScript files
import path from 'path'; // Path declaration
import json from '@rollup/plugin-json';

const pkg = require('./package.json')

const external = [
  ...Object.keys(pkg.dependencies),
  ...Object.keys(pkg.peerDependencies),
]

export default [
  {
    input: 'src/index.ts', // Entry point for CommonJS and ESM builds
    treeshake: true,
    external,
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
      nodeResolve({
        preferBuiltins: true,
      }),
      json(),
      commonjs(),
      typescript({
        tsconfig: path.resolve(__dirname, './tsconfig.json'),
      }),
      terser(),
    ]
  }
];
