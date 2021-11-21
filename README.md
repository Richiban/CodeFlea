# CodeFlea

## Quick reference

1. Press `Ctrl` + `'` to open the jump interface on interesting lines
1. Press the corresponding jumpcode to move the cursor to the desired line. Interesting points will now be highlighted
   - Pressing `Esc` will cancel.
   - Pressing `Space` will leave the cursor where it is and move to the interesting points
1. Press the corresponding jumpcode to move the cursor to the desired point
   - Pressing `Esc` or `Space` will leave the cursor where it is

## Introduction

CodeFlea is a language-agnostic extension for VS Code that makes it easy and intuitive to move the cursor around within a code file.

VS Code has excellent code navigation abilities for jumping to a particular file or member, but it doesn't really have much functionality for moving around within a file.

CodeFlea addresses this by giving simple, intuitive commands for moving the cursor around in a way that should be applicable to any programming language, even written prose! It accomplishes this by identifying "interesting" points within the file based on blocks of code and usage of punctuation and operators.

![CodeFlea in action](https://raw.githubusercontent.com/Richiban/CodeFlea/main/docs/jump-interface.gif)

A block of code is defined as either:

- being at a different indentation level from its surroundings
- being surrounded by "empty" lines (where empty means either containing only punctuation or nothing at all)

Example 1: In the following example code the "interesting" lines have been illustrated.

    ┌─  public class C
    │   {
    ├─────  public string A { get; set; }
    │       public string B { get; set; }
    │
    ├─────  public void M()
    │       {
    ├─────────  if (cond)
    │           {
    ├─────────────  var x = 4;
    │               var y = 5;
    │               var z = 6;
    │
    ├─────────────  DoSomething(x + y + z);
    │           }
    ├─────────  else
    │           {
    ├─────────────  DoSomethingElse(new D {
    ├─────────────────  E = "e",
    │                   F = "f",
    │                   G = "g"
    │               });
    │
    └─────────────  Console.WriteLine("Did something else")
                }
            }
        }

Due to the fact that CodeFlea is entirely based on whitespace and operators it should work in most programming languages without configuration:

    ┌── def cheeseshop(kind, *arguments, **keywords):
    ├────── print("-- Do you have any", kind, "?")
    │       print("-- I'm sorry, we're all out of", kind
    │
    ├────── for arg in arguments:
    ├────────── print(arg)
    │
    ├────── print("-" * 40)
    │       for kw in keywords:
    └────────── print(kw, ":", keywords[kw])

There are commands for jumping to the next/prev interesting line in the file, as well as for jumping to the next/prev interesting line at the same indentation level

_Interesting points_ within a line are defined as:

- The beginning of the line
- The first non-whitespace character after a punctuation mark or bracket
- The end of the line

Example:

```
┌───────┬────┬──────┬──┬──┬──────────────┬───┬─┐
var x = Some.Method(a, b, AnotherMethod("c", 4))
```

There are commands for jumping to the next/prev interesting point in the file.

There are also commands for jumping around based purely on indentation level. The indentation is almost universal among programming languages, and provides a visual tree-like structure to the code that can be viewed as a useful map to be navigated.

Please note that CodeFlea may be thrown off if you mix spaces and tabs for indentation.

## Commands

The commands can be broadly separated into three categories:

- Navigating up / down through the interesting lines in a file
- Navigating up / down / left / right based on indentation
- Navigating left and right through a line based on punctuation

The complete list of commands is:

- nextBlock
- prevBlock
- nearestOuterLine
- nearestInnerLine
- prevOuterLine
- nextOuterLine
- prevInnerLine
- nextInnerLine
- prevSameLine
- nextSameLine
- prevInterestingPoint
- nextInterestingPoint

## Building and running

- Run `npm install` in your terminal to install dependencies
- Run the `Run Extension` target in the Debug View.
