import { FormMatchingFieldsElement } from './form-matching-fields.js';

export function defineComponentName(tagName = 'form-matching-fields') {
	const hasWindow = typeof window !== 'undefined';
	const registry = hasWindow ? window.customElements : undefined;

	if (!registry || typeof registry.define !== 'function') {
		return false;
	}

	if (!registry.get(tagName)) {
		registry.define(tagName, FormMatchingFieldsElement);
	}

	return true;
}

defineComponentName();
