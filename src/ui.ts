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

class Label extends BaseElement {
    className = "label"
    id = ""

    constructor(value: string) {
        super(value)
    }

    updateValue(value: string){
        this.title = value
        const title = document.getElementById(this.id) as HTMLLabelElement
        title.innerHTML = value
    }

    override render(parentId?: string) {
        this.id = this.getId(parentId ?? "")
        const div = this.renderWrapper()
        const label = document.createElement("label")
        label.textContent = this.title
        label.id = this.id
        div.appendChild(label)
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

type RadioButtonItem = {
    label: string
    value: string
    selected: boolean
}

class RadioButtonGroup extends BaseElement {
    className = "radio-button-group"
    items: RadioButtonItem[]
    onChange: (selectedItem: RadioButtonItem) => void
    dir: "col" | "row"

    constructor(title: string, items: RadioButtonItem[], onChange: (selectedItem: RadioButtonItem) => void, dir: "col" | "row" = "row") {
        super(title)
        this.items = items
        this.onChange = onChange
        this.dir = dir
        this.className += " " + dir
    }

    handleSelect(index: number) {
        this.items.forEach((item, i) => item.selected = i === index)
        this.onChange(this.items[index])
    }

    override render(parentId?: string) {
        const div = this.renderWrapper()
        this.items.forEach((item, index) => {
            const label = document.createElement("label")
            label.classList.add(...this.className.split(" "))

            const radioButton = document.createElement("input")
            radioButton.type = "radio"
            radioButton.name = this.className
            radioButton.checked = item.selected
            radioButton.addEventListener("change", () => this.handleSelect(index))

            const span = document.createElement("span")
            span.textContent = item.label

            label.appendChild(radioButton)
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

injectStyles(`.column,
.row,
.container,
.input,
.toggle-boxes,
.radio-button-group {
    margin: 2px; /* Decreased from 5px or 10px */
}

.container {
    gap: 2px; /* Decreased from 5px */
}

.input {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 5px; /* Decreased from 10px */
    border: 4px black;
    height: 30px;
    gap: 5px; /* Decreased from 10px */
}

.input input {
    width: 150px;
}

.toggle-boxes {
    display: flex;
    flex-direction: column;
    margin: 5px; /* Decreased from 10px */
}

.toggle-boxes label {
    display: flex;
    flex-direction: row;
    gap: 5px; /* Decreased from 10px */
    cursor: pointer;
}

.toggle-boxes input[type="checkbox"] {
    transform: scale(1.2);
}

.toggle-boxes span {
    font-size: 16px;
}

.radio-button-group {
    display: flex;
    margin: 5px; /* Decreased from 10px */
}

.radio-button-group.row {
    flex-direction: row;
}

.radio-button-group.col {
    flex-direction: column;
}

.radio-button-group label {
    display: flex;
    flex-direction: row;
    gap: 5px; /* Decreased from 10px */
    cursor: pointer;
    align-items: center;
}

.radio-button-group input[type="radio"] {
    transform: scale(1.2);
}

.radio-button-group span {
    font-size: 16px;
}

.items {
    border: 1px solid rgb(54, 54, 54);
}
`);


export { BaseElement, Button, Column, Row, Input, ToggleBoxItem, ToggleBoxes, Label, RadioButtonGroup, RadioButtonItem }
