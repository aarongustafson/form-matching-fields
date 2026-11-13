import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const read = (path) =>
	readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
const source = await read('form-matching-fields.js');
const definition = await read('define.js');
const css = await read('demo/styles.css');
const pages = ['index.html', 'esm.html', 'unpkg.html'];
const tokens = [
	'Canvas',
	'CanvasText',
	'ButtonFace',
	'ButtonText',
	'Field',
	'FieldText',
];
// Read-only study data: 62 observations reduce to 19 distinct palettes.
const palettes = [
	['#ffffff', '#000000', '#efefef', '#000000', '#ffffff', '#000000'],
	['#121212', '#ffffff', '#6b6b6b', '#ffffff', '#3b3b3b', '#ffffff'],
	['#ffffff', '#000000', '#e9e9ed', '#000000', '#ffffff', '#000000'],
	['#1c1b22', '#fbfbfe', '#2b2a33', '#fbfbfe', '#2b2a33', '#fbfbfe'],
	['#ffffff', '#000000', '#c0c0c0', '#000000d8', '#ffffff', '#000000d8'],
	['#1e1e1e', '#ffffff', '#ffffff3f', '#ffffffd8', '#ffffff3f', '#ffffffd8'],
	['#ffffff', '#000000', '#f0f0f0', '#000000', '#ffffff', '#000000'],
	['#202020', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#3d3d3d'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffee32'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#b6f6f0'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#202020'],
	['#ffffff', '#000000', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#000000', '#ffffff', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#ffffff', '#000000', '#ffffff', '#000000d8', '#ffffff', '#000000d8'],
	['#282828', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#202020', '#ffffff', '#00000000', '#ffffff', '#00000000', '#ffffff'],
];

function substitute(palette) {
	const values = Object.fromEntries(
		tokens.map((token, index) => [token.toLowerCase(), palette[index]]),
	);
	return css.replace(
		/\b(CanvasText|Canvas|ButtonFace|ButtonText|FieldText|Field)\b/gi,
		(token) => values[token.toLowerCase()],
	);
}

async function contrast(locator) {
	return locator.evaluate((element) => {
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = 1;
		const context = canvas.getContext('2d', { willReadFrequently: true });
		const pixel = () => [...context.getImageData(0, 0, 1, 1).data];
		const paint = (color) => {
			context.fillStyle = color;
			context.fillRect(0, 0, 1, 1);
			return pixel();
		};
		const background = (node) => {
			context.clearRect(0, 0, 1, 1);
			const ancestors = [];
			for (; node; node = node.parentElement) ancestors.unshift(node);
			for (const ancestor of ancestors) {
				const style = getComputedStyle(ancestor);
				if (style.opacity !== '1')
					throw new Error('Unexpected group opacity');
				paint(style.backgroundColor);
				if (style.backgroundImage !== 'none') {
					const gradient = style.backgroundImage.match(
						/^linear-gradient\((.+), \1\)$/,
					);
					if (!gradient)
						throw new Error(
							`Unsupported background ${style.backgroundImage}`,
						);
					paint(gradient[1]);
				}
			}
			if (pixel()[3] !== 255)
				throw new Error('Expected opaque backplate');
			return pixel();
		};
		const luminance = (rgb) =>
			rgb.slice(0, 3).reduce((sum, channel, index) => {
				const value = channel / 255;
				return (
					sum +
					(value <= 0.04045
						? value / 12.92
						: ((value + 0.055) / 1.055) ** 2.4) *
						[0.2126, 0.7152, 0.0722][index]
				);
			}, 0);
		const ratio = (a, b) => {
			const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
			return (values[0] + 0.05) / (values[1] + 0.05);
		};
		const style = getComputedStyle(element);
		const fill = background(element);
		const text = ratio(paint(style.color), fill);
		background(element);
		const border = paint(style.borderTopColor);
		return {
			text,
			inside: ratio(border, fill),
			outside:
				element === document.body
					? 0
					: ratio(border, background(element.parentElement)),
			surface:
				element === document.body
					? 0
					: ratio(fill, background(element.parentElement)),
		};
	});
}

async function demo(page, name) {
	await page.route('https://esm.sh/**', (route) =>
		route.fulfill({ contentType: 'text/javascript', body: source }),
	);
	await page.route('https://unpkg.com/**', (route) =>
		route.fulfill({
			contentType: 'text/javascript',
			body: definition.replace(
				"'./form-matching-fields.js'",
				"'http://127.0.0.1:4187/form-matching-fields.js'",
			),
		}),
	);
	await page.goto(`/demo/${name}`);
	await expect(page.locator('[data-enhancement-status]')).toHaveText(
		'Matching validation is ready.',
	);
}

for (const name of pages) {
	test(`${name}: native keyboard validation, mismatch recovery, and localized feedback`, async ({
		page,
	}) => {
		await demo(page, name);
		const form = page.locator('form').first();
		const fields = form.locator('input');
		await fields.first().focus();
		await expect(fields.first()).toHaveAccessibleName('Password');
		await fields.first().press('Tab');
		await expect(fields.nth(1)).toBeFocused();
		expect(
			await fields
				.nth(1)
				.evaluate((field) => getComputedStyle(field).outlineStyle),
		).not.toBe('none');
		await fields.nth(1).press('Enter');
		await expect(fields.first()).toBeFocused();
		await fields.first().fill('correct horse');
		await fields.nth(1).fill('different');
		await fields.nth(1).press('Enter');
		await expect(fields.nth(1)).toBeFocused();
		await expect(form.locator('[role="status"]')).toContainText(
			'should match',
		);
		expect(
			await fields.nth(1).evaluate((field) => field.validity.customError),
		).toBe(true);
		await fields.nth(1).fill('correct horse');
		await expect(form.locator('[role="status"]')).toBeEmpty();
		await fields.nth(1).press('Enter');
		await expect(form.locator('[role="status"]')).toContainText('not sent');
		await expect(fields.nth(1)).toBeFocused();
		const hindi = page.locator('form[lang="hi"]');
		await hindi.locator('input').first().fill('एक');
		await hindi.locator('input').nth(1).fill('दो');
		await hindi.locator('button').click();
		await expect(hindi.locator('[role="status"]')).toContainText(
			'का मान समान होना चाहिए',
		);
		await expect(hindi.locator('input').nth(1)).toHaveAccessibleName(
			'पासवर्ड फिर से',
		);
		const email = page.locator('form').nth(1);
		await email.locator('input').first().fill('one@example.com');
		await email.locator('input').nth(1).fill('not-an-email');
		await email.locator('button').click();
		await expect(email.locator('input').nth(1)).toBeFocused();
		expect(
			await email
				.locator('input')
				.nth(1)
				.evaluate((field) => ({
					native: field.validity.typeMismatch,
					custom: field.validity.customError,
				})),
		).toEqual({ native: true, custom: false });
	});

	test(`${name}: responsive code-left/live-right pairs and 320px reflow`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await demo(page, name);
		const pair = page.locator('.code-demo-pair').first();
		let code = await pair.locator('pre').boundingBox();
		let live = await pair.locator('.demo').boundingBox();
		expect(code.x + code.width).toBeLessThanOrEqual(live.x);
		await page.setViewportSize({ width: 320, height: 800 });
		code = await pair.locator('pre').boundingBox();
		live = await pair.locator('.demo').boundingBox();
		expect(code.y + code.height).toBeLessThanOrEqual(live.y);
		expect(
			await page.evaluate(() => document.documentElement.scrollWidth),
		).toBeLessThanOrEqual(320);
		await page.addStyleTag({ content: 'html { font-size: 32px; }' });
		expect(
			await page.evaluate(() => document.documentElement.scrollWidth),
		).toBeLessThanOrEqual(320);
	});
}

test('all 19 study palettes retain reading, feedback, fields, buttons, and hover contrast', async ({
	page,
}) => {
	test.setTimeout(120000);
	for (const name of pages) {
		await demo(page, name);
		const fields = page.locator('form').first().locator('input');
		await fields.first().fill('one');
		await fields.nth(1).fill('two');
		await page.locator('form').first().locator('button').click();
		const style = await page.addStyleTag({ content: css });
		for (const [index, palette] of palettes.entries()) {
			await style.evaluate((style, css) => {
				style.textContent = css;
			}, substitute(palette));
			for (const selector of [
				'body',
				'.demo-section',
				'.demo',
				'pre',
				'footer',
				'.feedback',
				'[data-enhancement-status]',
				'input',
				'button',
				'header code',
				'.demo-section > p code',
			]) {
				const target = page.locator(selector).first();
				if (!(await target.count())) continue;
				const values = await contrast(target);
				expect(
					values.text,
					`${name} palette ${index} ${selector}`,
				).toBeGreaterThanOrEqual(4.5);
				if (['input', 'button'].includes(selector)) {
					expect(
						values.inside,
						`inside ${selector} ${index}`,
					).toBeGreaterThanOrEqual(3);
					expect(
						Math.max(values.outside, values.surface),
						`outer border or field surface ${selector} ${index}`,
					).toBeGreaterThanOrEqual(3);
				}
			}
			await page.locator('button').first().hover();
			expect(
				(await contrast(page.locator('button').first())).text,
			).toBeGreaterThanOrEqual(4.5);
			await page.locator('h1').hover();
		}
	}
});

for (const colorScheme of ['light', 'dark']) {
	test(`${colorScheme}: actual native surfaces`, async ({
		page,
		browserName,
	}) => {
		test.fail(
			process.platform === 'linux' &&
				browserName === 'webkit' &&
				colorScheme === 'dark',
			'Bundled Ubuntu WebKit ButtonText/ButtonFace has a known 1.82:1 dark pair; no global palette override.',
		);
		await page.emulateMedia({ colorScheme });
		for (const name of pages) {
			await demo(page, name);
			for (const selector of [
				'body',
				'pre',
				'input',
				'button',
				'footer',
			]) {
				expect(
					(await contrast(page.locator(selector).first())).text,
					selector,
				).toBeGreaterThanOrEqual(4.5);
			}
		}
	});
}

for (const media of [{ forcedColors: 'active' }, { contrast: 'more' }]) {
	test(`${JSON.stringify(media)}: automatic adjustment and native focus`, async ({
		page,
		browserName,
	}) => {
		await page.emulateMedia(media);
		await demo(page, 'index.html');
		const field = page.locator('input').first();
		await field.focus();
		await field.press('Tab');
		expect(
			await page
				.locator('input')
				.nth(1)
				.evaluate((field) => getComputedStyle(field).outlineStyle),
		).not.toBe('none');
		for (const selector of [
			'body',
			'.demo',
			'pre',
			'footer',
			'input',
			'button',
		]) {
			expect(
				(await contrast(page.locator(selector).first())).text,
			).toBeGreaterThanOrEqual(4.5);
			const adjustment = await page
				.locator(selector)
				.first()
				.evaluate(
					(element) => getComputedStyle(element).forcedColorAdjust,
				);
			if (adjustment === undefined) {
				expect(browserName).toBe('webkit');
				expect(
					await page.evaluate(() =>
						CSS.supports('forced-color-adjust', 'none'),
					),
				).toBe(false);
				expect(css).not.toContain('forced-color-adjust');
			} else expect(adjustment).toBe('auto');
		}
	});
}

test('failed component imports preserve entries, native constraints, and recovery guidance', async ({
	page,
}) => {
	for (const name of pages) {
		await page.route('**/form-matching-fields.js*', (route) =>
			route.abort(),
		);
		await page.route('https://esm.sh/**', (route) => route.abort());
		await page.route('https://unpkg.com/**', (route) => route.abort());
		await page.goto(`/demo/${name}`);
		await expect(page.locator('[data-enhancement-status]')).toContainText(
			'could not load',
		);
		const form = page.locator('form').first();
		await form.locator('input').first().fill('keep this');
		await form.locator('button').click();
		await expect(form.locator('input').nth(1)).toBeFocused();
		await expect(form.locator('input').first()).toHaveValue('keep this');
		await form.locator('input').nth(1).fill('different');
		await form.locator('button').click();
		await expect(form.locator('[role="status"]')).toContainText(
			'matching must be checked on the server',
		);
	}
});

test('delayed upgrade preserves entered values and native focus', async ({
	page,
}) => {
	let release;
	const gate = new Promise((resolve) => {
		release = resolve;
	});
	await page.route('**/form-matching-fields.js', async (route) => {
		await gate;
		await route.continue();
	});
	await page.goto('/demo/index.html', { waitUntil: 'commit' });
	await expect(page.locator('[data-enhancement-status]')).toContainText(
		'loading',
	);
	await page.locator('input').first().fill('one');
	await page.locator('input').nth(1).fill('two');
	release();
	await expect(page.locator('[data-enhancement-status]')).toHaveText(
		'Matching validation is ready.',
	);
	await expect(page.locator('input').nth(1)).toBeFocused();
	await expect(page.locator('input').first()).toHaveValue('one');
	expect(
		await page
			.locator('input')
			.nth(1)
			.evaluate((field) => field.validity.customError),
	).toBe(true);
});

test('JavaScript-off fallback keeps native labels, constraints, and editable fields', async ({
	browser,
}) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	for (const name of pages) {
		await page.goto(`http://127.0.0.1:4187/demo/${name}`);
		await expect(page.locator('noscript p')).toContainText('server');
		await page.locator('input').first().fill('native value');
		await page.locator('form').first().locator('button').click();
		await expect(page.locator('input').nth(1)).toBeFocused();
		await expect(page.locator('input').first()).toHaveValue('native value');
	}
	await context.close();
});
