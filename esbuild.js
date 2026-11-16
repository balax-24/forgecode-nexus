const esbuild = require('esbuild');

const isWatch = process.argv.includes('--watch');

async function main() {
  const extensionConfig = {
    entryPoints: ['./src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: false,
    sourcemap: true,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'info',
  };

  const mcpConfig = {
    entryPoints: ['./src/mcp-server.ts'],
    bundle: true,
    format: 'cjs',
    minify: false,
    sourcemap: true,
    platform: 'node',
    outfile: 'dist/mcp-server.js',
    external: ['vscode'],
    logLevel: 'info',
  };

  if (isWatch) {
    const extCtx = await esbuild.context(extensionConfig);
    const mcpCtx = await esbuild.context(mcpConfig);
    await Promise.all([extCtx.watch(), mcpCtx.watch()]);
    console.log('Watching for changes...');
  } else {
    await Promise.all([
      esbuild.build(extensionConfig),
      esbuild.build(mcpConfig),
    ]);
    console.log('Build completed successfully.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
