import { beforeAll } from 'vitest';
import { FormMatchingFieldsElement } from '../form-matching-fields.js';

// Define the custom element before tests run
beforeAll(() => {
	if (!customElements.get('form-matching-fields')) {
		customElements.define(
			'form-matching-fields',
			FormMatchingFieldsElement,
		);
	}

	// Make the class available globally for testing static methods
	globalThis.FormMatchingFieldsElement = FormMatchingFieldsElement;
});
