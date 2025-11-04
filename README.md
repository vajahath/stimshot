# stimshot

[![CI](https://github.com/vajahath/stimshot/actions/workflows/ci.yml/badge.svg)](https://github.com/vajahath/stimshot/actions/workflows/ci.yml)

<img src="stimshot.jpg" alt="stimshot-banner" width="500"/>

A dead-simple, modern, and lightweight (~4kb) Dependency Injection library for TypeScript.

### **Why another DI framework?**

Many existing DI libraries for TypeScript rely on the older "experimental" decorators and reflection libraries like reflect-metadata. This approach forces you to enable emitDecoratorMetadata in your tsconfig.json, which depends on TypeScript's type-information—information that is erased at compile time.

This can lead to a fragile, guess-work setup.

stimshot was built with a different philosophy:

* **Explicit & Guess-less:** No magic strings, no fragile type-reflection. You explicitly ask for what you need.  
* **Weightless:** The entire library is one small file with no dependencies.  
* **Modern:** Built for modern TypeScript (5.0+) using standard Stage 3 Decorators.  
* **Simple APIs:** The API surface is tiny, intuitive, and easy to understand.

This library **does not** use or require reflect-metadata or experimentalDecorators like other DI libraries.

### **Why Use Dependency Injection?**

Using a DI pattern is a cornerstone of modern software design. It helps you build:

* **Modular Code:** Classes don't create their own dependencies; they just receive them. This makes your code loosely coupled and easier to manage.  
* **Testable Code:** DI makes testing a breeze. You can easily "replace" a real database or HTTP service with a fake (mock) version during tests.  
* **Clean Architecture:** It helps enforce the Single Responsibility Principle, leading to a codebase that's easier to scale and maintain.

### **Features**

* ✅ **Modern TypeScript:** Uses standard Stage 3 decorators (available in TS 5.0+).  
* ❌ **No reflect-metadata:** No hacks or reliance on fragile type information.  
* ❌ **No experimentalDecorators:** No tsconfig.json flags required.  
* 🧠 **Simple API:** A minimal set of 5 functions: @shared, @fresh, resolve, replace, and reset.  
* 🧪 **Testable by Design:** replace and reset make unit testing trivial and safe.

### **Installation**

```
npm install stimshot
```

### **Basic Usage**

The design is simple:

1. **Decorate** your classes with `@shared()` (for singletons (shared instances)) or `@fresh()` (for new instances).  
2. **Resolve** your dependencies using `resolve()`.

```typescript
import { resolve, shared, fresh } from 'stimshot';

@shared()
class Chip {
  public readonly name = "tensor";
}

@shared()
class Screen {
  public readonly dpi = 441;
}

@shared()
class Phone {
  private readonly chip = resolve(Chip); // Define dependency like this

  constructor(
    public readonly screen = resolve(Screen) // Or like this
  ){}

  getSpecs() {
    return `Phone with ${this.chip.name} chip and ${this.screen.dpi} DPI screen.`;
  }
}

// --- Then to make Phone instance ---
const phone = resolve(Phone); // Don't use 'new Phone()' method!
phone.getSpecs();
```

### **Testing with Mocks**

`stimshot` makes it trivial to replace dependencies in your tests.

```typescript
import { resolve, shared, replace, reset } from 'stimshot';

@shared()
class Chip {
  public readonly name = "tensor";
}

@shared()
class Phone {
  private readonly chip = resolve(Chip); // Define dependency like this

  getSpecs() {
    return `Phone with ${this.chip.name} chip`;
  }
}
// --- In your test setup ---
// I want to test the Phone class logic without using the real Chip class.
// This is a good practice in unit testing to isolate the class under test.
// So now Chip class will not interfere with our Phone tests.

// Create a mock implementation for Chip
@shared()
class MockChip {
  public readonly name = "mock-tensor";
}

replace(Chip, { useClass: MockChip }); // Replace Chip with MockChip

const phone = resolve(Phone); // Resolve Phone, which now uses MockChip
console.log(phone.getSpecs()); // Outputs: Phone with mock-tensor chip
```

You can also replace with a simple object (`useValue`) or a function (`useFactory`).

### **API Reference**

#### **Decorators**

* **@shared()**: Class decorator. Registers the class as a "singleton." A single instance will be created on the first resolve and shared for all subsequent calls.  
* **@fresh()**: Class decorator. Registers the class as a "prototype." A new instance will be created *every time* it is resolved.

#### **Functions**

* **resolve(Token)**: Resolves a dependency from the container. Token is the class constructor (e.g., resolve(Database)).  
* **replace(Token, options)**: Used for testing. Replaces the registered Token with a mock implementation.  
  * options.useClass: Replaces with another registered class.  
  * options.useValue: Replaces with a specific value (e.g., a mock object).  
  * options.useFactory: Replaces with a function that returns the instance.  
* **reset()**: Used for testing. Resets the entire container, clearing all shared instances and removing all replacements, restoring the original configuration.

# License

MIT &copy; 2025 Vajahath Ahmed