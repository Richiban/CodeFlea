import * as vscode from "vscode";

export type JumpConfig = {
    characters: string;
};

export type ModesConfig = {
    navigateKeySequence: string;
};

export type Config = {
    jump: JumpConfig;
    scrollStep: number;
    modes: ModesConfig;
};

export function loadConfig(): Config {
    const config = vscode.workspace.getConfiguration("codeFlea");

    return {
        jump: config.get<JumpConfig>("jump")!,
        scrollStep: config.get<number>("scrollStep") || 10,
        modes: config.get<ModesConfig>("modes")!,
    };
}
