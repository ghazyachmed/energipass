import { access, cp, mkdir, rm } from 'node:fs/promises';

const projectRoot = new URL('../', import.meta.url);
const outputDirectory = new URL('dist/', projectRoot);

// Browser assets only. worker/ is bundled by Wrangler, tests/ and docs/ are not served.
const assets = ['index.html', 'styles.css', 'src/'];

// Check every source before replacing the previous build.
for (const asset of assets) {
  await access(new URL(asset, projectRoot));
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const asset of assets) {
  await cp(new URL(asset, projectRoot), new URL(asset, outputDirectory), { recursive: true });
}

console.log(`Built ${assets.length} static asset entries into dist/`);
