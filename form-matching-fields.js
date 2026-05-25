const ELIGIBLE_INPUT_TYPES = new Set([
	'',
	'text',
	'email',
	'password',
	'search',
	'tel',
	'url',
]);

const DEFAULT_VALIDATION_MESSAGE =
	'The fields “{label_1}” and “{label_2}” should match';

/**
 * Web component that adds match validation for the first two eligible descendent text-type fields.
 *
 * Validation is additive and only sets a custom mismatch error when the target field has no
 * native or pre-existing custom validation errors.
 *
 * @element form-matching-fields
 * @attr {string} validation-message - Custom message template with {label_1} and {label_2} placeholders.
 */
export class FormMatchingFieldsElement extends HTMLElement {
	static get observedAttributes() {
		return ['validation-message'];
	}

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._internals = {
			isRendered: false,
			fields: {
				first: null,
				second: null,
			},
			lastAppliedMessage: '',
		};

		this._onFieldInteraction = this._onFieldInteraction.bind(this);
		this._onMutations = this._onMutations.bind(this);
		this._mutationObserver = new MutationObserver(this._onMutations);
	}

	connectedCallback() {
		this._upgradeProperty('validationMessage');
		this.render();
		this._refreshFieldBindings();

		this._mutationObserver.observe(this, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: [
				'type',
				'disabled',
				'readonly',
				'name',
				'id',
				'aria-label',
			],
		});
	}

	disconnectedCallback() {
		this._unbindFieldListeners();
		this._mutationObserver.disconnect();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}

		if (name === 'validation-message' && this._internals.isRendered) {
			this._validateFields();
		}
	}

	/**
	 * Upgrade a property to handle cases where it was set before the element upgraded.
	 * @param {string} prop - Property name to upgrade
	 * @private
	 */
	_upgradeProperty(prop) {
		if (Object.prototype.hasOwnProperty.call(this, prop)) {
			const value = this[prop];
			delete this[prop];
			this[prop] = value;
		}
	}

	/**
	 * Custom mismatch message template.
	 */
	get validationMessage() {
		return (
			this.getAttribute('validation-message') ||
			DEFAULT_VALIDATION_MESSAGE
		);
	}

	set validationMessage(value) {
		if (value === null || value === undefined || value === '') {
			this.removeAttribute('validation-message');
		} else {
			this.setAttribute('validation-message', value);
		}
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: contents;
				}

				:host([hidden]) {
					display: none;
				}
			</style>
			<slot></slot>
		`;

		this._internals.isRendered = true;
	}

	_onMutations() {
		this._refreshFieldBindings();
	}

	_onFieldInteraction() {
		this._validateFields();
	}

	_refreshFieldBindings() {
		const nextFields = this._getEligibleFields();
		const { first, second } = this._internals.fields;

		const hasSameFields =
			first === nextFields.first && second === nextFields.second;

		if (hasSameFields) {
			this._validateFields();
			return;
		}

		this._unbindFieldListeners();
		this._internals.fields = nextFields;
		this._bindFieldListeners();
		this._validateFields();
	}

	_getEligibleFields() {
		const allInputs = Array.from(this.querySelectorAll('input'));
		const eligible = allInputs.filter((input) =>
			FormMatchingFieldsElement._isEligibleInput(input),
		);

		return {
			first: eligible[0] || null,
			second: eligible[1] || null,
		};
	}

	static _isEligibleInput(input) {
		if (input.disabled || input.readOnly) {
			return false;
		}

		const type = (input.getAttribute('type') || '').toLowerCase();
		return ELIGIBLE_INPUT_TYPES.has(type);
	}

	_bindFieldListeners() {
		const { first, second } = this._internals.fields;
		if (!first || !second) {
			return;
		}

		first.addEventListener('input', this._onFieldInteraction);
		first.addEventListener('change', this._onFieldInteraction);
		second.addEventListener('input', this._onFieldInteraction);
		second.addEventListener('change', this._onFieldInteraction);
	}

	_unbindFieldListeners() {
		const { first, second } = this._internals.fields;
		if (first) {
			first.removeEventListener('input', this._onFieldInteraction);
			first.removeEventListener('change', this._onFieldInteraction);
		}

		if (second) {
			second.removeEventListener('input', this._onFieldInteraction);
			second.removeEventListener('change', this._onFieldInteraction);
		}
	}

	_validateFields() {
		const { first, second } = this._internals.fields;
		if (!first || !second) {
			return;
		}

		this._clearOwnMismatchMessage(second);

		const bothNonEmpty = first.value !== '' && second.value !== '';
		if (!bothNonEmpty) {
			return;
		}

		const isMismatch = first.value !== second.value;
		if (!isMismatch) {
			return;
		}

		if (
			second.validity.customError ||
			FormMatchingFieldsElement._hasNativeConstraintError(second)
		) {
			return;
		}

		const mismatchMessage = this._formatValidationMessage(first, second);
		second.setCustomValidity(mismatchMessage);
		this._internals.lastAppliedMessage = mismatchMessage;
	}

	_clearOwnMismatchMessage(second) {
		if (!this._internals.lastAppliedMessage) {
			return;
		}

		if (
			second.validity.customError &&
			second.validationMessage === this._internals.lastAppliedMessage
		) {
			second.setCustomValidity('');
		}

		this._internals.lastAppliedMessage = '';
	}

	static _hasNativeConstraintError(field) {
		const validity = field.validity;
		return (
			validity.valueMissing ||
			validity.typeMismatch ||
			validity.patternMismatch ||
			validity.tooLong ||
			validity.tooShort ||
			validity.rangeUnderflow ||
			validity.rangeOverflow ||
			validity.stepMismatch ||
			validity.badInput
		);
	}

	_formatValidationMessage(first, second) {
		const label1 =
			FormMatchingFieldsElement._getFieldLabel(first) || 'Field 1';
		const label2 =
			FormMatchingFieldsElement._getFieldLabel(second) || 'Field 2';

		return this.validationMessage
			.replaceAll('{label_1}', label1)
			.replaceAll('{label_2}', label2);
	}

	static _getFieldLabel(field) {
		const directLabel = field.labels?.[0]?.textContent?.trim();
		if (directLabel) {
			return directLabel;
		}

		const wrappingLabel = field.closest('label')?.textContent?.trim();
		if (wrappingLabel) {
			return wrappingLabel;
		}

		const ariaLabel = field.getAttribute('aria-label')?.trim();
		if (ariaLabel) {
			return ariaLabel;
		}

		if (field.name) {
			return field.name;
		}

		if (field.id) {
			return field.id;
		}

		return '';
	}
}
