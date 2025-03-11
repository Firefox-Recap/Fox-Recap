# Histofy 📊
A Firefox browser extension that provides structured and categorized browsing history reports using a topic classifier and a frequency algorithm (frequency + recency). Get productivity insights right from your browser!

---

## 🚀 Features
- Categorized browsing history reports
- Frequency and recency-based analysis
- User-friendly and privacy-focused

---

## 💻 Tech Stack
- **Frontend:** Vanilla JavaScript, HTML, CSS (Firefox Extension)
- **NLP Models:** Transformers.js for topic classification
- **CI/CD:** GitHub Actions for linting, testing, and building

---

## 🛠 Getting Started

### Prerequisites
- Node.js (v18.x recommended)
- npm (v8.x recommended)

---

### Installation
```sh
# Clone the repository
git clone https://github.com/Firefox-Recap/Histofy.git

# Navigate to the project directory
cd Histofy

# Install dependencies
npm install

### Running the Extension Locally
```sh
npm run build

# Open Firefox and navigate to:
about:debugging#/runtime/this-firefox

# Click on:
Load Temporary Add-on

# Select the file:
dist/manifest.json from the project directory
```
---

## 🔒 Branch Rules & Contribution Guidelines

### 🌿 Branching Strategy
We follow a **Git Flow** strategy to maintain code quality and streamline the development process: 

- **Main Branch (`main`)**:
  - Reserved for **production-ready** code.
  - **Direct commits** are prohibited. All changes must go through a Pull Request (PR).
  - Requires **at least 1 approving review** before merging.
  - **Status checks** (Lint, Test, and Build) must pass before merging.
  - **Merge commits** are prohibited; a linear history is enforced.

- **Development Branch (`develop`)**:
  - This is the integration branch for features.
  - All feature branches should be branched off from `develop`.
  - Pull Requests should be made to `develop` first. Once all features are integrated and tested, `develop` is merged into `main`.

- **Feature Branches (`feature/your-feature-name`)**:
  - Used for individual features or fixes.
  - Should always be branched off from `develop`.
  - Follow the naming pattern: `feature/your-feature-name`.

---

### 📌 Rules to Follow
- **Direct pushes to `main` are prohibited.** All changes must go through Pull Requests.
- **Pull Requests** should be made to `develop`. Once reviewed and approved, `develop` will be merged into `main` for production releases.
- **Ensure your branch is up-to-date with `develop`** before creating a Pull Request.
- **Rebasing** is preferred over merging to maintain a clean history.

---

### 🚀 Working with Branches

1. **Create a Feature Branch:**
    ```sh
    git checkout develop
    git pull origin develop
    git checkout -b feature/your-feature-name
    ```

2. **Commit your changes:**
    ```sh
    git add .
    git commit -m "feat: Add new feature"
    ```

3. **Push the branch to GitHub:**
    ```sh
    git push origin feature/your-feature-name
    ```

4. **Open a Pull Request:**
    - Go to the [repository on GitHub](https://github.com/Firefox-Recap/Histofy).
    - Open a Pull Request from your feature branch to `develop`.
    - Ensure all checks pass and at least one reviewer approves before merging.

---

### 🔄 Merging Strategy
- **Squash and Merge**: For smaller, atomic commits to keep the history clean.
- **Rebase and Merge**: Preferred for feature branches to maintain a linear history.

---

### 📝 Notes:
- Branch names should be **descriptive and concise**.
- Example patterns: 
  - `feature/add-login`
  - `bugfix/fix-header-alignment`
  - `chore/update-dependencies`
- **Keep commits focused**: Each commit should represent a single change or update.


---

## 🤝 Contributing
Contributions are welcome! Please follow the branch rules and ensure all checks pass before requesting a review. Feel free to open issues or submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

---

## 🙏 Acknowledgments
- Thanks to the Mozilla AI team for their guidance.
- Special shoutout to **Peter Mitchell**, **Diego Valdez**, **Kate Sawtell**, and **Taimur Hasan** for their collaboration.

