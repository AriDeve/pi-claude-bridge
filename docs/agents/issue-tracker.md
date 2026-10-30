# Issue tracker: Epiq

Issues and specs for this repo live on its Epiq board, not GitHub Issues or local markdown. Use the Epiq MCP tools and the `epiq` skill for tracker operations.

## Access and discovery

- Resolve the repository root to an absolute path and pass it as `repoRoot` wherever supported.
- Discover boards and lanes with `epiq_board_list` and `epiq_swimlane_list`. The initial workflow is the `Default` board with `Todo`, `In progress`, and `Done` lanes.
- Follow board and lane descriptions. Use returned IDs rather than deriving them from titles or refs.
- Use MCP for all board reads and writes; never edit Epiq state files or event logs directly.
- If MCP is unavailable, report the missing connection rather than publishing to another tracker.
- Before the first board write, follow the `epiq` skill's contributor discovery and agent-identity procedure. Keep shared-connection identity changes and board writes with the coordinating agent.

## Issue operations

Tool names below use the `epiq_` suffix; use the names exposed by the current MCP connection.

- **Create / publish**: `epiq_issue_create` in the `Todo` lane. Its `parentId` is the swimlane ID, not the board ID. Store specs in the description.
- **Read / fetch**: `epiq_issue_get` with the returned full ID or seven-character ref; read comments too.
- **List / search**: `epiq_issue_list`, scoped to the board with query, tag, or assignee filters. Use `brief: true` for discovery, then fetch the relevant issue.
- **Edit / comment**: `epiq_issue_description_edit` and `epiq_issue_comment_add`.
- **Labels**: Epiq tags, mapped in `docs/agents/triage-labels.md`. Apply with `epiq_issue_tag_add` or `tagNames` at creation; remove an issue's tag with `epiq_issue_tag_remove`. Tags are created on first use.
- **Claim / start**: assign with `epiq_issue_assignee_add`, then move to `In progress` with `epiq_issue_move`. Ask before taking another contributor's assigned ticket.
- **Complete**: verify behavior, add an outcome comment whose opening line is exactly `Solution:`, and move to `Done`. Close with `epiq_issue_close` only when authorized; reopen with `epiq_issue_reopen`.
- **Sync**: call `epiq_sync` on demand to pull or publish board state. Other MCP operations are local; report sync failures.

## Relationships and dependencies

Use issue refs in descriptions for relationships not represented by the exposed MCP tools:

- Put `Part of <parent-ref>` at the top of a child ticket and maintain a child-ticket list in the parent's description.
- Put `Blocked by: <ref>, <ref>` at the top of a dependent ticket. A blocker is resolved when it is in `Done` or closed.
- For `/wayfinder`, use a map issue tagged `wayfinder:map`, children tagged `wayfinder:<type>`, and preserve child order in the map. The frontier is the first unassigned, unresolved child with every blocker resolved.

## Commits

When a commit is authorized, use the issue ref returned by MCP in a body trailer: `Epiq-Ref: <ref>`. Multiple refs are comma-separated. Tracker work does not itself authorize commits, pushes, merges, or closure.
