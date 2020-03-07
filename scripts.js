// @ts-check

const bw = 820;
// Box height
const bh = 820;

var delta = 50;

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

function drawBoard() {
    for (var x = 0; x <= bw; x += delta) {
        context.moveTo(x, 0);
        context.lineTo(x, bh);
    }

    for (var x = 0; x <= bh; x += delta) {
        context.moveTo(0, x);
        context.lineTo(bw, x);
    }
    context.strokeStyle = "#808080";
    context.stroke();
}

function drawTime(time) {
    context.fillStyle = "black";
    context.font = '66px serif';
    context.fillText("Time: " + Math.floor(time), 10, 700);
}

function drawBackground(x, y, w, h, image) {
    context.drawImage(image, x * delta, y * delta, w * delta, h * delta);
}

function drawWarehouse(x, y, color, name, image, cargos) {
    //context.drawImage(image, x * delta, y * delta, delta, delta);

    for (let j = 0; j < cargos.length; j++) {
        let cargoType = cargos[j]
        context.drawImage(cargoImages[cargoType], x * delta + delta / 2, y * delta - delta / 3 - 11 * j, 10, 10);
    }

    // context.fillStyle = "black";
    // context.font = '24px serif';
    // context.fillText(name, x * delta + 0.1 * delta, y * delta + 1.5 * delta);
}

function drawRoute(x1, y1, x2, y2) {
    context.moveTo(delta / 2 + delta * x1, delta / 2 + delta * y1);
    context.lineTo(delta / 2 + delta * x2, delta / 2 + delta * y2);

    context.strokeStyle = "#808080";
    context.stroke();
}

function drawTransport(image, begin, end, percent, padding, warehouses, cargos) {
    const bwh = warehouses.filter(function (x) {
        return x['name'] == begin;
    })[0];
    const ewh = warehouses.filter(function (x) {
        return x['name'] == end;
    })[0];

    let angle = Math.atan((ewh["y"] - bwh["y"]) / (ewh["x"] - bwh["x"]));
    const x = bwh["x"] + (ewh["x"] - bwh["x"]) * percent / 100;
    const y = bwh["y"] + (ewh["y"] - bwh["y"]) * percent / 100;

    const x0 = x * delta;
    const y0 = y * delta;

    const x1 = x0 * Math.cos(-angle) - y0 * Math.sin(-angle);
    const y1 = x0 * Math.sin(-angle) + y0 * Math.cos(-angle);


    for (let j = 0; j < cargos.length; j++) {
        let cargoType = cargos[j];
        context.drawImage(cargoImages[cargoType], x0 + delta / 2, y0 - 11 * j, 10, 10);
    }

    context.save();
    context.rotate(angle);
    context.drawImage(image, x1 + padding, y1 + padding, delta, delta);
    context.restore();
}

function write_log(event) {
    const div = document.getElementById('log');
    if (!("event" in event))
        div.innerHTML += "<li><strong>" + event["time"] + "</strong></li>";
    else
        div.innerHTML += "<li>" + JSON.stringify(event) + "</li>";
}

const transport_kind = [
    { "kind": "TRUCK", "direction": "left", "image": new Image() },
    { "kind": "TRUCK", "direction": "right", "image": new Image() },
    { "kind": "FERRY", "direction": "left", "image": new Image() },
    { "kind": "FERRY", "direction": "right", "image": new Image() },
];

transport_kind[0]["image"].src = "images/truck_left.png";
transport_kind[1]["image"].src = "images/truck_right.png";
transport_kind[2]["image"].src = "images/ship_left.png";
transport_kind[3]["image"].src = "images/ship_right.png";

const back = new Image();
back.src = "images/back.jpg";

const cargo_img_A = new Image();
cargo_img_A.src = "images/cargo_A.png";
const cargo_img_B = new Image();
cargo_img_B.src = "images/cargo_B.png";
const cargoImages = {
    "A": cargo_img_A,
    "B": cargo_img_B
}

function setup(speed, cargos, event_list) {
    const routes = [
        { 'Begin': 'FACTORY', 'End': 'PORT', 'Distance': 1 },
        { 'Begin': 'FACTORY', 'End': 'B', 'Distance': 5 },
        { 'Begin': 'PORT', 'End': 'A', 'Distance': 4 }
    ];

    const warehouses = [
        { "name": "FACTORY", "x": 4.5, "y": 5.5, "picture": 'images/factory.png', "cargos": cargos, "image": new Image() },
        { "name": "PORT", "x": 8, "y": 5, "picture": 'images/port.png', "cargos": [], "image": new Image() },
        { "name": "A", "x": 13.4, "y": 5, "picture": 'images/warehouse_a.png', "cargos": [], "image": new Image() },
        { "name": "B", "x": 13.5, "y": 14, "picture": 'images/warehouse_b.png', "cargos": [], "image": new Image() }];

    warehouses.forEach(function (item, i, arr) {
        item["image"].src = item["picture"];
    });

    document.getElementById('caption').innerText = cargos


    let time = 0;
    let readIndex = 0;
    let move = {};

    function mainLoop() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground(0, 0, 17, 17, back);
        //drawBoard();
        let bwh;
        let ewh;

        routes.forEach(function (item, i, arr) {
            bwh = warehouses.filter(function (x) {
                return x['name'] == item['Begin'];
            })[0];
            ewh = warehouses.filter(function (x) {
                return x['name'] == item['End'];
            })[0];

            //drawRoute(bwh["x"], bwh["y"], ewh["x"], ewh["y"]);
        });


        let showTime = true;
        let i = 0;
        for (i = readIndex; i < event_list.length; i++) {
            if (event_list[i]["time"] > time)
                break;

            if (showTime) {
                write_log({ "time": event_list[i]["time"] });
                showTime = false;
            }

            readIndex++;

            write_log(event_list[i]);
            if (event_list[i]["event"] == "LOAD") {
                let begin = event_list[i]["location"];
                bwh = warehouses.filter(function (x) {
                    return x['name'] == begin;
                })[0];
                bwh["cargos"].splice(0, event_list[i]["cargo"].length);
                continue;
            }

            if (event_list[i]["event"] == "UNLOAD") {
                let begin = event_list[i]["location"];
                bwh = warehouses.filter(function (x) {
                    return x['name'] == begin;
                })[0];
                let cargoUnloaded = Array
                    .from(event_list[i]["cargo"])
                    .map(c => c.destination);
                bwh["cargos"] = bwh["cargos"].concat(cargoUnloaded);
                continue;
            }


            if (event_list[i]["event"] != "DEPART")
                continue;

            let begin = event_list[i]["location"];
            let end = event_list[i]["destination"];
            let distances = routes.filter(function (x) {
                return x['Begin'] == begin && x['End'] == end || x['Begin'] == end && x['End'] == begin;
            });

            bwh = warehouses.filter(function (x) {
                return x['name'] == begin;
            })[0];
            ewh = warehouses.filter(function (x) {
                return x['name'] == end;
            })[0];

            let distance = distances[0]["Distance"];
            let cargoOnVehicle = Array
                .from(event_list[i]["cargo"])
                .map(c => c.destination);
            move[event_list[i]["transport_id"]] = {
                "Start": time,
                "Finish": time + distance,
                "Begin": begin,
                "End": end,
                "Cargos": cargoOnVehicle
            }

            let direction = (bwh["x"] >= ewh["x"] ? "left" : "right");

            move[event_list[i]["transport_id"]]["image"] = transport_kind.filter(function (item) {
                return item["direction"] == direction && item["kind"] == event_list[i]["kind"];
            })[0]["image"];
        }


        let padding = 0;
        for (var key in move) {
            let percent = 100 * (time - move[key]["Start"]) / (move[key]["Finish"] - move[key]["Start"]);

            if (percent < 10)
                percent = 10;
            if (percent > 90)
                percent = 90;
            drawTransport(move[key]["image"], move[key]["Begin"], move[key]["End"], percent, padding, warehouses, move[key]["Cargos"]);
            padding += 10
        }

        warehouses.forEach(function (item, i, arr) {
            drawWarehouse(item["x"], item["y"], 'rgba(0, 0, 200, 0.5)', item["name"], item["image"], item["cargos"]);
        });


        if (time > event_list[event_list.length - 1]["time"]) {
            clearInterval(timerId);

            context.fillStyle = "red";
            context.font = '88px serif';
            context.fillText("FINISH", 300, 300);

        }

        time += speed;
        drawTime(time);
    }

    transport_kind.forEach(transport => {
        let begin = transport.kind == 'TRUCK'
            ? 'FACTORY'
            : 'PORT';
        let end = transport.kind == 'TRUCK'
            ? 'PORT'
            : 'A';

        drawTransport(transport.image, begin, end, 0, 0, warehouses, []);    
    });
    
    let timerId = setInterval(mainLoop, 50);
}