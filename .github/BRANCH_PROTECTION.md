# Branch protection

## `main`

Ustawić ręcznie na GitHubie:

- Require a pull request before merging
- Require approvals: 2
- Require review from Code Owners
- Require status checks to pass before merging
  - Lint
  - Typecheck
  - Test
  - Build
- Require branches to be up to date before merging
- Do not allow bypassing the above settings
- Block force pushes

## `main-merge`

Ustawić ręcznie na GitHubie:

- Require a pull request before merging
- Require approvals: 1
- Require review from Code Owners dla plików wspólnych
- Require status checks to pass before merging
  - Lint
  - Typecheck
  - Test
  - Build
- Require branches to be up to date before merging
- Do not allow bypassing the above settings
- Block force pushes