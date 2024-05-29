import * as vscode from 'vscode';

export type RangeSplit = 
    | { kind: 'SingleLine'; range: vscode.Range }
    | { kind: 'MultiLine'; firstLine: vscode.Range, middleLines: vscode.Range[], lastLine: vscode.Range };

function isSingleLineRange(range: vscode.Range): boolean {
    return range.start.line === range.end.line;
}
    
export function splitRange(document: vscode.TextDocument, range: vscode.Range): RangeSplit{
    if (isSingleLineRange(range)) {
        return { kind: 'SingleLine', range };
    }
    
    const firstLine = document.lineAt(range.start.line).range.with({start: range.start});
    const lastLine = document.lineAt(range.end.line).range.with({end: range.end});
    const middleLines = Array.from({ length: lastLine.start.line - firstLine.end.line - 1 }, (_, i) => document.lineAt(firstLine.end.line + i + 1).range);

    return { kind: 'MultiLine', firstLine, middleLines, lastLine };
}