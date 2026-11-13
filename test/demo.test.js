import {
	copyFileSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const read = (path) =>
	readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), '..', path),
		'utf8',
	);
const fingerprint = (text) =>
	createHash('sha256')
		.update(
			text.replace(
				/(https:\/\/esm\.sh\/@aarongustafson\/form-matching-fields@)\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?(?=\/form-matching-fields\.js)/g,
				'$1VERSION',
			),
		)
		.digest('hex');
const cdnFieldFingerprints = [
	'8f8ad1d327eb5948926b758e27229d23ccf595e573d9486ed043baafd44fd5af',
	'c9521030889cb98e5f7bb74b8da70980ec8b176a90089dfaeee1e641cdace581',
	'eb53a68bf8b6d1ea28f612ccabc13f3a7256192b436329e292cd82cf0407ac74',
	'a8a6104bf12bdc9bbb703fa74c71d394b7c9353fa751f40270da15344aa90aca',
];
// Preserve decoded snippet text, including whitespace; only the release pin varies.
const snippetFingerprints = {
	index: [
		'1185f2878908b6cc3d7eee7aeee2e24d98e4e708a49b9c8d7d11866cdc15d471',
		'8ec5c46d9824754c1a7c6bc8722ced89af727e85e9070dc9ed4a04ce5a78023d',
		'9cf4f826ccfafb1858ddc90bd7c39c3afeddfc7ad6dbb8ca516ee8979de3e35a',
		'5796501a98789942da4d8d2af0d79799998e920197cabd897e9996d1f515d396',
	],
	esm: [
		fingerprint(`import { FormMatchingFieldsElement } from 'https://esm.sh/@aarongustafson/form-matching-fields@VERSION/form-matching-fields.js?bundle&target=es2022';
customElements.define('form-matching-fields', FormMatchingFieldsElement);`),
		...cdnFieldFingerprints,
	],
	unpkg: [
		'c007c16fe002ae5c25b5bba9ff8e96d72ff943316c8bd8bd3fc667ec2c1a3c86',
		...cdnFieldFingerprints,
	],
};

describe('demo accessibility contracts', () => {
	it('preserves highlighting and other snippet text after a future publishing-helper version update', () => {
		const source = join(dirname(fileURLToPath(import.meta.url)), '..');
		const root = join(source, `.snippet-version-fixture-${randomUUID()}`);
		try {
			mkdirSync(join(root, 'scripts'), { recursive: true });
			mkdirSync(join(root, 'demo'));
			const pkg = JSON.parse(read('package.json'));
			pkg.version = '9.8.7';
			writeFileSync(join(root, 'package.json'), JSON.stringify(pkg));
			for (const path of [
				'scripts/update-demo-versions.js',
				'demo/esm.html',
			])
				copyFileSync(join(source, path), join(root, path));
			execFileSync(
				process.execPath,
				['scripts/update-demo-versions.js'],
				{ cwd: root },
			);
			const html = readFileSync(join(root, 'demo/esm.html'), 'utf8');
			expect(html.match(/form-matching-fields@9\.8\.7\//g)).toHaveLength(
				2,
			);
			document.body.innerHTML = html.replace(/<link[^>]*>/g, '');
			const codes = [...document.querySelectorAll('pre code')];
			expect(codes.map((code) => fingerprint(code.textContent))).toEqual(
				snippetFingerprints.esm,
			);
			for (const code of codes) {
				expect(code.querySelector('mark mark')).toBeNull();
				expect(
					[...code.querySelectorAll('mark')].map(
						(mark) => mark.textContent,
					),
				).toEqual(
					code.textContent.match(
						/<\/?form-matching-fields\b[^>]*>|import[^\n]*@aarongustafson\/form-matching-fields[^\n]*;|customElements\.define\([^;\n]*\);|defineComponentName\(\);/g,
					),
				);
			}
			expect(
				fingerprint(
					codes[0].textContent.replace(
						'target=es2022',
						'target=es2023',
					),
				),
			).not.toBe(snippetFingerprints.esm[0]);
			expect(fingerprint('const version = "1.0.1";')).not.toBe(
				fingerprint('const version = "9.8.7";'),
			);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

	it('pairs reading and control surfaces without replacing native focus', () => {
		const css = read('demo/styles.css');
		expect(css).not.toMatch(
			/GrayText|ActiveText|SelectedItem|Highlight|opacity:\s*0\.8/,
		);
		expect(css).not.toContain(':focus-visible');
		expect(css).toContain('border: 1px solid currentColor');
		expect(css).toContain('minmax(0, 1fr)');
		expect(css).toContain('color-mix(in srgb, CanvasText 80%, Canvas)');
	});

	for (const name of ['index', 'esm', 'unpkg']) {
		it(`${name} highlights every component-specific snippet and no generic code`, () => {
			document.body.innerHTML = read(`demo/${name}.html`).replace(
				/<link[^>]*>/g,
				'',
			);
			for (const code of document.querySelectorAll('pre code')) {
				const expected = code.textContent.match(
					/<\/?form-matching-fields\b[^>]*>|import[^\n]*@aarongustafson\/form-matching-fields[^\n]*;|customElements\.define\([^;\n]*\);|defineComponentName\(\);/g,
				);
				expect(expected?.length).toBeGreaterThan(0);
				expect(code.querySelector('mark mark')).toBeNull();
				expect(
					[...code.querySelectorAll('mark')].map(
						(mark) => mark.textContent,
					),
				).toEqual(expected);
			}
		});

		it(`${name} preserves decoded snippet text except the release-managed CDN version`, () => {
			document.body.innerHTML = read(`demo/${name}.html`).replace(
				/<link[^>]*>/g,
				'',
			);
			expect(
				[...document.querySelectorAll('pre code')].map((code) =>
					fingerprint(code.textContent),
				),
			).toEqual(snippetFingerprints[name]);
		});

		it(`${name} includes responsive pairs, localized labels, and failure guidance`, () => {
			const html = read(`demo/${name}.html`);
			document.body.innerHTML = html.replace(/<link[^>]*>/g, '');
			expect(document.querySelector('header a')?.textContent).toBe(
				'README',
			);
			expect(document.querySelector('main')).toBeTruthy();
			expect(document.querySelector('footer a')?.textContent).toBe(
				'Aaron Gustafson',
			);
			expect(document.querySelector('form[lang="hi"]')).toBeTruthy();
			expect(
				document.querySelector('[data-enhancement-status]'),
			).toBeTruthy();
			expect(document.querySelector('noscript')?.textContent).toContain(
				'server',
			);
			for (const form of document.querySelectorAll('form')) {
				expect(
					form.closest('.code-demo-pair')?.querySelector('pre code'),
				).toBeTruthy();
				expect(form.querySelector('[role="status"]')).toBeTruthy();
			}
		});
	}
});

describe('demo feedback', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('refreshes only previously reported feedback after a delayed upgrade changes validity', async () => {
		document.body.innerHTML = `<p data-enhancement-status data-ready="Ready">Loading</p>
			<form><input required><p role="status"></p></form>
			<form><input required><p role="status"></p></form>`;
		const { enhanceDemos } = await import('../demo/demo.js');
		let release;
		const loading = enhanceDemos(
			() =>
				new Promise((resolve) => {
					release = resolve;
				}),
		);
		const fields = document.querySelectorAll('input');
		const feedback = document.querySelectorAll('form [role="status"]');
		fields[0].dispatchEvent(new Event('invalid'));
		expect(feedback[0].textContent).not.toBe('');
		fields[0].value = 'nonempty';
		fields[0].dispatchEvent(new Event('input', { bubbles: true }));
		expect(feedback[0].textContent).toBe('');
		for (const field of fields)
			field.setCustomValidity('Mismatch after upgrade');
		release();
		await loading;
		expect(feedback[0].textContent).toBe('Mismatch after upgrade');
		expect(feedback[1].textContent).toBe('');
	});

	it('keeps native invalid handling and writes validation messages as text', async () => {
		document.body.innerHTML = `<p data-enhancement-status data-ready="Ready" data-failed="Unavailable">Loading</p>
			<form data-success="Accepted"><input required aria-describedby="feedback"><button>Submit</button><p id="feedback" role="status"></p></form>`;
		const { enhanceDemos } = await import('../demo/demo.js');
		await enhanceDemos(() => Promise.resolve());
		const field = document.querySelector('input');
		const feedback = document.querySelector('[role="status"]');
		field.setCustomValidity('<img src=x onerror=alert(1)>');
		const event = new Event('invalid', { cancelable: true });
		field.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
		expect(feedback.textContent).toBe(field.validationMessage);
		expect(feedback.children).toHaveLength(0);
		expect(
			document.querySelector('[data-enhancement-status]').textContent,
		).toBe('Ready');
		field.setCustomValidity('');
		field.value = 'valid';
		field.dispatchEvent(new Event('input', { bubbles: true }));
		expect(feedback.textContent).toBe('');
	});

	it('reports loading failure and still prevents demo form navigation', async () => {
		document.body.innerHTML = `<p data-enhancement-status data-failed="Native validation only">Loading</p>
			<form data-success="Not sent"><input required><p role="status"></p></form>`;
		const { enhanceDemos } = await import('../demo/demo.js');
		await enhanceDemos(() => Promise.reject(new Error('Offline')));
		expect(
			document.querySelector('[data-enhancement-status]').textContent,
		).toBe('Native validation only');
		const event = new Event('submit', { cancelable: true });
		document.querySelector('form').dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		expect(document.querySelector('[role="status"]').textContent).toBe(
			'Native validation only',
		);
	});
});
