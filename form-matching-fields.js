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
			labels: {
				first: 'Field 1',
				second: 'Field 2',
			},
			lastAppliedMessage: '',
			mutationWorkScheduled: false,
			needsFieldRefresh: false,
			needsLabelRefresh: false,
		};

		this._onFieldInteraction = this._onFieldInteraction.bind(this);
		this._onMutations = this._onMutations.bind(this);
		this._mutationObserver = new MutationObserver(this._onMutations);
	}

	connectedCallback() {
		this._upgradeProperty('validationMessage');
		this.render();
		this._refreshFieldBindings();
		this.addEventListener('input', this._onFieldInteraction);
		this.addEventListener('change', this._onFieldInteraction);

		this._mutationObserver.observe(this, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: [
				'type',
				'disabled',
				'readonly',
				'name',
				'id',
				'aria-label',
				'for',
			],
		});
	}

	disconnectedCallback() {
		this.removeEventListener('input', this._onFieldInteraction);
		this.removeEventListener('change', this._onFieldInteraction);
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
		this._internals.needsFieldRefresh = true;
		this._internals.needsLabelRefresh = true;
		this._scheduleMutationWork();
	}

	_onFieldInteraction(event) {
		const target = event.target;
		if (!(target instanceof HTMLInputElement)) {
			return;
		}

		const { first, second } = this._internals.fields;
		if (target !== first && target !== second) {
			return;
		}

		this._validateFields();
	}

	_scheduleMutationWork() {
		if (this._internals.mutationWorkScheduled) {
			return;
		}

		this._internals.mutationWorkScheduled = true;
		queueMicrotask(() => {
			this._internals.mutationWorkScheduled = false;

			if (this._internals.needsFieldRefresh) {
				this._internals.needsFieldRefresh = false;
				this._internals.needsLabelRefresh = false;
				this._refreshFieldBindings();
				return;
			}

			if (this._internals.needsLabelRefresh) {
				this._internals.needsLabelRefresh = false;
				this._cacheFieldLabels();
				this._validateFields();
			}
		});
	}

	_refreshFieldBindings() {
		const nextFields = this._getEligibleFields();
		const { first, second } = this._internals.fields;

		const hasSameFields =
			first === nextFields.first && second === nextFields.second;

		if (hasSameFields) {
			this._cacheFieldLabels();
			this._validateFields();
			return;
		}

		if (second) {
			this._clearOwnMismatchMessage(second);
		}

		this._internals.fields = nextFields;
		this._cacheFieldLabels();
		this._validateFields();
	}

	_getEligibleFields() {
		const walker = document.createTreeWalker(this, NodeFilter.SHOW_ELEMENT);
		let first = null;
		let second = null;

		let node = walker.nextNode();
		while (node) {
			if (
				node instanceof HTMLInputElement &&
				FormMatchingFieldsElement._isEligibleInput(node)
			) {
				if (!first) {
					first = node;
				} else {
					second = node;
					break;
				}
			}

			node = walker.nextNode();
		}

		return {
			first,
			second,
		};
	}

	_cacheFieldLabels() {
		const { first, second } = this._internals.fields;
		this._internals.labels = {
			first: FormMatchingFieldsElement._getFieldLabel(first) || 'Field 1',
			second:
				FormMatchingFieldsElement._getFieldLabel(second) || 'Field 2',
		};
	}

	static _isEligibleInput(input) {
		if (input.disabled || input.readOnly) {
			return false;
		}

		const type = (input.getAttribute('type') || '').toLowerCase();
		return ELIGIBLE_INPUT_TYPES.has(type);
	}

	_validateFields() {
		const { first, second } = this._internals.fields;
		if (!first || !second) {
			this._internals.lastAppliedMessage = '';
			return;
		}

		const hasOwnMismatch = this._hasOwnMismatchMessage(second);

		const bothNonEmpty = first.value !== '' && second.value !== '';
		if (!bothNonEmpty) {
			if (hasOwnMismatch) {
				this._clearOwnMismatchMessage(second);
			}
			return;
		}

		const isMismatch = first.value !== second.value;
		if (!isMismatch) {
			if (hasOwnMismatch) {
				this._clearOwnMismatchMessage(second);
			}
			return;
		}

		const hasExternalCustomError =
			second.validity.customError && !hasOwnMismatch;

		if (
			hasExternalCustomError ||
			FormMatchingFieldsElement._hasNativeConstraintError(second)
		) {
			if (hasOwnMismatch) {
				this._clearOwnMismatchMessage(second);
			}
			return;
		}

		const mismatchMessage = this._formatValidationMessage();
		if (hasOwnMismatch && second.validationMessage === mismatchMessage) {
			return;
		}

		second.setCustomValidity(mismatchMessage);
		this._internals.lastAppliedMessage = mismatchMessage;
	}

	_hasOwnMismatchMessage(second) {
		return (
			Boolean(this._internals.lastAppliedMessage) &&
			second.validity.customError &&
			second.validationMessage === this._internals.lastAppliedMessage
		);
	}

	_clearOwnMismatchMessage(second) {
		if (!this._hasOwnMismatchMessage(second)) {
			this._internals.lastAppliedMessage = '';
			return;
		}

		second.setCustomValidity('');

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

	_formatValidationMessage() {
		const { labels } = this._internals;
		const label1 = labels.first || 'Field 1';
		const label2 = labels.second || 'Field 2';

		return this.validationMessage
			.replaceAll('{label_1}', label1)
			.replaceAll('{label_2}', label2);
	}

	static _getFieldLabel(field) {
		if (!field) {
			return '';
		}

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
