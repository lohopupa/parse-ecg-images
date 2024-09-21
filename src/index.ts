import { BaseElement, Button, Column, Row } from "./ui.js"

type State = {
    loadedImages: HTMLImageElement[]
    currentImage: number
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    mouseX: number
    mouseY: number
    square: [number, number][]
}

let state: State

const onPrevImageClick = () => {
    state.currentImage = Math.max(0, state.currentImage - 1)
    render()
}

const onNextImageClick = () => {
    state.currentImage = Math.min(state.loadedImages.length, state.currentImage + 1)
    render()
}

const onSquareButtinClick = () => {
    state.square.length = 0
}

const parameters = new Column("Parameters",
    [
        new Row("Navigation", [
            new Button("Prev", onPrevImageClick),
            new Button("next", onNextImageClick)
        ]),
        new Column("Squares", [
            new Button("Square", onSquareButtinClick)
        ]),
        new Button("Load Files", loadFiles)
    ])

function renderParameters() {
    const left_bar = document.getElementById("left-bar") as HTMLElement
    left_bar.innerHTML = ''
    left_bar.appendChild(parameters.render())
}



window.onload = () => {
    const input = document.getElementById("load-files") as HTMLInputElement
    input.addEventListener("change", addFiles)
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    canvas.addEventListener("mousemove", (e) => {
        state.mouseX = e.offsetX;
        state.mouseY = e.offsetY;
        render()
    });
    // canvas.addEventListener("mousedown", console.log)
    // canvas.addEventListener("mouseup", console.log)
    canvas.addEventListener("click", (e) => {
        if (state.square.length < 4) {
            state.square.push([e.offsetX, e.offsetY])
        }
    })
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    state = {
        loadedImages: [],
        currentImage: 0,
        mouseX: 0,
        mouseY: 0,
        square: [],
        canvas: canvas,
        ctx: ctx
    }

    renderParameters()

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
                        state.loadedImages.push(img)
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
}


function drawImageOnCanvas(img: HTMLImageElement) {

    if (img) {
        const hRatio = state.canvas.width / img.width
        const vRatio = state.canvas.height / img.height
        const ratio = Math.min(hRatio, vRatio)
        state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height)
        state.ctx.drawImage(img, 0, 0, img.width * ratio, img.height * ratio)
    } else {
        throw new Error("UGABUGA");
    }
}

function onResize() {
    const canvas_container = document.getElementById("canvas-container") as HTMLElement

    state.canvas.width = canvas_container.clientWidth
    state.canvas.height = canvas_container.clientHeight

    render()
}

function render() {
    drawImageOnCanvas(state.loadedImages[state.currentImage])
    zoomWindow()
    renderSquare()
}
function renderSquare() {
    if (state.square.length > 1) {
        state.ctx.strokeStyle = "red"
        state.ctx.lineWidth = 1

        for (let i = 0; i < state.square.length; i++) {
            let sx: number, sy: number, ex: number, ey: number
            [sx, sy] = state.square[i];
            [ex, ey] = state.square[(i+1)%state.square.length];

            state.ctx.beginPath()
            state.ctx.moveTo(sx, sy)
            state.ctx.lineTo(ex, ey)
            state.ctx.stroke()
            state.ctx.closePath()
        }
    }
    state.ctx.fillStyle = "red"
    state.ctx.strokeStyle = "blue"
    state.ctx.lineWidth = 2

    state.square.forEach(([cx, cy]) => drawCircle(state.ctx, cx, cy, 5))
}

function zoomWindow() {

    const zoomRadius = 50
    const zoomScale = 1.5
    const img = state.loadedImages[state.currentImage]

    const hRatio = state.canvas.width / img.width
    const vRatio = state.canvas.height / img.height
    const ratio = Math.min(hRatio, vRatio)
    const offset = 50

    state.ctx.save()
    state.ctx.beginPath()
    state.ctx.lineWidth = 1
    state.ctx.strokeStyle = "black"
    state.ctx.arc(state.mouseX + offset, state.mouseY + offset, zoomRadius, 0, Math.PI * 2)
    state.ctx.stroke()
    state.ctx.clip()

    const srcX = (state.mouseX / ratio - zoomRadius / zoomScale)
    const srcY = (state.mouseY / ratio - zoomRadius / zoomScale)
    const srcW = (zoomRadius * 2) / zoomScale
    const srcH = (zoomRadius * 2) / zoomScale

    state.ctx.drawImage(img,
        srcX, srcY, srcW, srcH,
        state.mouseX - zoomRadius + offset, state.mouseY - zoomRadius + offset, zoomRadius * 2, zoomRadius * 2)

    state.ctx.beginPath()
    state.ctx.moveTo(state.mouseX - zoomRadius + offset, state.mouseY + offset)
    state.ctx.lineTo(state.mouseX + zoomRadius + offset, state.mouseY + offset)
    state.ctx.moveTo(state.mouseX + offset, state.mouseY - zoomRadius + offset)
    state.ctx.lineTo(state.mouseX + offset, state.mouseY + zoomRadius + offset)
    state.ctx.stroke()
    state.ctx.restore()
}


function loadFiles() {
    const input = document.getElementById("load-files") as HTMLInputElement
    input.click()
}


function drawCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
}