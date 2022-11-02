export const registeredCommands: ExtensionConstructor[] = [];

export function registerCommand() {
    return function <T extends ExtensionConstructor>(constructor: T) {
        registeredCommands.push(constructor);
        return constructor;
    };
}

export type ExtensionCommand = {
    id: string;
    description?: string;
    defaultKeyBinding?: {
        key: string;
        when?: string;
    };
    execute: Function;
};

type ExtensionConstructor = {
    new (...args: any[]): ExtensionCommand;
};
