import { describe, expect, test } from "bun:test";
import {
	getBodyScrollLockCountForTests,
	lockBodyScroll,
	resetBodyScrollLockForTests,
	unlockBodyScroll,
} from "./bodyScrollLock";

describe("bodyScrollLock", () => {
	test("nested lock/unlock restores only after outer unlock", () => {
		resetBodyScrollLockForTests();
		lockBodyScroll();
		expect(getBodyScrollLockCountForTests()).toBe(1);
		lockBodyScroll();
		expect(getBodyScrollLockCountForTests()).toBe(2);
		unlockBodyScroll();
		expect(getBodyScrollLockCountForTests()).toBe(1);
		unlockBodyScroll();
		expect(getBodyScrollLockCountForTests()).toBe(0);
	});

	test("unlock below zero is a no-op", () => {
		resetBodyScrollLockForTests();
		unlockBodyScroll();
		expect(getBodyScrollLockCountForTests()).toBe(0);
	});
});
