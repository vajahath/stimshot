/** biome-ignore-all lint/suspicious/noTsIgnore: <some cases need this> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <some cases need this> */
import { afterEach, describe, expect, test, vi } from "vitest";
import { fresh, replace, reset, resolve, shared } from "../src";

describe("clear-syringe", () => {
	// Reset the container after each test to ensure isolation.
	afterEach(() => {
		reset();
	});

	// --- Test Classes ---

	@shared()
	class SharedService {
		public id = Math.random();
	}

	@fresh()
	class FreshService {
		public id = Math.random();
	}

	class NotRegisteredService {}

	@shared()
	class ServiceWithDependency {
		// Using property initialization to resolve dependencies
		public sharedSvc: SharedService = resolve(SharedService);
	}

	// --- Basic Resolution Tests ---

	test("should resolve a shared service as a singleton", () => {
		const instance1 = resolve(SharedService);
		const instance2 = resolve(SharedService);
		expect(instance1).toBeInstanceOf(SharedService);
		expect(instance1.id).toBe(instance2.id);
		expect(instance1).toBe(instance2);
	});

	test("should resolve a fresh service as a new instance each time", () => {
		const instance1 = resolve(FreshService);
		const instance2 = resolve(FreshService);
		expect(instance1).toBeInstanceOf(FreshService);
		expect(instance2).toBeInstanceOf(FreshService);
		expect(instance1.id).not.toBe(instance2.id);
		expect(instance1).not.toBe(instance2);
	});

	test("should resolve dependencies within a class property", () => {
		const instance = resolve(ServiceWithDependency);
		const sharedInstance = resolve(SharedService);
		expect(instance.sharedSvc).toBeInstanceOf(SharedService);
		expect(instance.sharedSvc).toBe(sharedInstance);
	});

	// --- Replacement Tests ---

	test("should replace a service with a mock value using useValue", () => {
		const mockService = { id: 123, custom: "value" };
		replace(SharedService, { useValue: mockService });

		const instance = resolve(SharedService);
		expect(instance.id).toBe(123);
		expect(instance).toBe(mockService);
	});

	@shared()
	class MockSharedService extends SharedService {
		public id = 456;
	}

	test("should replace a service with a mock class using useClass", () => {
		replace(SharedService, { useClass: MockSharedService });

		const instance = resolve(SharedService);
		expect(instance).toBeInstanceOf(MockSharedService);
		expect(instance.id).toBe(456);

		// It should also be a singleton if the mock is @shared
		const instance2 = resolve(SharedService);
		expect(instance).toBe(instance2);
	});

	test("should replace a service with a factory function using useFactory", () => {
		const factory = () => ({ id: 789 });
		replace(SharedService, { useFactory: factory });

		const instance = resolve(SharedService);
		expect(instance.id).toBe(789);
	});

	test("should clear cached instance when a service is replaced", () => {
		const instance1 = resolve(SharedService);
		replace(SharedService, { useValue: { id: 999 } });
		const instance2 = resolve(SharedService);

		expect(instance1.id).not.toBe(999);
		expect(instance2.id).toBe(999);
		expect(instance1).not.toBe(instance2);
	});

	// --- Error Handling Tests ---

	test("should throw an error when resolving an unregistered class", () => {
		expect(() => resolve(NotRegisteredService)).toThrow(
			"[clear-syringe] Resolution error: Class NotRegisteredService is not registered. Did you forget to add @shared() or @fresh()?",
		);
	});

	test("should throw an error when replacing an unregistered class", () => {
		expect(() => replace(NotRegisteredService, { useValue: {} })).toThrow(
			"[clear-syringe] Replacement error: Cannot replace NotRegisteredService because it is not registered.",
		);
	});

	test("should throw an error on circular dependencies", () => {
		@shared()
		class CircularA {
			constructor() {
				resolve(CircularB);
			}
		}

		@shared()
		class CircularB {
			constructor() {
				resolve(CircularA);
			}
		}

		expect(() => resolve(CircularA)).toThrow(
			"[clear-syringe] Circular dependency detected: CircularA -> CircularB -> CircularA",
		);
	});

	test("should throw an error if replace is called without a provider", () => {
		expect(() => replace(SharedService, {} as any)).toThrow(
			`[clear-syringe] Replacement error: You must provide 'useClass', 'useValue', or 'useFactory' when replacing SharedService.`,
		);
	});

	test("should throw an error if instance creation fails", () => {
		const errorMessage = "Constructor failed";
		@fresh()
		class FailingService {
			constructor() {
				throw new Error(errorMessage);
			}
		}

		expect(() => resolve(FailingService)).toThrow(
			`[clear-syringe] Error creating instance of FailingService: ${errorMessage}`,
		);
	});

	// --- Reset Test ---

	test("reset() should restore original factories and clear instances", () => {
		const instance1 = resolve(SharedService);

		replace(SharedService, { useValue: { id: 999 } });
		const mockedInstance = resolve(SharedService);
		expect(mockedInstance.id).toBe(999);

		reset();

		const instance2 = resolve(SharedService);
		const instance3 = resolve(SharedService);

		expect(instance2).toBeInstanceOf(SharedService);
		expect(instance2.id).not.toBe(999);
		expect(instance2).not.toBe(instance1); // Because reset clears shared instances
		expect(instance2).toBe(instance3); // But it should be a singleton again
	});

	// --- Decorator Error Tests ---

	test("@shared should throw if not used on a class", () => {
		expect(() => {
			// @ts-ignore - Intentionally misusing decorator for test
			shared()(class {}, { kind: "method", name: "test" });
		}).toThrow("[clear-syringe] @shared can only be used on classes.");
	});

	test("@fresh should throw if not used on a class", () => {
		expect(() => {
			// @ts-ignore - Intentionally misusing decorator for test
			fresh()(class {}, { kind: "field", name: "test" });
		}).toThrow("[clear-syringe] @fresh can only be used on classes.");
	});

	// --- Re-registration Test ---
	test("should allow re-registering a class with a warning", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		class ServiceToReload {}

		// First registration
		// @ts-ignore - Manually calling decorator for test
		shared()(ServiceToReload, { kind: "class", name: "ServiceToReload" });

		// Second registration
		// @ts-ignore - Manually calling decorator for test
		shared()(ServiceToReload, { kind: "class", name: "ServiceToReload" });

		expect(warnSpy).toHaveBeenCalledWith(
			"[clear-syringe] Warning: Class ServiceToReload is being re-registered.",
		);

		warnSpy.mockRestore();
	});
});
