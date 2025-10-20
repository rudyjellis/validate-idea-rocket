# Testing Guide

This project uses Vitest and React Testing Library for testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Structure

- **Unit Tests**: Test individual components and utilities
- **Integration Tests**: Test component interactions
- **Setup**: Test configuration in `src/test/setup.ts`
- **Utilities**: Custom render function in `src/test/utils.tsx`

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Hook Tests

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('returns expected value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current).toBe(true);
  });
});
```

### Utility Tests

```typescript
import { describe, it, expect } from 'vitest';
import { myUtility } from './utils';

describe('myUtility', () => {
  it('processes input correctly', () => {
    expect(myUtility('input')).toBe('output');
  });
});
```

## Test Coverage

Coverage reports are generated in the `coverage/` directory. View the HTML report by opening `coverage/index.html` in a browser.

## Mocking

### Mocking Modules

```typescript
import { vi } from 'vitest';

vi.mock('@/components/MyComponent', () => ({
  default: () => <div>Mocked Component</div>,
}));
```

### Mocking Functions

```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
2. **Use Semantic Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Keep Tests Simple**: One assertion per test when possible
4. **Mock External Dependencies**: Mock API calls, external libraries, and complex components
5. **Test Accessibility**: Ensure components are accessible using proper ARIA roles and labels

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

See `.github/workflows/test.yml` for CI configuration.
