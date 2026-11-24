# form-matching-fields Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/form-matching-fields.svg)](https://www.npmjs.com/package/@aarongustafson/form-matching-fields)
[![CI status](https://img.shields.io/github/actions/workflow/status/aarongustafson/form-matching-fields/ci.yml?branch=main&label=CI)](https://github.com/aarongustafson/form-matching-fields/actions/workflows/ci.yml)
[![Minified + gzipped size](https://img.shields.io/bundlejs/size/@aarongustafson/form-matching-fields?format=minzip&label=min%2Bgzip)](https://bundlejs.com/?q=@aarongustafson/form-matching-fields)
[![License](https://img.shields.io/npm/l/@aarongustafson/form-matching-fields)](https://github.com/aarongustafson/form-matching-fields/blob/main/LICENSE)
[![Type definitions](https://img.shields.io/npm/types/@aarongustafson/form-matching-fields)](https://github.com/aarongustafson/form-matching-fields/blob/main/form-matching-fields.d.ts)

`<form-matching-fields>` adds a mismatch message to the second of two text-type
inputs without replacing native constraints or an existing custom validity
message. Without JavaScript, the fields keep their native behavior, but the
browser doesn’t compare their values. Always check submitted values on the server.

## Demo

[Live Demo](https://aarongustafson.github.io/form-matching-fields/demo/) ([Source](./demo/index.html))

Additional demos:

- [ESM CDN Demo](https://aarongustafson.github.io/form-matching-fields/demo/esm.html) ([Source](./demo/esm.html))
- [Unpkg CDN Demo](https://aarongustafson.github.io/form-matching-fields/demo/unpkg.html) ([Source](./demo/unpkg.html))

## Installation

```bash
npm install @aarongustafson/form-matching-fields
```

## Usage

### Register the custom element

Import `define.js` to register `<form-matching-fields>`:

```javascript
import '@aarongustafson/form-matching-fields/define.js';
```

Or use the define-only script in HTML:

```html
<script
  src="./node_modules/@aarongustafson/form-matching-fields/define.js"
  type="module"
></script>
```

### Import the class without registration

The main package import and the `form-matching-fields.js` subpath both export the
class without registering it. Register it yourself if you need a different tag
name, and use that name in your HTML:

```javascript
import { FormMatchingFieldsElement } from '@aarongustafson/form-matching-fields';

customElements.define('my-custom-name', FormMatchingFieldsElement);
```

### Basic Example

```html
<form action="/account" method="post">
  <form-matching-fields>
    <label for="password">Password</label>
    <input id="password" name="password" type="password" required />

    <label for="password-again">Password again</label>
    <input id="password-again" name="password-again" type="password" required />
  </form-matching-fields>
  <button type="submit">Create account</button>
</form>
```

Replace `/account` with your application’s endpoint. The component sets a custom
validity message on the second field when both values are nonempty and different.
Native form validation then blocks submission and focuses the invalid field.
It doesn’t submit the form or check password strength.

## Matching behavior

- It only looks at descendant input controls.
- It only considers text-type inputs: text, email, password, search, tel, and url.
- An omitted or empty `type` is also eligible; other types and `textarea` elements aren’t.
- It ignores disabled and readonly fields.
- It always compares the first two eligible fields.
- It only applies mismatch validation when both fields are non-empty.
- It pins mismatch validation to the second field.
- It compares exact values, without trimming whitespace or changing case.
- With fewer than two eligible fields, it adds no matching validation.

### Existing validation

The component does not replace native or existing custom validation:

- If the second field already has native validation issues (such as required or type mismatch), the component does not apply a mismatch message.
- If the second field already has a custom validity message, the component does not replace it.
- The component only clears a mismatch message that it previously set itself.

Matching runs on connection and on `input` and `change` events from the paired
fields. The component also refreshes its pair and labels when relevant descendant
markup changes. If your script assigns a field’s `value` or changes external
custom validity, dispatch an `input` or `change` event to request a new comparison.

Disconnecting the component removes its interaction listeners and mutation
observer; it does **not** clear an existing mismatch message from the second
field. Reconnection refreshes the pair and validation. If you remove the wrapper
while retaining its fields, account for any remaining custom validity.

## Attributes

| Attribute            | Type     | Default                                               | Description                                                                                         |
| -------------------- | -------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `validation-message` | `string` | `The fields “{label_1}” and “{label_2}” should match` | Custom mismatch message template. Supports placeholder replacement for `{label_1}` and `{label_2}`. |

## Properties

| Property            | Type     | Description                                                                                                                   |
| ------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `validationMessage` | `string` | Reads and writes `validation-message`. Assigning `null`, `undefined`, or `''` removes the attribute and restores the default. |

An absent or empty `validation-message` uses the default. Changing it updates
matching validation. The property and attribute share the same configuration;
there’s no separate property override.

## Message Label Resolution

When replacing `{label_1}` and `{label_2}`, labels are resolved in this order:

1. Text from the first associated label in `input.labels` (an explicit or wrapping label)
2. Closest wrapping `<label>` text
3. `aria-label`
4. `name`
5. `id`

If none supplies text, the component uses `Field 1` or `Field 2`. These fallbacks
aren’t accessible names: author meaningful labels for both inputs. The component
uses label text in its message, not the entered values.

## Methods and events

The component adds no validation command or custom event. Use the form’s native
[`checkValidity()` and `reportValidity()`](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation)
methods to check constraints or show browser feedback. The exported
`defineComponentName(tagName = 'form-matching-fields')` helper in `define.js`
registers the class if the tag isn’t already defined. Importing that module calls
the helper; it returns `false` without a browser custom element registry and
`true` when a registry is available.

## Examples

### Email Verification

See [email verification](https://aarongustafson.github.io/form-matching-fields/demo/#email-verification)
for native email constraints alongside matching.

### Custom Validation Message

```html
<form-matching-fields
  validation-message="Please make sure {label_2} matches {label_1}."
>
  <label for="email">Email</label>
  <input id="email" type="email" required />

  <label for="verify-email">Verify email</label>
  <input id="verify-email" type="email" required />
</form-matching-fields>
```

### Localized (Hindi) Message

Translate `validation-message` and both field labels together. The
[Hindi example](https://aarongustafson.github.io/form-matching-fields/demo/#hindi-mismatch-message)
also translates the submit label and the demo’s persistent feedback.

## Styling and validation feedback

The component doesn’t paint fields, messages, or focus indicators. Its existing
shadow root only supplies a slot; labels, inputs, and buttons stay in the light
DOM. Native validation still owns invalid-field focus and the browser’s validation
message. Author `validation-message` and meaningful field labels to translate
mismatch feedback; native required and email messages use the browser’s language.

Style the light-DOM inputs and labels with your own selectors. The component
exposes no CSS custom properties or parts. Keep errors visible in text, not just
color, and preserve the browser’s focus indicator.

The [demos](./demo/index.html#password-confirmation) add a persistent text region
described by both fields after an invalid submission. That region is
**demo-authored**, not component output: it shows the component’s mismatch message
or an authored reminder to check native constraints. The helper doesn’t copy
native browser messages, which can include entered values, into the page.
It writes messages with `textContent` and doesn’t move focus or suppress the
browser’s validation popup. If a form has already reported an error while the component loads,
its feedback refreshes after upgrade applies matching validation. An independent
inline submit guard prevents navigation even if the demo helper fails to load;
the page then shows the authored failure and recovery guidance.
The Hindi example authors its labels, mismatch message, and
success text. Loading and import failures leave fields editable and explain
recovery; without enhancement, required and email checks still work, but matching
doesn’t. Always validate submitted values on the server. The demos have no
submission endpoint and don’t store entries.

Browser validation UI and live-region announcements vary. The component doesn’t
add `aria-invalid`, descriptions, or persistent error text; authors must provide
any additional feedback their application needs. Real Windows high-contrast
themes and assistive-technology announcements still need platform testing.

## Browser Support

This component uses modern web standards:

- Custom Elements v1
- Shadow DOM v1
- ES Modules

The browser suite exercises Chromium, Firefox, and WebKit. That isn’t a guarantee
for every browser version or assistive technology.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Install browser engines once, then run browser checks (one worker)
npx playwright install
npm run test:browser

# Lint code
npm run lint

# Format code
npm run format

# View demo
PORT=3010 node scripts/serve.js
# Then open http://127.0.0.1:3010/demo/index.html
```

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)
