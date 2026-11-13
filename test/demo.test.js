import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const read = (path) =>
	readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), '..', path),
		'utf8',
	);

describe('demo accessibility contracts', () => {
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
