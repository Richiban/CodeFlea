export type Casing =
    | "camel"
    | "pascal"
    | "kebab"
    | "snake"
    | "title"
    | "sentence"
    | "mid-sentence"
    | "flip-first-character";

function splitWords(str: string): string[] {
    return str.split(/(?=[A-Z])|_|-|\s/);
}

export function changeCase(text: string, casing: Casing): string {
    switch (casing) {
        case "kebab":
            return splitWords(text).map((word) => word.toLowerCase()).join("-");
        case "snake":
            return splitWords(text).map((word) => word.toLowerCase()).join("_");
        case "pascal":
            return splitWords(text)
                .map((word) =>
                    word.replace(
                        /(^\w|\s\w)(\S*)/g,
                        (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase()
                    )
                )
                .join("");
        case "camel": {
            let first = true;
            const newWords = [];

            for (const word of splitWords(text)) {
                if (first) {
                    newWords.push(word.toLowerCase());
                    first = false;
                    continue;
                }

                newWords.push(
                    word.replace(
                        /(^\w|\s\w)(\S*)/g,
                        (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase()
                    )
                );
            }

            return newWords.join("");
        }
        case "title":
            return splitWords(text)
                .map((word) =>
                    word.replace(
                        /(^\w|\s\w)(\S*)/g,
                        (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase()
                    )
                )
                .join(" ");
        case "sentence": {
            let first = true;
            const newWords = [];

            for (const word of splitWords(text)) {
                if (first) {
                    newWords.push(
                        word.replace(
                            /(^\w|\s\w)(\S*)/g,
                            (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase()
                        )
                    );
                    first = false;
                    continue;
                }

                newWords.push(word.toLowerCase());
            }

            return newWords.join(" ");
        }
        case "mid-sentence":
            return splitWords(text).map((word) => word.toLowerCase()).join(" ");
        case "flip-first-character":
            return text[0].toUpperCase() === text[0]
                ? text[0].toLowerCase() + text.slice(1)
                : text[0].toUpperCase() + text.slice(1);
    }
}
