import { useRef, useCallback, useEffect } from "react";
import { TextareaRenderable } from "@opentui/core";
import { useRenderer } from "@opentui/react";
import type { KeyBinding } from "@opentui/core";
import StatusBar from "./status-bar";
import { CommandMenu } from "./command-menu";
import type { Command } from "./command-menu/types";
import { useCommandMenu } from "./command-menu/use-command-menu";
type Props = {
    onSubmit: (text: string) => void;
    disabled?: boolean;
};

export const TEXTAREA_KEY_BINDINGS: KeyBinding[] = [
    { name: "return", action: "submit" },
    { name: "enter", action: "submit" },
    { name: "return", ctrl: true, action: "newline" },
    { name: "enter", ctrl: true, action: "newline" },
];

const InputBar = ({ onSubmit, disabled = false }: Props) => {
    const textareaRef = useRef<TextareaRenderable>(null);
    const onSubmitRef = useRef<() => void>(() => {});
    const renderer = useRenderer();
    const {
        commandQuery,
        handleContentChange,
        resolveCommand,
        scrollRef,
        selectedIndex,
        setSelectedIndex,
        showCommandMenu,
    } = useCommandMenu();
    const handleCommand = useCallback(
        (command: Command | undefined) => {
            const textarea = textareaRef.current;
            if (!textarea || !command) return;
            textarea.setText("");
            if (command.action) {
                command.action({
                    exit: () => renderer.destroy(),
                });
            } else {
                textarea.insertText(command.value + " ");
            }
        },
        [renderer],
    );
    const handleCommandExecute = useCallback(
        (index: number) => {
            const command = resolveCommand(index);
            handleCommand(command);
        },
        [handleCommand, resolveCommand],
    );

    const handleTextareaContentChange = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        handleContentChange(textarea.plainText);
    }, []);

    const handleSubmit = useCallback(() => {
        if (disabled) return;

        const textarea = textareaRef.current;
        if (!textarea) return;

        const text = textarea.plainText.trim();
        if (text.length === 0) return;

        onSubmit(text);
        textarea.setText("");
    }, [disabled, onSubmit]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.onSubmit = () => {
            onSubmitRef.current();
        };
    }, []);

    onSubmitRef.current = () => {
        if (disabled) return;
        if (showCommandMenu) {
            const command = resolveCommand(selectedIndex);
            handleCommand(command);
            return;
        }
        handleSubmit();
    };

    return (
        <box width={"100%"} alignItems="center">
            <box border={["left"]} borderColor={"cyan"} width={"100%"}>
                <box
                    position="relative"
                    justifyContent="center"
                    paddingX={2}
                    paddingY={1}
                    backgroundColor={"#1A1A24"}
                    width={"100%"}
                    gap={1}
                >
                    {showCommandMenu && (
                        <box
                            position="absolute"
                            bottom={"100%"}
                            left={0}
                            width={"100%"}
                            backgroundColor={"#1A1A24"}
                            zIndex={10}
                        >
                            <CommandMenu
                                onExecute={handleCommandExecute}
                                onSelect={setSelectedIndex}
                                scrollRef={scrollRef}
                                selectedIndex={selectedIndex}
                                query={commandQuery}
                            />
                        </box>
                    )}
                    <textarea
                        ref={textareaRef}
                        onContentChange={handleTextareaContentChange}
                        keyBindings={TEXTAREA_KEY_BINDINGS}
                        focused={!disabled}
                        placeholder={`Ask anything... "Fix a bug in the database"`}
                    />
                    <StatusBar />
                </box>
            </box>
        </box>
    );
};

export default InputBar;
