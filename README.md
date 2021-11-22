# CodeFlea

## Quick reference

1. Press `Ctrl` + `'` to open the jump interface
1. Press the corresponding jumpcode to move the cursor to the desired line. Interesting points will now be highlighted
   - Pressing `Esc` will cancel.
   - Pressing `Space` will leave the cursor at the beginning of the line
1. Press the corresponding jumpcode to move the cursor to the desired point
   - Pressing `Esc` or `Space` will leave the cursor where it is

Alternatively, use `alt+.` or `alt+m` to go to the next block or previous block respectively.

## Concept

CodeFlea is a language-agnostic extension for VS Code that makes it easy and intuitive to move the cursor around within a code file.

VS Code has excellent code navigation abilities for jumping to a particular file or member, but it doesn't really have much functionality for moving around within a file.

CodeFlea addresses this by giving simple, intuitive commands for moving the cursor around in a way that should be applicable to any programming language, even written prose or Markdown! It accomplishes this by identifying "blocks" within the file based on indentation and usage of punctuation and operators.

![CodeFlea in action](https://raw.githubusercontent.com/Richiban/CodeFlea/main/docs/jump-interface.gif)

The beginning and end of a block of code is defined as:

- a change of indentation
- a stop-line (a "stop-line" is a line that is either empty or contains only punctuation or whitespace)

Example 1: In the following example code the beginning of each block has been illustrated.

```
    ┌─  export function* iterLines(
    ├───── document: vscode.TextDocument,
    │      currentLineNumber: number,
    │      direction: Direction,
    │      skipCurrent = true
    │      ) {
    ├───── const advance = fromDirection(direction);
    │
    ├───── if (skipCurrent) currentLineNumber = advance(currentLineNumber);
    │
    ├───── while (withinBounds()) {
    ├────────── yield document.lineAt(currentLineNumber);
    │           currentLineNumber = advance(currentLineNumber);
    │       }
    │
    ├────── function withinBounds() {
    └────────── return currentLineNumber >= 0 && currentLineNumber < document.lineCount;
            }
        }
```

Due to the fact that CodeFlea is entirely based on whitespace and operators it should just work in most programming languages, such as Javascript, C#, F#, Haskell, V, or Python:

```
    ┌── import unittest
    │
    ├── def median(pool):
    ├────── copy = sorted(pool)
    │       size = len(copy)
    │
    ├────── if size % 2 == 1:
    ├────────── return copy[int((size - 1) / 2)]
    ├────── else:
    ├────────── return (copy[int(size/2 - 1)] + copy[int(size/2)]) / 2
    │
    ├── class TestMedian(unittest.TestCase):
    ├────── def testMedian(self):
    ├────────── self.assertEqual(median([2, 9, 9, 7, 9, 2, 4, 5, 8]), 7)
    │
    ├── if __name__ == '__main__':
    └────── unittest.main()
```

## Commands for navigating blocks

To get started, it is recommended that you use the commands

| Command                 | Default keybinding | Description                                          |
| ----------------------- | ------------------ | ---------------------------------------------------- |
| codeFlea.jump           | `ctrl+'`           | Opens the jump interface                             |
| codeFlea.nextBlock      | `alt+.`            | Jumps to the next block in the file                  |
| codeFlea.prevBlock      | `alt+m`            | Jumps to the previous block in the file              |
| codeFlea.scrollToCursor | `alt+/`            | Scrolls the editor until the cursor is in the middle |

Once you have developed an intuitive sense of where the cursor can jump to, you can move on to some of the more advanced commands:

| Command                 | Default keybinding | Description                                          |
| ----------------------- | ------------------ | ---------------------------------------------------- |
| codeFlea.nextOuterBlock | `alt+j`            | Move to the next block with less indentation         |
| codeFlea.prevOuterBlock | `alt+u`            | Move to the previous block with less indentation     |
| codeFlea.nextSameBlock  | `alt+k`            | Move to the next block with the same indentation     |
| codeFlea.prevSameBlock  | `alt+i`            | Move to the previous block with the same indentation |
| codeFlea.nextInnerBlock | `alt+l`            | Move to the next block with greater indentation      |
| codeFlea.prevInnerBlock | `alt+o`            | Move to the previous block with greater indentation  |

These commands are laid out on the QWERTY keybord in the following way:

```
┌───┐ ┌───┐ ┌───┐       ┌───┐ ┌───┐ ┌───┐
│ U │ │ I │ │ O │       │ ↖ │ │ ↑ │ │ ↗ │
└───┘ └───┘ └───┘       └───┘ └───┘ └───┘
┌───┐ ┌───┐ ┌───┐   =   ┌───┐ ┌───┐ ┌───┐
│ J │ │ K │ │ L │       │ ↙ │ │ ↓ │ │ ↘ │
└───┘ └───┘ └───┘       └───┘ └───┘ └───┘
```

Feel free to change these bindings if they don't suit you or you use another keyboard layout (I use Colemak myself, so mine are bound to `L`,`U`,`Y`,`N`,`E` and `I`).

In addition to moving between blocks you can also select blocks:

| Command                                | Default keybinding | Description                                    |
| -------------------------------------- | ------------------ | ---------------------------------------------- |
| codeFlea.extendBlockSelection          | `alt+shift+k`      | Extend selection to include the next block     |
| codeFlea.extendBlockSelectionBackwards | `alt+shift+i`      | Extend selection to include the previous block |

## Commands for navigating to points

There are commands for jumping to the next/previous block in the file, as well as for jumping to the next/prev block at the same indentation level

_Interesting points_ within a line are defined as:

- The beginning of the line
- The first non-whitespace character after a punctuation mark or bracket
- The end of the line

Example:

```
┌───────┬────┬──────┬──┬──┬──────────────┬───┬─┐
let x = some.method(a, b, anotherMethod("c", 4))

```

| Command                       | Default keybinding | Description                                                |
| ----------------------------- | ------------------ | ---------------------------------------------------------- |
| codeFlea.nextInterestingPoint | `alt+h`            | Move to the previous interesting point in the file         |
| codeFlea.prevInterestingPoint | `alt+;`            | Extend selection to the next interesting point in the file |

## Miscellaneous commands

CodeFlea includes some other commands that are generally useful for keyboard-only use of VS Code:

| Command                 | Default keybinding | Description                                         |
| ----------------------- | ------------------ | --------------------------------------------------- |
| codeFlea.nextBlankLine  | `alt+h`            | Move to the next blank line in the file             |
| codeFlea.prevBlankLine  | `alt+h`            | Move to the previous blank line in the file         |
| codeFlea.scrollToCursor | `alt+;`            | Scroll the editor until the cursor is in the middle |

## Building and running

- Run `npm install` in your terminal to install dependencies
- Run the `Run Extension` target in the Debug View.
