// Mostly from https://github.com/usernamehw/vscode-find-jump/blob/master/src/inlineInput.ts

import { commands, Disposable, StatusBarAlignment, StatusBarItem, TextEditor, window } from 'vscode';
import { Char } from '../common';
import * as vscode from "vscode";

const cancellationChars = new Set('\n');
const subscriptions: Disposable[] = [];

export class InlineInput {
    private statusBarItem: StatusBarItem;
    private input = '';

    constructor(private readonly props: {
        textEditor: TextEditor;
        onInput(input: string, char: Char): void;
        onCancel(...args: any[]): void;
    }) {
        subscriptions.push(
            commands.registerCommand('type', this._onInput),
            window.onDidChangeTextEditorSelection(this._onCancel),
        );

        vscode.commands.executeCommand('setContext', 'codeFlea.waitingForChar', true);
        this.statusBarItem = window.createStatusBarItem(
            StatusBarAlignment.Right,
            1000
        );
    }

    public updateStatusBar = (text: string, numberOfMatches: number, activityIndicatorState?: boolean): void => {
        if (activityIndicatorState !== undefined) {
            const indicator = activityIndicatorState ? '⚪' : '🔴';
            this.statusBarItem.text = `${numberOfMatches} ░ ${text} ░ ${indicator}`;
        } else {
            this.statusBarItem.text = `$(search) ${text}`;
        }
        this.statusBarItem.show();
    };

    public destroy = (): void => {
        this.statusBarItem.dispose();
        subscriptions.forEach(subscription => subscription.dispose());
        vscode.commands.executeCommand('setContext', 'codeFlea.waitingForChar', false);
    };

    public deleteLastCharacter = (): string => {
        this.input = this.input.slice(0, -1);
        return this.input;
    };

    private readonly _onInput = ({ text }: { text: string }) => {
        if (text.length !== 1) return;
        const char = text as Char;  // Now we know it's length 1
        this.input += char;

        if (cancellationChars.has(char)) {
            this._onCancel();
        } else {
            return this.props.onInput(this.input, char);
        }
    };

    private readonly _onCancel = (...args: any[]) => {
        this.destroy();
        return this.props.onCancel(args);
    };
}