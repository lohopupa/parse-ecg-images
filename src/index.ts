import { BaseElement, Button, Column, Input, Row, ToggleBoxes } from "./ui.js"
import { findIntersection, Vector2 } from "./vector2.js"

const LEAFS_COUNT = 12
enum Action {
    NOTHING,
    DRAW_SQUARE,
    SELECT_CHANNELS,
    MOVE_CHANNELS,
    FIND_DATA
}

type State = {
    loadedImages: HTMLImageElement[]
    currentImage: number
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    mouseX: number
    mouseY: number
    mouseDelta: Vector2
    squareDiagonal: [number, number][]
    squarePoints: Vector2[]
    action: Action
    channelsSelectState: "pos" | "size"
    channels: { p1: Vector2, p2: Vector2 }
    dragging: boolean
    pointsPerSquare: number
    cropedImage: ImageData | null
}

let state: State

const colors = [
    "#FF573322",
    "#33FF5722",
    "#3357FF22",
    "#F1C40F22",
    "#8E44AD22",
    "#E67E2222",
    "#1ABC9C22",
    "#2980B922",
    "#D3540022",
    "#7D3C9822",
    "#2ECC7122",
    "#C0392B22",
]

const onPrevImageClick = () => {
    state.currentImage = Math.max(0, state.currentImage - 1)
    render()
}

const onNextImageClick = () => {
    state.currentImage = Math.min(state.loadedImages.length, state.currentImage + 1)
    render()
}

const onSquareButtonClick = () => {
    state.squareDiagonal.length = 0
    state.action = Action.DRAW_SQUARE
}

const onSelectChannelsButtonClick = () => {
    state.action = Action.SELECT_CHANNELS
    state.channelsSelectState = "pos"
}

const onMoveChannelsButtonClick = () => {
    state.action = Action.MOVE_CHANNELS
}

const onCropImageButtonClick = async () => {
    const img = state.loadedImages[state.currentImage]
    // const img = await loadImageFromUrl(state.canvas.toDataURL())
    const [sp1, sp2, sp3, sp4] = state.squarePoints
    const { p1, p2: p3 } = state.channels

    const hRatio = state.canvas.width / img.width
    const vRatio = state.canvas.height / img.height
    const ratio = Math.min(hRatio, vRatio)

    const norm = sp2.subtract(sp1).normalize()
    const p2 = findIntersection({ p: p1, d: norm }, { p: p3, d: norm.rotate270() }) ?? new Vector2(0, 0)
    const p4 = findIntersection({ p: p1, d: norm.rotate90() }, { p: p3, d: new Vector2(0, 0).subtract(norm) }) ?? new Vector2(0, 0)
    const points = [p1, p2, p3, p4].map((p) => p.scale(1 / ratio).apply(Math.floor))
    state.cropedImage = await extractAndAlignRectangle(img, points)
    state.action = Action.FIND_DATA
    render()
}

async function loadImageFromUrl(url: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
    })
}

const onFindDataButtonClick = () => {
    state.action = Action.FIND_DATA
}

const onPPSChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    state.pointsPerSquare = Number(target.value)
    console.log(state.pointsPerSquare)
}

function renderParameters(parameters: BaseElement) {
    const left_bar = document.getElementById("left-bar") as HTMLElement
    left_bar.innerHTML = ''
    left_bar.appendChild(parameters.render())
}

window.onload = () => {
    const input = document.getElementById("load-files") as HTMLInputElement
    input.addEventListener("change", addFiles)
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    canvas.addEventListener("mousemove", (e) => {
        state.mouseDelta = new Vector2(e.offsetX - state.mouseX, e.offsetY - state.mouseY)
        state.mouseX = e.offsetX;
        state.mouseY = e.offsetY;
        render()
    });
    canvas.addEventListener("mousedown", () => {
        state.dragging = true
    })
    canvas.addEventListener("mouseup", () => {
        state.dragging = false
    })
    canvas.addEventListener("click", (e) => {
        switch (state.action) {
            case Action.NOTHING: {
                break
            }
            case Action.DRAW_SQUARE: {
                if (state.squareDiagonal.length < 2) {
                    state.squareDiagonal.push([e.offsetX, e.offsetY])
                }
                break
            }
            case Action.SELECT_CHANNELS: {
                if (state.channelsSelectState == "pos") {
                    state.channels.p1 = new Vector2(e.offsetX, e.offsetY)
                    state.channelsSelectState = "size"
                } else {
                    state.channels.p2 = new Vector2(e.offsetX, e.offsetY)
                }
                break
            }
            case Action.MOVE_CHANNELS: {
                break;
            }
        }
    })
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
    state = {
        loadedImages: [],
        currentImage: 0,
        mouseX: 0,
        mouseY: 0,
        squareDiagonal: [],
        canvas: canvas,
        ctx: ctx,
        squarePoints: [],
        action: Action.NOTHING,
        channels: { p1: new Vector2(0, 0), p2: new Vector2(0, 0) },
        channelsSelectState: "pos",
        dragging: false,
        mouseDelta: Vector2.Zero,
        pointsPerSquare: 10,
        cropedImage: null,
    }

    const parameters = new Column("Parameters",
        [
            new Column("Action", [
                new Button("Load Files", loadFiles),
                new Button("Draw square", onSquareButtonClick),
                new Button("Select chanels", onSelectChannelsButtonClick),
                new Button("Move chanels", onMoveChannelsButtonClick),
                new Button("Crop", onCropImageButtonClick),
                new Button("Find data", onFindDataButtonClick),
            ]),
            new Row("Navigation", [
                new Button("Prev", onPrevImageClick),
                new Button("next", onNextImageClick)
            ]),
            new Column("Settings", [
                new Input("Points per square", onPPSChange, state.pointsPerSquare),
                new Button("Calc", calc)

            ])
        ])


    renderParameters(parameters)

    onResize()
    document.addEventListener("resize", onResize)
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

function drawImageOnCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement){
    const hRatio = canvas.width / img.width
    const vRatio = canvas.height / img.height
    const ratio = Math.min(hRatio, vRatio)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, img.width * ratio, img.height * ratio)
}

function drawImageOnStateCanvas(img: HTMLImageElement) {
    if (img) {
        drawImageOnCanvas(state.canvas, state.ctx, img)
    }
}

function onResize() {
    const canvas_container = document.getElementById("canvas-container") as HTMLElement

    state.canvas.width = canvas_container.clientWidth
    state.canvas.height = canvas_container.clientHeight

    render()
}

function render() {
    state.ctx.font = "30px Arial"
    drawImageOnStateCanvas(state.loadedImages[state.currentImage])
    renderSquare()
    if (state.action != Action.FIND_DATA) {
        if (state.action == Action.MOVE_CHANNELS && state.dragging) {
            state.channels.p1 = state.channels.p1.add(state.mouseDelta)
            state.channels.p2 = state.channels.p2.add(state.mouseDelta)
        }
        if (state.channelsSelectState == "size")
            drawGrid(
                state.channels.p1,
                state.channels.p2.isZero()
                    ? new Vector2(state.mouseX, state.mouseY)
                    : state.channels.p2)

        if (state.action == Action.DRAW_SQUARE)
            zoomWindow()
    } else if (state.cropedImage) {
        state.canvas.width = state.cropedImage.width
        state.canvas.height = state.cropedImage.height
        state.ctx.putImageData(state.cropedImage, 0, 0)
        renderCrop()
        // drawGrid(
        //     Vector2.Zero,
        //     new Vector2(
        //         state.cropedImage.width,
        //         state.cropedImage.height
        //     )
        // )
    }
}

function renderCrop() {

}

function renderSquare() {
    if (state.squareDiagonal.length == 0) {
        return
    }
    let sx: number, sy: number, ex: number, ey: number
    [sx, sy] = state.squareDiagonal[0]
    if (state.squareDiagonal.length == 1) {
        [ex, ey] = [state.mouseX, state.mouseY]
    } else {
        [ex, ey] = state.squareDiagonal[1]
    }
    state.ctx.fillStyle = "red"
    state.ctx.strokeStyle = "blue"
    state.ctx.lineWidth = 2
    drawSquare(state.ctx, sx, sy, ex, ey)

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

function drawSquare(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    const p1 = new Vector2(x1, y1)
    const p2 = new Vector2(x2, y2)


    const mid = p1.add(p2.subtract(p1).scale(0.5))
    const bottomLeft = mid.add(p2.subtract(mid).rotate90())
    const topRight = mid.add(p2.subtract(mid).rotate270())
    state.squarePoints = [p1, topRight, p2, bottomLeft]

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.closePath();
    ctx.stroke();
    drawLineThroughCanvas(ctx, bottomLeft.x, bottomLeft.y, p2.x, p2.y, state.canvas.width, state.canvas.height)
}

function drawLineThroughCanvas(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, canvasWidth: number, canvasHeight: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    let xStart, yStart, xEnd, yEnd;

    if (dx === 0) {
        xStart = x1;
        xEnd = x1;
        yStart = 0;
        yEnd = canvasHeight;
    } else if (dy === 0) {
        yStart = y1;
        yEnd = y1;
        xStart = 0;
        xEnd = canvasWidth;
    } else {
        const slope = dy / dx;

        xStart = 0;
        yStart = y1 - (x1 * slope);

        xEnd = canvasWidth;
        yEnd = yStart + (canvasWidth * slope);
    }

    ctx.beginPath();
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();
}


function drawGrid(p1: Vector2, p3: Vector2) {
    const [sp1, sp2, sp3, sp4] = state.squarePoints

    const norm = sp2.subtract(sp1).normalize()

    const p2 = findIntersection({ p: p1, d: norm }, { p: p3, d: norm.rotate270() }) ?? new Vector2(0, 0)
    const p4 = findIntersection({ p: p1, d: norm.rotate90() }, { p: p3, d: new Vector2(0, 0).subtract(norm) }) ?? new Vector2(0, 0)

    state.ctx.beginPath()
    state.ctx.moveTo(p1.x, p1.y)
    state.ctx.lineTo(p2.x, p2.y)
    state.ctx.lineTo(p3.x, p3.y)
    state.ctx.lineTo(p4.x, p4.y)
    state.ctx.lineTo(p1.x, p1.y)
    state.ctx.closePath()
    state.ctx.stroke()
    for (let i = 0; i < LEAFS_COUNT; i++) {

        state.ctx.fillStyle = colors[i]

        const t1 = p1.add(p4.subtract(p1).scale((i / LEAFS_COUNT)))
        const t2 = p2.add(p3.subtract(p2).scale((i / LEAFS_COUNT)))

        const t3 = p1.add(p4.subtract(p1).scale(((i + 1) / LEAFS_COUNT)))
        const t4 = p2.add(p3.subtract(p2).scale(((i + 1) / LEAFS_COUNT)))

        state.ctx.beginPath()
        state.ctx.moveTo(t1.x, t1.y)
        state.ctx.lineTo(t2.x, t2.y)
        state.ctx.lineTo(t4.x, t4.y)
        state.ctx.lineTo(t3.x, t3.y)
        state.ctx.closePath()
        state.ctx.fill()
    }
}

async function calc() {
    const img = state.loadedImages[state.currentImage]
    const [sp1, sp2, sp3, sp4] = state.squarePoints
    const { p1, p2: p3 } = state.channels

    const hRatio = state.canvas.width / img.width
    const vRatio = state.canvas.height / img.height
    const ratio = Math.min(hRatio, vRatio)

    const norm = sp2.subtract(sp1).normalize()
    const p2 = findIntersection({ p: p1, d: norm }, { p: p3, d: norm.rotate270() }) ?? new Vector2(0, 0)
    const p4 = findIntersection({ p: p1, d: norm.rotate90() }, { p: p3, d: new Vector2(0, 0).subtract(norm) }) ?? new Vector2(0, 0)
    const points = [p1, p2, p3, p4].map((p) => p.scale(1 / ratio).apply(Math.floor))
    const img2 = await extractAndAlignRectangle(img, points)

    for (let i = 0; i < LEAFS_COUNT; i++) {
        const x = 0;
        const h = Math.floor(img2.height / LEAFS_COUNT)
        const y = Math.floor(h * i)
        const w = img2.width

        const leaf = getSubImageData(img2, x, y, w, h)

        const points = extractECGPixels(leaf).map((p) => p.y)
        const max = Math.max(...points)
        const min = Math.min(...points)
        const hh = Math.floor(p1.distance(p4) / LEAFS_COUNT)
        const norm = points.map((p) => (p - min) / (max - min) * hh)
        const ww = p1.distance(p2)
        const shrinked = resizeArray(norm, ww)

        // const t1 = p1.add(p4.subtract(p1).scale((i / LEAFS_COUNT)))
        // const t2 = p2.add(p3.subtract(p2).scale((i / LEAFS_COUNT)))

        // const t3 = p1.add(p4.subtract(p1).scale(((i + 1) / LEAFS_COUNT)))
        // const t4 = p2.add(p3.subtract(p2).scale(((i + 1) / LEAFS_COUNT)))
        const yy = hh * i
        const xx = p1.x
        state.ctx.strokeStyle = "red"
        state.ctx.beginPath()
        state.ctx.moveTo(p1.x + 0, yy + p1.y + shrinked[0])
        for (let x = 1; x < ww; x++) {
            state.ctx.lineTo(p1.x + x, yy + p1.y + shrinked[x])
        }
        state.ctx.moveTo(0, shrinked[0])
        state.ctx.closePath()
        state.ctx.stroke()
        // state.ctx.beginPath()
        // state.ctx.moveTo(p1.x, y)
        // state.ctx.lineTo(t2.x, t2.y)
        // state.ctx.lineTo(t4.x, t4.y)
        // state.ctx.lineTo(t3.x, t3.y)
        // state.ctx.closePath()
        // state.ctx.fill()

        // console.log(points)
        // state.ctx.putImageData(leaf, 0, 0)
        // state.ctx.strokeRect(0, 0, w, h)
    }
}
type Color = {
    r: number
    g: number
    b: number
    a: number
}
type Point = {
    x: number
    y: number
    d: number
}
function extractECGPixels(img: ImageData) {
    const points: Point[] = []
    for (let x = 0; x < img.width; x++) {
        let prev: Point
        if (points.length != 0) {
            prev = points[points.length - 1]
        } else {
            prev = {
                d: 0,
                x: 0,
                y: img.height / 2
            }
        }
        const t = getPoint(img, x, prev)
        points.push(t)
    }
    return points
}

function getPoint(img: ImageData, x: number, prev: Point) {
    const column: Point[] = []
    for (let y = 0; y < img.height; y++) {
        const color = getColor(img, x, y)
        column.push({ x: x, y: y, d: calculateDarkness(color) })
    }
    const p = column.sort((a, b) => {
        const scoreA = getScore(a)
        const scoreB = getScore(b)
        return scoreB - scoreA
    })[0]


    column.length = 0
    return p

    function getScore(pixel: Point) {
        const darknessWeight = 2
        const distanceToPreviousWeight = 3
        const distanceToCenterWeight = 1

        const distanceToPrevious = Math.abs(pixel.y - prev.y)
        const distanceToCenter = Math.abs(pixel.y - img.height / 2)

        return (pixel.d * darknessWeight)
            - (distanceToPrevious * distanceToPreviousWeight)
            - (distanceToCenter * distanceToCenterWeight)
    }
}

function getColor(img: ImageData, x: number, y: number): Color {
    const index = (y * img.width + x) * 4
    return {
        r: img.data[index],
        g: img.data[index + 1],
        b: img.data[index + 2],
        a: img.data[index + 3],
    }
}

function calculateDarkness({ r, g, b }: Color) {
    let brightness = 0.299 * r + 0.587 * g + 0.114 * b
    return 255 - brightness
}

function getSubImageData(imageData: ImageData, x: number, y: number, width: number, height: number) {
    const subImageData = new ImageData(width, height)

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const index = ((y + row) * imageData.width + (x + col)) * 4
            const subIndex = (row * width + col) * 4

            subImageData.data[subIndex] = imageData.data[index]
            subImageData.data[subIndex + 1] = imageData.data[index + 1]
            subImageData.data[subIndex + 2] = imageData.data[index + 2]
            subImageData.data[subIndex + 3] = imageData.data[index + 3]
        }
    }

    return subImageData
}

async function extractAndAlignRectangle(image: HTMLImageElement, points: Vector2[]) {

    const gridAngle = Vector2.Zero.angle(points[0].subtract(points[1])) - Math.PI / 2

    const minX = Math.min(...points.map((p) => p.x))
    const minY = Math.min(...points.map((p) => p.y))
    const maxX = Math.max(...points.map((p) => p.x))
    const maxY = Math.max(...points.map((p) => p.y))

    const width = maxX - minX
    const height = maxY - minY

    const tempCanvas = document.createElement('canvas') as HTMLCanvasElement
    const tempCtx = tempCanvas.getContext('2d', {willReadFrequently: true}) as CanvasRenderingContext2D

    tempCanvas.width = width
    tempCanvas.height = height

    tempCtx.fillStyle = "red"
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    tempCtx.translate(width / 2, height / 2)
    tempCtx.rotate(gridAngle)
    tempCtx.drawImage(image, minX, minY, width, height, -width / 2, -height / 2, width, height)
    tempCtx.rotate(-gridAngle)

    const sWidth = points[0].distance(points[1])
    const sHeight = points[1].distance(points[2])

    const tmpImgData = tempCtx.getImageData((width - sWidth) / 2, (height - sHeight) / 2, sWidth, sHeight)
    tempCanvas.width = tmpImgData.width
    tempCanvas.height = tmpImgData.height
    tempCtx.putImageData(tmpImgData, 0, 0)
    const img3 = await  loadImageFromUrl(tempCanvas.toDataURL())
    tempCanvas.width = state.canvas.width
    tempCanvas.height = state.canvas.height
    drawImageOnCanvas(tempCanvas, tempCtx, img3)
    return tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
}

function resizeArray(arr: number[], targetLength: number): number[] {
    const currentLength = arr.length

    if (currentLength === targetLength) return arr

    if (currentLength > targetLength) {
        return thinOutArray(arr, targetLength)
    }

    return interpolateArray(arr, targetLength)
}

function thinOutArray(array: number[], length: number) {
    const factor = array.length / length
    return Array.from({ length: length }, (_, i) => array[Math.floor(i * factor)])
}

function interpolateArray(array: number[], length: number) {
    const factor = (array.length - 1) / (length - 1)
    return Array.from({ length: length }, (_, i) => {
        const index = i * factor
        const lower = Math.floor(index)
        const upper = Math.ceil(index)
        if (lower === upper) return array[lower]
        return array[lower] + (array[upper] - array[lower]) * (index - lower)
    })
}