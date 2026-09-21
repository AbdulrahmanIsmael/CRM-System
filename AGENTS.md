<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Instructions

### 1. source of truth

- Read this file before making changes.
- For Next.js APIs, behavior, convenients, and version-sensitive decisions, use the documentation bundled with the installed Next.js version: `node_modules/next/dist/docs`.
- Do not rely on memory for version-sensitive Next.js behavior.
- Inspect the existing codebase and follow established patterns before introducing new ones.

### 2. Project Principles

- Prefer the smallest correct change over the large changes if it solves the required task or problem.
- Reuse the existing hooks, components, utilities, helpers, if they do the same behavior you need, before creating a new one.
- If I tell you to use specific library or dependency, install it directly, and if I don't tell you, ask me first about the necessay dependencies you need to install
- Do not peform unrelated and unnecessary refactors that do not have anything to do with the task or solving the problem, and if that refactor is necessary for the performance, ask me first
- Do not modify generated files unless explicity required
- Do not repeat code in many files, adopt DRY principle (Do not repeat yourself)

### 3. Architecture

- For building the UI for the first time and the project structure is not organized yet, use the most convenient structure, and just focus on clean structure and architecture, and if you find a component file very large and have a lot of UI elements inside it, break it into another components by creating components folder in the same directory of the component file
- Follow the existing project structure and convenients, and if there are a necessary modification on the current strucutre you need to create, ask me first.
- Keep responsibiliites separated according to the current architecture.
- Prefer reusability and composition over duplicatoin.
- Do not move code from place to another without a clear reason

### Tailwind CSS

- in Tailwind CSS, if a color, a length, a value is used repeatedly in the project, add it to `globals.css` in  @theme or any necessary blocks and reuse it in the project instead

### Next.js

- Follow the installed Next.js version, not training-data assumptions.
- Prefer Server Components by default.
- Use Client Components only when client-side interactivity or browser-only APIs require them.
- Prefer using caching feature (`use cache`) if it could improve the performance and if the data suppose to not be always renewable
- Before using an unfamiliar or version-sensitive Next.js API, read the relevant bundled documentation.
- Prefer official Next.js patterns over custom workarounds.

### TypeScript

- Always write all the types and interfaces separately in `types` folder, in global `src/types` or even in any nested folder that its files need its own types
- Keep types explicit at important boundaries.
- Do not use `any` unless there is a clear technical reason.
- Prefer existing types and schemas over duplicating and recreating them, and if a type exsited in a nested `type` folder, and used in another place, move it to the `src/types` folder and create file for it if needed.
- Preserve strict type safety.

### 6. UI

- Reuse existing UI components and design patterns.
- When I give you an image of a design, match the same existing colors, spacing, typography, responsiveness (specially for headers, navlinks bar and footers), and interaction patterns from the image in your implementation.
- Do not introduce a new styling approach when the project already has one.
- Keep accessibility intact.

### Verification

After every meaningful change:

1. Run the most relevant tests/checks.
2. Run type checking or linting when applicable.
3. Use the `next-dev-loop` Skill for changes affecting application behavior or UI.
4. Verify the affected route or behavior at runtime.
5. Inspect actual errors and warnings instead of guessing.
6. Fix issues found during verification before considering the task complete.

Do not consider a change complete based only on static reasoning or successful file edits.

### 9. Change discipline

- Keep the diff focused.
- Do not rename, move, or rewrite unrelated code.
- Do not change public behavior unless required by the task.
- Do not delete existing functionality without explicit justification.
- When multiple valid approaches exist, prefer the one most consistent with the existing codebase
