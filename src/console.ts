const PROMPT = `<span class="at">@</span><span class="host">${window.location.hostname}</span> ~# >&nbsp;`;
const CARET = "_"
const SPACE = "&nbsp;"
const CONSOLE = document.querySelector(".app .console")!;
const CONSOLE_INPUT = document.querySelector(".console-input input")! as HTMLInputElement;
const CONSOLE_BODY = document.querySelector(".app .console .console-body")!;
const LINE_DELAY = 100;
const COMMANDS: string[] = [
    "help",
    "clear",
    "cls",
    "whoami",
    "about",
];


let lines: HTMLElement[] = [];
let inputs: string[] = [];
let currentInput = inputs.length - 1;

const padLeftHTMLString = (s: string, n: number): string => {
    return SPACE.repeat(n) + s
}

const getTrueCaretLength = (caret: Element): number => {
    return (caret.innerHTML.length - CARET.length) / SPACE.length
}

const newLine = (text: string, className: string = ""): void => {
    let line = document.createElement("div");
    line.classList.add("line");
    if (className !== "") {
        line.classList.add("current");
        line.classList.add(className);
    }

    let lineNumber = document.createElement("span");
    lineNumber.classList.add("line-number");
    lineNumber.innerHTML = lines.length + 1 + "";

    let lineContent = document.createElement("span");
    lineContent.classList.add("line-content");
    lineContent.innerHTML = text;

    line.appendChild(lineNumber);
    line.appendChild(lineContent);

    if (className !== "") {
        let prompt = document.createElement("span");
        prompt.classList.add("prompt");
        prompt.innerHTML = PROMPT;
        lineContent.appendChild(prompt);

        let caret = document.createElement("span");
        caret.classList.add("caret")
        caret.innerHTML = CARET
        lineContent.appendChild(caret)

        let text = document.createElement("span");
        text.classList.add("line-input-text");
        lineContent.appendChild(text);

        let suggestion = document.createElement("span");
        suggestion.classList.add("suggestion");
        lineContent.appendChild(suggestion);
    }

    if (lines.length > 0) {
        lines[lines.length-1].classList.remove("current");
    }
    lines.push(line);
    CONSOLE_BODY.appendChild(line);
    CONSOLE_BODY.scrollTop = CONSOLE_BODY.scrollHeight;
}

const newLines = (lines: string[][]): void => {
    let delay = 0;
    lines.forEach(line => {
        setTimeout(() => {
            if (line.length === 1) {
                newLine(line[0]);
            } else {
                newLine(line[0], line[1]);
            }
        }, delay);
        delay += LINE_DELAY;
    });
}

const setCaretPosition = (): void => {
    let end = CONSOLE_INPUT.value.length;
    CONSOLE_INPUT.setSelectionRange(end, end);
}

const focusInput = (): void => {
    CONSOLE_INPUT.focus();
    setCaretPosition();
}

const editLastLine = (input: string): void => {
    if (COMMANDS.includes(input.trim())) {
        input = `<span class="cmd">${input}</span>`
    }
    lines[lines.length-1].querySelector(".line-content .line-input-text")!.innerHTML = input;
}

const addInput = (input: string): void => {
    if (input === "") {
        return;
    }
    // squash all inputs that are the same
    if (inputs.length > 0 && inputs[inputs.length-1] === input) {
        return;
    }
    inputs.push(input);
    currentInput = inputs.length;
}

const setSuggestion = (input: string): void => {
    let current = lines[lines.length-1].querySelector(".suggestion")!;
    let suggestion = autoComplete(input, true).replace(input, "");
    if (input === "") {
        suggestion = "";
    }
    current.innerHTML = suggestion;
}

const autoComplete = (input: string, force: boolean = false): string => {
    let matches = COMMANDS.filter(cmd => cmd.startsWith(input));
    if (matches.length === 1) {
        return matches[0];
    } else if (matches.length > 1 && force) {
        return matches.reduce((a, b) => a.length <= b.length ? a : b);
    }
    return input;
}

const inputHandler = (input: string): void => {
    switch (input) {
        case "help":
            newLines([
                ["help - show this help"],
                ["clear | cls - clear the console"],
                ["whoami - show information about the user"],
                ["about - show information about the creator"],
                ["", "input-line"],
            ]);
            break;
        case "clear":
        case "cls":
            CONSOLE_BODY.innerHTML = "";
            lines = [];
            newLine("", "input-line");
            break;
        default:
            newLines([
                [`Unknown command: ${input}`],
                ["", "input-line"],
            ]);
            break;
    }
}

CONSOLE.addEventListener("click", () => {
    focusInput();
});

// Handle input from CONSOLE_INPUT Element
CONSOLE_INPUT.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
        currentInput = inputs.length;
    }

    if (event.key == "Enter") {
        let input = CONSOLE_INPUT.value;
        CONSOLE_INPUT.value = "";
        inputHandler(input);
        addInput(input);
    } else if (event.key == "ArrowUp") {
        event.preventDefault();
        if (inputs.length > 0) {
            if (currentInput > 0) {
                currentInput--;
                CONSOLE_INPUT.value = inputs[currentInput];
                setCaretPosition();
                editLastLine(CONSOLE_INPUT.value);
            }
        }
    } else if (event.key == "ArrowDown") {
        event.preventDefault();
        if (inputs.length > 0) {
            if (currentInput < inputs.length - 1) {
                currentInput++;
                CONSOLE_INPUT.value = inputs[currentInput];
                setCaretPosition();
                editLastLine(CONSOLE_INPUT.value);
            } else if (currentInput == inputs.length - 1) {
                currentInput++;
                CONSOLE_INPUT.value = "";
                setCaretPosition();
                editLastLine(CONSOLE_INPUT.value);
            }
        }
    } else if (event.key == "Tab") {
        event.preventDefault();
        CONSOLE_INPUT.value = autoComplete(CONSOLE_INPUT.value, true);
        setCaretPosition();
        editLastLine(CONSOLE_INPUT.value);
    }

    setSuggestion(CONSOLE_INPUT.value);
}, false);

CONSOLE_INPUT.addEventListener("keyup", (event: Event) => {
    lines[lines.length-1].querySelector(".caret")!.innerHTML = padLeftHTMLString(CARET, CONSOLE_INPUT.selectionStart!)
})

CONSOLE_INPUT.addEventListener("input" , (event: Event) => {
    editLastLine(CONSOLE_INPUT.value);
    setSuggestion(CONSOLE_INPUT.value);
    lines[lines.length-1].querySelector(".caret")!.innerHTML = padLeftHTMLString(CARET, CONSOLE_INPUT.selectionStart!)
});

CONSOLE_INPUT.onblur = () => {
    let caret = document.querySelector(".console-body .line.current .line-content .caret") as HTMLElement
    if (caret != undefined) {
        caret.style.display = "none"
    }
}

CONSOLE_INPUT.onfocus = () => {
    let caret = document.querySelector(".console-body .line.current .line-content .caret") as HTMLElement
    if (caret != undefined) {
        caret.style.display = "inline"
    }
}

newLines([
    ["Welcome to the console!"],
    ["Type 'help' to see a list of commands."],
    ["", "input-line"]
]);

focusInput();