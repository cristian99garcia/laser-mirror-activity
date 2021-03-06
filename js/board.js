var Board = (function() {

    var key = {
        CTRL: 17,
        SPACE: 32,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
    }

    var mirrorStyle = {
        NULL: 0,
        NORMAL: 1,
        CRISTAL: 2
    }

    var gridSize = [-1, -1],
        tileSize = [-1, -1],
        bgColor = "#000",
        fgColor = "#555",
        lineColor = "#FFF",
        level = "FIRST",
        levels = ["FIRST", "SECOND", "THIRD", "FOURTH"],
        levelData = {},
        overTile = [0, 0],
        tiles = [],
        objects = {},
        showingDialog = false,
        selectedMirrorStyle = mirrorStyle.NORMAL;

    var mirrorsButton = document.getElementById("mirrors-count-button"),
        cristalsButton = document.getElementById("cristals-count-button"),
        clearButton = document.getElementById("clear-button"),
        completeButton = document.getElementById("complete-button"),
        retryButton = document.getElementById("retry-button"),
        board = document.getElementById("board-canvas"),
        context = board.getContext("2d");

    var levelManager = LevelsManager,
        laser = Laser,
        utils = Utils;

    function init() {
        loadLevelData();
        draw();
    }

    function loadLevelData() {
        var data = levelManager.getLevelData(level);
        board.width = data["canvasSize"][0];
        board.height = data["canvasSize"][1];

        objects = data["objects"];

        gridSize = data["gridSize"];
        var laserPosition = data["laserPosition"],
            laserDirection = data["laserDirection"];

        tileSize[0] = board.width / gridSize[0];
        tileSize[1] = board.height / gridSize[1];
        tiles = [];
        for (var x = 0; x < gridSize[0]; x++) {
            tiles[x] = [];
            for (var y = 0; y < gridSize[1]; y++) {
                tiles[x][y] = [mirrorStyle.NULL, 0];
            }
        }

        laser.setData(gridSize, tileSize, tiles, laserPosition, laserDirection, objects, objects["LAMPS"].length);

        if (data.mirrorsCount.NORMAL != 0) {
            selectMirrorStyle(mirrorStyle.NORMAL);
        } else {
            selectMirrorStyle(mirrorStyle.CRISTAL);
        }

        updateTooltipsData(data);
    }

    function nextLevel() {
        var index = levels.indexOf(level) + 1;
        if (index == levels.length) {
            level = levels[0];

        } else {
            level = levels[index];
        }

        loadLevelData();
    }

    function setLevel(_level) {
        level = _level;
        loadLevelData();
    }

    function draw() {
        if (laser.checkLevelComplete()) {
            document.getElementById("complete-dialog").style.display = "block";
            showingDialog = true;
        }

        if (laser.checkLevelLosed()) {
            document.getElementById("losed-dialog").style.display = "block";
            showingDialog = true;
        }

        drawBackground();

        if (!showingDialog) {
            drawGrid();
            drawOverTile();
            drawMirrors();
            laser.draw(tiles);
            drawGun();
            drawObjects();
        }
    }

    function drawBackground() {
        context.fillStyle = bgColor;
        context.fillRect(0, 0, board.width, board.height);
    }

    function drawGrid() {
        context.beginPath();

        context.lineWidth = 2;
        context.strokeStyle = lineColor;

        for (var i=1; i < gridSize[0]; i++) {
            context.moveTo(tileSize[0] * i, 0);
            context.lineTo(tileSize[0] * i, board.height);
        }

        for (var i=1; i < gridSize[1]; i++) {
            context.moveTo(0, tileSize[1] * i);
            context.lineTo(board.width, tileSize[1] * i);
        }

        context.stroke();
    }

    function drawOverTile() {
        if (overTile.length !== 0) {
            var x = overTile[0],
                y = overTile[1];

            context.fillStyle = fgColor;
            context.fillRect(tileSize[0] * x - 1, tileSize[1] * y - 1, tileSize[0] + 2, tileSize[1] + 2);
            context.fill();
        }
    }

    function drawMirrors() {
        for (var x = 0; x < gridSize[0]; x++) {
            for (var y = 0; y < gridSize[1]; y++) {
                var name = "";
                if (tiles[x][y][0] == mirrorStyle.NORMAL) {
                    name = "mirror"
                } else if (tiles[x][y][0] == mirrorStyle.CRISTAL) {
                    name = "cristal"
                }

                if (name != "") {
                    drawImage(name + tiles[x][y][1], x, y);
                }
            }
        }
    }

    function drawGun() {
        var data = levelManager.getLevelData(level),
            angle = 0,
            x = tileSize[0] * data["laserPosition"][0],
            y = tileSize[1] * data["laserPosition"][1],
            w = tileSize[0],
            h = tileSize[1];

        if (data["laserDirection"] == "left") {
            angle = 0;
        } else if (data["laserDirection"] == "up-left") {
            angle = 45;
        } else if (data["laserDirection"] == "up") {
            angle = 90;
        } else if (data["laserDirection"] == "up-right") {
            angle = 135;
        } else if (data["laserDirection"] == "right") {
            angle = 180;
        } else if (data["laserDirection"] == "down-right") {
            angle = 225;
        } else if (data["laserDirection"] == "down") {
            angle = 270;
        } else if (data["laserDirection"] == "down-left") {
            angle = 315;
        }

        context.save();
        context.translate(x + w / 2, y + h / 2);
        context.rotate(angle * Math.PI / 180);

        img = new Image();
        img.src = "img/gun.png";
        context.drawImage(img, -w/2, -h/2 + 3, w, h);

        context.restore();
    }

    function drawObjects() {
        var lamps = objects["LAMPS"],
            bombs = objects["BOMBS"],
            walls = objects["WALLS"],
            poweredLamps = laser.getPoweredLamps();

        for (var i=0; i < lamps.length; i++) {
            var x = lamps[i][0],
                y = lamps[i][1],
                imgName = "";
            
            for (var j=0; j < poweredLamps.length; j++) {
                if (poweredLamps[j][0] === x && poweredLamps[j][1] === y) {
                    imgName = "lamp1";
                    break;
                }
            }

            if (imgName == "") {
                imgName = "lamp0";
            }

            drawImage(imgName, lamps[i][0], lamps[i][1]);
        }

        for (var i=0; i < bombs.length; i++) {
            drawImage("bomb", bombs[i][0], bombs[i][1]);
        }

        for (var i=0; i < walls.length; i++) {
            drawImage("wall", walls[i][0], walls[i][1]);
        }
    }

    function drawImage(imageName, x, y) {
        img = new Image();
        img.src = "img/" + imageName + ".png";
        context.drawImage(img, tileSize[0] * x, tileSize[1] * y, tileSize[0], tileSize[1]);
    }

    function actionOnOverTile() {
        var data = levelManager.getLevelData(level);
        var row = overTile[0],
            column = overTile[1];

        if (utils.checkForObject(objects, overTile[0], overTile[1])) {
            return;  // If exists a object on here, don't make mirrors
        }

        if (overTile[0] == data["laserPosition"][0] && overTile[1] == data["laserPosition"][1]) {
            return;  // Evit make a mirror on gun place
        }

        var mirrors = countMirrorsOnScreen(selectedMirrorStyle);
        var name = "";

        if (selectedMirrorStyle == mirrorStyle.NORMAL) {
            name = "NORMAL";
        } else if (selectedMirrorStyle == mirrorStyle.CRISTAL) {
            name = "CRISTAL";
        }

        if (mirrors >= data["mirrorsCount"][name] && tiles[row][column][0] != selectedMirrorStyle) {
            return;  // Limit mirrors
        }

        updateTooltipsData(data);
        tiles[row][column][0] = selectedMirrorStyle;
        tiles[row][column][1] = tiles[row][column][1] + 1;

        if ((tiles[row][column][0] == mirrorStyle.NORMAL && tiles[row][column][1] >= 9) ||
             tiles[row][column][0] == mirrorStyle.CRISTAL && tiles[row][column][1] >= 5) {

            tiles[row][column] = [mirrorStyle.NULL, 0];
        }

        updateTooltipsData(data);
        laser.setTiles(tiles);
        draw();
    }

    board.addEventListener("click", function(event) {
        actionOnOverTile();
    }, false);

    document.onkeydown = function checkKey(event) {
        event = event || window.event;

        if (event.keyCode == key.CTRL) {
            selectNextMirrorStyle();

        } else if (event.keyCode == key.SPACE) {
            if (laser.checkLevelComplete()) {
                completeButton.onclick();
            } else if (laser.checkLevelLosed()) {
                retryButton.onclick();
            } else {
                actionOnOverTile();
            }

        } else if (event.keyCode == key.LEFT) {
            if (overTile[0] - 1 > -1) {
                overTile[0] = overTile[0] - 1;
            }
        
        } else if (event.keyCode == key.UP) {
            if (overTile[1] - 1 > -1) {
                overTile[1] = overTile[1] - 1;
            }
        
        } else if (event.keyCode == key.RIGHT) {
            if (overTile[0] + 1 < gridSize[0]) {
                overTile[0] = overTile[0] + 1;
            }
        
        } else if (event.keyCode == key.DOWN) {
            if (overTile[1] + 1 < gridSize[1]) {
                overTile[1] = overTile[1] + 1;
            }
        }

        draw();
    }

    function countMirrorsOnScreen(type) {
        var mirrors = 0;
        for (var x=0; x < gridSize[0]; x++) {
            for (var y=0; y < gridSize[1]; y++) {
                if (tiles[x][y][0] == type) {
                    mirrors++;
                }
            }
        }

        return mirrors;
    }

    function updateTooltipsData(data) {
        mirrorsButton.title = "Have left: " + (data.mirrorsCount.NORMAL - countMirrorsOnScreen(mirrorStyle.NORMAL));
        cristalsButton.title = "Have left: " + (data.mirrorsCount.CRISTAL - countMirrorsOnScreen(mirrorStyle.CRISTAL));
    }

    function selectMirrorStyle(style) {
        selectedMirrorStyle = style;

        if (selectedMirrorStyle == mirrorStyle.NORMAL) {
            mirrorsButton.style.backgroundColor = "#808080";
            cristalsButton.style.backgroundColor = "";
        } else if (selectedMirrorStyle == mirrorStyle.CRISTAL) {
            cristalsButton.style.backgroundColor = "#808080";
            mirrorsButton.style.backgroundColor = "";
        }
    }

    function selectNextMirrorStyle() {
        var styles = [mirrorStyle.NORMAL, mirrorStyle.CRISTAL];

        if (styles.indexOf(selectedMirrorStyle) == styles.length - 1) {
            selectMirrorStyle(styles[0]);
        } else {
            selectMirrorStyle(styles[styles.indexOf(selectedMirrorStyle) + 1]);
        }
    }

    board.addEventListener("mousemove", function(event) {
        overTile[0] = parseInt(event.offsetX / tileSize[0]);
        overTile[1] = parseInt(event.offsetY / tileSize[1]);
        draw();
    }, false);

    completeButton.onclick = function() {
        this.parentNode.style.display = "none";
        showingDialog = false;
        nextLevel();
    };

    retryButton.onclick = function() {
        this.parentNode.style.display = "none";
        showingDialog = false;
        setLevel(level);  // Reset
    };

    mirrorsButton.onclick = function() {
        selectMirrorStyle(mirrorStyle.NORMAL);
    };

    cristalsButton.onclick = function() {
        selectMirrorStyle(mirrorStyle.CRISTAL);
    };

    clearButton.onclick = function() {
        for (var x = 0; x < tiles.length; x++) {
            for (var y = 0; y < tiles[x].length; y++) {
                tiles[x][y] = [mirrorStyle.NULL, 0];
            }
        }

        draw();
    };

    return {
        init: init,
        draw: draw
    };
})();