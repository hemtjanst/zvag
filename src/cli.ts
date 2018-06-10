import * as cliArgs from "command-line-args";
import * as cliUsage from "command-line-usage";
import {connect} from "mqtt";

import {ZVag} from "./lib/index";
import {Client} from "hemtjanst/lib/hemtjanst";

import * as dbgModule from "debug";
import {ZVagProxy} from "./lib/proxy";
import {OZW} from "./lib/openzwave-shared";
import {MqttOzw} from "./lib/mqttOzw";
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
    },
    {
        name: 'proxy',
        alias: 'p',
        type: Boolean,
        description: 'Run in proxy mode'
    },
    {
        name: 'client',
        alias: 'c',
        type: Boolean,
        description: 'Run in client mode'
    },
    {
        name: 'proxyName',
        alias: 'r',
        type: String,
        description: "--name used on proxy side (prefixes topics for reading and writing raw data)",
        typeLabel: '[underline]{zwave}'
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
if (!args.proxyName) {
    args.proxyName = "zwave";
}

if (args.help) {
    console.log(cliUsage([
        {
            header: `zvag ${version}`,
            content: `Connects the Z-Wave Network to Hemtjänst`
        },
        {
            header: `Usage`,
            content: `zvag -a [italic]{tcp://127.0.0.1:1883} -d [italic]{/dev/ttyUSB0} [-p] [-e [italic]{zwave/}]`
        },
        {
            header: `Options`,
            optionList: opts
        }
    ]))
} else {
    let clientId = "zvag-" + Math.floor((Math.random() * 10000000) + 1);

    let zwave: OZW;

    if (!args.client) {
        const OZW = require('openzwave-shared');
        zwave = new OZW({
            Logging: false,
            ConsoleOutput: false
        });
    } else {
        let mqtt = connect(args.mqtt, { keepalive: 30 });
        debug('Creating mqtt -> Z-Wave client');
        zwave = new MqttOzw({
            mqtt: mqtt,
            name: args.proxyName
        });
    }

    zwave.connect(args.device);

    if (!args.proxy) {

        let htMqtt = connect(args.mqtt, {
            keepalive: 30,
            clientId: clientId,
            will: {
                topic: "leave",
                payload: clientId,
                qos: 1,
                retain: false
            }
        });

        let hemtjanst = new Client(htMqtt);

        new ZVag(zwave, hemtjanst, {
            name: args.name,
            clientId: clientId
        });
    } else {
        let mqtt = connect(args.mqtt, { keepalive: 30 });
        new ZVagProxy(zwave, mqtt, {
            prefix: args.name
        });
    }
}