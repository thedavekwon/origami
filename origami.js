// Do Hyung Kwon
// Final Project ECE462
// webGL objects
let canvas;
let gl;
let program;
let paper;

let vPosition;
let vTexCoord;
let vNormal;

let projectionMatrix = mat4();
let modelViewMatrix = mat4();
let normalViewMatrix = mat4();

let projectionUniform;
let modelViewUniform;
let normalViewUniform;

const texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

// perspective view and camera
let eye = null;
let radius = 3;
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 0.0, -1.0);
let FOV = 45.0;
let aspect = 1.0;
let near = 1.0;
let far = 10000;
let theta = radians(0);
let phi = radians(90);

// rotation variables
let queue = [];
let partIdx = 0;
let rotateTheta = 0;
let start = false;
let rotateStep = false;
let rotateIdx = 1;
let precomputed = false;
let rotationDegree = 90;

// variables for html interaction with events
let mouseLeftDown = false;
let mouseRightDown = false;
let init_x;
let init_y;
let new_x;
let new_y;
let CANVAS_X_OFFSET;
let CANVAS_Y_OFFSET;

// indices for rendering
let paperIndices = [];

// lighting
let lightPosition = vec4(0.0, 0.0, 1.0, 1.0);
let lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
let lightDiffuse = vec4(0.0, 0.0, 0.0, 1.0);
let lightSpecular = vec4(0.0, 0.0, 0.0, 1.0);

let materialAmbient = vec4(0.9, 0.9, 0.9, 1.0);
let materialDiffuse = vec4(0.9, 0.9, 0.9, 1.0);
let materialSpecular = vec4(0.9, 0.9, 0.9, 1.0);
let shininess = 20.0;

window.onload = function init() {
    // webgl initialization
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas, {preserveDrawingBuffer: true, premultipliedAlpha: false});

    CANVAS_X_OFFSET = canvas.offsetLeft;
    CANVAS_Y_OFFSET = canvas.offsetTop;

    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    const image = document.getElementById("texImage");
    loadTexture(image);

    document.getElementById("start").onclick = () => {
        start = true;
    };
    document.getElementById("next").onclick = () => {
        rotateStep = true;
    };
    document.getElementById("cube").onclick = () => {
        if (start) {
            alert("change after animation is done!");
            return;
        }
        partIdx = 0;
        rotateIdx = 1;
        queue = [];
        paperIndices = [];
        rotationDegree = 90;
        paper = new Paper("cube");
        start = false;
        rotateTheta = 0;
        precomputed = false;
        rotateStep = false;
    };
    document.getElementById("plane").onclick = () => {
        if (start) {
            alert("change after animation is done!");
            return;
        }
        partIdx = 0;
        rotateIdx = 1;
        rotationDegree = 90;
        queue = [];
        paperIndices = [];
        paper = new Paper("plane");
        start = false;
        rotateTheta = 0;
        precomputed = true;
        rotateStep = false;
    };
    const ambient = document.getElementById("ambient");
    ambient.oninput = () => {
        lightAmbient = vec4(ambient.value / 50.0, ambient.value / 50.0, ambient.value / 50.0, 1);
    };
    const diffusion = document.getElementById("diffusion");
    diffusion.oninput = () => {
        lightDiffuse = vec4(diffusion.value / 50.0, diffusion.value / 50.0, diffusion.value / 50.0, 1);
    };
    const specular = document.getElementById("specular");
    specular.oninput = () => {
        lightSpecular = vec4(specular.value / 50.0, specular.value / 50.0, specular.value / 50.0, 1);
    };

    document.onkeydown = (e) => {
        e = e || window.event;
        if (e.keyCode == '38') {
            radius = radius - 0.1;
        } else if (e.keyCode == '40') {
            radius = radius + 0.1;
        }
    };

    // element initialization
    canvas.addEventListener("mousedown", startRotate);
    canvas.addEventListener("mouseup", stopRotate);
    canvas.addEventListener("mousemove", rotating);
    canvas.addEventListener("oncontextmenu", (event) => {
        event.preventDefault();
    });

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);

    vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.enableVertexAttribArray(vTexCoord);

    vNormal = gl.getAttribLocation(program, "vNormal");
    gl.enableVertexAttribArray(vNormal);

    paper = new Paper("cube");

    render();
};

function animate() {
    console.log(rotateTheta);
    if (queue.length) {
        if (rotateIdx < paper.parts.length && rotateTheta <= rotationDegree && precomputed) {
            // console.log(queue);
            rotationDegree = queue[0][queue[0].length - 1];
            // setTimeout(function(){  }, 50); 
            paper.rotatePrecompute(...queue[0]);
            if (rotateTheta >= rotationDegree) {
                rotateStep = false;
                rotateTheta = 0;
                rotateIdx++;
                // paper.rotateAxis(...queue[0]);
                queue.shift();
            }
            setTimeout(animate, 3000);
        }
    } else {
        start = false;
    }
}

function render() {
    // Light
    const ambientProduct = mult(lightAmbient, materialAmbient);
    const diffuseProduct = mult(lightDiffuse, materialDiffuse);
    const specularProduct = mult(lightSpecular, materialSpecular);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);

    requestAnimFrame(render);
    paper.draw();

    if (rotateTheta <= rotationDegree && start) {
        if (!precomputed) paper.rotate();
        else {
            animate();
        }
    } else {
        start = false;
    }
    if (rotateIdx < paper.parts.length && rotateTheta <= rotationDegree && rotateStep && !precomputed) {
        paper.rotateNext();
        if (rotateTheta >= rotationDegree) {
            rotateStep = false;
            rotateIdx++;
            rotateTheta = 0;
        }
    }
    if (rotateIdx < paper.parts.length && rotateTheta <= rotationDegree && rotateStep && precomputed) {
        rotationDegree = queue[0][queue[0].length - 1];
        paper.rotatePrecompute(...queue[0]);
        if (rotateTheta >= rotationDegree) {
            rotateStep = false;
            rotateTheta = 0;
            rotateIdx++;
            // paper.rotateAxis(...queue[0]);
            queue.shift();
        }
    }
}

// loading texture from image
function loadTexture(image) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "uSampler"), 0);
}

// constructed with paper class and subclass of parts
class Paper {
    constructor(type) {
        // buffers
        this.paperVerticesBuffer = null;
        this.paperTextureBuffer = null;
        this.paperNormalBuffer = null;

        this.paperVertices = [];
        this.paperColors = [];
        this.paperTextures = [];
        this.paperNormalVertices = [];

        this.parts = [];
        this.sharedEdges = [];
        this.edges = {};
        this.edgesChecked = {};
        this.effected = {};

        if (type === "cube") {
            this.initCube();
        }
        if (type === "plane") {
            this.initPlane();
        }
        this.initPaperBuffers();
        paperIndices.push(this.paperVertices.length);
    }

    // initialize precomputed paper plane
    initPlane() {
        precomputed = true;
        this.parts = [
            new Part(this, [
                [1, 0.7, 0.0, 1],
                [1, 0, 0.0, 1],
                [0.7, 0.7, 0.0, 1]
            ], COLORS.white),
            new Part(this, [
                [0.7, 0.7, 0.0, 1],
                [1, 0, 0.0, 1],
                [0.3, 0.7, 0.0, 1]
            ], COLORS.white),
            new Part(this, [
                [0.3, 0.7, 0.0, 1],
                [1, 0, 0.0, 1],
                [-0.6, 0.7, 0.0, 1]
            ], COLORS.white),
            new Part(this, [
                [-0.6, 0.7, 0.0, 1],
                [1, 0, 0.0, 1],
                [-0.6, 0.0, 0.0, 1]
            ], COLORS.white),
            new Part(this, [
                [1, -0.7, 0.0, 1],
                [1, 0, 0.0, 1],
                [0.7, -0.7, 0.0, 1]
            ], COLORS.white),
            new Part(this, [
                [0.7, -0.7, 0.0, 1],
                [1, 0, 0.0, 1],
                [0.3, -0.7, 0.0, 1]
            ], COLORS.white),
            new Part(this, [
                [0.3, -0.7, 0.0, 1],
                [1, 0, 0.0, 1],
                [-0.6, -0.7, 0.0, 1]
            ], COLORS.white),
            new Part(this, [
                [-0.6, -0.7, 0.0, 1],
                [1, 0, 0.0, 1],
                [-0.6, 0.0, 0.0, 1]
            ], COLORS.white),
        ];
        this.findSharedEdges();
        this.setRotationAxis();

        queue.push([[0, 1], 2, 0, false, 180]);
        queue.push([[4, 5], 6, 0, true, 180]);
        queue.push([[0, 1, 2, 3], 7, 0, true, 180]);
        // queue.push([[1, 2], 2, 0, false, 90]);
        queue.push([[1, 2], 7, 1, false, 90]);
        queue.push([[5, 6], 7, 1, true, 90])
    }

    // initialize precomputed cube
    initCube() {
        this.parts = [
            new Part(this, [
                [0.5, 0.0, 0.0, 1],
                [0.5, 0.25, 0.0, 1],
                [0.25, 0.25, 0.0, 1],
                [0.25, 0.0, 0.0, 1]
            ], COLORS.white),
            new Part(this, [
                [0.25, 0.0, 0.0, 1],
                [0.25, 0.25, 0.0, 1],
                [0.0, 0.25, 0.0, 1],
                [0.0, 0.0, 0.0, 1]
            ], COLORS.white),
            new Part(this, [
                [0.25, 0.25, 0.0, 1],
                [0.25, 0.5, 0.0, 1],
                [0.0, 0.5, 0.0, 1],
                [0.0, 0.25, 0.0, 1]
            ], COLORS.white),
            new Part(this, [
                [0.25, -0.25, 0.0, 1],
                [0.25, 0.0, 0.0, 1],
                [0.0, 0.0, 0.0, 1],
                [0.0, -0.25, 0.0, 1]
            ], COLORS.white),
            new Part(this, [
                [0.0, 0.0, 0.0, 1],
                [0.0, 0.25, 0.0, 1],
                [-0.25, 0.25, 0.0, 1],
                [-0.25, 0, 0.0, 1]
            ], COLORS.white),
            new Part(this, [
                [-0.25, 0.0, 0.0, 1],
                [-0.25, 0.25, 0.0, 1],
                [-0.5, 0.25, 0.0, 1],
                [-0.5, 0, 0.0, 1]
            ], COLORS.white)
        ];

        // this.parts = [
        //     new Part(this, [
        //         [-0.25, -0.25, 0.0, 1],
        //         [0.25, -0.25, 0.0, 1],
        //         [0, 0.10355339059, 0.0 , 1],
        //     ]),
        //     new Part(this, [
        //         [0, 0.10355339059, 0.0, 1],
        //         [0.25, -0.25, 0.0, 1],
        //         [0.5, 0.10355339059, 0.0, 1],
        //     ]),
        //     new Part(this, [
        //         [0, 0.10355339059, 0.0, 1],
        //         [-0.25, -0.25, 0.0, 1],
        //         [-0.5, 0.10355339059, 0.0, 1],
        //     ]),
        //     new Part(this, [
        //         [0, -0.60355339059, 0.0, 1],
        //         [-0.25, -0.25, 0.0, 1],
        //         [0.25, -0.25, 0.0, 1],
        //     ])
        // ];

        this.findSharedEdges();
        this.setRotationAxis();
        this.findAllConnected();
    }

    // initialize buffers
    initPaperBuffers() {
        this.paperVerticesBuffer = gl.createBuffer();
        this.paperTextureBuffer = gl.createBuffer();
        this.paperNormalBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.paperVerticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.paperVertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.paperTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.paperTextures), gl.STATIC_DRAW);
        gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.paperNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.paperNormalVertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    }

    // draw each parts with its own modelviewmatrix
    draw() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        eye = vec3(radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.cos(theta));
        gl.uniform3fv(gl.getUniformLocation(program, "eyePosition"), flatten(eye));
        modelViewMatrix = lookAt(eye, at, up);
        projectionMatrix = perspective(FOV, aspect, near, far);
        this.parts.forEach((part, idx) => {
            part.draw(idx);
        })
    }

    // find shared edges before rotation with given points
    findSharedEdges() {
        Object.keys(this.edges).forEach((edge) => {
            if (this.edges[edge] in this.edgesChecked || this.edges[edge].length !== 2) {

            } else {
                this.edgesChecked[this.edges[edge]] = 1;
                this.sharedEdges[edge] = this.edges[edge];
            }
        });

        Object.keys(this.sharedEdges).forEach((edge) => {
            this.sharedEdges[edge] = this.sharedEdges[edge].sort();
        })
    }

    // find rotation axis before rotation with given points
    setRotationAxis() {
        Object.keys(this.sharedEdges).forEach((edge) => {
            const e = this.sharedEdges[edge];
            const tmp = edge.split(",");
            const axis = [(parseFloat(tmp[0]) - parseFloat(tmp[4])).toFixed(3), (parseFloat(tmp[1]) - parseFloat(tmp[5])).toFixed(3), (parseFloat(tmp[2]) - parseFloat(tmp[6])).toFixed(3)];
            this.parts[e[1]].rotationAxis.push(axis);
            this.parts[e[1]].rotationCoord[axis] = [parseFloat(tmp[4]).toFixed(3), parseFloat(tmp[5]).toFixed(3), parseFloat(tmp[6]).toFixed(3)];
            this.parts[e[1]].rotationCoord[negate(axis)] = [parseFloat(tmp[0]).toFixed(3), parseFloat(tmp[1]).toFixed(3), parseFloat(tmp[2]).toFixed(3)];
            console.log(this.parts[e[1]].rotationCoord);
        })
    }

    // find affected planes with rotation
    findAffected() {
        for (let i = 1; i < this.parts.length; i++) {
            for (let j = i; j < this.parts.length; j++) {
                this.findAllConnected(this.parts[i])
            }
        }
    }

    // find connected planes
    findAllConnected() {
        Object.keys(this.sharedEdges).forEach((edge) => {
            if (this.sharedEdges[edge][0] in this.effected) {
                this.effected[this.sharedEdges[edge][0]].push(this.sharedEdges[edge][1]);
            } else {
                this.effected[this.sharedEdges[edge][0]] = [this.sharedEdges[edge][1]];
            }
        });
        Object.keys(this.effected).forEach((edge) => {
            this.effected[edge] = this.effected[edge].sort();
        })
    }

    // rotate all parts together
    rotate() {
        for (let i = 0; i < this.parts.length; i++) {
            this.parts[i].rotationMatrix = mat4();
        }

        for (let i = 0; i < this.parts.length; i++) {
            if (this.parts[i].rotationAxis.length === 0) continue;
            const q = [i];
            while (q.length) {
                const p = q.shift();
                if (this.effected[p]) {
                    q.push(...this.effected[p]);
                }
                this.parts[p].rotationMatrix = mult(this.parts[p].rotationMatrix, translate(...this.parts[i].rotationCoord[this.parts[i].rotationAxis[0]]));
                this.parts[p].rotationMatrix = mult(this.parts[p].rotationMatrix, rotate(rotateTheta, negate(this.parts[i].rotationAxis[0])));
                this.parts[p].rotationMatrix = mult(this.parts[p].rotationMatrix, translate(...negate(this.parts[i].rotationCoord[this.parts[i].rotationAxis[0]])));
            }
        }
        rotateTheta = rotateTheta + 1;
    }

    // rotate one by one
    rotateNext() {
        const i = rotateIdx;
        if (this.parts[i].rotationAxis.length === 0) return;
        const q = [i];
        while (q.length) {
            const p = q.shift();
            if (this.effected[p]) {
                q.push(...this.effected[p]);
            }
            this.parts[p].rotationMatrix = mult(this.parts[p].rotationMatrix, translate(...this.parts[i].rotationCoord[this.parts[i].rotationAxis[0]]));
            this.parts[p].rotationMatrix = mult(this.parts[p].rotationMatrix, rotate(this.parts[i].rotateAngle, negate(this.parts[i].rotationAxis[0])));
            this.parts[p].rotationMatrix = mult(this.parts[p].rotationMatrix, translate(...negate(this.parts[i].rotationCoord[this.parts[i].rotationAxis[0]])));
        }
        rotateTheta = rotateTheta + 2;
    }

    // rotate one by one with given coordinate
    rotatePrecompute(effecteds, i, idx, negative) {
        // console.log(this.parts[i].rotationCoord);
        // console.log(this.parts[i].rotationAxis[idx]);
        if (!negative) {
            for (let j = 0; j < effecteds.length; j++) {
                const p = effecteds[j];
                // console.log(this.parts[i].rotationCoord);
                // console.log(this.parts[i].rotationAxis[idx]);
                this.parts[p].rotationMatrix = mult(translate(...negate(this.parts[i].rotationCoord[this.parts[i].rotationAxis[idx]])), this.parts[p].rotationMatrix);
                this.parts[p].rotationMatrix = mult(rotate(this.parts[i].rotateAngle, this.parts[i].rotationAxis[idx].slice(0)), this.parts[p].rotationMatrix);
                this.parts[p].rotationMatrix = mult(translate(...this.parts[i].rotationCoord[this.parts[i].rotationAxis[idx]]), this.parts[p].rotationMatrix);
            }
        } else {
            for (let j = 0; j < effecteds.length; j++) {
                const p = effecteds[j];
                this.parts[p].rotationMatrix = mult(translate(...negate(this.parts[i].rotationCoord[this.parts[i].rotationAxis[idx]])), this.parts[p].rotationMatrix);
                this.parts[p].rotationMatrix = mult(rotate(-this.parts[i].rotateAngle, this.parts[i].rotationAxis[idx].slice(0)), this.parts[p].rotationMatrix);
                this.parts[p].rotationMatrix = mult(translate(...this.parts[i].rotationCoord[this.parts[i].rotationAxis[idx]]), this.parts[p].rotationMatrix);
            }
        }
        rotateTheta = rotateTheta + 2;
    }

    // rotate axis after finishing rotation
    rotateAxis(effecteds, i, idx, negative, angle) {
        console.log(effecteds, i, idx, negative, angle);
        if (!effecteds.includes(i)) effecteds.push(i);
        if (!negative) {
            for (let j = 0; j < effecteds.length; j++) {
                const p = effecteds[j];
                const tmp = this.parts[i].rotationAxis[idx];
                const tmpp = this.parts[i].rotationAxis[idx];

                if (tmpp == null || tmp == null || this.parts[p].rotationAxis.length === 0) continue;

                const loc = this.parts[i].rotationCoord[this.parts[i].rotationAxis[idx]];
                const rot = [parseFloat(this.parts[p].rotationAxis[idx][0]).toFixed(3),
                    parseFloat(this.parts[p].rotationAxis[idx][1]).toFixed(3),
                    parseFloat(this.parts[p].rotationAxis[idx][2]).toFixed(3),
                    (0.0).toFixed(3)];
                this.parts[p].rotationAxis[idx] = mult(translate(...negate(loc)), rot);
                this.parts[p].rotationAxis[idx] = mult(rotate(-angle, tmp.slice(0)), rot);
                this.parts[p].rotationAxis[idx] = mult(translate(...negate(loc)), rot);
                this.parts[p].rotationAxis[idx] = this.parts[p].rotationAxis[idx].slice(0, 3);
                this.parts[p].rotationCoord[tmpp] = this.parts[p].rotationCoord[this.parts[p].rotationAxis[idx]];
            }
        } else {
            for (let j = 0; j < effecteds.length; j++) {
                const p = effecteds[j];
                const tmp = this.parts[i].rotationAxis[idx];
                const tmpp = this.parts[i].rotationAxis[idx];
                if (tmpp == null || tmp == null || this.parts[p].rotationAxis.length === 0) continue;
                const loc = this.parts[i].rotationCoord[this.parts[i].rotationAxis[idx]];
                const rot = [parseFloat(this.parts[p].rotationAxis[idx][0]).toFixed(3),
                    parseFloat(this.parts[p].rotationAxis[idx][1]).toFixed(3),
                    parseFloat(this.parts[p].rotationAxis[idx][2]).toFixed(3),
                    (0.0).toFixed(3)];
                this.parts[p].rotationAxis[idx] = mult(translate(...negate(loc)), rot);
                this.parts[p].rotationAxis[idx] = mult(rotate(angle, tmp.slice(0)), rot);
                this.parts[p].rotationAxis[idx] = mult(translate(...negate(loc)), rot);
                this.parts[p].rotationAxis[idx] = this.parts[p].rotationAxis[idx].slice(0, 3);
                console.log(this.parts[p].rotationAxis[idx]);
                this.parts[p].rotationCoord[tmpp] = this.parts[p].rotationCoord[this.parts[p].rotationAxis[idx]];
            }
        }
    }
}


// each plane of paper
class Part {
    constructor(paper, coordinates, color) {
        this.paper = paper;
        this.coordinates = [...coordinates];
        this.rotationAxis = [];
        this.rotationCoord = {};
        this.color = color;
        this.rotationMatrix = mat4();
        this.buildPart();
        this.rotateAngle = 2;
        partIdx++;
    }

    buildPart() {
        paperIndices.push(this.paper.paperVertices.length);
        if (this.coordinates.length === 4) {
            this.quad(...this.coordinates);
        } else if (this.coordinates.length === 3) {
            this.triangle(...this.coordinates);
        }
    }

    transform() {
        modelViewMatrix = mult(modelViewMatrix, this.rotationMatrix);
    }

    quad(a, b, c, d) {
        const indices = [a, b, c, a, c, d];
        for (let i = 0; i < indices.length; ++i) {
            this.paper.paperVertices.push(indices[i]);
            this.paper.paperColors.push(this.color);
            this.paper.paperNormalVertices.push([0, 0, 1]);
            switch (i) {
                case 0:
                    this.paper.paperTextures.push(texCoord[0]);
                    break;
                case 1:
                    this.paper.paperTextures.push(texCoord[1]);
                    break;
                case 2:
                    this.paper.paperTextures.push(texCoord[2]);
                    break;
                case 3:
                    this.paper.paperTextures.push(texCoord[0]);
                    break;
                case 4:
                    this.paper.paperTextures.push(texCoord[2]);
                    break;
                case 5:
                    this.paper.paperTextures.push(texCoord[3]);
                    break;
            }
        }

        const v = [[...a, ...b], [...b, ...a], [...b, ...c], [...c, ...b], [...c, ...d], [...d, ...c], [...d, ...a], [...a, ...d]];
        v.forEach((i) => {
            if (i in this.paper.edges) {
                this.paper.edges[i].push(partIdx);
            } else {
                this.paper.edges[i] = [partIdx];
            }
        })
    }

    triangle(a, b, c) {
        const indices = [b, a, c];
        const t1 = subtract(b, a);
        const t2 = subtract(c, a);
        let normal = normalize(cross(t2, t1));
        normal = vec4(normal);
        normal[3] = 0.0;
        for (let i = 0; i < indices.length; ++i) {
            this.paper.paperVertices.push(indices[i]);
            // this.paper.paperNormalVertices.push([...indices[i], 1.0])
            this.paper.paperColors.push(this.color);
            // this.paper.paperTextures.push(normalize(indices[i]));
            this.paper.paperNormalVertices.push([0, 0, 1, 1]);
            switch (i) {
                case 0:
                    this.paper.paperTextures.push(texCoord[1]);
                    break;
                case 1:
                    this.paper.paperTextures.push(texCoord[0]);
                    break;
                case 2:
                    this.paper.paperTextures.push(texCoord[2]);
                    break;
            }
        }
        const v = [[...a, ...b], [...b, ...a], [...b, ...c], [...c, ...b], [...a, ...c], [...c, ...a]];
        v.forEach((i) => {
            if (i in this.paper.edges) {
                this.paper.edges[i].push(partIdx);
            } else {
                this.paper.edges[i] = [partIdx];
            }
        })

    }

    draw(idx) {
        let mvMatrix = modelViewMatrix;
        this.transform();
        normalViewMatrix = [
            vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
            vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
            vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
        ];
        setMatrixToProgram();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.paper.paperVerticesBuffer);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.paper.paperTextureBuffer);
        gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.paper.paperNormalBuffer);
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);


        gl.drawArrays(gl.TRIANGLES, paperIndices[idx], paperIndices[idx + 1] - paperIndices[idx]);

        modelViewMatrix = mvMatrix;
    }
}

// send matrices to vertex shader
function setMatrixToProgram() {
    projectionUniform = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv(projectionUniform, false, flatten(projectionMatrix));
    modelViewUniform = gl.getUniformLocation(program, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewUniform, false, flatten(modelViewMatrix));
    normalViewUniform = gl.getUniformLocation(program, "normalViewMatrix");
    gl.uniformMatrix3fv(normalViewUniform, false, flatten(normalViewMatrix));
}

// right mouse to rotate the cube, and left mouse to turn the cube
function startRotate(event) {
    if (isLeftMouse(event)) mouseLeftDown = true;
    else if (isRightMouse(event)) mouseRightDown = true;
    init_x = event.x;
    init_y = event.y;
}

// rotate the cube with right mouse
function rotating(event) {
    if (mouseLeftDown) {
        new_x = event.pageX;
        new_y = event.pageY;
        const delta_x = (init_x - new_x) / 3;
        const delta_y = (init_y - new_y) / 3;

        const tmp_phi = Math.abs((phi / Math.PI * 180.0) % 360);

        if (tmp_phi > 180.0 && tmp_phi < 270.0 || phi < 0.0) {
            if ((phi / Math.PI * 180.0) % 360 < -180.0) {
                up = vec3(0.0, 1.0, 0.0);
                theta += -delta_x * 2 * Math.PI / canvas.width;
            } else {
                up = vec3(0.0, -1.0, 0.0);
                theta += delta_x * 2 * Math.PI / canvas.width;
            }
        } else {
            if (tmp_phi > 270.0) {
                up = vec3(0.0, -1.0, 0.0);
                theta += delta_x * 2 * Math.PI / canvas.width;
            } else {
                up = vec3(0.0, 1.0, 0.0);
                theta += -delta_x * 2 * Math.PI / canvas.width;
            }
        }
        phi += -delta_y * 2 * Math.PI / canvas.height;
        init_x = event.pageX;
        init_y = event.pageY;
        event.preventDefault();
    }
}

// stop rotation
function stopRotate(event) {
    mouseLeftDown = false;
    mouseRightDown = false;
}

function isLeftMouse(event) {
    return event.button === 0;
}

function isRightMouse(event) {
    return event.button === 2;
}

function equal(arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false;
    for (let i = arr1.length; i--;) {
        if (arr1[i] !== arr2[i])
            return false;
    }
    return true;
}

function negate(v) {
    let temp = [];
    for (let i = 0; i < v.length; i++) {
        temp[i] = -v[i];
    }
    return temp;
}