function splitWords(str: string): string[] {
    return str.split(/(?=[A-Z])|_|-|\s/);
}

export type Casing =
    | "camel"
    | "pascal"
    | "kebab"
    | "snake"
    | "title"
    | "sentence"
    | "mid-sentence";

function rejoin(words: string[], casing: Casing): string {
    switch (casing) {
        case "kebab":
            return words.map((word) => word.toLowerCase()).join("-");
        case "snake":
            return words.map((word) => word.toLowerCase()).join("_");
        case "pascal":
            return words
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

            for (const word of words) {
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
            return words
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

            for (const word of words) {
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
            return words.map((word) => word.toLowerCase()).join(" ");
    }
}

export function changeCase(str: string, casing: Casing): string {
    return rejoin(splitWords(str), casing);
}
