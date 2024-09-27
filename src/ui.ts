class BaseElement {
    protected title: string
    protected className: string

    constructor(title: string) {
        this.title = title
        this.className = "not-implemented"
    }

    render(parentId?: string): HTMLElement {
        throw new Error("NOT IMPLEMENTD")
    }

    getId(parentId: string) {
        return (parentId == "" ? "" : (parentId + "-")) + this.title.toLowerCase()
    }

    protected renderWrapper(): HTMLElement {
        const div = document.createElement('div');
        div.className = this.className
        return div
    }
}

class Container extends BaseElement {
    protected children: BaseElement[]
    constructor(title: string, children: BaseElement[]) {
        super(title)
        this.children = children
    }

    add(e: BaseElement) {
        this.children.push(e)
    }

    override render(parentId?: string) {
        const div = this.renderWrapper()
        div.className = "container"
        const title = document.createElement("p")
        title.textContent = this.title
        const items = document.createElement("div")
        items.className = this.className + " items"
        this.children.forEach((c) => items.appendChild(c.render(parentId)))
        div.appendChild(title)
        div.appendChild(items)

        return div
    }
}
class Row extends Container {
    className = "row"
}

class Column extends Container {
    className = "column"
}

class Button extends BaseElement {
    className = "button"
    callback: (e: MouseEvent) => void

    constructor(title: string, callback: (e: MouseEvent) => void) {
        super(title)
        this.callback = callback
    }

    override render(parentId?: string) {
        const div = this.renderWrapper()
        const btn = document.createElement("button")
        btn.textContent = this.title
        btn.addEventListener("click", this.callback)
        div.appendChild(btn)
        return div
    }
}

class Input extends BaseElement {
    className = "input"
    callback: (e: Event) => void
    defaultValue?: string | number

    constructor(title: string, callback: (e: Event) => void, defaultValue?: string | number) {
        super(title)
        this.callback = callback
        this.defaultValue = defaultValue
    }

    override render(parentId?: string) {
        const div = this.renderWrapper()
        const title = document.createElement("p")
        title.textContent = this.title
        const input = document.createElement("input")
        input.value = this.defaultValue?.toString() ?? ""
        input.addEventListener("input", this.callback)
        div.appendChild(title)
        div.appendChild(input)
        return div
    }
}

type ToggleBoxItem = {
    label: string
    value: boolean
}

class ToggleBoxes extends BaseElement {
    className = "toggle-boxes"
    items: ToggleBoxItem[]
    onChange: (updatedItems: ToggleBoxItem[]) => void

    constructor(title: string, items: ToggleBoxItem[], onChange: (updatedItems: ToggleBoxItem[]) => void) {
        super(title)
        this.items = items
        this.onChange = onChange
    }

    handleToggle(index: number) {
        this.items[index].value = !this.items[index].value
        this.onChange(this.items)
    }

    override render(parentId?: string) {
        const div = this.renderWrapper()
        this.items.forEach((item, index) => {
            const label = document.createElement("label")
            label.classList.add(this.className)

            const checkbox = document.createElement("input")
            checkbox.type = "checkbox"
            checkbox.checked = item.value
            checkbox.addEventListener("change", () => this.handleToggle(index))

            const span = document.createElement("span")
            span.textContent = item.label

            label.appendChild(checkbox)
            label.appendChild(span)
            div.appendChild(label)
        })
        return div
    }
}

// TODO: i am not sure about it
const injectStyles = (css: string) => {
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);
};

injectStyles(`
.column {
    display: flex;
    flex-direction: column;
    margin: 5px;
}
.row {
    display: flex;
    flex-direction: row;
    margin: 5px;
}
.container {
    display: flex;
    flex-direction: column;
    margin: 5px;
    width: fit-content;
    gap: 5px;
}
.items {
    border: 1px solid rgb(54, 54, 54);
}
.input {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 10px;
    border: 4px black;
    height: 30px;
    gap: 10px;
}

.input input {
    width: 150px;
}
.toggle-boxes {
    display: flex;
    flex-direction: column;
    margin: 10px;
}

.toggle-boxes label {
    display: flex;
    flex-direction: row;
    gap: 10px;
    cursor: pointer;
}

.toggle-boxes input[type="checkbox"] {
    transform: scale(1.2);
}

.toggle-boxes span {
    font-size: 16px;
}
`);


export { BaseElement, Button, Column, Row, Input, ToggleBoxItem, ToggleBoxes }
