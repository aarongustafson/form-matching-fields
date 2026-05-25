import { describe, it, expect, afterEach } from 'vitest';
import { FormMatchingFieldsElement } from '../form-matching-fields.js';

function createFixture(content) {
	const host = document.createElement('div');
	host.innerHTML = content;
	document.body.appendChild(host);
	return host;
}

function dispatchInput(el) {
	el.dispatchEvent(new Event('input', { bubbles: true }));
	el.dispatchEvent(new Event('change', { bubbles: true }));
}

function getFields(host) {
	return {
		wrapper: host.querySelector('form-matching-fields'),
		first: host.querySelector('#first'),
		second: host.querySelector('#second'),
		third: host.querySelector('#third'),
	};
}

describe('FormMatchingFieldsElement', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('is defined', () => {
		expect(customElements.get('form-matching-fields')).toBe(
			FormMatchingFieldsElement,
		);
	});

	it('creates a shadow root', () => {
		const element = document.createElement('form-matching-fields');
		expect(element.shadowRoot).toBeTruthy();
	});

	it('applies mismatch validation to the second of the first two eligible text-type fields', async () => {
		const host = createFixture(`
			<form>
				<form-matching-fields>
					<label for="first">Password</label>
					<input id="first" type="password" />

					<label for="second">Password again</label>
					<input id="second" type="password" />
				</form-matching-fields>
			</form>
		`);
		const { first, second } = getFields(host);

		first.value = 'abc123';
		second.value = 'something-else';
		dispatchInput(second);

		await Promise.resolve();

		expect(second.validity.customError).toBe(true);
		expect(second.validationMessage).toContain('Password');
		expect(second.validationMessage).toContain('Password again');
	});

	it('clears only its own mismatch error when values become equal', async () => {
		const host = createFixture(`
			<form>
				<form-matching-fields>
					<label for="first">Email</label>
					<input id="first" type="email" />

					<label for="second">Verify email</label>
					<input id="second" type="email" />
				</form-matching-fields>
			</form>
		`);
		const { first, second } = getFields(host);

		first.value = 'a@example.com';
		second.value = 'b@example.com';
		dispatchInput(second);
		await Promise.resolve();

		expect(second.validity.customError).toBe(true);

		second.value = 'a@example.com';
		dispatchInput(second);
		await Promise.resolve();

		expect(second.validity.customError).toBe(false);
		expect(second.validationMessage).toBe('');
	});

	it('does not flag mismatch until both fields are non-empty', async () => {
		const host = createFixture(`
			<form>
				<form-matching-fields>
					<label for="first">Password</label>
					<input id="first" type="password" />

					<label for="second">Password again</label>
					<input id="second" type="password" required />
				</form-matching-fields>
			</form>
		`);
		const { first, second } = getFields(host);

		first.value = 'abc123';
		second.value = '';
		dispatchInput(second);

		await Promise.resolve();

		expect(second.validity.valueMissing).toBe(true);
		expect(second.validity.customError).toBe(false);
	});

	it('supports a custom validation-message attribute', async () => {
		const host = createFixture(`
			<form>
				<form-matching-fields validation-message="Please make sure {label_2} matches {label_1}.">
					<label for="first">Email</label>
					<input id="first" type="email" />

					<label for="second">Verify email</label>
					<input id="second" type="email" />
				</form-matching-fields>
			</form>
		`);
		const { first, second } = getFields(host);

		first.value = 'a@example.com';
		second.value = 'not-a-match@example.com';
		dispatchInput(second);

		await Promise.resolve();

		expect(second.validationMessage).toBe(
			'Please make sure Verify email matches Email.',
		);
	});

	it('supports localization through validation-message (Hindi example)', async () => {
		const host = createFixture(`
			<form>
				<form-matching-fields validation-message="{label_1} और {label_2} का मान समान होना चाहिए।">
					<label for="first">पासवर्ड</label>
					<input id="first" type="password" />

					<label for="second">पासवर्ड फिर से</label>
					<input id="second" type="password" />
				</form-matching-fields>
			</form>
		`);
		const { first, second } = getFields(host);

		first.value = 'गुप्त123';
		second.value = 'अलग123';
		dispatchInput(second);

		await Promise.resolve();

		expect(second.validationMessage).toBe(
			'पासवर्ड और पासवर्ड फिर से का मान समान होना चाहिए।',
		);
	});

	it('uses aria-label when explicit labels are not present', async () => {
		const host = createFixture(`
			<form>
				<form-matching-fields>
					<input id="first" type="password" aria-label="Password" />
					<input id="second" type="password" aria-label="Password again" />
				</form-matching-fields>
			</form>
		`);
		const { first, second } = getFields(host);

		first.value = 'abc123';
		second.value = 'xyz789';
		dispatchInput(second);

		await Promise.resolve();

		expect(second.validationMessage).toContain('Password');
		expect(second.validationMessage).toContain('Password again');
	});

	it('ignores disabled and readonly fields when selecting the first two fields to match', async () => {
		const host = createFixture(`
			<form>
				<form-matching-fields>
					<input id="first" type="text" value="ignore" readonly />
					<input id="second" type="text" value="ignore" disabled />
					<input id="third" type="text" />
					<input id="fourth" type="text" />
				</form-matching-fields>
			</form>
		`);

		const third = host.querySelector('#third');
		const fourth = host.querySelector('#fourth');

		third.value = 'one';
		fourth.value = 'two';
		dispatchInput(fourth);

		await Promise.resolve();

		expect(fourth.validity.customError).toBe(true);
	});

	it('ignores non-text controls when selecting match candidates', async () => {
		const host = createFixture(`
			<form>
				<form-matching-fields>
					<input id="checkbox" type="checkbox" />
					<input id="radio" type="radio" name="x" />
					<input id="first" type="email" />
					<input id="second" type="email" />
				</form-matching-fields>
			</form>
		`);
		const { first, second } = getFields(host);

		first.value = 'a@example.com';
		second.value = 'b@example.com';
		dispatchInput(second);

		await Promise.resolve();

		expect(second.validity.customError).toBe(true);
	});

	it('does not override an existing custom validity message on the second field', async () => {
		const host = createFixture(`
			<form>
				<form-matching-fields>
					<input id="first" type="password" />
					<input id="second" type="password" />
				</form-matching-fields>
			</form>
		`);
		const { first, second } = getFields(host);

		second.setCustomValidity('Existing custom error');
		first.value = 'abc123';
		second.value = 'different';
		dispatchInput(second);

		await Promise.resolve();

		expect(second.validationMessage).toBe('Existing custom error');
	});

	it('does not override native validation errors on the second field', async () => {
		const host = createFixture(`
			<form>
				<form-matching-fields>
					<input id="first" type="email" />
					<input id="second" type="email" />
				</form-matching-fields>
			</form>
		`);
		const { first, second } = getFields(host);

		first.value = 'first@example.com';
		second.value = 'not-an-email';
		dispatchInput(second);

		await Promise.resolve();

		expect(second.validity.typeMismatch).toBe(true);
		expect(second.validity.customError).toBe(false);
	});
});
