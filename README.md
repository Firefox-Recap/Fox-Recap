# Firefox Recap 📊  

**Firefox Recap** is a powerful browser extension designed to help users analyze and understand their browsing habits. It categorizes your browsing history using **AI-powered topic classification** and a **frequency + recency algorithm**, providing **insightful reports** on how you spend time online.  

🔹 **Automatic Categorization** – Your browsing history is structured into meaningful categories.  
🔹 **Productivity Insights** – Identify where your time goes and optimize your workflow.  
🔹 **Privacy-First Design** – All data is processed locally, ensuring full control over your history.  

Gain valuable insights into your browsing patterns **directly from your browser**!  

---

## 🚀 Features
### 🔍 **Smart Browsing History Reports**  
Automatically categorize your browsing history into meaningful topics using an AI-powered classifier.  

### 📊 **Frequency & Recency Analysis**  
Gain insights into your most visited websites based on **how often** and **how recently** you've accessed them.  

### 🔒 **Privacy-Focused & Secure**  
All data is processed **locally on your device**, ensuring complete privacy and control over your browsing history.  

### 🎛 **User-Friendly Dashboard**  
A clean and intuitive interface makes it easy to view, filter, and analyze your browsing trends.  

### ⚡ **Optimized for Productivity**  
Identify distractions, track work-related sites, and optimize your online habits for better focus and efficiency.  

---

## 💻 Tech Stack
### 🌐 **Frontend**  
- **React.js** – Modern UI framework for the extension popup  
- **Tailwind CSS** – Styling for a clean, responsive design  
- **HTML, CSS, JavaScript** – Core extension structure  

### 🧠 **AI & NLP**  
- **Transformers.js** – Topic classification using zero-shot learning  
- **ONNX Runtime** – Optimized model execution for local inference  

### 🛠 **Backend & Storage**  
- **IndexedDB** – Local storage for browsing history data  
- **SQLite (via sql.js)** – Structured data persistence  

### 🔄 **CI/CD & Deployment**  
- **GitHub Actions** – Automated linting, testing, and building  
- **Webpack** – Optimized bundling for Firefox extension packaging  

---

## 🛠 Getting Started
### 🚀 Prerequisites  
Ensure you have the following installed before proceeding:  
- **Node.js** (v18.x recommended)  
- **npm** (v8.x recommended)  
- **Firefox Browser** (Latest stable version)  

---

### 📥 Installation  
Clone the repository and install dependencies:  

```sh
# Clone the repository
git clone https://github.com/Firefox-Recap/Histofy.git

# Navigate to the project directory
cd Histofy

# Install dependencies
npm install
```

---

### 🔧 Running the Extension Locally  
To test the extension in **Firefox Developer Mode**, follow these steps:  

1️⃣ Open **Firefox** and navigate to:  
   ```
   about:debugging#/runtime/this-firefox
   ```  
2️⃣ Click **"Load Temporary Add-on"**  
3️⃣ Select **`manifest.json`** from the project directory  

Your extension should now be active in Firefox! 🚀  

---

### 🏗 Development Mode (Auto Rebuild)  
For live development with **automatic rebuilding**:  

```sh
# Start the local development server
npm run dev
```
This will watch for changes and automatically rebuild the extension.  

---

### 🔥 Building for Production  
When you're ready to package the extension for deployment:  

```sh
npm run build
```

This will generate an optimized **ZIP package** inside the `dist/` folder, ready for publishing.  

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
    - Go to the [repository on GitHub](https://github.com/Firefox-Recap/FireFox-Recap).
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

