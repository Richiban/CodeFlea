# CodeFlea

CodeFlea is an extension for VS Code that makes it easy and intuitive to move the cursor around within a code file.

VS Code has excellent code navigation abilities for jumping to a particular file or member, but it doesn't really have much to say about moving around within a file.

CodeFlea addresses this by giving simple, intuitive commands for moving the cursor around within a file in a way that should be applicable to any programming language, even written prose! It accomplishes this by identifying "interesting" points in the file based on the presence of characters relative to whitespace.

The rules for figuring out the locations of interesting lines and interesting points are as follows:

An interesting line is defined as a line that (all of the below):

- Is not "boring" (see below)
- Is immediately preceded by either:
  - A boring line
  - A change of indentation

A "boring" line is one that either:

- is empty
- contains nothing but punctuation

In the following example code, "interesting" lines have been marked with the ░ symbol to illustrate the positions.

       ░public class C
        {
           ░public string A { get; set; }
            public string B { get; set; }

           ░public void M()
            {
               ░if (cond)
                {
                   ░var x = 4;
                    var y = 5;
                    var z = 6;

                   ░DoSomething(x + y + z);
                }
               ░else
                {
                   ░DoSomethingElse(new D {
                       ░E = "e",
                        F = "f",
                        G = "g"
                    });

                   ░Console.WriteLine("Did something else")
                }
            }
        }

There will be keyboard shortcuts for jumping to the next/prev interesting line in the file, as well as for jumping to the next/prev interesting line at the same indentation level

_Interesting points_ within a line are defined as:

- The beginning of the line
- The first non-whitespace character after a punctuation mark or bracket
- The end of the line

Example:

    ░       ░    ░      ░  ░  ░             ░    ░  ░
    var x = Some.Method(a, b, AnotherMethod("c", 4))

There are commands for jumping to the next/prev interesting point in the file.

# codeflea README

This is the README for your extension "codeflea". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

- `myExtension.enable`: enable/disable this extension
- `myExtension.thing`: set to `blah` to do something
