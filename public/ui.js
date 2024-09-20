"use strict";
class BaseElement {
    constructor(title) {
        this.title = title;
        this.className = "not-implemented";
    }
    getId(parentId) {
        return (parentId == "" ? "" : (parentId + "-")) + this.title.toLowerCase();
    }
    render() {
        throw new Error("NOT IMPLEMENTD");
    }
}
class ContainerElement extends BaseElement {
    constructor(title, children) {
        super(title);
        this.children = children;
    }
    render() {
    }
}
class InputElement extends BaseElement {
    constructor(title) {
        super(title);
    }
}
class Row extends ContainerElement {
}
// type UIElement = {
//     type: UIElementType
//     title: string
// }
const qparametersLayout = {
    "type": "container",
    "title": "Parameters",
    "items": [
        {
            "type": "container",
            "title": "Navigation",
            "items": [
                // {
                //     "type": "label",
                //     "title": `Image ${currentImage}/${loadedImages.length}`
                // },
                {
                    "type": "button",
                    "title": "Prev",
                    "action": () => {
                        currentImage = Math.max(0, currentImage - 1);
                        render();
                    }
                },
                {
                    "type": "button",
                    "title": "Next",
                    "action": () => {
                        currentImage = Math.min(loadedImages.length, currentImage + 1);
                        render();
                    }
                },
            ]
        },
        {
            "type": "container",
            "title": "AAA",
            "items": [
                {
                    "type": "button",
                    "title": "Square",
                    "action": () => {
                        state = State.SQARE;
                    }
                }
            ]
        },
        {
            "type": "button",
            "title": "Load files",
            "action": loadFiles
        },
    ]
};
