class BaseElement {
    constructor(title) {
        this.title = title;
        this.className = "not-implemented";
    }
    render(parentId) {
        throw new Error("NOT IMPLEMENTD");
    }
    getId(parentId) {
        return (parentId == "" ? "" : (parentId + "-")) + this.title.toLowerCase();
    }
    renderWrapper() {
        const div = document.createElement('div');
        div.className = this.className;
        return div;
    }
}
class Container extends BaseElement {
    constructor(title, children) {
        super(title);
        this.children = children;
    }
    add(e) {
        this.children.push(e);
    }
    render(parentId) {
        const div = this.renderWrapper();
        div.className = "container";
        const title = document.createElement("p");
        title.textContent = this.title;
        const items = document.createElement("div");
        items.className = this.className + " items";
        this.children.forEach((c) => items.appendChild(c.render(parentId)));
        div.appendChild(title);
        div.appendChild(items);
        return div;
    }
}
class Row extends Container {
    constructor() {
        super(...arguments);
        this.className = "row";
    }
}
class Column extends Container {
    constructor() {
        super(...arguments);
        this.className = "column";
    }
}
class Button extends BaseElement {
    constructor(title, callback) {
        super(title);
        this.className = "button";
        this.callback = callback;
    }
    render(parentId) {
        const div = this.renderWrapper();
        const btn = document.createElement("button");
        btn.textContent = this.title;
        btn.addEventListener("click", this.callback);
        div.appendChild(btn);
        return div;
    }
}
class Input extends BaseElement {
    constructor(title, callback, defaultValue) {
        super(title);
        this.className = "input";
        this.callback = callback;
        this.defaultValue = defaultValue;
    }
    render(parentId) {
        var _a, _b;
        const div = this.renderWrapper();
        const title = document.createElement("p");
        title.textContent = this.title;
        const input = document.createElement("input");
        input.value = (_b = (_a = this.defaultValue) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "";
        input.addEventListener("input", this.callback);
        div.appendChild(title);
        div.appendChild(input);
        return div;
    }
}
class ToggleBoxes extends BaseElement {
    constructor(title, items, onChange) {
        super(title);
        this.className = "toggle-boxes";
        this.items = items;
        this.onChange = onChange;
    }
    handleToggle(index) {
        this.items[index].value = !this.items[index].value;
        this.onChange(this.items);
    }
    render(parentId) {
        const div = this.renderWrapper();
        this.items.forEach((item, index) => {
            const label = document.createElement("label");
            label.classList.add(this.className);
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = item.value;
            checkbox.addEventListener("change", () => this.handleToggle(index));
            const span = document.createElement("span");
            span.textContent = item.label;
            label.appendChild(checkbox);
            label.appendChild(span);
            div.appendChild(label);
        });
        return div;
    }
}
// TODO: i am not sure about it
const injectStyles = (css) => {
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
export { BaseElement, Button, Column, Row, Input, ToggleBoxes };
