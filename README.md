# gittye - Automate Your GitHub Contributions

gittye is a VS Code extension that automates the process of summarizing your coding activity and committing it to a GitHub repository. It monitors your coding activity in one-hour intervals, generates a summary of your changes, and commits and pushes these summaries to your GitHub repository named `gittye-commits`. This tool streamlines tracking your progress and maintaining a log of your work.

---

## Why gittye?

In many professional workflows, developers often work on feature branches and make commits. However, when these branches are merged, the commit history becomes condensed, and the individual contributions are not reflected. Additionally, many developers use separate email accounts for professional work, leaving little time to enhance their personal GitHub profiles.

gittye addresses this gap by ensuring your personal GitHub profile stays active and well-maintained. It automatically updates your GitHub commit chart with regular commits, helping you showcase consistent activity and growth as a developer.

---

## Features

1. **Automated Monitoring**: gittye monitors the codes you save and generates summaries of your code every hour.
2. **Hourly Commits**: After continous hour of work, gittye commits and pushes a summary of your changes to the `gittye-commits` repository.
   - For example, if you work for 2 hours continously, there will be 2 commits and pushes.
3. **GitHub Integration**:
   - Login via VS Code to authenticate with your GitHub account.
   - Alternatively, you can manually enter your GitHub Personal Access Token (PAT) for authentication.
4. **Enhance Your GitHub Profile**: Maintain a consistent and active commit chart on your personal GitHub profile, even when working on professional projects.
5. **Commands**:
   - Update your PAT manually with the `Update Token` command.

---

## Getting Started

### Step 1: Authenticate with GitHub

gittye requires access to your GitHub account to push commits. You can authenticate in one of the following ways:

#### **Option 1: Login via VS Code**

1. If you are already logged in VS Code through Github, gittye will start working immediately.
2. If not, you will be prompted to login via GitHub.

## Requirements

- **VS Code**: Make sure you have VS Code installed.
- **GitHub Account**: Required for authentication.
- **Personal Access Token (Optional)**: If not using the login feature.

## License

gittye is licensed under the MIT License. See the `LICENSE` file for details.
# GittyE
