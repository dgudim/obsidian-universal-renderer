import { execFileSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

function run(cmd, args, opts = {}) {
	return execFileSync(cmd, args, { stdio: 'inherit', ...opts });
}

function tryRun(cmd, args) {
	try {
		execFileSync(cmd, args, { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

function runScript(name) {
	if (tryRun('bun', ['--version'])) {
		run('bun', ['run', name]);
		return;
	}
	run('npm', ['run', name]);
}

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const version = manifest.version;

// Obsidian tags releases with the bare version (no "v" prefix).
const tag = version;

if (manifest.version !== pkg.version) {
	console.error(
		`Version mismatch: manifest.json is ${manifest.version} but package.json is ${pkg.version}. ` +
			'Bump both (e.g. `bun run version` after setting package.json version) before releasing.',
	);
	process.exit(1);
}

if (!tryRun('gh', ['--version'])) {
	console.error('GitHub CLI (gh) is required. Install it from https://cli.github.com/ and run `gh auth login`.');
	process.exit(1);
}

// Refuse to release a dirty tree so the built artifacts match a committed state.
const dirty = execFileSync('git', ['status', '--porcelain']).toString().trim();
if (dirty) {
	console.error(`Working tree is not clean. Commit or stash your changes before releasing:\n${dirty}`);
	process.exit(1);
}

console.log(`Building plugin for release ${version}...`);
runScript('build');

const assets = ['main.js', 'manifest.json', 'styles.css'];
for (const asset of assets) {
	if (!existsSync(asset)) {
		console.error(`Missing build artifact: ${asset}. Did the build succeed?`);
		process.exit(1);
	}
}

// Make sure the current commit is pushed so the release tag points at published code.
console.log('Pushing current branch...');
run('git', ['push', '--follow-tags']);

if (tryRun('gh', ['release', 'view', tag])) {
	console.error(`Release ${tag} already exists. Bump the version before releasing again.`);
	process.exit(1);
}

console.log(`Creating GitHub release ${tag}...`);
run('gh', [
	'release',
	'create',
	tag,
	...assets,
	'--title',
	version,
	'--generate-notes',
]);

console.log(`\nReleased ${version} \u2713`);
