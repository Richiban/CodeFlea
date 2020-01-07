import { Config } from "./config";

export type DecorationModel = {
  // index in character set array
  index: number;
  //string displayed in decoration
  code: string;

  // line index
  line: number;
  //character index in line
  character: number;

  indexInModels: number;
  root?: DecorationModel;
  children: DecorationModel[];
};

export interface ILineCharIndexes {
  count: number;
  indexes: IIndexes;
  focusLine: number;
}

export class CharIndex {
  constructor(public charIndex: number) {}
}

export enum Direction {
  up = -1,
  down = 1
}

export interface IIndexes {
  // key is line number, value stores character indexes in line
  [key: number]: CharIndex[];
}

class LineCharIndex {
  static END = new LineCharIndex();
  constructor(
    public line: number = -1,
    public char: number = -1,
    public indexInModels: number = -1
  ) {}
}

class LineCharIndexState {
  upIndexCounter = 0;
  downIndexCounter = 1;

  constructor(
    private lineIndexes: ILineCharIndexes,
    private direction = Direction.up,
    private up: LineCharIndex,
    private down: LineCharIndex
  ) {}

  findNextAutoWrap(): { lineCharIndex: LineCharIndex; lineChanged: boolean } {
    let lineCharIndex = this.findNext();
    if (lineCharIndex.lineCharIndex === LineCharIndex.END) {
      this.toggleDirection();
      lineCharIndex = this.findNext();
    }
    return lineCharIndex;
  }

  toggleDirection() {
    this.direction =
      this.direction === Direction.up ? Direction.down : Direction.up;
  }

  private findNext(): { lineCharIndex: LineCharIndex; lineChanged: boolean } {
    if (this.direction === Direction.up) {
      return this.findUp();
    } else {
      return this.findDown();
    }
  }

  private findUp(): { lineCharIndex: LineCharIndex; lineChanged: boolean } {
    let lineCharIndex = this.up;
    let line = lineCharIndex.line;
    let charIndexes = this.lineIndexes.indexes[line];

    if (!charIndexes)
      return { lineCharIndex: LineCharIndex.END, lineChanged: false }; //to end;

    if (lineCharIndex.char >= 0) {
      let r = new LineCharIndex(
        line,
        charIndexes[lineCharIndex.char].charIndex,
        this.upIndexCounter--
      );
      lineCharIndex.char--;
      return { lineCharIndex: r, lineChanged: false };
    } else {
      lineCharIndex.line -= 1;
      charIndexes = this.lineIndexes.indexes[lineCharIndex.line];
      if (!charIndexes)
        return { lineCharIndex: LineCharIndex.END, lineChanged: false }; //to end;
      lineCharIndex.char = charIndexes.length - 1;
      return {
        lineCharIndex: this.findNext().lineCharIndex,
        lineChanged: true
      };
    }
  }
  private findDown(): { lineCharIndex: LineCharIndex; lineChanged: boolean } {
    let lineCharIndex = this.down;
    let line = lineCharIndex.line;
    let charIndexes = this.lineIndexes.indexes[line];

    if (!charIndexes)
      return { lineCharIndex: LineCharIndex.END, lineChanged: false }; //to end;

    if (lineCharIndex.char < charIndexes.length) {
      let r = new LineCharIndex(
        line,
        charIndexes[lineCharIndex.char].charIndex,
        this.downIndexCounter++
      );
      lineCharIndex.char++;
      return { lineCharIndex: r, lineChanged: false };
    } else {
      lineCharIndex.line += 1;
      lineCharIndex.char = 0;
      return {
        lineCharIndex: this.findNext().lineCharIndex,
        lineChanged: true
      };
    }
  }
}

export class DecorationModelBuilder {
  private config!: Config;

  initialize = (config: Config) => {
    this.config = config;
  };

  buildDecorationModel = (lineIndexes: ILineCharIndexes): DecorationModel[] => {
    let models: DecorationModel[] = [];
    let line = lineIndexes.focusLine;
    let lineIndexesState = new LineCharIndexState(
      lineIndexes,
      Direction.up,
      new LineCharIndex(line, lineIndexes.indexes[line].length - 1),
      new LineCharIndex(line + 1, 0)
    );

    let twoCharsMax = Math.pow(this.config.jumper.characters.length, 2);
    let leadChars =
      lineIndexes.count > twoCharsMax ? twoCharsMax : lineIndexes.count;
    leadChars = Math.trunc(leadChars / this.config.jumper.characters.length); // just process two letter codes

    // one char codes
    for (let i = leadChars; i < this.config.jumper.characters.length; i++) {
      let lci = lineIndexesState.findNextAutoWrap();
      let lineCharIndex = lci.lineCharIndex;
      if (lineCharIndex === LineCharIndex.END) return models;

      let model = {
        code: this.config.jumper.characters[i],
        index: i,
        line: lineCharIndex.line,
        character: lineCharIndex.char,
        indexInModels: lineCharIndex.indexInModels,
        children: []
      };

      models.push(model);

      if (lci.lineChanged) lineIndexesState.toggleDirection();
    }

    // two char codes
    for (let i = 0; i < leadChars; i++) {
      lineIndexesState.toggleDirection();
      let root: DecorationModel = undefined!;

      for (let k = 0; k < this.config.jumper.characters.length; k++) {
        let lineCharIndex = lineIndexesState.findNextAutoWrap().lineCharIndex;

        if (lineCharIndex === LineCharIndex.END) return models;

        let model: DecorationModel = {
          code:
            this.config.jumper.characters[i] + this.config.jumper.characters[k],
          index: i,
          line: lineCharIndex.line,
          character: lineCharIndex.char,
          indexInModels: lineCharIndex.indexInModels,
          children: []
        };

        models.push(model);

        if (k === 0) {
          root = model;
        }

        let childModel = Object.assign({}, model);
        childModel.root = root;
        childModel.children = [];
        childModel.code = this.config.jumper.characters[k];
        root.children.push(childModel);
      }
    }
    return models;
  };
}
