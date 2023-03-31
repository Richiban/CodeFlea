export type SubjectAction = keyof SubjectActions;

export type SubjectActions = {
    nextObjectDown(): Promise<void>;
    nextObjectUp(): Promise<void>;
    nextObjectLeft(): Promise<void>;
    nextObjectRight(): Promise<void>;

    addObjectBelow(): Promise<void>;
    addObjectAbove(): Promise<void>;
    addObjectToLeft(): Promise<void>;
    addObjectToRight(): Promise<void>;

    swapWithObjectBelow(): Promise<void>;
    swapWithObjectAbove(): Promise<void>;
    swapWithObjectToLeft(): Promise<void>;
    swapWithObjectToRight(): Promise<void>;

    nextOccurrenceOfObject(): Promise<void>;
    prevOccurrenceOfObject(): Promise<void>;
    extendNextOccurrenceOfObject(): Promise<void>;
    extendPrevOccurrenceOfObject(): Promise<void>;

    firstObjectInScope(): Promise<void>;
    lastObjectInScope(): Promise<void>;

    deleteObject(): Promise<void>;
    duplicateObject(): Promise<void>;

    prependNew(): Promise<void>;
    appendNew(): Promise<void>;
};
