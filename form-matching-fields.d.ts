/**
 * FormMatchingFieldsElement - Web component that automatically adds validation rules that ensure the values of descendent fields match.
 *
 * @element form-matching-fields
 *
 * @attr {string} validation-message - Custom message template with {label_1} and {label_2} placeholders.
 */
export class FormMatchingFieldsElement extends HTMLElement {
	/**
	 * List of attributes to observe for changes
	 */
	static readonly observedAttributes: string[];

	/**
	 * Internal state and flags
	 */
	private readonly _internals: {
		isRendered: boolean;
		fields: {
			first: HTMLInputElement | null;
			second: HTMLInputElement | null;
		};
		lastAppliedMessage: string;
	};

	private readonly _mutationObserver: MutationObserver;

	constructor();

	/**
	 * Called when the element is connected to the DOM
	 */
	connectedCallback(): void;

	/**
	 * Called when the element is disconnected from the DOM
	 */
	disconnectedCallback(): void;

	/**
	 * Called when an observed attribute changes
	 * @param name - The attribute name that changed
	 * @param oldValue - The previous value
	 * @param newValue - The new value
	 */
	attributeChangedCallback(
		name: string,
		oldValue: string | null,
		newValue: string | null,
	): void;

	/**
	 * Upgrade a property to handle cases where it was set before the element upgraded.
	 * This is especially important for framework compatibility.
	 * @param prop - Property name to upgrade
	 * @private
	 */
	private _upgradeProperty(prop: string): void;

	/**
	 * Custom mismatch validation message template.
	 */
	get validationMessage(): string;
	set validationMessage(value: string | null | undefined);

	/**
	 * Renders the component's shadow DOM content
	 */
	render(): void;

	private _onMutations(): void;
	private _onFieldInteraction(): void;
	private _refreshFieldBindings(): void;
	private _getEligibleFields(): {
		first: HTMLInputElement | null;
		second: HTMLInputElement | null;
	};
	private static _isEligibleInput(input: HTMLInputElement): boolean;
	private _bindFieldListeners(): void;
	private _unbindFieldListeners(): void;
	private _validateFields(): void;
	private _clearOwnMismatchMessage(second: HTMLInputElement): void;
	private static _hasNativeConstraintError(field: HTMLInputElement): boolean;
	private _formatValidationMessage(
		first: HTMLInputElement,
		second: HTMLInputElement,
	): string;
	private static _getFieldLabel(field: HTMLInputElement): string;
}
