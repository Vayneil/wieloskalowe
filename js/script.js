import {distance, prob, rho} from "./functions.js";

window.lastDrawnRow = 0;
window.interval = null;
window.gridWidth = 0;
window.gridHeight = 0;
window.cellArray = null;

window.colors = [];
window.colorIterator = 0;
window.periodic = 0;

window.pentagonalsX = [[0, -1, -1, -1, 0], [0, 1, 1, 1, 0], [-1, -1, 0, 1, 1], [-1, -1, 0, 1, 1]];
window.pentagonalsY = [[-1, -1, 0, 1, 1], [-1, -1, 0, 1, 1], [0, 1, 1, 1, 0], [0, -1, -1, -1, 0]];

window.hexagonalsX = [[0, 1, 1, 0, -1, -1], [-1, -1, 0, 1, 1, 0]];
window.hexagonalsY = [[-1, -1, 0, 1, 1, 0], [0, -1, -1, 0, 1, 1]];

window.kt = 6;
window.a = 86710969050178.5;
window.b = 9.41268203527779;

window.ileprzejsc = 0;
window.ilezarodkow = 0;

window.neighbours = {
    neumann: {
        x: [0, 1, 0, -1],
        y: [-1, 0, 1, 0]
    },
    moore: {
        x: [-1, 0, 1, -1, 1, -1, 0, 1],
        y: [-1, -1, -1, 0, 0, 1, 1, 1]
    },
    hexagonalLeft: {
        x: [0, 1, 1, 0, -1, -1],
        y: [-1, -1, 0, 1, 1, 0]
    },
    hexagonalRight: {
        x: [-1, -1, 0, 1, 1, 0],
        y: [0, -1, -1, 0, 1, 1]
    },
    hexagonalRandom: {
        chooseX: [[0, 1, 1, 0, -1, -1], [-1, -1, 0, 1, 1, 0]],
        chooseY: [[-1, -1, 0, 1, 1, 0], [0, -1, -1, 0, 1, 1]],
        x: [],
        y: []
    },
    pentagonalRandom: {
        chooseX: [[0, -1, -1, -1, 0], [0, 1, 1, 1, 0], [-1, -1, 0, 1, 1], [-1, -1, 0, 1, 1]],
        chooseY: [[-1, -1, 0, 1, 1], [-1, -1, 0, 1, 1], [0, 1, 1, 1, 0], [0, -1, -1, -1, 0]],
        x: [],
        y: []
    }
};

$(document).ready(() => {

    // APPLY SETTINGS
    $(() => {
        $('#settings').click(() => {
            // Take data
            let canvas = document.getElementById("canvas");
            window.gridWidth = parseInt($('#gridSizeX').val());
            window.gridHeight = parseInt($('#gridSizeY').val());
            document.getElementById("container").width = 8 * window.gridWidth;
            canvas.width = document.getElementById("container").width;
            canvas.height = 8 * window.gridHeight;
            window.cellArray = new Array(window.gridHeight);
            for (let i = 0; i < window.gridHeight; i++) {
                window.cellArray[i] = new Array(window.gridWidth);
                for (let j = 0; j < window.gridWidth; j++) {
                    window.cellArray[i][j] = {
                        state: 0,
                        property: 0,
                        weightX: Math.random(),
                        weightY: Math.random(),
                        energy: 0,
                        dislocationValue: 0,
                        recrystallize: 0,
                        recentlyRecrystallized: false
                    };
                }
            }
            window.colorIterator = 0;
            window.colors = [];

            window.periodic = parseInt($('input[name="bc"]:checked').val());

            window.seeding = parseInt($('input[name="seed"]:checked').val());

            window.neighbourIndex = ($('input[name="neighbour"]:checked').val());

            window.numOfRandom = parseInt($('#numOfRandom').val());

            window.homoRows = parseInt($('#homoRows').val());
            window.homoColumns = parseInt($('#homoColumns').val());

            window.radius = parseInt($('#radius').val());
            window.numOfRadius = parseInt($('#numOfRadius').val());

            window.weightedRadius = parseInt($('#weightedRadius').val());
            window.numOfWeightedRadius = parseInt($('#numOfWeightedRadius').val());

            window.monteCarloIterations = parseInt($('#monteCarloIterations').val());

            switch (seeding) {
                case 0: {
                    for (let i = 0; i < numOfRandom; i++) {
                        let x = Math.floor(window.gridWidth * Math.random());
                        let y = Math.floor(window.gridHeight * Math.random());

                        window.cellArray[y][x].state = 1;
                        window.cellArray[y][x].property = window.colorIterator;

                        window.colors.push(generateColor());
                        window.colorIterator++;
                    }
                    break;
                }
                case 1: {
                    let gapColumns = Math.floor(window.gridWidth / window.homoColumns);
                    let gapRows = Math.floor(window.gridHeight / window.homoRows);
                    for (let i = Math.round(gapColumns / 2); i < window.gridWidth; i += gapColumns) {
                        for (let j = Math.round(gapRows / 2); j < window.gridHeight; j += gapRows) {
                            window.cellArray[j][i].state = 1;
                            window.cellArray[j][i].property = window.colorIterator;

                            window.colors.push(generateColor());
                            window.colorIterator++;
                        }
                    }

                    break;
                }
                case 2: {
                    let circles = [];
                    let iterator = 0;
                    while (iterator < window.numOfRadius) {
                        let protection = 0;

                        let circle = {
                            x: Math.floor(window.gridWidth * Math.random()),
                            y: Math.floor(window.gridHeight * Math.random()),
                        };

                        let overlap = false;

                        for (let i = 0; i < circles.length; i++) {
                            /*(x2 - x1)^2 + (y2 - y1)^2*/
                            let otherCircle = circles[i];
                            let dist = distance(circle.x, otherCircle.x, circle.y, otherCircle.y);
                            if (dist < 2 * window.radius) {
                                overlap = true;
                            }
                        }

                        if (!overlap) {
                            circles.push(circle);
                            iterator++;
                        }

                        protection++;

                        if (protection > 100) {
                            break;
                        }
                    }
                    for (let i = 0; i < circles.length; i++) {
                        let current = circles[i];
                        window.cellArray[current.y][current.x].state = 1;
                        window.cellArray[current.y][current.x].property = window.colorIterator;

                        window.colors.push(generateColor());
                        window.colorIterator++;

                    }
                    break;
                }
                case 3: {
                    let circles = [];
                    let iterator = 0;
                    let protection = 0;
                    while (iterator < window.numOfWeightedRadius) {


                        let circle = {
                            x: Math.floor(window.gridWidth * Math.random()),
                            y: Math.floor(window.gridHeight * Math.random()),
                            weightX: Math.random(),
                            weightY: Math.random()
                        };

                        let overlap = false;

                        for (let i = 0; i < circles.length; i++) {
                            /*(x2 - x1)^2 + (y2 - y1)^2*/
                            let otherCircle = circles[i];
                            let dist = distance(
                                circle.x + circle.weightX,
                                otherCircle.x + otherCircle.weightX,
                                circle.y + circle.weightY,
                                otherCircle.y + otherCircle.weightY);
                            if (dist < 2 * window.weightedRadius) {
                                overlap = true;
                            }
                        }

                        if (!overlap) {
                            circles.push(circle);
                            iterator++;
                        }
                        else {
                            protection++;
                        }

                        if (protection > 100) {
                            break;
                        }
                    }
                    for (let i = 0; i < circles.length; i++) {
                        let current = circles[i];
                        window.cellArray[current.y][current.x].state = 1;
                        window.cellArray[current.y][current.x].property = window.colorIterator;
                        window.cellArray[current.y][current.x].weightX = current.weightX;
                        window.cellArray[current.y][current.x].weightY = current.weightY;

                        window.colors.push(generateColor());
                        window.colorIterator++;

                    }
                    break;
                }
            }
            drawCellArray(8);
            $('#canvas').load("index.html #canvas");
       });
    });



    // 1 ITERATION
    $(() => {
        $('#run').click(() => {
            naiveGrowth();
            $('#canvas').load("index.html #canvas");
        });
    });

    // ANIMATION
    $(() => {
        $('#animation').click(() => {

            //window.interval = setInterval(gameOfLife, 100);
            window.interval = setInterval(naiveGrowth, 100);
            $('#canvas').load("index.html #canvas");
        });
    });

    // STOP
    $(() => {
        $('#stop').click(() => {
             clearInterval(window.interval);
        });
    });

    // CLICKING ON CANVAS
    $(() => {
        $('#canvas').click((event) => {
            let x = Math.floor((event.pageX - $('#canvas').offset().left) / 8);
            let y = Math.floor((event.pageY - $('#canvas').offset().top) / 8);

            window.cellArray[y][x].state = 1;
            window.cellArray[y][x].property = window.colorIterator;

            window.colors.push(generateColor());

            drawCellArray(8);
            window.colorIterator++;
            $('#canvas').load("index.html #canvas");
        });
    });

    // MONTE CARLO
    $(() => {
        $('#simulate').click(() => {
            for (let i = 0; i < window.monteCarloIterations; i++) {
                monteCarlo();
            }
            drawCellArray(8);
            $('#canvas').load("index.html #canvas");
        });
    });

    // DRAW ENERGY
    $(() => {
        $('#energy').click(() => {
            energy(8);
            $('#canvas').load("index.html #canvas");
        });
    });

    // DRX
    $(() => {
        $('#drx').click(() => {
            drx();
            $('#canvas').load("index.html #canvas");
            console.log(ileprzejsc);
            console.log(ilezarodkow);
        });
    });
});


// // 1D CELLULAR AUTOMATA
// function run(rule, startingPoint, gridSize) {
//     let canvas = document.getElementById("canvas");
//     if (canvas.getContext) {
//         let context = canvas.getContext("2d");
//         context.clearRect(0,0,400,400);
//     }
//
//     let cellSize = 400 / gridSize;
//
//     /* MAIN LOOP
//      * leftCell, centerCell and rightCell are states
//      * of 3 cells responsible for state of next-gen cell */
//
//     let leftCell, centerCell, rightCell;
//     for (let col = 0; col < gridSize; col++) {
//         leftCell = window.cellArray[window.lastDrawnRow][mod(col - 1, gridSize)]
//             .toString();
//         centerCell = window.cellArray[window.lastDrawnRow][col]
//             .toString();
//         rightCell = window.cellArray[window.lastDrawnRow][mod(col + 1, gridSize)]
//             .toString();
//         window.cellArray[window.lastDrawnRow + 1][col] = parseInt(configurations[parseInt(leftCell + centerCell + rightCell, 2)]
//             .futureState, 10);
//         }
//
//
//     drawCellArray(cellSize, gridSize);
//
//     //drawGrid(cellSize);
//
//     window.lastDrawnRow++;
//
// }


// // GAME OF LIFE
// function gameOfLife(array) {
//
//     let canvas = document.getElementById("canvas");
//     if (canvas.getContext) {
//         let context = canvas.getContext("2d");
//         context.clearRect(0,0,8 * window.gridWidth,8 * window.gridHeight);
//     }
//
//     let mooreNeighboursX = [-1, 0, 1, -1, 1, -1, 0, 1];
//     let mooreNeighboursY = [-1, -1, -1, 0, 0, 1, 1, 1];
//     let aliveNeighbours, state;
//
//     let cellArrayCopy = $.extend(true, {}, window.cellArray);
//
//     for (let i = 0; i < window.gridWidth; i++) {
//         for (let j = 0; j < window.gridHeight; j++) {
//             aliveNeighbours = 0;
//             state = window.cellArray[j][i].state;
//             for (let k = 0; k < 8; k++) {
//                 if (window.cellArray[mod(j + mooreNeighboursY[k], window.gridHeight)][mod(i + mooreNeighboursX[k], window.gridWidth)].state === 1) {
//                     aliveNeighbours++;
//                 }
//             }
//             //console.log(aliveNeighbours);
//             if (state === 0 && aliveNeighbours === 3) {
//                 cellArrayCopy[j][i].state = 1;
//             }
//             else if (state === 1 && (aliveNeighbours === 2 || aliveNeighbours === 3)) {
//                 cellArrayCopy[j][i].state = 1;
//             }
//             else if (state === 1 && (aliveNeighbours > 3 || aliveNeighbours < 2)) {
//                 cellArrayCopy[j][i].state = 0;
//             }
//         }
//     }
//
//     window.cellArray = $.extend(true, {}, cellArrayCopy);
//     drawCellArray(8);
// }

// NAIVE GROWTH
function naiveGrowth() {

    let random = false;

    if (neighbourIndex === "pentagonalRandom" || neighbourIndex === "hexagonalRandom") {
        random = true;
    }

    if (random) {
        let index = Math.floor(Math.random() * window.neighbours[window.neighbourIndex]["chooseX"].length);
        window.neighbours[window.neighbourIndex]["x"] = window.neighbours[window.neighbourIndex]["chooseX"][index];
        window.neighbours[window.neighbourIndex]["y"] = window.neighbours[window.neighbourIndex]["chooseY"][index];
    }


    let canvas = document.getElementById("canvas");
    if (canvas.getContext) {
        let context = canvas.getContext("2d");
        context.clearRect(0,0,8 * window.gridWidth,8 * window.gridHeight);
    }


    let cellArrayCopy = $.extend(true, {}, window.cellArray);

    for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridHeight; j++) {
            if (window.cellArray[j][i].state === 0) {
                let neighbourProperties = [];
                for (let k = 0; k < window.neighbours[window.neighbourIndex]["x"].length; k++) {
                    // PERIODIC
                    if (window.periodic) {
                       if (
                           window.cellArray
                               [mod(j + window.neighbours[window.neighbourIndex]["y"][k], gridHeight)]
                               [mod(i + window.neighbours[window.neighbourIndex]["x"][k], gridWidth)].state) {
                           neighbourProperties.push(
                               window.cellArray
                                   [mod(j + window.neighbours[window.neighbourIndex]["y"][k], gridHeight)]
                                   [mod(i + window.neighbours[window.neighbourIndex]["x"][k], gridWidth)].property);
                       }
                    }
                    // ABSORBING
                    else {
                        if (
                            window.cellArray
                                [mod(j + window.neighbours[window.neighbourIndex]["y"][k], gridHeight)]
                                [mod(i + window.neighbours[window.neighbourIndex]["x"][k], gridWidth)].state
                            && j + window.neighbours[window.neighbourIndex]["y"][k] < gridHeight
                            && j + window.neighbours[window.neighbourIndex]["y"][k] >= 0
                            && i + window.neighbours[window.neighbourIndex]["x"][k] < gridWidth
                            && i + window.neighbours[window.neighbourIndex]["x"][k] >= 0) {
                            neighbourProperties.push(
                                window.cellArray
                                    [mod(j + window.neighbours[window.neighbourIndex]["y"][k], gridHeight)]
                                    [mod(i + window.neighbours[window.neighbourIndex]["x"][k], gridWidth)].property);
                        }
                    }
                }
                // FINDING MOST FREQUENT NEIGHBOURS AND RANDOM THEM
                if (neighbourProperties.length) {
                    cellArrayCopy[j][i].state = 1;
                    let counts = neighbourProperties.reduce((a, c) => {
                        a[c] = (a[c] || 0) + 1;
                        return a;
                    }, {});
                    let maxCount = Math.max(...Object.values(counts));
                    let mostFrequent = Object.keys(counts).filter(k => counts[k] === maxCount);
                    if (mostFrequent.length === 1) {
                        cellArrayCopy[j][i].property = parseInt(mostFrequent[0]);
                    }
                    else cellArrayCopy[j][i].property = parseInt(mostFrequent[Math.floor(mostFrequent.length * Math.random())]);
                }
            }
        }
    }

    window.cellArray = $.extend(true, {}, cellArrayCopy);

    drawCellArray(8);


}

function monteCarlo() {
    let random = false;

    if (neighbourIndex === "pentagonalRandom" || neighbourIndex === "hexagonalRandom") {
        random = true;
    }

    if (random) {
        let index = Math.floor(Math.random() * window.neighbours[window.neighbourIndex]["chooseX"].length);
        window.neighbours[window.neighbourIndex]["x"] = window.neighbours[window.neighbourIndex]["chooseX"][index];
        window.neighbours[window.neighbourIndex]["y"] = window.neighbours[window.neighbourIndex]["chooseY"][index];
    }


    let canvas = document.getElementById("canvas");
    if (canvas.getContext) {
        //let context = canvas.getContext("2d");
        //context.clearRect(0,0,8 * window.gridWidth,8 * window.gridHeight);
    }


    let cellArrayCopy = $.extend(true, {}, window.cellArray);

    for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridHeight; j++) {


            let neighboursLength = window.neighbours[window.neighbourIndex]["x"].length;
            let neighbourhood = window.neighbours[window.neighbourIndex];
            let cellProperty = window.cellArray[j][i].property;

            let randomIndex = Math.floor(Math.random() * neighboursLength);
            let energy = 0;
            let randomEnergy = 0;
            let neighbourProperty;
            let randomNeighbourProperty;
            let e, p;

            for (let k = 0; k < neighboursLength; k++) {

                neighbourProperty = window.cellArray[mod(j + neighbourhood["y"][k], gridHeight)][mod(i + neighbourhood["x"][k], gridWidth)].property;
                randomNeighbourProperty = window.cellArray[mod(j + neighbourhood["y"][randomIndex], gridHeight)][mod(i + neighbourhood["x"][randomIndex], gridWidth)].property;

                if (cellProperty !== neighbourProperty) {
                    energy++;
                }
                if (neighbourProperty !== randomNeighbourProperty) {
                    randomEnergy++;
                }
            }

            e = randomEnergy - energy;
            p = prob(window.kt, e);

            //console.log(p);

            if (p > Math.random()) {
                cellArrayCopy[j][i].property = randomNeighbourProperty;
                cellArrayCopy[j][i].energy = randomEnergy;
            } else {
                cellArrayCopy[j][i].energy = energy;
            }
        }
    }
    window.cellArray = $.extend(true, {}, cellArrayCopy);

    //drawCellArray(8);
}

// function Conf(conf_number) {
//     this.binaryConf = conf_number.toString(2);
//     // binary string of length 3
//     while (this.binaryConf.length < 3) {
//         this.binaryConf = "0" + this.binaryConf;
//     }
// }

function drx() {
    let random = false;

    if (neighbourIndex === "pentagonalRandom" || neighbourIndex === "hexagonalRandom") {
        random = true;
    }

    if (random) {
        let index = Math.floor(Math.random() * window.neighbours[window.neighbourIndex]["chooseX"].length);
        window.neighbours[window.neighbourIndex]["x"] = window.neighbours[window.neighbourIndex]["chooseX"][index];
        window.neighbours[window.neighbourIndex]["y"] = window.neighbours[window.neighbourIndex]["chooseY"][index];
    }


    let canvas = document.getElementById("canvas");
    if (canvas.getContext) {
        //let context = canvas.getContext("2d");
        //context.clearRect(0,0,8 * window.gridWidth,8 * window.gridHeight);
    }
    // previous and current array
    let previousArray = $.extend(true, {}, window.cellArray);
    let currentArray = $.extend(true, {}, window.cellArray);

    // current array isn't recently recrystallized
    for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridHeight; j++) {
            currentArray[j][i].recentlyRecrystallized = false;
        }
    }

    let neighboursLength = window.neighbours[window.neighbourIndex]["x"].length;
    let neighbourhood = window.neighbours[window.neighbourIndex];

    for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridHeight; j++) {

            let neighbourRecrystallized = false;
            let cellHasBiggestDislocation = true;

            for (let k = 0; k < neighboursLength; k++) {
                let neighbourDislocation = previousArray[mod(j + neighbourhood["y"][k], gridHeight)][mod(i + neighbourhood["x"][k], gridWidth)].dislocationValue;
                let neighbourStatus = previousArray[mod(j + neighbourhood["y"][k], gridHeight)][mod(i + neighbourhood["x"][k], gridWidth)].recentlyRecrystallized;
                let cellDislocation = previousArray[j][i].dislocationValue;

                if (neighbourStatus === true) {
                    neighbourRecrystallized = true;
                }
                if (neighbourDislocation >= cellDislocation) {
                    cellHasBiggestDislocation = false;
                }
            }

            if (neighbourRecrystallized === true && cellHasBiggestDislocation === true) {
                window.ileprzejsc++;

                currentArray[j][i].recrystallize = 1;
                currentArray[j][i].dislocationValue = 0;
                currentArray[j][i].recentlyRecrystallized = true;
            }
        }
    }

    //let maxRow = window.cellArray.map(function(row){ return Math.max.apply(Math, row); });
    //let max = Math.max.apply(null, maxRow);
    //console.log(max);



    let critical = 4.21584e12 / (window.gridWidth * window.gridHeight);
    let deltaRho = rho(86710969050178.5, 9.41268203527779);
    let dislocationAvgValue = deltaRho / (window.gridWidth * window.gridHeight);
    let initialPackageSize = 0.5 * dislocationAvgValue;

    // Strzelaj do polaka
    for (let i = 0; i < window.gridWidth; i++) {
        for (let j = 0; j < window.gridHeight; j++) {
            currentArray[j][i].dislocationValue += initialPackageSize;
        }
    }

    // Losowanko
    let numberOfPackages = 100;
    let packageSize = 0.5 * deltaRho / numberOfPackages;
    while (numberOfPackages > 0) {
        // Wylosuj komórkę do której wrzucasz paczkę
        let x = Math.floor(Math.random() * window.gridWidth);
        let y = Math.floor(Math.random() * window.gridHeight);
        // Oblicz prawdopodobieństwo
        let p;
        if (currentArray[y][x].energy > 0) p = 0.8;
        else p = 0.2;
        if (p > Math.random()) {
            currentArray[y][x].dislocationValue += packageSize;
            //console.log(window.cellArray[y][x].dislocationValue);
            numberOfPackages--;
        }
        if (currentArray[y][x].dislocationValue > critical) {
            window.ilezarodkow++;

            currentArray[y][x].recrystallize = 1;
            currentArray[y][x].dislocationValue = 0;
            currentArray[y][x].recentlyRecrystallized = true;
        }
    }


    window.cellArray = $.extend(true, {}, currentArray);

    drawDislocation(critical,  window.gridWidth * window.gridHeight, 8);
}

function drawCellArray(cellSize) {
    let canvas = document.getElementById("canvas");
    let context = canvas.getContext('2d');
    for (let i = 0; i < window.gridWidth; i++) {
        for (let j = 0; j < window.gridHeight; j++) {
            if (window.cellArray[j][i].state === 1) {
                context.fillStyle = window.colors[window.cellArray[j][i].property];
                context.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
        }
    }
    //console.log(window.cellArray);
}

function mod(n, m) {
    return ((n % m) + m) % m;
}

function generateColor() {
    //let r, g, b;
    //r = (Math.floor(Math.random() * 0xff) / 2).toString(16);
    let color = '#' + (0x1888888 + Math.floor(Math.random() * 0x888888)).toString(16).substr(1,6);
    //console.log(color);
    return color;

}

function energy(cellSize) {
    let canvas = document.getElementById("canvas");
    let context = canvas.getContext('2d');
    context.clearRect(0,0,8 * window.gridWidth,8 * window.gridHeight);
    for (let i = 0; i < window.gridWidth; i++) {
        for (let j = 0; j < window.gridHeight; j++) {
            if (window.cellArray[j][i].energy) {
                context.fillStyle = "#" + "00" + (window.cellArray[j][i].energy * 0x20).toString(16) + "00";
                context.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
        }
    }
}

function drawDislocation(critical, numberOfCells, cellSize) {
    let canvas = document.getElementById("canvas");
    let context = canvas.getContext('2d');
    context.clearRect(0,0,8 * window.gridWidth,8 * window.gridHeight);
    for (let i = 0; i < window.gridWidth; i++) {
        for (let j = 0; j < window.gridHeight; j++) {
            if (window.cellArray[j][i].energy > 0 && window.cellArray[j][i].recrystallize > 0) {
                context.fillStyle = "#" + (window.cellArray[j][i].energy * 0x20).toString(16) + "0000";
                context.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
        }
    }
}













