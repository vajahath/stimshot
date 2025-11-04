// --- clear-syringe ---
// A dead-simple, modern, and lightweight DI library for TypeScript.

// --- Internal Types and State ---

/**
 * Options for replacing a dependency during testing.
 */
export interface ReplaceOptions<T = any> {
  /** Provide a specific class to use. */
  useClass?: new (...args: any[]) => T;
  /** Provide a specific value (object, mock) to use. */
  useValue?: T;
  /** Provide a factory function to create the instance. */
  useFactory?: () => T;
}

/**
 * Internal entry to store registration details in the container.
 */
interface RegistrationEntry<T = any> {
  /** The original class constructor. */
  ctor: new (...args: any[]) => T;
  
  /** The lifetime of the instance. */
  lifetime: 'shared' | 'fresh';
  
  /** The cached instance, for shared dependencies. */
  instance?: T;
  
  /** The original function to create an instance. */
  originalFactory: () => T;
  
  /** The current factory (can be highjacked for mocks). */
  currentFactory: () => T;
}

/**
 * The global DI container.
 * Stores tokens (class constructors) and their registration details.
 */
const container = new Map<Function, RegistrationEntry>();

/**
 * A stack to track circular dependencies during resolution.
 */
const resolutionStack = new Set<Function>();

// --- Private Helper Functions ---

/**
 * A shared registration function for decorators.
 */
function register<T>(
  ctor: new (...args: any[]) => T,
  lifetime: 'shared' | 'fresh'
) {
  if (container.has(ctor)) {
    // Allows re-registering, which can be useful for HMR (Hot Module Replacement)
    console.warn(`[clear-syringe] Warning: Class ${ctor.name} is being re-registered.`);
  }

  const factory = () => new ctor();

  container.set(ctor, {
    ctor,
    lifetime,
    originalFactory: factory,
    currentFactory: factory,
  });
}

/**
 * Throws a formatted error.
 */
function throwError(message: string): never {
  throw new Error(`[clear-syringe] ${message}`);
}

// --- Public API ---

/**
 * Class decorator: Registers the class as a **shared** instance (singleton).
 * One instance will be created and shared across all injectors.
 */
export function shared() {
  return (target: new (...args: any[]) => any, context: ClassDecoratorContext) => {
    if (context.kind !== 'class') {
      throwError('@shared can only be used on classes.');
    }
    register(target, 'shared');
  };
}

/**
 * Class decorator: Registers the class as a **fresh** instance (prototype/transient).
 * A new instance will be created every time it's resolved.
 */
export function fresh() {
  return (target: new (...args: any[]) => any, context: ClassDecoratorContext) => {
    if (context.kind !== 'class') {
      throwError('@fresh can only be used on classes.');
    }
    register(target, 'fresh');
  };
}

/**
 * Resolves a dependency from the container.
 *
 * @param token The class constructor to resolve.
 * @returns An instance of the requested class.
 */
export function resolve<T>(token: new (...args: any[]) => T): T {
  const registration = container.get(token);

  if (!registration) {
    return throwError(
      `Resolution error: Class ${token.name} is not registered. Did you forget to add @shared() or @fresh()?`
    );
  }

  // Circular dependency check
  if (resolutionStack.has(token)) {
    const stack = Array.from(resolutionStack).map(t => t.name).join(' -> ');
    return throwError(
      `Circular dependency detected: ${stack} -> ${token.name}`
    );
  }

  // For 'fresh' instances or 'shared' instances being created for the first time
  if (registration.lifetime === 'fresh' || !registration.instance) {
    resolutionStack.add(token);
    let newInstance: T;
    try {
      newInstance = registration.currentFactory();
    } catch (err: any)
    {
      return throwError(`Error creating instance of ${token.name}: ${err.message}`);
    } finally {
      // Always remove from stack, even if factory throws
      resolutionStack.delete(token);
    }

    if (registration.lifetime === 'shared') {
      registration.instance = newInstance;
    }
    return newInstance;
  }

  // Return existing shared instance
  return registration.instance;
}

/**
 * Replaces a registered dependency with a mock for testing.
 *
 * @param token The original class token to replace.
 * @param options The mock implementation (useClass, useValue, or useFactory).
 */
export function replace<T>(
  token: new (...args: any[]) => T,
  options: ReplaceOptions<T>
) {
  const registration = container.get(token);

  if (!registration) {
    return throwError(
      `Replacement error: Cannot replace ${token.name} because it is not registered.`
    );
  }

  let newFactory: () => T;

  if (options.useValue !== undefined) {
    newFactory = () => options.useValue as T;
  } else if (options.useClass) {
    newFactory = () => resolve(options.useClass as new (...args: any[]) => T);
  } else if (options.useFactory) {
    newFactory = options.useFactory;
  } else {
    return throwError(`Replacement error: You must provide 'useClass', 'useValue', or 'useFactory' when replacing ${token.name}.`);
  }

  // Overwrite the current factory and clear any cached instance
  registration.currentFactory = newFactory;
  registration.instance = undefined;
}

/**
 * Resets the container to its original state.
 * Clears all cached shared instances and removes all mock replacements.
 *
 * Typically used in a test's `afterEach` block.
 */
export function reset() {
  for (const registration of container.values()) {
    registration.currentFactory = registration.originalFactory;
    registration.instance = undefined;
  }
  resolutionStack.clear();
}
