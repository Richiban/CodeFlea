import { Config } from "../config";
import { JumpInterface } from "./jump-interface";
import * as vscode from "vscode";
import { JumpLocations, JumpLocation, getJumpCodes } from "../common";
import { getInterestingPoints } from "../utils/points";

export class FleaJumper {
    private config: Config;
    private isJumping: boolean = false;
    private jumpInterface: JumpInterface;

    constructor(config: Config) {
        this.config = config;
        this.jumpInterface = new JumpInterface(config);
        this.jumpInterface.update(this.config);
    }

    updateConfig = (config: Config) => {
        this.jumpInterface.update(config);
    };

    private done() {
        this.isJumping = false;
    }

    private cancel() {
        this.isJumping = false;
    }

    async jump(): Promise<void> {
        try {
            let jumpTimeoutId: NodeJS.Timeout | null = null;

            if (this.isJumping) {
                throw new Error("CodeFlea: reinvoke goto command");
            }

            this.isJumping = true;

            jumpTimeoutId = setTimeout(() => {
                jumpTimeoutId = null;
                this.cancel();
            }, this.config.jump.timeout);

            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                return;
            }

            const msg = "CodeFlea: Type To Jump";

            const messageDisposable = vscode.window.setStatusBarMessage(msg);

            try {
                await this.jumpToLinePhase(editor);

                await this.jumpToPointPhase(editor);
            } catch (reason) {
                if (!reason) {
                    reason = "Cancelled!";
                }
                vscode.window.setStatusBarMessage(`CodeFlea: ${reason}`, 2000);
            } finally {
                if (jumpTimeoutId) {
                    clearTimeout(jumpTimeoutId);
                }

                messageDisposable.dispose();
            }

            this.done();
            vscode.window.setStatusBarMessage("CodeFlea: Jumped!", 2000);
        } catch (err) {
            this.cancel();
            console.log("codeFlea: " + err);
        }
    }

    private jumpToLinePhase = async (editor: vscode.TextEditor) => {
        const jumpLines = this.findJumpLines(editor);

        const chosenLine = await this.jumpInterface.getUserSelection(
            editor,
            jumpLines,
            "primary"
        );

        if (chosenLine.tag === "Cancelled") {
            return;
        }

        if (chosenLine.tag === "Ok") {
            editor.selection = new vscode.Selection(
                chosenLine.userSelection.position,
                chosenLine.userSelection.position
            );
        }
    };

    private jumpToPointPhase = async (editor: vscode.TextEditor) => {
        const jumpPoints = this.findJumpPoints(editor);

        const chosenPoint = await this.jumpInterface.getUserSelection(
            editor,
            jumpPoints,
            "secondary"
        );

        if (chosenPoint.tag === "Ok") {
            editor.selection = new vscode.Selection(
                chosenPoint.userSelection.position,
                chosenPoint.userSelection.position
            );
        }
    };

    private findJumpPoints = (editor: vscode.TextEditor): JumpLocations => {
        const interestingPoints = getInterestingPoints(
            editor,
            editor.selection.active
        );
        const jumpCodes = getJumpCodes(this.config);

        const { start: viewportStart, end: viewportEnd } =
            editor.visibleRanges[0];

        const inBounds = (loc: JumpLocation) =>
            loc.position.line >= viewportStart.line &&
            loc.position.line <= viewportEnd.line;

        return interestingPoints
            .zipWith(jumpCodes)
            .map(([p, c]) => ({ jumpCode: c, position: p }))
            .takeWhile(inBounds)
            .toArray();
    };

    private findJumpLines = (editor: vscode.TextEditor): JumpLocations => {
        const bounds = editor.visibleRanges[0];
        const jumpCodes = getJumpCodes(this.config);
        const cursorPosition = editor.selection.active;
        throw new Error("Not implemented");
        // const blocks = getBlocksAround(cursorPosition, "alternate", "forwards");

        // return blocks
        //     .zipWith(jumpCodes)
        //     .map(([p, c]) => ({ jumpCode: c, position: p.point }))
        //     .toArray();
    };
}
