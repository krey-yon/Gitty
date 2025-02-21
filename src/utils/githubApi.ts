import * as vscode from "vscode";
const { Octokit } = require("@octokit/rest");
export class GithubService {
  public Info: {
    token: string | undefined;
    username: string | undefined;
    octokit: any;
    git: any;
  };

  constructor(private context: vscode.ExtensionContext) {
    this.Info = {
      token: undefined,
      username: undefined,
      octokit: undefined,
      git: undefined,
    };
  }

  //! Method to check if user is logged in vscode via github and if not then ask for PAT
  //! This method removes the need of getToken method()
  public async checkSession() {
    let token = await this.context.secrets.get("githubPAT");
    if (!token) {
      const credentials = await vscode.authentication.getSession(
        "github",
        ["repo"],
        { createIfNone: true }
      );
      // console.log("Credentials are:", credentials?.accessToken);
      if (!credentials) {
        vscode.window.showErrorMessage(
          "GitHub credentials not found. Please log in to VS Code using your GitHub credentials or run the 'Update Token' command to enter a Personal Access Token (PAT)."
        );
        return;
      }
      token = credentials?.accessToken;
      // await this.context.secrets.store("githubPAT", token);
      try {
        await this.context.secrets.store("githubPAT", token); // Store token
        console.log("Token stored successfully.");
      } catch (error) {
        console.error("Error storing the token:", error);
        vscode.window.showErrorMessage(
          "Failed to save GitHub token. Please try again later."
        );
      }
    }
    this.Info.token = token;
    this.Info.octokit = new Octokit({ auth: token });

    try {
      const { data } = await this.Info.octokit.users.getAuthenticated();
      this.Info.username = data.login;
      if (!this.Info.username) {
        return vscode.window.showErrorMessage(
          "Error setting Github, Kindly login again or run `Update Token` to enter personal access token (PAT)"
        );
      }
      console.log("Username is:", this.Info.username);
      vscode.window.showInformationMessage(
        `Github account ${this.Info.username} is set for gittye Extension`
      );
      this.createRepo();
    } catch (error) {
      console.log("Error setting username", error);
      await this.context.secrets.delete("githubPAT");
      return vscode.window.showErrorMessage(
        "Error setting Github, Kindly login again or run `Update Token` to enter personal access token (PAT)"
      );
    }
  }


  //! Method to update the token
  public async updateToken() {
    let token = await this.context.secrets.get("githubPAT");
    console.log("token is:", token);
    await this.context.secrets.delete("githubPAT");
    token = await this.context.secrets.get("githubPAT");
    console.log("Token after deletion is ", token);

    this.Info.token = undefined;
    this.Info.username = undefined;
    this.Info.octokit = undefined;

    token = await vscode.window.showInputBox({
      prompt:
        "Enter your github personal access token (PAT) with access to repo",
      placeHolder: "ghp_xxx...",
      ignoreFocusOut: true,
      password: true,
    });
    if (!token) {
      return vscode.window.showWarningMessage(
        "PAT is required, run `Update Token` again to enter PAT"
      );
    }
    await this.context.secrets.store("githubPAT", token);

    this.Info.token = token;
    this.Info.octokit = new Octokit({ auth: token });

    try {
      const { data } = await this.Info.octokit.users.getAuthenticated();
      this.Info.username = data.login;
      if (!this.Info.username) {
        return vscode.window.showErrorMessage(
          "Error setting Github, Kindly check you PAT and run `Update Token` again to enter PAT"
        );
      }
      console.log("Username is:", this.Info.username);
      vscode.window.showInformationMessage(
        `Github account ${this.Info.username} is set for gittye Extension`
      );
      this.createRepo();
    } catch (error) {
      console.log("Error setting username", error);
      await this.context.secrets.delete("githubPAT");
      return vscode.window.showErrorMessage(
        "Error setting Github, Kindly check you PAT and run `Update Token` again to enter PAT"
      );
    }
  }

  //! Creating repository for summaries
  public async createRepo() {
    if (!this.Info.octokit || !this.Info.username) {
      return vscode.window.showErrorMessage(
        "Error setting Github, Kindly check you PAT"
      );
    }
    let repoExists = false;

    try {
      await this.Info.octokit.repos.get({
        //! Checking if repo exists
        owner: this.Info.username,
        repo: "gittye-Commits",
      });
      repoExists = true;
      console.log("Repository already exists");
    } catch (error) {
      console.log("Repo not exist | Error getting repository:", error);
    }

    if (repoExists) {
      //! If repo exist move to initializeRepo method else create a new repo
      await this.initializeRepo();
    } else {
      try {
        await this.Info.octokit.repos.createForAuthenticatedUser({
          name: "gittye-Commits",
          private: false,
          description:
            "Repository for tracking code activity via gittye extension",
        });
        console.log("Created new repository: gittye-Commits");
        this.initializeRepo();
      } catch (error) {
        console.log("Error creating repository:", error);
      }
    }
  }

  //! Initializing repository with Readme.md file
  public async initializeRepo() {
    if (!this.Info.octokit || !this.Info.username) {
      return vscode.window.showErrorMessage(
        "Error setting Github, Kindly check you PAT"
      );
    }

    try {
      try {
        await this.Info.octokit.repos.getContent({
          owner: this.Info.username!,
          repo: "gittye-Commits",
          path: "README.md",
        });
      } catch (error) {
        await this.Info.octokit.repos.createOrUpdateFileContents({
          owner: this.Info.username!,
          repo: "gittye-Commits",
          path: "README.md",
          message: "Initialize gittye repository",
          content: Buffer.from(
            "# gittye\nTracking my coding activity using VS Code extension"
          ).toString("base64"),
        });
      }
    } catch (error) {
      console.error("Error initializing repository:", error);
      vscode.window.showErrorMessage("Failed to initialize repository");
    }
  }

  //! Method to save the summary in the repository
  public async saveSummary(summary: string) {
    if (!this.Info.octokit || !this.Info.username) {
      console.log("No octokit or username found");
      return vscode.window.showErrorMessage(
        "GitHub service not initialized, Kindly check PAT and run `Update Token` to enter PAT"
      );
    }
    try {
      const date = new Date();
      const fileName = `summaries/${date.getFullYear()}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}.md`;

      let currentContent = "";
      let fileSha;

      try {
        const response = await this.Info.octokit.repos.getContent({
          //! Try to get existing content
          owner: this.Info.username,
          repo: "gittye-Commits",
          path: fileName,
        });

        if ("content" in response.data) {
          currentContent = Buffer.from(
            response.data.content,
            "base64"
          ).toString();
          fileSha = response.data.sha;
        }
        console.log("Fethced existing content");
      } catch {
        console.log("File doesn't exist yet, creating it");
      }

      //! Format new content
      const timeString = date.toLocaleTimeString();
      const newContent = currentContent
        ? `${currentContent}\n\n## ${timeString}\n${summary}`
        : `# Activity Summary for ${date.toLocaleDateString()}\n\n## ${timeString}\n${summary}`;

      //! Create or update file
      await this.Info.octokit.repos.createOrUpdateFileContents({
        owner: this.Info.username,
        repo: "gittye-Commits",
        path: fileName,
        message: `Add activity summary for ${timeString}`,
        content: Buffer.from(newContent).toString("base64"),
        ...(fileSha ? { sha: fileSha } : {}),
      });

      console.log(
        "Successfully saved summary in account: ",
        this.Info.username
      );
      vscode.window.showInformationMessage(
        `Successfully commited and pushed activity summary in ${this.Info.username}'s account`
      );
    } catch (error) {
      console.error("Failed to save summary:", error);
      vscode.window.showErrorMessage("Failed to save activity summary");
    }
  }
}

export function initializeGithubService(context: vscode.ExtensionContext) {
  const githubService = new GithubService(context);
  return githubService;
}


