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
}
.items {
    border: 1px solid rgb(54, 54, 54);
}
`);


export { BaseElement, Button, Column, Row }


// .container {
//     display: flex;
//     flex-direction: column;
//     /* margin-left: 20px; */
//     margin: 10px;
// }

// /* .container button {
//     color: brown;
// } */

// .button {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
//     /* margin-left: 20px; */
//     margin: 10px;
// }

// .button button {
//     width: fit-content;
// }

// .label {
//     display: flex;
//     flex-direction: row;
//     align-items: center;
//     /* margin-left: 20px; */
//     margin: 10px;
//     border: 4px black;
//     height: 30px;
//     gap: 10px;
// }

// .input {
//     display: flex;
//     flex-direction: row;
//     align-items: center;
//     /* margin-left: 20px; */
//     margin: 10px;
//     border: 4px black;
//     height: 30px;
//     gap: 10px;
// }

// .input input {
//     width: 150px;
// }

// .textarea {
//     display: flex;
//     flex-direction: column;
//     margin: 10px;
//     border: 4px black;
// }

// .textarea textarea{
//     resize: none;
// }
// .items {
//     border: 1px solid rgb(54, 54, 54);
// }

// /* .column{
//     margin: 10px;
//     display: flex;
//     flex-direction: column;
// }

// .row{
//     height: 30px;
//     display: flex;
//     flex-direction: row;
//     gap: 10px;
// } */