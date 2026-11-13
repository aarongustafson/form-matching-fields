# form-matching-fields Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/form-matching-fields.svg)](https://www.npmjs.com/package/@aarongustafson/form-matching-fields)
[![CI status](https://img.shields.io/github/actions/workflow/status/aarongustafson/form-matching-fields/ci.yml?branch=main&label=CI)](https://github.com/aarongustafson/form-matching-fields/actions/workflows/ci.yml)
[![Minified + gzipped size](https://img.shields.io/bundlejs/size/@aarongustafson/form-matching-fields?format=minzip&label=min%2Bgzip)](https://bundlejs.com/?q=@aarongustafson/form-matching-fields)
[![License](https://img.shields.io/npm/l/@aarongustafson/form-matching-fields)](https://github.com/aarongustafson/form-matching-fields/blob/main/LICENSE)
[![Type definitions](https://img.shields.io/npm/types/@aarongustafson/form-matching-fields)](https://github.com/aarongustafson/form-matching-fields/blob/main/form-matching-fields.d.ts)

Web component wrapper that adds additive validation to ensure two text-type fields match.

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

### Option 1: Auto-define the custom element (easiest)

Import the package to automatically define the `<form-matching-fields>` custom element:

```javascript
import '@aarongustafson/form-matching-fields';
```

Or use the define-only script in HTML:

```html
<script
  src="./node_modules/@aarongustafson/form-matching-fields/define.js"
  type="module"
></script>
```

### Option 2: Import the class and define manually

Import the class and define the custom element with your preferred tag name:

```javascript
import { FormMatchingFieldsElement } from '@aarongustafson/form-matching-fields/form-matching-fields.js';

customElements.define('my-custom-name', FormMatchingFieldsElement);
```

### Basic Example

```html
<form-matching-fields>
  <label for="password">Password</label>
  <input id="password" type="password" required />

  <label for="password-again">Password again</label>
  <input id="password-again" type="password" required />
</form-matching-fields>
```

### How Matching Works

This component intentionally keeps matching behavior simple:

- It only looks at descendant input controls.
- It only considers text-type inputs: text, email, password, search, tel, and url.
- It ignores disabled and readonly fields.
- It always compares the first two eligible fields.
- It only applies mismatch validation when both fields are non-empty.
- It pins mismatch validation to the second field.

### Validation Stacking Behavior

The component does not replace native or existing custom validation:

- If the second field already has native validation issues (such as required or type mismatch), the component does not apply a mismatch message.
- If the second field already has a custom validity message, the component does not replace it.
- The component only clears a mismatch message that it previously set itself.

## Attributes

| Attribute            | Type     | Default                                               | Description                                                                                         |
| -------------------- | -------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `validation-message` | `string` | `The fields “{label_1}” and “{label_2}” should match` | Custom mismatch message template. Supports placeholder replacement for `{label_1}` and `{label_2}`. |

## Properties

| Property            | Type     | Description                                  |
| ------------------- | -------- | -------------------------------------------- |
| `validationMessage` | `string` | Property equivalent of `validation-message`. |

## Message Label Resolution

When replacing `{label_1}` and `{label_2}`, labels are resolved in this order:

1. Associated `<label for>` text
2. Wrapping `<label>` text
3. `aria-label`
4. `name`
5. `id`

## Examples

### Email Verification

```html
<form-matching-fields>
  <label for="email">Email</label>
  <input id="email" type="email" required />

  <label for="verify-email">Verify email</label>
  <input id="verify-email" type="email" required />
</form-matching-fields>
```

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

```html
<form-matching-fields
  validation-message="{label_1} और {label_2} का मान समान होना चाहिए।"
>
  <label for="password-hi">पासवर्ड</label>
  <input id="password-hi" type="password" required />

  <label for="password-hi-again">पासवर्ड फिर से</label>
  <input id="password-hi-again" type="password" required />
</form-matching-fields>
```

## Styling and validation feedback

The component doesn’t paint fields, messages, or focus indicators. Its existing
shadow root only supplies a slot; labels, inputs, and buttons stay in the light
DOM. Native validation still owns invalid-field focus and the browser’s validation
message. Author `validation-message` and meaningful field labels to translate
mismatch feedback; native required and email messages use the browser’s language.

The demos pair reading surfaces with `CanvasText`/`Canvas`, code with
`FieldText`/`Field`, and buttons with `ButtonText`/`ButtonFace`. Inline code and
example panels retain the button pair. Necessary field boundaries use their
foreground, and keyboard focus keeps the browser’s native indicator. Hover adds
an underline and a small foreground wash, without fading labels. Forced colors
and increased contrast retain full-strength footer text and unmodified buttons.
In forced colors, code, fields, and buttons use solid system surfaces rather than
depending on gradients that browsers suppress.
Keep foregrounds and surfaces together when overriding demo styles.

Each demo also copies native validation feedback into a persistent, described
text region after an invalid submission. These demo-only messages use
`textContent`, don’t include entered values, and don’t replace native validation
or move focus. If a form has already reported an error while the component loads,
its feedback refreshes after upgrade applies matching validation. An independent
inline submit guard prevents navigation even if the demo helper fails to load;
the page then shows the authored failure and recovery guidance.
The Hindi example authors its labels, mismatch message, and
success text. Loading and import failures leave fields editable and explain
recovery; without enhancement, required and email checks still work, but matching
doesn’t. Always validate submitted values on the server. The demos have no
submission endpoint and don’t store entries.

Recorded study palettes are regression inputs, not a guarantee for every platform
or authored theme. Real Windows high-contrast themes and assistive-technology
announcements still need platform testing.

## Browser Support

This component uses modern web standards:

- Custom Elements v1
- Shadow DOM v1
- ES Modules

For older browsers, you may need polyfills.

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
