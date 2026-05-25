# form-matching-fields Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/form-matching-fields.svg)](https://www.npmjs.com/package/@aarongustafson/form-matching-fields) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/form-matching-fields/ci.yml?branch=main)](https://github.com/aarongustafson/form-matching-fields/actions)

Web component that automatically adds validation rules that ensure the values of descendent fields match.

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
<script src="./node_modules/@aarongustafson/form-matching-fields/define.js" type="module"></script>
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
  <!-- Your content here -->
</form-matching-fields>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `example-attribute` | `string` | `""` | Description of the attribute |

## Events

The component fires custom events that you can listen to:

| Event | Description | Detail |
|-------|-------------|--------|
| `form-matching-fields:event` | Fired when something happens | `{ data }` |

### Example Event Handling

```javascript
const element = document.querySelector('form-matching-fields');

element.addEventListener('form-matching-fields:event', (event) => {
  console.log('Event fired:', event.detail);
});
```

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--example-color` | `#000` | Example color property |

### Example Styling

```css
form-matching-fields {
  --example-color: #ff0000;
}
```

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

# Lint code
npm run lint

# Format code
npm run format

# View demo
open demo/index.html
```

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)
