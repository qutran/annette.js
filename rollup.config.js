function createConfig({ fmt, ext }) {
  return {
    input: 'src/index.js',
    output: {
      name: 'lib',
      format: fmt,
      file: `dist/lib.${ext}`,
    },
  };
}

export default [{ fmt: 'esm', ext: 'mjs' }, { fmt: 'cjs', ext: 'js' }].map(
  createConfig,
);
