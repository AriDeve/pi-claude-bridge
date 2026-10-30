import { describe, it } from "node:test";
import assert from "node:assert/strict";

const { default: activate } = await import("../src/index.js");
// The host clears extension-owned registration, then replays factory-time calls
// before session_start. Keep this timing visible; recovery in session_start is
// too late for startup model selection and can replace live serving state.
function host(registryShape = "hasProvider") {
	const handlers = new Map();
	let selected;
	let pending;
	return {
		pi: {
			on(event, fn) {
				const list = handlers.get(event) ?? [];
				list.push(fn);
				handlers.set(event, list);
			},
			registerTool() {},
			registerProvider(name, config) { pending = { name, config }; },
		},
		rebuild() {
			selected = undefined;
			if (pending) selected = pending;
		},
		get selected() { return selected; },
		emit(event, id) {
			const modelRegistry = registryShape === "hasProvider"
				? { hasProvider: () => !!selected }
				: { getProvider: () => selected };
			for (const fn of handlers.get(event) ?? []) {
				fn({}, { cwd: "/tmp", sessionManager: { getSessionId: () => id }, modelRegistry });
			}
		},
	};
}

describe("source-owned provider replay", () => {
	it("replays the original serving function before child session startup", async () => {
		const parent = host();
		activate(parent.pi);
		parent.rebuild();
		parent.emit("session_start", "parent");
		const original = parent.selected.config.streamSimple;
		for (const loading of ["fresh", "prepared", "fresh-again"]) {
			const factory = loading === "prepared" ? activate : (await import(`../src/index.js?${loading}`)).default;
			const child = host(loading === "prepared" ? "hasProvider" : "getProvider");
			factory(child.pi);
			child.rebuild();
			assert.equal(child.selected?.name, "claude-bridge", "source replay restores registration before session_start");
			assert.equal(child.selected.config.apiKey, "not-used");
			assert.equal(child.selected.config.streamSimple, original, "child source replay preserves original serving state");
			child.emit("session_start", loading);
		}
	});
});
