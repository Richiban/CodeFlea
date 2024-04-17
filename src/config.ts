import * as vscode from "vscode";
import { SubjectName } from "./subjects/SubjectName";

export type JumpConfig = {
    characters: string;
};

export type Config = {
    jump: JumpConfig;
    scrollStep: number;
    defaultSubject: SubjectName;
};

export function loadConfig(): Config {
    const config = vscode.workspace.getConfiguration("codeFlea");

    return {
        jump: config.get<JumpConfig>("jump")!,
        scrollStep: config.get<number>("scrollStep") || 10,
        defaultSubject: config.get<SubjectName>("defaultSubject") ?? "WORD",
    };
}
