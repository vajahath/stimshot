# **💉 clear-syringe**

A dead-simple, modern, and lightweight Dependency Injection library for TypeScript.

### **Why another DI framework?**

Most existing DI libraries for TypeScript are complex, require unstable compiler flags, or rely on outdated reflection libraries.

clear-syringe was built with a different philosophy:

* **Explicit & Guess-less:** No magic strings, no fragile type-reflection. You explicitly ask for what you need.  
* **Weightless:** The entire library is one small file with no dependencies.  
* **Modern:** Built for modern TypeScript (5.0+) using standard Stage 3 Decorators.  
* **Simple APIs:** The API surface is tiny, intuitive, and easy to understand.

This library **does not** use or require reflect-metadata or experimentalDecorators. You don't need to change *any* flags in your tsconfig.json.

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

npm install clear-syringe

### **Basic Usage**

The design is simple:

1. **Decorate** your classes with @shared() (for singletons) or @fresh() (for new instances).  
2. **Resolve** your dependencies using resolve().

import { resolve, shared, fresh } from 'clear-syringe';

// This class will be a "singleton"  
// One instance will be created and shared.  
@shared()  
class Database {  
  connect() {  
    console.log('Connected to DB');  
  }  
}

// This class will be "prototype"  
// A new instance is created every time it's resolved.  
@fresh()  
class UserService {  
  // Dependencies are resolved as properties are initialized  
  db \= resolve(Database);

  getUser(id: string) {  
    this.db.connect();  
    return { id, name: 'Test User' };  
  }  
}

// \--- In your application's entry point \---

// 1\. Resolve the UserService  
const userService1 \= resolve(UserService);  
const user \= userService1.getUser('123');

// 2\. Resolve it again  
const userService2 \= resolve(UserService);

// \--- Results \---  
// userService1.db \=== userService2.db  (true \- Database is @shared)  
// userService1 \=== userService2        (false \- UserService is @fresh)

### **Testing with Mocks**

clear-syringe makes it trivial to replace dependencies in your tests.

import { resolve, shared, replace, reset } from 'clear-syringe';  
import { UserService } from './UserService';  
import { Database } from './Database';

// 1\. Create a mock class  
@shared() // Mocks can also be shared\!  
class MockDatabase {  
  connect() {  
    console.log('Connected to MOCK DB');  
  }  
}

// 2\. In your test setup (e.g., beforeEach)  
beforeEach(() \=\> {  
  // Replace the \*real\* Database with the \*mock\* one  
  replace(Database, { useClass: MockDatabase });  
});

// 3\. In your test teardown (e.g., afterEach)  
afterEach(() \=\> {  
  // Restore all original classes  
  reset();  
});

// 4\. Run your test  
test('UserService should use the mock database', () \=\> {  
  const userService \= resolve(UserService);  
    
  // This will call connect() on MockDatabase, not the real one.  
  const user \= userService.getUser('456');

  expect(user.id).toBe('456');  
});

You can also replace with a simple object (useValue) or a function (useFactory).

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