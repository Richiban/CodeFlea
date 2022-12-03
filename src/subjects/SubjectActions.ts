import * as common from "../common";

export type SubjectActions = {
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

    nextSubjectMatch(): Promise<void>;
    prevSubjectMatch(): Promise<void>;
    extendNextSubjectMatch(): Promise<void>;
    extendPrevSubjectMatch(): Promise<void>;

    firstSubjectInScope(): Promise<void>;
    lastSubjectInScope(): Promise<void>;

    deleteSubject(): Promise<void>;
    changeSubject(): Promise<void>;
    duplicateSubject(): Promise<void>;

    search(target: common.Char): Promise<void>;
    searchBackwards(target: string): Promise<void>;
};
