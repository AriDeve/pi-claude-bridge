import { it } from "node:test";
import assert from "node:assert/strict";

const mod = await import("../src/index.js");

function activation(factory) {
	const handlers = new Map();
	let config;
	factory({
		on(event, fn) {
			const list = handlers.get(event) ?? [];
			list.push(fn);
			handlers.set(event, list);
		},
		registerTool() {},
		registerProvider(_name, value) { config = value; },
	});
	return {
		config,
		emit(event, id, reason) {
			for (const fn of handlers.get(event) ?? []) {
				fn({ reason }, { cwd: "/tmp", sessionManager: { getSessionId: () => id } });
			}
		},
	};
}

const mirror = (id) => ({ sessionId: `cc-${id}`, cursor: 2, cwd: "/tmp", needsRebuild: false, piSessionId: id });
const activeStream = () => globalThis[Symbol.for("claude-bridge:activeStreamSimple")];

it("prepared child shutdown removes only its mirror and preserves parent ownership", () => {
	const parent = activation(mod.default);
	parent.emit("session_start", "P");
	const child = activation(mod.default);
	child.emit("session_start", "C");
	mod.__test.setSharedSession("P", mirror("P"));
	mod.__test.setSharedSession("C", mirror("C"));
	mod.__test.historyRewrittenBySession.add("P");
	mod.__test.historyRewrittenBySession.add("C");
	child.emit("session_shutdown", "C");
	child.emit("session_shutdown", "C");
	assert.equal(mod.__test.getSharedSession("P")?.sessionId, "cc-P");
	assert.equal(mod.__test.getSharedSession("C"), null);
	assert.equal(mod.__test.historyRewrittenBySession.has("P"), true);
	assert.equal(mod.__test.historyRewrittenBySession.has("C"), false);
	assert.equal(activeStream(), parent.config.streamSimple);
	parent.emit("session_shutdown", "P");
	assert.equal(activeStream(), undefined);
});

it("owner reload releases ownership without letting stale shutdown release its successor", () => {
	const owner = activation(mod.default);
	owner.emit("session_start", "reload");
	owner.emit("session_shutdown", "reload");
	const replacement = activation(mod.default);
	replacement.emit("session_start", "reload");
	owner.emit("session_shutdown", "reload");
	assert.equal(activeStream(), replacement.config.streamSimple);
	replacement.emit("session_shutdown", "reload");
});

it("explicit session transitions clear only that runtime's old and new sessions", () => {
	const owner = activation(mod.default);
	owner.emit("session_start", "parent", "new");
	const child = activation(mod.default);
	child.emit("session_start", "old-child");
	for (const reason of ["new", "resume", "fork"]) {
		for (const id of ["parent", "old-child", "next-child", "unrelated"]) mod.__test.setSharedSession(id, mirror(id));
		child.emit("session_start", "next-child", reason);
		assert.equal(mod.__test.getSharedSession("parent").sessionId, "cc-parent");
		assert.equal(mod.__test.getSharedSession("unrelated").sessionId, "cc-unrelated");
		assert.equal(mod.__test.getSharedSession("old-child"), null);
		assert.equal(mod.__test.getSharedSession("next-child"), null);
		child.emit("session_start", "old-child");
	}
	owner.emit("session_shutdown", "parent");
	child.emit("session_shutdown", "old-child");
});
