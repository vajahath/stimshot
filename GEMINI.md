# GEMINI.md

## Project Overview

This project is a lightweight, modern, and dependency-free Dependency Injection (DI) library for TypeScript called `stimshot`. It is designed to be simple, explicit, and easy to use, without requiring any special TypeScript compiler flags like `experimentalDecorators` or `emitDecoratorMetadata`.

The library provides a minimal API consisting of two decorators (`@shared` and `@fresh`) and three functions (`resolve`, `replace`, and `reset`). The core logic is contained in a single file, `src/index.ts`.

The main technologies used are TypeScript and `vitest` for testing. The project is set up to be built with `tsdown`.

## Building and Running

### Build

To build the project, run the following command:

```bash
npm run build
```

This will compile the TypeScript code and output the JavaScript files to the `dist` directory.

### Development

To build the project in watch mode, run the following command:

```bash
npm run dev
```

### Testing

To run the tests, use the following command:

```bash
npm run test
```

The tests are written using `vitest`. The main test file is `tests/index.test.ts`.

### Type Checking

To run the TypeScript type checker, use the following command:

```bash
npm run typecheck
```

## Development Conventions

### Coding Style

The codebase follows standard TypeScript best practices. The code is well-documented with JSDoc comments.

### Testing

The project uses `vitest` for testing. The tests are located in the `tests` directory. The existing test file, `tests/index.test.ts`, is a placeholder and should be updated to include comprehensive tests for the library.

Here is an example of how you could write a test for the `stimshot` library in `tests/index.test.ts`:

```typescript
import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { shared, fresh, resolve, replace, reset } from '../src';

describe('stimshot', () => {
  afterEach(() => {
    reset();
  });

  @shared()
  class SharedService {
    public id = Math.random();
  }

  @fresh()
  class FreshService {
    public id = Math.random();
  }

  test('should resolve a shared service as a singleton', () => {
    const instance1 = resolve(SharedService);
    const instance2 = resolve(SharedService);
    expect(instance1.id).toBe(instance2.id);
  });

  test('should resolve a fresh service as a new instance', () => {
    const instance1 = resolve(FreshService);
    const instance2 = resolve(FreshService);
    expect(instance1.id).not.toBe(instance2.id);
  });

  test('should replace a service with a mock value', () => {
    const mockService = { id: 123 };
    replace(SharedService, { useValue: mockService });
    const instance = resolve(SharedService);
    expect(instance.id).toBe(123);
  });

  @shared()
  class MockSharedService extends SharedService {
    public id = 456;
  }

  test('should replace a service with a mock class', () => {
    replace(SharedService, { useClass: MockSharedService });
    const instance = resolve(SharedService);
    expect(instance.id).toBe(456);
  });
});
```
