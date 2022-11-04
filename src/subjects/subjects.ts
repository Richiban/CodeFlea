import ModeManager from "../modes/ModeManager";
import BlockSubject from "./BlockSubject";
import LineSubject from "./LineSubject";
import WordSubject from "./WordSubject";

export type SubjectName = "WORD";
//  | "LINE"
//  | "BLOCK";

export type SubjectAction = {
    nextSubjectDown(): Promise<void>;
    nextSubjectUp(): Promise<void>;
    nextSubjectLeft(): Promise<void>;
    nextSubjectRight(): Promise<void>;

    addSubjectDown(): Promise<void>;
    addSubjectUp(): Promise<void>;
    addSubjectLeft(): Promise<void>;
    addSubjectRight(): Promise<void>;

    extendSubjectDown(): Promise<void>;
    extendSubjectUp(): Promise<void>;
    extendSubjectLeft(): Promise<void>;
    extendSubjectRight(): Promise<void>;

    swapSubjectDown(): Promise<void>;
    swapSubjectUp(): Promise<void>;
    swapSubjectLeft(): Promise<void>;
    swapSubjectRight(): Promise<void>;

    delete(): Promise<void>;
};

export type Subject = SubjectAction & {
    fixSelection(direction: "left" | "right"): void;

    name: SubjectName;
};

export function createFrom(
    manager: ModeManager,
    subjectName: SubjectName
): Subject {
    switch (subjectName) {
        // TODO: Temporarily disabled so that I can work on line mode exclusively
        // case "BLOCK":
        //     return new BlockSubject(manager);
        // case "LINE":
        //     return new LineSubject(manager);
        case "WORD":
            return new WordSubject(manager);
    }
}
