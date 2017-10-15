/// <reference path="./lib/openzwave-shared.d.ts"/>
import * as fs from "fs";
import {ZVag} from "./lib/index";
import {OzwMock} from "./mock/ozw";
import {Client as HemtjanstClient} from "hemtjanst/lib/hemtjanst";
import * as mqtt from "mqtt";

let mockDataStr = fs.readFileSync("data.json");
let mockData = JSON.parse(mockDataStr.toString());

let ozwMock = OzwMock();

let hemtjanst = new HemtjanstClient(mqtt.connect());
let zvag = new ZVag(ozwMock, hemtjanst);


setTimeout(() => {
    for (let d of mockData) {
        let delay = d.shift();
        let event = d.shift();
        let args = d;
        setTimeout(() => {
            // console.log(`Firing event ${event}, delay: ${delay}`);
            ozwMock.emit(event, args);
        }, delay);
    }
}, 1000);