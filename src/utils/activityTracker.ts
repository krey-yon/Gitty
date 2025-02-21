
import * as vscode from 'vscode';

interface codeChange {
    filepath: string;
    content: string;
    timestamp: number;
}
export class ActivityTracker {
    private codeHistory: codeChange[] =[];
    private maxHistorySize: number = 100;
    private hasNewChanges: boolean = false;
    private debounceTimeout : NodeJS.Timeout | null = null;
    private readonly DEBOUNCE_DELAY = 5000;

    constructor(){
        this.setupEventListeners();
    }

    //! this method sets up the event listeners that will track the changes and runs after debounce delay
    private setupEventListeners(){
        vscode.workspace.onDidSaveTextDocument((e)=>{
            const editor = vscode.window.activeTextEditor;
            if(!editor){
                return;
            }
            if(this.debounceTimeout){
                clearTimeout(this.debounceTimeout);
            }
            this.debounceTimeout = setTimeout(()=>{
                this.trackChange(editor);
            }, this.DEBOUNCE_DELAY);
        });
    }

    // this method tracks the change done by the user in their file and stores it in the codeHistory array
    private trackChange(editor: vscode.TextEditor){

        const text = editor.document.getText();
        const words = text.split(/\s+/);
        const limitedText = words.slice(0, 1000).join(" ");  // Limiting words to increase efficiency
        const filepath = editor.document.fileName;

        const change: codeChange = {
            filepath,
            content: limitedText,
            timestamp: Date.now()
        };
        
        this.codeHistory.push(change);
        this.hasNewChanges = true;
        console.log("code history is", this.codeHistory);

        if(this.codeHistory.length > this.maxHistorySize){
            this.codeHistory.shift();
        }
    }

    //! this method returns all the changes available in the codeHistory array
    public getAllChanges(): codeChange[]{
        return [...this.codeHistory];
    }

    //! this method returns the summary so that it can be analyzed by AI
    public getFormattedSummary(): string{
        let summary = '';

        for(const change of this.codeHistory){
            summary += `\nFile Path: ${change.filepath}\n`;
            summary += `Timestamp: ${new Date(change.timestamp).toLocaleString()}\n`;
            summary += `Code:\n${change.content}\n`;
            summary += '----------------------------------------\n';
        }

        return summary;
    }

    //! this method clears the history of the codeHistory array
    public clearHistory(){
        this.codeHistory = [];
        this.hasNewChanges = false;
    }

    public hasChanges(){
        return this.hasNewChanges;
    }

    //! A dispose method to clear the debounce timeout
    public dispose(){
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
    }
}

export function initializeActivityTracker(): ActivityTracker {
    const tracker = new ActivityTracker();
    return tracker;
}

export const tracker = initializeActivityTracker();