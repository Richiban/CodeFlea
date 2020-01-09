export type DirectionOrNearest = Direction | "nearest";

export type Change = "greaterThan" | "lessThan";

export type Direction = "forwards" | "backwards";

export type JumpLocations = {
  forwardLocations: JumpLocation[];
  backwardLocations: JumpLocation[];
  focusLine: number;
};

export type JumpLocation = {
  jumpCode: string;
  lineNumber: number;
  charIndex: number;
};

export function* zip<A, B>(left: Iterator<A>, right: Iterator<B>) {
  while (true) {
    const lResult = left.next();
    const rResult = right.next();

    if (lResult.done || rResult.done) {
      return;
    } else {
      yield [lResult.value, rResult.value] as const;
    }
  }
}
