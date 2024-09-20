
const loadedImages: HTMLImageElement[] = []
let currentImage = 0


let mouseX = 0
let mouseY = 0
let mouseDown = false

enum State {
    SQARE,
    IDLE
}

let state = State.IDLE

const parametersLayout = {
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
                        currentImage = Math.max(0, currentImage - 1)
                        render()
                    }
                },
                {
                    "type": "button",
                    "title": "Next",
                    "action": () => {
                        currentImage = Math.min(loadedImages.length, currentImage + 1)
                        render()
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
                        state = State.SQARE
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
}

function renderParameters(prms: any) {
    const left_bar = document.getElementById("left-bar") as HTMLElement
    left_bar.innerHTML = ''
    const x = parameters2Html(prms)
    if (x)
        left_bar.appendChild(x)
}

function getParameters(prm: any, parentId = "") {
    const elementId = getParameterId(prm, parentId)
    switch (prm.type) {
        case "container": {
            return prm.items
                .filter((i: any) => !["button"].includes(i.type))
                .reduce((acc: any, i: any) => {
                    acc[i.title.toLowerCase().replace(" ", "_")] = getParameters(i, elementId)
                    return acc
                }, {})
        }
        case "input":
        case "textarea": {
            const v = (document.getElementById(elementId) as HTMLTextAreaElement).value
            switch (prm.valueType) {
                case "int":
                    const x = Number(v)
                    if (isNaN(x)) {
                        alert(`Value in field \"${prm["title"]}\" is not Integer`)
                        throw `Value in field \"${prm["title"]}\" is not Integer`
                    }
                    return x
                case "text":
                    return v
            }
        }
        case "button": break
    }
}

function getParameterId(prm: any, parentId = "") {
    return (parentId == "" ? "" : (parentId + "-")) + prm.title.toLowerCase()
}

function notImplementedElement() {
    const title = document.createElement("p")
    title.textContent = "NOT IMPLEMENTED"
    return title
}


function parameters2Html(prm: any, parentId = ""): HTMLDivElement {
    switch (prm.type) {
        case "container": {
            const div = document.createElement('div');
            div.className = "container"
            const title = document.createElement("p")
            title.textContent = prm.title
            const items = document.createElement("div")
            items.className = "items"
            prm.items.forEach((i: any) => items.appendChild(parameters2Html(i, getParameterId(prm, parentId))))
            div.appendChild(title)
            div.appendChild(items)
            return div

        }
        case "input": {
            const div = document.createElement('div');
            div.className = "input"
            const title = document.createElement("p")
            title.textContent = prm.title
            const input = document.createElement("input")
            input.type = "text"
            input.value = prm.default
            input.id = getParameterId(prm, parentId)
            div.appendChild(title)
            div.appendChild(input)
            return div
        }
        case "textarea": {
            const div = document.createElement('div');
            div.className = "textarea"
            const title = document.createElement("p")
            title.textContent = prm.title
            const input = document.createElement("textarea")
            // input.type = "text"
            input.placeholder = "Type rules here"
            input.rows = 10
            input.cols = 40
            input.id = getParameterId(prm, parentId)
            div.appendChild(title)
            div.appendChild(input)
            return div
        }
        case "button": {
            const div = document.createElement('div');
            div.className = "textarea"
            const btn = document.createElement("button")
            btn.textContent = prm.title
            btn.addEventListener("click", prm.action)
            div.appendChild(btn)
            return div
        }
        case "label": {
            const div = document.createElement('div');
            div.className = "label"
            const lbl = document.createElement("label")
            lbl.textContent = prm.title
            div.appendChild(lbl)
            return div
        }
        default:
            return notImplementedElement()
    }

}

function mouseMove(e: MouseEvent) {

}

window.onload = () => {
    const input = document.getElementById("load-files") as HTMLInputElement
    input.addEventListener("change", addFiles)
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    canvas.addEventListener("mousemove", (e) => {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
        render()
    });
    // canvas.addEventListener("mousedown", console.log)
    // canvas.addEventListener("mouseup", console.log)
    canvas.addEventListener("click", console.log)

    renderParameters(parametersLayout)

    onResize()
    window.addEventListener("resize", onResize)



}

function addFiles(event: Event) {
    const input = event.target as HTMLInputElement

    if (input.files) {
        const files = Array.from(input.files)

        files.forEach(file => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = new Image();
                    img.onload = function () {
                        loadedImages.push(img)
                    };
                    img.src = e.target?.result as string;
                };

                reader.onerror = function () {
                    console.error(`Error reading image file: ${file.name}`);
                };

                reader.readAsDataURL(file);
            } else {
                console.error("Not an image file:", file.name)
            }
        })
    } else {
        console.error("No files selected")
    }
    // rrrr()
}


function drawImageOnCanvas(img: HTMLImageElement) {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    
    if (img && ctx) {
        canvas.width = img.width
        canvas.height = img.height
        var hRatio = canvas.width / img.width
        var vRatio = canvas.height / img.height
        var ratio = Math.min(hRatio, vRatio)
        var centerShift_x = (canvas.width - img.width * ratio) / 2
        var centerShift_y = (canvas.height - img.height * ratio) / 2
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio)
    } else {
        throw new Error("UGABUGA");
    }
}

function onResize() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    const canvas_container = document.getElementById("canvas-container") as HTMLElement

    canvas.width = canvas_container.clientWidth
    canvas.height = canvas_container.clientHeight

    // rrrr()
    // render()
}

function render() {
    drawImageOnCanvas(loadedImages[currentImage])
    zalupa()
}

function zalupa() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    const zoomRadius = 50
    const zoomScale = 1.5
    const img = loadedImages[currentImage]

    const widthRatio = img.width / canvas.width
    const heightRatio = img.height / canvas.height

    ctx.save()
    ctx.beginPath()
    const offset = 50
    ctx.lineWidth = 1
    ctx.strokeStyle = "black"
    ctx.arc(mouseX + offset, mouseY + offset, zoomRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.clip()

    const srcX = (mouseX * widthRatio - zoomRadius / zoomScale)
    const srcY = (mouseY * heightRatio - zoomRadius / zoomScale)
    const srcW = (zoomRadius * 2) / zoomScale
    const srcH = (zoomRadius * 2) / zoomScale

    ctx.drawImage(img, 
        srcX, srcY, srcW, srcH, 
        mouseX - zoomRadius + offset, mouseY - zoomRadius + offset, zoomRadius * 2, zoomRadius * 2)

    ctx.beginPath()
    ctx.moveTo(mouseX - zoomRadius + offset, mouseY + offset)
    ctx.lineTo(mouseX + zoomRadius + offset, mouseY + offset)
    ctx.moveTo(mouseX + offset, mouseY - zoomRadius + offset)
    ctx.lineTo(mouseX + offset, mouseY + zoomRadius + offset)
    ctx.stroke()
    ctx.restore()
}


function zalupa2() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    const zoomRadius = 50
    const zoomScale = 1.5
    const img = loadedImages[currentImage]

    ctx.save()
    ctx.beginPath()
    const offset = 50
    ctx.lineWidth = 1
    ctx.strokeStyle = "black"
    ctx.arc(mouseX, mouseY, zoomRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.clip()

    const srcX = (mouseX - zoomRadius / zoomScale)
    const srcY = (mouseY - zoomRadius / zoomScale)
    const srcW = (zoomRadius * 2) / zoomScale
    const srcH = (zoomRadius * 2) / zoomScale

    ctx.drawImage(img, 
        srcX, srcY, srcW, srcH, 
        mouseX - zoomRadius + offset, mouseY - zoomRadius + offset, zoomRadius * 2, zoomRadius * 2)

    ctx.beginPath()
    ctx.moveTo(mouseX - zoomRadius + offset, mouseY + offset)
    ctx.lineTo(mouseX + zoomRadius + offset, mouseY + offset)
    ctx.moveTo(mouseX + offset, mouseY - zoomRadius + offset)
    ctx.lineTo(mouseX + offset, mouseY + zoomRadius + offset)
    ctx.stroke()
    ctx.restore()
}


function loadFiles() {
    const input = document.getElementById("load-files") as HTMLInputElement
    input.click()
}
