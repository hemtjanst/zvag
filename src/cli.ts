import * as cliArgs from "command-line-args";
import * as cliUsage from "command-line-usage";
import {connect} from "mqtt";

import * as OZW from "openzwave-shared";
import {ZVag} from "./lib/index";
import {Client} from "hemtjanst/lib/hemtjanst";

import * as dbgModule from "debug";
let debug = dbgModule("zvag");
let version = "0.0.1";

let opts = [
    {
        name: "device",
        alias: "d",
        type: String,
        description: "Z-Wave serial interface device",
        typeLabel: "[underline]{/dev/ttyUSB0}",
    },
    {
        name: 'mqtt',
        alias: 'a',
        type: String,
        description: "MQTT address",
        typeLabel: 'tcp://[underline]{127.0.0.1}:1883'
    },
    {
        name: 'name',
        alias: 'n',
        type: String,
        description: "Name for prefixing, should be unique between instances on the same mqtt",
        typeLabel: '[underline]{zwave}'
    },
    {
        name: 'help',
        alias: 'h',
        type: Boolean,
        description: 'Show this help'
    }
];

let args = cliArgs(opts);

if (!args.device) {
    args.device = "/dev/ttyUSB0";
}
if (!args.mqtt) {
    args.mqtt = "tcp://127.0.0.1:1883";
}
if (!args.name) {
    args.name = "zwave";
}


if (args.help) {
    console.log(cliUsage([
        {
            header: `zvag ${version}`,
            content: `Connects the Z-Wave Network to Hemtjänst`
        },
        {
            header: `Usage`,
            content: `zvag -a [italic]{tcp://127.0.0.1:1883} -d [italic]{/dev/ttyUSB0}`
        },
        {
            header: `Options`,
            optionList: opts
        }
    ]))
} else {
    let zwave = new OZW({
        Logging: false,
        ConsoleOutput: false
    });

    zwave.connect(args.device);
    let mqtt = connect(args.mqtt, {
        keepalive: 30,
        clientId: `zvag`
    });

    let hemtjanst = new Client(mqtt);

    new ZVag(zwave, hemtjanst, {name: args.name});
}