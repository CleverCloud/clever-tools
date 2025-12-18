---
kind: '📌 Architecture Decision Records'
---
# ADR 0001: Rework file structure and documentation generation

🗓️ 2025-12-18 · ✍️ Hubert Sablonnière

## Context

The CLI started with a monolithic structure where all subcommands for a feature lived in a single large file (e.g., `addon.js` contained all addon-related commands). Over time, this became harder to maintain and navigate.

At the same time, command definitions were scattered across the codebase with limited type safety, making it difficult to ensure consistency and leverage IDE support.

**Questions to answer:**

### File Structure Reorganization

- Why move from a monolithic structure (addon.js with everything inside) to a hierarchical structure per command?
- What specific problems with the old organization were we trying to solve?
- Why this particular hierarchy (addon/addon.create.command.js, addon/addon.list.command.js)?
- Did we consider other organizations (by feature, by domain, etc.)? Why did we choose this one?
- How does this affect file size and code navigation?

### Type-Safe Definition System

- Why introduce `defineArgument`, `defineOption`, `defineCommand` helpers?
- What problems existed with the previous way of defining commands?
- Why Zod for schemas? Did we evaluate other alternatives (like Strictly, or other schema validators)?
  - Why not use oclif or Strictly or another established CLI framework instead of building this custom solution?
  - What are the trade-offs of keeping our custom system vs. adopting an existing framework?
- How does this improve maintainability and developer experience (IDE support, type-safety)?
- Is this more about developer experience than runtime performance?

### Documentation Generation

- Why generate documentation automatically instead of maintaining it manually?
- How do we ensure the generated docs stay in sync with the actual code?
- What's the process for generating these docs? (part of the build? pre-commit hook?)
- Who consumes this generated documentation? (internal devs, LLMs, end users?)
- What do we gain/lose by moving to automatic generation?

## Decision

> *WIP: This section will explain the decisions made and rationale behind the chosen approach.*

## Consequences

> *WIP: This section will document the impact of these changes, benefits realized, and any challenges encountered.*

## Next Steps

This refactoring sets the foundation for several future improvements:

- **Enhanced tooling** around command definitions and validation
- **Better developer experience** with type-safe CLI definitions
- **Automated documentation** that can be consumed by different audiences (API docs, LLM context, user guides)
- **Potential framework upgrades** without major structural changes
- **Improved testability** with more granular command organization

> *More details about these next steps will be added as plans are finalized.*
