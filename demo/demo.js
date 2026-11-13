export async function enhanceDemos(load) {
	const status = document.querySelector('[data-enhancement-status]');
	let enhanced = false;
	const refreshReportedFeedback = [];
	for (const form of document.querySelectorAll('form')) {
		const feedback = form.querySelector('[role="status"]');
		let reported = false;
		const update = () => {
			const invalid = [...form.elements].find(
				(field) => field.willValidate && !field.validity.valid,
			);
			feedback.textContent = invalid?.validationMessage || '';
		};
		refreshReportedFeedback.push(() => {
			if (reported) update();
		});
		form.addEventListener(
			'invalid',
			() => {
				reported = true;
				update();
			},
			true,
		);
		form.addEventListener('input', () => {
			if (reported) update();
			else feedback.textContent = '';
		});
		form.addEventListener('submit', (event) => {
			event.preventDefault();
			reported = false;
			feedback.textContent = enhanced
				? form.dataset.success
				: form.dataset.failed || status.dataset.failed;
		});
	}
	try {
		await load();
		if (!globalThis.customElements?.get('form-matching-fields')) {
			throw new Error('Component registration unavailable');
		}
		enhanced = true;
		for (const refresh of refreshReportedFeedback) refresh();
		status.textContent = status.dataset.ready;
	} catch {
		status.textContent = status.dataset.failed;
	}
}
