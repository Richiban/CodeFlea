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
