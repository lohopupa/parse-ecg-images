import { BaseElement, Button, Column, Input, Label, RadioButtonGroup, RadioButtonItem, Row, ToggleBoxes } from "./ui.js"
import { findIntersection, Vector2 } from "./vector2.js"


const fileHeader = ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"]
const LEAFS_COUNT = fileHeader.length
const leafBoxHandleSize = new Vector2(30, 20)
const AudioElement = document.getElementById("audio") as HTMLAudioElement
let AudioPlaying = false
enum Action {
    NOTHING,
    DRAW_SQUARE,
    SELECT_CHANNELS,
    MOVE_CHANNELS,
    FIND_DATA
}

type Sex = "male" | "female" | "none"

enum FindDataAction {
    NOTHING,
    ADJUST_BOX,
    TUNE_LEAF
}

type LeafPoint = {
    x: number
    y: number
    d: number
    modified: boolean
}

type LeafBox = {
    offset: number,
    height: number,
    zeroPoint: number
}

type AdjustBoxAction = null | "top" | "bottom" | "leaf"

type State = {
    loadedImages: { img: HTMLImageElement, filepath: string }[]
    // loadedImages: HTMLImageElement[]
    currentImage: number
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    initialCanvasSize: Vector2
    mouseX: number
    mouseY: number
    mouseDelta: Vector2
    squareDiagonal: [number, number][]
    squarePoints: Vector2[]
    action: Action
    channelsSelectState: "pos" | "size"
    channels: { p1: Vector2, p2: Vector2 }
    dragging: boolean
    rightButton: boolean
    pointsPerSquare: number
    cropedImage: ImageData | null
    currentLeaf: number
    leafsData: LeafPoint[][] | null
    leafsBoxes: LeafBox[]
    findDataAction: FindDataAction
    adjustBoxAction: AdjustBoxAction
    qt: number
    sex: Sex
    speedX: number
    speedY: number
    canvasSizeBeforeCrop: Vector2
    canvas2imgRatio: number
    lastClick: number 
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
    if(!confirm("Are done with that image?"))return
    state.currentImage = Math.max(0, state.currentImage - 1)
    clean()
    render()
}

const onNextImageClick = () => {
    if(!confirm("Are done with that image?"))return
    state.currentImage = Math.min(state.loadedImages.length, state.currentImage + 1)
    clean()
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
    state.canvasSizeBeforeCrop = getSize(state.canvas)

    const img = state.loadedImages[state.currentImage].img
    // const img = await loadImageFromUrl(state.canvas.toDataURL())
    const [sp1, sp2, sp3, sp4] = state.squarePoints
    const { p1, p2: p3 } = state.channels

    const ratio = getRatio(state.canvas, img)
    const norm = sp2.subtract(sp1).normalize()
    const p2 = findIntersection({ p: p1, d: norm }, { p: p3, d: norm.rotate270() }) ?? new Vector2(0, 0)
    const p4 = findIntersection({ p: p1, d: norm.rotate90() }, { p: p3, d: new Vector2(0, 0).subtract(norm) }) ?? new Vector2(0, 0)
    const points = [p1, p2, p3, p4].map((p) => p.scale(1 / ratio).apply(Math.floor))
    state.cropedImage = await extractAndAlignRectangle(img, points)
    state.action = Action.FIND_DATA
    // saveImage(state.cropedImage!, "test.png")

    render()
    onFindDataButtonClick()
    // console.log(
    //     "sizeBeforeCrop", state.imageSizeBeforeCrop,
    //     "canvas", getSize(state.canvas),
    //     "cropedImage", getSize(state.cropedImage!),
    //     "currentImage", getSize(state.loadedImages[state.currentImage].img),
    //     getRatio(state.canvas, state.imageSizeBeforeCrop.toSize())
    // )
}


async function loadImageFromUrl(url: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
    })
}

function renderLeafs() {
    if (!state.leafsData) {
        return
    }

    for (let i = 0; i < state.leafsData.length; i++) {
        const { height, offset } = state.leafsBoxes[i]

        const leaf = state.leafsData[i]

        state.ctx.lineWidth = state.currentLeaf == i ? 3 : 1
        state.ctx.strokeStyle = state.currentLeaf == i ? "#00FF00AA" : "#FF0000AA"
        state.ctx.beginPath()
        state.ctx.moveTo(0, offset + leaf[0].y)
        for (let x = 1; x < leaf.length; x++) {
            state.ctx.lineTo(x, offset + leaf[x].y)
        }
        state.ctx.moveTo(0, leaf[0].y)
        state.ctx.closePath()
        state.ctx.stroke()
        if (state.currentLeaf == i) {
            state.ctx.strokeStyle = "#0000FFAA"
            state.ctx.beginPath()
            state.ctx.moveTo(0, offset + leaf[0].y)
            for (let x = 1; x < leaf.length; x++) {
                if (leaf[x].modified) {
                    state.ctx.lineTo(x, offset + leaf[x].y)
                } else {
                    state.ctx.moveTo(x, offset + leaf[x].y)
                }
            }
            state.ctx.moveTo(0, leaf[0].y)
            state.ctx.closePath()
            state.ctx.stroke()
        }
    }
}

const onFindDataButtonClick = () => {
    state.action = Action.FIND_DATA
    if (!state.cropedImage) {
        return
    }
    const img = state.cropedImage

    const x = 0;
    const h = Math.floor(img.height / LEAFS_COUNT)
    const w = img.width

    state.leafsData = Array.from({ length: LEAFS_COUNT }, (_, i) => {
        const y = Math.floor(h * i)
        const leaf = getSubImageData(img, x, y, w, h)
        return extractECGPixels(leaf)
    })
    state.leafsBoxes = Array.from({ length: LEAFS_COUNT }, (_, i) => {
        const y = Math.floor(h * i)
        return { offset: y, height: h, zeroPoint: state.leafsData?state.leafsData[i][0].y:h/2 }
    })
    render()
}

const onSpeedXChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    state.speedX = Number(target.value)
}
const onSpeedYChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    state.speedY = Number(target.value)
}

const onPPSChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    state.pointsPerSquare = Number(target.value)
}

const onQTChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    state.qt = Number(target.value)
}

const onSEXChange = (v: RadioButtonItem) => {
    state.sex = v.value as Sex
}

function renderParameters(parameters: BaseElement) {
    const left_bar = document.getElementById("left-bar") as HTMLElement
    left_bar.innerHTML = ''
    left_bar.appendChild(parameters.render())
}

const currentLeafLabel = new Label("All")
const fileLabel = new Label("Load file")

function onLeafPrevButtonClick() {
    if (state.currentLeaf == -1) {
        state.currentLeaf = 0
    } else {
        state.currentLeaf = Math.max(state.currentLeaf - 1, 0)
    }
    currentLeafLabel.updateValue(state.currentLeaf.toString())
    render()
}
function onLeafAllButtonClick() {
    state.currentLeaf = -1
    currentLeafLabel.updateValue("All")
    render()
}
function onLeafNextButtonClick() {
    if (state.currentLeaf == -1) {
        state.currentLeaf = 0
    } else {
        state.currentLeaf = Math.min(state.currentLeaf + 1, LEAFS_COUNT - 1)
    }
    currentLeafLabel.updateValue(state.currentLeaf.toString())
    render()
}

function onSaveButtonClicked() {
    if (!state.leafsData) {
        alert("There is no leafs data")
        return
    }
    const [p1, p2, p3, p4] = state.squarePoints
    const { sex, qt } = state
    const imgPath = state.loadedImages[state.currentImage].filepath
    const squareSide = getSquareSide()
    const filePath = `${imgPath}_${sex}_${qt}_${Math.floor(squareSide)}.csv`
    downloadCSV(
        fileHeader,
        state.leafsData.map((l, i) =>
            convertEcgData(l.map((p) => state.leafsBoxes[i].zeroPoint- p.y), state.speedX, state.speedY, squareSide, state.pointsPerSquare)),
        filePath)
}


function onUpdateLeafButtonClick() {
    // state.findDataAction = FindDataAction.ADJUST_BOX
    updateLeafPoints()
    render()
}
// function onTuneLeafButtonClick(){
//     state.findDataAction = FindDataAction.TUNE_LEAF
// }

function rotatePointRelative(x: number, y: number, anchorX: number, anchorY: number, relativeAngle: number): [number, number] {
    const deltaX = x - anchorX
    const deltaY = y - anchorY
    const currentAngle = Math.atan2(deltaY, deltaX) // angle of the point relative to the anchor
    const newAngle = currentAngle + (relativeAngle * Math.PI) / 180 // new angle after adding the relative angle

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) // distance from anchor point
    const xNew = anchorX + distance * Math.cos(newAngle)
    const yNew = anchorY + distance * Math.sin(newAngle)

    return [xNew, yNew]
}

window.onload = () => {
    AudioElement.volume = 0.001
    const input = document.getElementById("load-files") as HTMLInputElement
    input.addEventListener("change", addFiles)

    window.addEventListener("keypress", (e) => {
        switch(e.code){
            case "KeyQ":{
                onLeafPrevButtonClick()
                break
            }
            case "KeyA":{
                onLeafNextButtonClick()
                break
            }
            case "Digit1":{
                loadFiles()
                break
            }
            case "Digit2":{
                onSquareButtonClick()
                break
            }
            case "Digit3":{
                onSelectChannelsButtonClick()
                break
            }
            case "Digit4":{
                onCropImageButtonClick()
                break
            }
            case "KeyS":{
                onSaveButtonClicked()
                break
            }
            default:{
                console.log("Unbinded KeyCode:", e.code)
                break
            }
        }
    })
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault()
        e.stopPropagation()
    })
    canvas.addEventListener("mousemove", (e) => {
        state.mouseDelta = new Vector2(e.offsetX - state.mouseX, e.offsetY - state.mouseY)
        state.mouseX = e.offsetX;
        state.mouseY = e.offsetY;
        render()

    });
    canvas.addEventListener("mouseout", (e) => {
        state.dragging = false
        state.rightButton = false
        state.adjustBoxAction = null
        updateLeafPoints()
        // if(AudioPlaying){
        //     AudioPlaying = false
        //     AudioElement.pause()
        // }
    })
    canvas.addEventListener("wheel", (e) => {
        if (state.action == Action.FIND_DATA) {
            const mouse = new Vector2(state.mouseX, state.mouseY)
            if (pointOverRect(mouse,
                new Vector2(0, state.leafsBoxes[state.currentLeaf].offset),
                new Vector2(state.canvas.width, state.leafsBoxes[state.currentLeaf].height))) {
                state.leafsBoxes[state.currentLeaf].zeroPoint += Math.sign(e.deltaY) * (e.shiftKey ? 5 : 1)
                render()
            }
        }else if(state.action == Action.DRAW_SQUARE){
            if(state.squareDiagonal.length == 2){
                const leftTop = Vector2.FromArray(state.squareDiagonal[0])
                const bottomRight = Vector2.FromArray(state.squareDiagonal[1])
                // const v = bottomRight.subtract(leftTop)
                // const polar = v.toPolar()
                // polar.t += Math.sign(e.deltaY) * 0.1
                // const v2 = Vector2.fromPolar(polar)
                state.squareDiagonal[1] = rotatePointRelative(
                    ...bottomRight.xy, 
                    ...leftTop.xy, 
                    Math.sign(e.deltaY) * 0.1)
                render()
                
            }
        }
    })
    canvas.addEventListener("mousedown", (e) => {
        if(!AudioPlaying){
            AudioElement.play()
            AudioPlaying = true
        }
        state.dragging = true
        if(e.button == 2){
            state.adjustBoxAction = "leaf"
            state.rightButton = true
            return
        }
        if (state.action == Action.FIND_DATA) {
            const [top, bottom] = getLeafBoxHandles()
            const mouse = new Vector2(state.mouseX, state.mouseY)
            if (pointOverRect(mouse, top, leafBoxHandleSize)) {
                state.adjustBoxAction = "top"
            } else if (pointOverRect(mouse, bottom, leafBoxHandleSize)) {
                state.adjustBoxAction = "bottom"
            } else if (pointOverRect(mouse,
                new Vector2(0, state.leafsBoxes[state.currentLeaf].offset),
                new Vector2(state.canvas.width, state.leafsBoxes[state.currentLeaf].height))) {
                state.adjustBoxAction = "leaf"
                // updateLeafPoints()
            }
        }
    })
    canvas.addEventListener("mouseup", () => {
        state.dragging = false
        state.rightButton = false
        state.adjustBoxAction = null
        updateLeafPoints()
    })
    canvas.addEventListener("click", (e) => {
        if(e.timeStamp - 150 < state.lastClick){
            return
        }
        state.lastClick = e.timeStamp
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
            case Action.FIND_DATA: {

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
        pointsPerSquare: 50,
        cropedImage: null,
        initialCanvasSize: Vector2.Zero,
        currentLeaf: -1,
        leafsData: null,
        findDataAction: FindDataAction.NOTHING,
        leafsBoxes: [],
        adjustBoxAction: null,
        qt: 0,
        sex: "none",
        speedX: 50,
        speedY: 10,
        canvasSizeBeforeCrop: Vector2.Zero,
        canvas2imgRatio: 0,
        rightButton: false,
        lastClick: 0
    }



    const parameters = new Column("Parameters",
        [
            new Column("Settings", [
                fileLabel,
                new Column("", [
                    new Input("Speed", onSpeedXChange, state.speedX),
                    new Input("Apmlitude", onSpeedYChange, state.speedY),
                    new Input("Points per square", onPPSChange, state.pointsPerSquare),

                ]),
                new Input("QT", onQTChange, 0),
                new RadioButtonGroup(
                    "SEX",
                    [
                        { label: "Male", value: "male", selected: false },
                        { label: "Female", value: "female", selected: false },
                        { label: "Combat Helicopter", value: "none", selected: true },
                    ],
                    onSEXChange,
                    "col"),
                new Button("Save", onSaveButtonClicked)

            ]),
            new Column("Action", [
                new Column("Prepare Data", [
                    new Button("Load Files", loadFiles),
                    new Button("Draw square", onSquareButtonClick),
                    new Button("Select chanels", onSelectChannelsButtonClick),
                    new Button("Move chanels", onMoveChannelsButtonClick),
                    new Button("Crop", onCropImageButtonClick),
                ]),
                // new Column("AAAA Data", [
                //     new Button("Find data", onFindDataButtonClick),
                //     new Button("Update leaf", onUpdateLeafButtonClick),
                //     // new Button("Tune Leaf", onTuneLeafButtonClick),
                // ]),
            ]),
            new Column("Leafs", [
                currentLeafLabel,
                new Row("", [
                    new Button("Prev", onLeafPrevButtonClick),
                    new Button("All", onLeafAllButtonClick),
                    new Button("Next", onLeafNextButtonClick),
                ])
            ]),
            new Row("Navigation", [
                new Button("Prev", onPrevImageClick),
                new Button("next", onNextImageClick)
            ]),
        ])

    renderParameters(parameters)

    onResize()
    state.initialCanvasSize.set(canvas.width, canvas.height)
    document.addEventListener("resize", onResize)
}

function addFiles(event: Event) {
    const input = event.target as HTMLInputElement

    if (input.files) {
        const files = Array.from(input.files)

        files.forEach(file => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader()
                const fn = file.name
                reader.onload = function (e) {
                    const img = new Image()
                    img.onload = function () {
                        state.loadedImages.push({ img: img, filepath: fn })
                        // state.loadedImages.push(img)
                    };
                    img.src = e.target?.result as string;
                };

                reader.onerror = function () {
                    console.error(`Error reading image file: ${file.name}`)
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

function drawImageOnCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
    const ratio = getRatio(canvas, img)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, img.width * ratio, img.height * ratio)
}

function drawImageOnStateCanvas(img: HTMLImageElement) {
    if (img) {
        state.canvas2imgRatio = getRatio(state.canvas, img)
        drawImageOnCanvas(state.canvas, state.ctx, img)
    }
}

function onResize() {
    const canvas_container = document.getElementById("canvas-container") as HTMLElement

    state.canvas.width = 0
    state.canvas.height = 0


    state.canvas.width = canvas_container.clientWidth
    state.canvas.height = canvas_container.clientHeight

    render()
}

function render() {
    state.ctx.font = "30px Arial"
    if (!state.loadedImages[state.currentImage]) {
        return
    }
    fileLabel.updateValue(state.loadedImages[state.currentImage].filepath)
    drawImageOnStateCanvas(state.loadedImages[state.currentImage].img)
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
    } else if (state.action == Action.FIND_DATA && state.cropedImage) {
        if (state.dragging) {
            if (state.currentLeaf != -1) {
                if (state.adjustBoxAction == "top") {
                    state.leafsBoxes[state.currentLeaf].offset += state.mouseDelta.y
                    // if (state.leafsData) {
                    //     for (let i = 0; i < state.leafsData[state.currentLeaf].length; i++) {
                    //         state.leafsData[state.currentLeaf][i].y -= (state.mouseDelta.y / 4)
                    //     }
                    // }   
                    state.leafsBoxes[state.currentLeaf].height -= state.mouseDelta.y
                } else if (state.adjustBoxAction == "bottom") {
                    state.leafsBoxes[state.currentLeaf].height += state.mouseDelta.y
                } else if (state.adjustBoxAction == "leaf" && !state.rightButton) {
                    if (state.leafsData) {
                        state.leafsData[state.currentLeaf][state.mouseX].y = state.mouseY - state.leafsBoxes[state.currentLeaf].offset
                        state.leafsData[state.currentLeaf][state.mouseX].modified = true
                    }
                }else if (state.adjustBoxAction == "leaf" && state.rightButton) {
                    if (state.leafsData) {
                        for(let i = -15; i <= 15; i++){
                            if(state.mouseX + i < 0 || state.mouseX + i > state.leafsData[state.currentLeaf].length){
                                continue
                            }
                            state.leafsData[state.currentLeaf][state.mouseX + i].modified = false
                        }
                    }
                }
            }
        }
        renderCrop()
        if(state.dragging && state.rightButton){
            state.ctx.fillStyle = "#AAAAAAAA"
            drawCircle(state.ctx, state.mouseX, state.mouseY, 15)
        }
    }
}

function renderCrop() {
    if (!state.cropedImage) {
        return
    }
    state.canvas.width = state.cropedImage.width
    state.canvas.height = state.cropedImage.height
    state.ctx.putImageData(state.cropedImage, 0, 0)

    renderLeafs()
    // renderCurrentColumn()
    renderLeafBox()
    renderLeafBoxHandles()
    // renderTestSquare()
}

function getSquareSide(){
    const [p1, p2, p3, p4] = state.squarePoints
    const img = state.loadedImages[state.currentImage].img
    const ratioC2I = getRatio(state.canvasSizeBeforeCrop.toSize(), img)
    const imgSquareSize = p1.distance(p2) / ratioC2I
    const ratioI2C = getRatio(img, state.cropedImage!)
    // const ratio = state.canvas2imgRatio / getRatio(state.canvas, state.cropedImage!)
    return (imgSquareSize / ratioI2C) * (10/9)
    
}

function renderTestSquare() {
    const points = state.squarePoints
    // TODO: map points to new image size
    
    // const ratio = getRatio(state.cropedImage!, state.imageSizeBeforeCrop.toSize())
    const squareSide = getSquareSide()
    state.ctx.strokeStyle = "blue"
    state.ctx.strokeRect(0, 0, squareSide, squareSide)
    state.ctx.strokeRect(state.mouseX, state.mouseY, squareSide, squareSide)
    state.ctx.strokeStyle = "green"
    state.ctx.strokeRect(100, 0, points[0].distance(points[1]), points[0].distance(points[1]))
}

function renderCurrentColumn() {
    const i = state.currentLeaf
    if (i == -1) return
    const { height, offset } = state.leafsBoxes[i]

    state.ctx.strokeStyle = "#0000FF88"
    state.ctx.lineWidth = 2
    state.ctx.beginPath()
    state.ctx.moveTo(state.mouseX, offset)
    state.ctx.lineTo(state.mouseX, offset + height)
    state.ctx.closePath()
    state.ctx.stroke()

    state.ctx.strokeStyle = "#0000FF88"
    state.ctx.lineWidth = 2
    state.ctx.strokeRect(0, offset, state.canvas.width, height)
    state.ctx.stroke()

}

function renderLeafBox() {
    const i = state.currentLeaf
    if (i == -1) return
    const { height, offset, zeroPoint } = state.leafsBoxes[i]
    state.ctx.strokeStyle = "#0000FF88"
    state.ctx.lineWidth = 2
    state.ctx.strokeRect(0, offset, state.canvas.width, height)
    state.ctx.strokeStyle = "#0000FF88"
    state.ctx.lineWidth = 2
    state.ctx.beginPath()
    state.ctx.moveTo(0, offset + zeroPoint)
    state.ctx.lineTo(state.canvas.width, offset + zeroPoint)
    state.ctx.closePath()
    state.ctx.stroke()
}

function renderLeafBoxHandles() {
    const handles = getLeafBoxHandles()
    state.ctx.strokeStyle = "blue"
    state.ctx.lineWidth = 2
    state.ctx.fillStyle = "#AAAAAA55"
    handles.forEach((b) => {
        strokeRect(b, leafBoxHandleSize)
        fillRect(b, leafBoxHandleSize)
    })
}

function fillRect({ x, y }: Vector2, { x: w, y: h }: Vector2) {
    state.ctx.fillRect(x, y, w, h)
}

function strokeRect({ x, y }: Vector2, { x: w, y: h }: Vector2) {
    state.ctx.strokeRect(x, y, w, h)
}

function getLeafBoxHandles() {
    const i = state.currentLeaf
    if (i == -1) return []
    const { height, offset } = state.leafsBoxes[i]
    const mid = state.canvas.width / 2
    const top = new Vector2(mid, offset).subtract(leafBoxHandleSize.scale(0.5))
    const bottom = new Vector2(mid, height + offset).subtract(leafBoxHandleSize.scale(0.5))
    return [top, bottom]
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
    const img = state.loadedImages[state.currentImage].img

    const ratio = getRatio(state.canvas, img)
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
    drawLineThroughCanvas(ctx, p1.x, p1.y, bottomLeft.x, bottomLeft.y, state.canvas.width, state.canvas.height)
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

type Color = {
    r: number
    g: number
    b: number
    a: number
}

function updateLeafPoints() {
    if (!state.leafsData) { return }
    if (state.currentLeaf == -1) { return }
    for (let i = 1; i < state.canvas.width; i++) {
        if (!state.leafsData[state.currentLeaf][i].modified) {
            state.leafsData[state.currentLeaf][i] = getPointByIndex(i, state.leafsData[state.currentLeaf][i - 1])
        }
        // const t = getPoint(img, i, prev)
        // points.push(t)
    }
}

function extractECGPixels(img: ImageData) {
    const points: LeafPoint[] = []
    for (let x = 0; x < img.width; x++) {
        let prev: LeafPoint
        if (points.length != 0) {
            prev = points[points.length - 1]
        } else {
            prev = {
                d: 0,
                x: 0,
                y: img.height / 2,
                modified: false
            }
        }
        const t = getPoint(img, x, prev)
        points.push(t)
    }
    return points
}

function getPointByIndex(x: number, prev: LeafPoint) {
    const column: LeafPoint[] = []
    const img = state.cropedImage
    const i = state.currentLeaf
    if (!img || i == -1) {
        throw new Error("AAAAAAAAAAAAA")
    }
    const leafBox = state.leafsBoxes[i]
    for (let y = 0; y < leafBox.height; y++) {
        const color = getColor(img, x, leafBox.offset + y)
        column.push({ x: x, y: y, d: calculateDarkness(color), modified: false })
    }
    const p = column.sort((a, b) => {
        const scoreA = getScore(a)
        const scoreB = getScore(b)
        return scoreB - scoreA
    })[0]


    column.length = 0
    return p

    function getScore(pixel: LeafPoint) {
        const darknessWeight = 2
        const distanceToPreviousWeight = 3
        const distanceToCenterWeight = 1

        const distanceToPrevious = Math.abs(pixel.y - prev.y)
        const distanceToCenter = Math.abs(pixel.y - leafBox.height / 2)

        return (pixel.d * darknessWeight)
            - (distanceToPrevious * distanceToPreviousWeight)
            - (distanceToCenter * distanceToCenterWeight)
    }
}


function getPoint(img: ImageData, x: number, prev: LeafPoint) {
    const column: LeafPoint[] = []
    for (let y = 0; y < img.height; y++) {
        const color = getColor(img, x, y)
        column.push({ x: x, y: y, d: calculateDarkness(color), modified: false })
    }
    const p = column.sort((a, b) => {
        const scoreA = getScore(a)
        const scoreB = getScore(b)
        return scoreB - scoreA
    })[0]


    column.length = 0
    return p

    function getScore(pixel: LeafPoint) {
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
    let brightness = 0.0 * r + 0.587 * g + 0.114 * b
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
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D

    tempCanvas.width = width
    tempCanvas.height = height

    tempCtx.translate(width / 2, height / 2)
    tempCtx.rotate(gridAngle)
    tempCtx.drawImage(image, minX, minY, width, height, -width / 2, -height / 2, width, height)

    const sWidth = points[0].distance(points[1])
    const sHeight = points[1].distance(points[2])

    const tmpImgData = tempCtx.getImageData((width - sWidth) / 2, (height - sHeight) / 2, sWidth, sHeight)

    tempCanvas.width = sWidth
    tempCanvas.height = sHeight
    tempCtx.putImageData(tmpImgData, 0, 0)

    const img3 = await loadImageFromUrl(tempCanvas.toDataURL())

    tempCanvas.width = state.initialCanvasSize.x
    tempCanvas.height = state.initialCanvasSize.y

    const ratio = getRatio(tempCanvas, img3)
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
    tempCtx.drawImage(img3, 0, 0, img3.width * ratio, img3.height * ratio)

    return tempCtx.getImageData(0, 0, img3.width * ratio, img3.height * ratio)
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

function stripTransparentEdges(imageData: ImageData): ImageData {
    const { width, height, data } = imageData
    let minX = width, minY = height, maxX = 0, maxY = 0
    let hasOpaquePixel = false

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4
            const alpha = data[index + 3]
            if (alpha !== 0) {
                hasOpaquePixel = true
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
        }
    }


    const croppedWidth = maxX - minX + 1
    const croppedHeight = maxY - minY + 1
    const croppedData = new Uint8ClampedArray(croppedWidth * croppedHeight * 4)

    for (let y = 0; y < croppedHeight; y++) {
        for (let x = 0; x < croppedWidth; x++) {
            const sourceIndex = ((y + minY) * width + (x + minX)) * 4
            const targetIndex = (y * croppedWidth + x) * 4
            croppedData[targetIndex] = data[sourceIndex]
            croppedData[targetIndex + 1] = data[sourceIndex + 1]
            croppedData[targetIndex + 2] = data[sourceIndex + 2]
            croppedData[targetIndex + 3] = data[sourceIndex + 3]
        }
    }

    return new ImageData(croppedData, croppedWidth, croppedHeight)
}


function pointOverRect(p: Vector2, rectPos: Vector2, rectSize: Vector2) {
    return p.x >= rectPos.x && p.x <= rectPos.x + rectSize.x &&
        p.y >= rectPos.y && p.y <= rectPos.y + rectSize.y
}


function downloadCSV(headers: string[], data: number[][], filename: string) {
    const csvContent = [
        headers.join(','),
        ...transpose(data).map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)
}

function transpose<T>(array: T[][]): T[][] {
    return array[0].map((_, colIndex) => array.map(row => row[colIndex]))
}

function clean() {
    state.squareDiagonal = []
    state.squarePoints = []
    state.action = Action.NOTHING
    state.channels = { p1: new Vector2(0, 0), p2: new Vector2(0, 0) }
    state.channelsSelectState = "pos"
    state.dragging = false
    state.cropedImage = null
    state.currentLeaf = -1
    state.leafsData = null
    state.findDataAction = FindDataAction.NOTHING
    state.leafsBoxes = []
    state.adjustBoxAction = null
    state.canvas.width = state.initialCanvasSize.x
    state.canvas.height = state.initialCanvasSize.y
}


function convertEcgData(
    ecgData: number[],
    speed: number,
    amplitude: number,
    squareSide: number,
    pointsPerSquare: number
): number[] {
    const mmPerPixel = 10 / squareSide
    const mvPerPixel = (1 / amplitude) * mmPerPixel

    const ecgAbsolute = ecgData.map(pixel => pixel * mvPerPixel)

    const currentSamplesPerSquare = (speed / 10) * (squareSide / pointsPerSquare)
    const scaleFactor = pointsPerSquare / currentSamplesPerSquare
    const newSize = Math.round(ecgAbsolute.length * scaleFactor)

    const resizedEcg = interpolateArray(ecgAbsolute, newSize)

    // const resizedEcg = new Array(newSize)

    // for (let i = 0; i < newSize; i++) {
    //   const index = (i * (ecgAbsolute.length - 1)) / (newSize - 1)
    //   const lowerIndex = Math.floor(index)
    //   const upperIndex = Math.ceil(index)
    //   const weight = index - lowerIndex

    //   if (upperIndex == lowerIndex) {
    //     resizedEcg[i] = ecgAbsolute[lowerIndex]
    //   } else {
    //     resizedEcg[i] =
    //       ecgAbsolute[lowerIndex] * (1 - weight) + ecgAbsolute[upperIndex] * weight
    //   }
    // }

    return ecgAbsolute
}

function flipData(arr: number[]) {
    const max = Math.max(...arr)
    return arr.map((v) => max - v)
}

interface HasSize {
    width: number
    height: number
}

function getSize(src: HasSize) {
    return new Vector2(src.width, src.height)
}

function getRatio(a: HasSize, b: HasSize) {
    const hRatio = a.width / b.width
    const vRatio = a.height / b.height
    return Math.min(hRatio, vRatio)
}



function saveImage(imageData: ImageData, filename: string): void {
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas 2D context')
    ctx.putImageData(imageData, 0, 0)

    canvas.toBlob(blob => {
        if (!blob) throw new Error('Failed to create Blob from canvas')
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = filename
        link.click()
    })
}
