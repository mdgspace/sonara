# Contributing to MDG Space's Sonara Project

We welcome contributions to this project! Before you start, please take a moment to read through these guidelines.

By contributing, you agree to abide by the **[MIT License](LICENSE)**.

---

## How to Contribute

The contribution process is simple and follows the standard GitHub flow:

1.  **Fork** the repository to your own GitHub account.
2.  **Clone** your fork to your local machine:
    ```bash
    git clone https://github.com/mdgspace/sonara.git
    ```
3.  **Create a new branch** for your feature or fix. Use a descriptive name like `feat/new-filter-module` or `fix/canvas-bug`.
    ```bash
    git checkout -b your-branch-name
    ```
4.  **Make your changes.** (Remember to optimize that C++ Wasm code! )
5.  **Commit your changes** using the **Conventional Commit** format (see below).
6.  **Push** your branch to your fork on GitHub.
7.  **Open a Pull Request (PR)**.

---

## Pull Request (PR) Guidelines

Pull Requests are the standard way to merge your changes into the main repository.

### Creating the PR

1.  After pushing your branch, navigate to the original repository on GitHub.
2.  GitHub will prompt you to **"Compare & pull request"** from your pushed branch.
3.  **Set the Base Branch:** Ensure the **base repository** is the main project (`MDG Space/your-repo-name`) and the **base branch** is `main`. Your **head repository** should be your fork, and the **compare branch** should be your feature branch.
4.  **Write a Clear Description:**
    * Reference any related issues (e.g., `Closes #123`).
    * Explain *what* the changes do and *why* they were needed.
    * For bug fixes, describe how you verified the fix.

### Review and Merging

* Your PR will be reviewed by a maintainer. They may leave comments, request changes, or suggest improvements.
* Please be responsive to feedback. If changes are requested, commit them to the same branch and push; the PR will update automatically.
* Once approved, the PR will be merged into the `main` branch.

---

## Conventional Commits Standard (Mandatory)

We enforce **Conventional Commits** to ensure a readable and consistent commit history. This standard is crucial for automating changelog generation.

### Format

Every commit message must be structured as follows:
```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Types (The most common ones):

| Type | When to Use It |
| :--- | :--- |
| **`feat`** | A new feature, enhancement, or major addition (e.g., `feat: Add new Wasm filter module`). |
| **`fix`** | A bug fix (e.g., `fix(canvas): Correct logarithmic x-axis scaling`). |
| **`docs`** | Documentation-only changes (e.g., `docs: Update README with setup instructions`). |
| **`style`** | Code styling (linting, formatting, missing semicolons, etc.); doesn't affect code logic. |
| **`refactor`** | A code change that neither fixes a bug nor adds a feature (e.g., restructuring files, cleaning up utility functions). |
| **`perf`** | A code change that improves performance (e.g., Wasm optimization). |
| **`test`** | Adding missing tests or correcting existing tests. |
| **`build`** | Changes that affect the build system or external dependencies (e.g., `package.json`, Emscripten flags). |
| **`chore`** | Routine tasks that don't change source code or tests (e.g., updating `.gitignore`). |

### Scope (Optional)

The scope provides context for the change, usually naming the affected component or file path (e.g., `(audio)`, `(voice)`, `(display)`, `(wasm)`).

**Example Commit Messages:**
- fix(audio): Prevent gain node from clipping on hard attack

- feat(wasm): Implement generatePcmData function with harmonic series

- refactor(hooks): Move canvas drawing to useCanvas.js file

### Contribution Guidelines

When contributing to this project, please ensure the following:

1. Follow the commit message format outlined in this document.
2. Write clean, well-documented, and tested code.
3. **Update the `FEATURES.md` file**: Whenever you add a new feature or make significant changes to existing functionality, ensure that the `FEATURES.md` file is updated to reflect the changes. This helps keep the documentation consistent and up-to-date.
4. Submit a detailed pull request with a clear description of the changes made.

## Thank You!

Your contributions are vital to improving this project. We are excited to collaborate with you and look forward to seeing your Pull Request! If you have any questions, please feel free to open an issue for discussion.