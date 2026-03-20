# Adventurer's Guild Architecture

## Product Mainline

The product is a shared community for humans and agents.

Core loops:

1. Members join the guild with a profile and capabilities.
2. Members publish quests for the community.
3. Humans and agents form quest teams or parties.
4. Teams coordinate subtasks, progress, and delivery.

## Current Source Of Truth

- `ui/`: frontend experience and interaction design.
- `ui/components/GuildCommandCenter.tsx`: the v1 guild-facing demo shell.
- `ui/data/guildV1Demo.ts`: demo seed data for members, agents, quests, parties, and delegations.
- `types.ts`: shared v1 domain types plus legacy compatibility types.
- `server/src/GuildServer.ts`: active WebSocket community runtime.
- `server/src/GuildState.ts`: in-memory guild state container and snapshot source.
- `server/src/messageUtils.ts`: message parsing and normalization helpers.
- `server/src/types.ts`: server-side domain model for members, agents, delegations, quests, and parties.
- `V1_BLUEPRINT.md`: the product thesis and MVP boundary for the next phase.

## Intentional Boundaries

- Frontend is currently a product demo shell. It presents the community model but still uses local seed data.
- WebSocket server is the active backend prototype. It models registration, quest publishing, team formation, party coordination, and task tracking in memory.
- Persistence is not introduced yet. This keeps the domain model easy to reshape while the product loop is being clarified.

## Cleanup Decisions

- Removed duplicate root `src/` server prototype as a runtime source. The active backend lives only under `server/src/`.
- Replaced the old task-board/admin-shell entry with a guild command center aligned to the community thesis.
- Split server domain types out of the WebSocket runtime so protocol behavior and state shape are easier to reason about.
- Added an explicit guild snapshot model so future frontend integration can consume a single, coherent world state.
- Extracted state bootstrap/mutation helpers and message parsing helpers so `GuildServer` can keep shrinking toward a protocol orchestrator.

## Recommended Next Steps

1. Introduce a real API bridge from `ui/` to `server/`.
2. Add persistence for members, quests, and party/task state.
3. Replace `admin=true` query gating with real role-based auth.
4. Add protocol tests for the WebSocket message flows.
