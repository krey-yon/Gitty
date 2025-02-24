import { GoogleGenerativeAI } from "@google/generative-ai";
import { tracker } from "./activityTracker";
import { GithubService } from "./githubApi";
import { loadConfig, Config } from "./loadenv";
import { ActivityTracker } from "./activityTracker";
import * as vscode from "vscode";

//! function to load the env file
let config: Config;
export function getEnv(context: vscode.ExtensionContext) {
  config = loadConfig(context);
  if (!config.aiKey || !config.prompt) {
    throw new Error("API key not found in settings or .env file");
  }
  console.log("Config loaded: ", config);
}

//! function to generate the summary
export async function generateSummary(tracker: ActivityTracker) {
  const codeHistory = tracker.getFormattedSummary();

  const genAI = new GoogleGenerativeAI(config.aiKey);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent(
      `${config.prompt}\n${codeHistory}`
    );

    if (!result.response.text()) {
      return "No summary generated from AI";
    }
    console.log("summary generated by AI is: ", result.response.text());
    return result.response.text();
  } catch (error) {
    console.log("Error generating AI summary: ", error);
    return;
  }
}

// //! Pushing summary after specified interval
let summaryInterval: NodeJS.Timeout | null = null;

export function pushSummary(githubService: GithubService) {

  const username = githubService.Info.username;
  if (!username) {
    console.log("Username not found, cant generate summary");
    return;
  }

  if (summaryInterval) {
    clearInterval(summaryInterval);
  }
  let isProcessing = false;

  summaryInterval = setInterval(async () => {
    const changes = tracker.hasChanges();

    if (!changes || isProcessing) {
      console.log("No new changes to generate summary");
      return;
    }
    try {
      console.log("Running summary generation");
      isProcessing = true;
      const summary = await generateSummary(tracker);

      console.log("Summary generated is: ", summary);
      if (summary) {
        await githubService.saveSummary(summary);
        tracker.clearHistory();
      }
    } catch (error) {
      console.log("Error generating summary: ", error);
    } finally {
      isProcessing = false;
    }
  }, 3600000); // Run every 1hr

  return () => {
    if (summaryInterval) {
      clearInterval(summaryInterval);
      summaryInterval = null;
    }
  };

//   let pushTimer = setTimeout(async () => {
//     if (tracker.hasChanges()) {
//         try {
//             console.log("Generating and pushing summary...");
//             const summary = await generateSummary(tracker);

//             if (summary) {
//                 await githubService.saveSummary(summary);
//                 tracker.clearHistory();
//                 tracker.updateLastPushTime(Date.now());

//                 pushTimer = setTimeout(pushLoop, HOUR); // Reset timer for next hour
//             }
//         } catch (error) {
//             console.error("Error pushing summary:", error);
//         }
//     } else {
//         console.log("No changes to push, waiting for next interval");
//         pushTimer = setTimeout(pushLoop, HOUR);
//     }
// }, remainingTime);

//     // Function to handle the continuous push loop
//     function pushLoop() {
//       if (tracker.hasChanges()) {
//           generateSummary(tracker).then(async (summary) => {
//               if (summary) {
//                   await githubService.saveSummary(summary);
//                   tracker.clearHistory();
//                   tracker.updateLastPushTime(Date.now());
//               }
//               pushTimer = setTimeout(pushLoop, HOUR);
//           }).catch(error => {
//               console.error("Error in push loop:", error);
//               pushTimer = setTimeout(pushLoop, HOUR);
//           });
//       } else {
//           // No changes, check again in an hour
//           pushTimer = setTimeout(pushLoop, HOUR);
//       }
//   }

//   // Return cleanup function
//   return () => {
//       if (pushTimer) {
//           clearTimeout(pushTimer);
//       }
//   };
}
