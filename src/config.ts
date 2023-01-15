import * as vscode from "vscode";
import { SubjectType } from "./subjects/SubjectType";

export type JumpConfig = {
    characters: string;
};

export type Config = {
    jump: JumpConfig;
    scrollStep: number;
    defaultSubject: SubjectType;
};

export function loadConfig(): Config {
    const config = vscode.workspace.getConfiguration("codeFlea");

    return {
        jump: config.get<JumpConfig>("jump")!,
        scrollStep: config.get<number>("scrollStep") || 10,
        defaultSubject: config.get<SubjectType>("defaultSubject") ?? "WORD",
    };
}
