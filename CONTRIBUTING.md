# Contributing

This project is part of my final degree project (TFG), and therefore does not accept external contributions yet.
The following workflow is used for organization and future reference:

## Branches

- `main`: stable, production-ready code.
- `develop`: integration branch for new features.
- `feature/*`: for new features or improvements.

## Workflow

1. Start from `develop`.
2. Create a `feature/*` branch for your changes.
3. Merge into `develop` when finished.
4. Merge `develop` into `main` when ready for release.

## Commits

Use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format.

### Examples:
- `feat: add user login page`
- `fix: correct API error handling`
- `docs: update README installation section`
- `refactor: simplify data processing logic`
- `chore: update dependencies`
- `test: add unit tests for user model`

## Notes

- No code review or PR approval is required (single contributor).
- Use clear and structured commit messages.