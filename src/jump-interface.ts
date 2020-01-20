import * as vscode from "vscode";
import { JumpLocations, JumpLocation, linqish, getJumpCodes } from "./common";
import { readKey } from "./inline-input";
import { Config } from "./config";

type InterfaceType = "primary" | "secondary";

export class JumpInterface {
  constructor(
    private config: Config,
    private jumpCodeImageCache: { [index: string]: vscode.Uri },
    private decorations: {
      [index: number]: vscode.TextEditorDecorationType;
    } = {}
  ) {}

  initialize = (config: Config) => {
    this.config = config;
    this.updateCache();
  };

  async pick(
    editor: vscode.TextEditor,
    jumpLocations: JumpLocations,
    interfaceType: InterfaceType
  ): Promise<JumpLocation | undefined> {
    this.addDecorations(editor, jumpLocations, interfaceType);

    const input = await readKey();

    this.removeDecorations(editor);

    return jumpLocations.find(x => x.jumpCode === input);
  }

  private addDecorations(
    editor: vscode.TextEditor,
    jumpLocations: JumpLocations,
    interfaceType: InterfaceType
  ) {
    const {
      _true: standardOptions,
      _false: optionsWithNoSpaceToLeft
    } = linqish(jumpLocations)
      .map(loc =>
        this.createDecorationOptions(
          loc.lineNumber,
          loc.charIndex,
          loc.jumpCode,
          interfaceType
        )
      )
      .partition(loc => loc.range.start.character > 0);

    editor.setDecorations(
      this.createTextEditorDecorationType(1),
      standardOptions
    );

    editor.setDecorations(
      this.createTextEditorDecorationType(0),
      optionsWithNoSpaceToLeft
    );
  }

  removeDecorations(editor: vscode.TextEditor) {
    for (const dec in this.decorations) {
      if (this.decorations[dec] === null) continue;
      editor.setDecorations(this.decorations[dec], []);
      this.decorations[dec].dispose();
      this.decorations[dec] = null!;
    }
  }

  private createTextEditorDecorationType(charsToOffsetToLeft: number) {
    if (!this.decorations[charsToOffsetToLeft]) {
      this.decorations[
        charsToOffsetToLeft
      ] = vscode.window.createTextEditorDecorationType({
        after: {
          margin: `0 0 0 ${charsToOffsetToLeft *
            -this.config.decoration.width}px`,
          height: `${this.config.decoration.height}px`,
          width: `${charsToOffsetToLeft * this.config.decoration.width}px`
        }
      });
    }

    return this.decorations[charsToOffsetToLeft];
  }

  private createDecorationOptions = (
    line: number,
    char: number,
    code: string,
    interfaceType: InterfaceType
  ): vscode.DecorationOptions => {
    return {
      range: new vscode.Range(line, char, line, char),
      renderOptions: {
        dark: {
          after: {
            contentIconPath: this.getUri(code, interfaceType)
          }
        },
        light: {
          after: {
            contentIconPath: this.getUri(code, interfaceType)
          }
        }
      }
    };
  };

  private getUri = (code: string, t: InterfaceType) => {
    const cacheKey = getCacheKey(t, code);

    if (cacheKey in this.jumpCodeImageCache)
      return this.jumpCodeImageCache[cacheKey];

    this.jumpCodeImageCache[cacheKey] = this.buildUri(code, t);

    return this.jumpCodeImageCache[cacheKey];
  };

  private updateCache = () => {
    this.jumpCodeImageCache = {};
    getJumpCodes(this.config).forEach(code => {
      (["primary", "secondary"] as const).forEach(t => {
        this.jumpCodeImageCache[getCacheKey(t, code)] = this.buildUri(code, t);
      });
    });
  };

  private buildUri = (code: string, interfaceType: InterfaceType) => {
    const cf = this.config.decoration;
    const key = this.config.decoration.upperCase
      ? code.toUpperCase()
      : code.toLowerCase();
    const width = code.length * cf.width;
    const bgColor =
      interfaceType === "primary"
        ? cf.backgroundColor
        : cf.secondaryBackgroundColor;

    const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${cf.height}" height="${cf.height}" width="${width}"><rect width="${width}" height="${cf.height}" rx="2" ry="3" style="fill:${bgColor};fill-opacity:1;stroke:${cf.borderColor};stroke-opacity:${cf.backgroundOpacity};"/><text font-family="${cf.fontFamily}" font-weight="${cf.fontWeight}" font-size="${cf.fontSize}px" style="fill:${cf.color}" x="${cf.x}" y="${cf.y}">${key}</text></svg>`;

    return vscode.Uri.parse(svg);
  };
}
function getCacheKey(t: string, code: string) {
  return `${t}(${code})`;
}
