import {
    IClassId,
    IHomeId,
    IIndex,
    IInstance,
    INodeId,
    INodeInfo,
    ISceneId,
    IValue,
    IValueId,
    OZW
} from "./openzwave-shared";
import {MqttClient} from "mqtt";
import {Packet} from "mqtt-packet";

import * as dbgModule from 'debug';
import {ICmd} from "./proxy";
let debug = dbgModule('zvag-mqttozw');

export class MqttOzw implements OZW {

    private mqtt: MqttClient;
    private name: string;
    private nodes: {[id: number]: INodeInfo} = {};
    private values: {[node: number]: IValue[]} = {};

    constructor(opts: {mqtt: MqttClient, name: string}) {
        this.mqtt = opts.mqtt;
        this.name = opts.name;
    }

    /**
     * Connect to a device
     * @param {string} device Serial device. e.g., /dev/ttyUSB0
     */
    connect(device: string) {
        debug(`Subscribing to ${this.name}/#`);
        this.mqtt.subscribe(`${this.name}/#`);
        this.mqtt.on("message", (topic, payload, packet) => {
            const l = this.name.length;
            const v = payload.toString() === '' ? null : JSON.parse(payload.toString());
            if (topic.length <= l) return;
            if (topic.substr(0, l+1) !== `${this.name}/`) return;
            this.onMsg(topic.substr(l+1), v);
        });
    }

    /**
     * Disconnect from a device
     * @param {string} device
     */
    disconnect(device: string) {
        this.mqtt.unsubscribe(this.name + "/#");
    }

    private cmd(cmd: ICmd|ICmd[]) {
        const nt = `${this.name}/set`;
        const pub = JSON.stringify(cmd);
        debug(`Sending to ${nt}: ${pub}`);
        this.mqtt.publish(nt, pub, {
            qos: 1,
            retain: false
        }, (error?: Error, packet?: Packet) => {
            if (error) {
                debug(`Error publishing to ${nt}: ${error}`);
                debug(`Message (${typeof cmd}): ${JSON.stringify(cmd)}`);
            }
        });

    }

    private createNode(node_id: INodeId) {
        if (typeof this.nodes[node_id] === 'undefined') {
            this.nodes[node_id] = {};
            this.cb.nodeAdded.forEach(cb => cb(node_id));
        }
    }

    private updateValue(val: IValue) {
        this.createNode(val.node_id);
        if (typeof this.values[val.node_id] === 'undefined') {
            this.values[val.node_id] = [];
        }
        for (let k in this.values[val.node_id]) {
            let vv = this.values[val.node_id][k];
            if (vv.value_id != val.value_id) continue;
            let upd = false;
            for (let kk in val) {
                if (val.hasOwnProperty(k)) {
                    if (this.values[val.node_id][k][kk] !== val[k]) {
                        upd = true;
                    }
                    this.values[val.node_id][k][kk] = val[k];
                }
            }
            if (upd) {
                debug(`Updated value for ${val.value_id}`);
                debug(val);
                this.cb.valueChanged.forEach(cb => {
                    cb(val.node_id, val.class_id, val)
                });
            } else {
                this.cb.valueRefreshed.forEach(cb => {
                    cb(val.node_id, val.class_id, val)
                });
            }
            return;
        }

        debug(`New value: ${JSON.stringify(val)}`);
        this.values[val.node_id].push(val);
        this.cb.valueAdded.forEach(cb => {
            cb(val.node_id, val.class_id, val)
        });

    };

    private onMsg(topic: string, obj: any) {
        const valMatch = /^node(\d+)\/value(\d+)-(\d+)-(\d+)$/.exec(topic);
        const nodeMatch = /^node(\d+)$/.exec(topic);

        if (valMatch) {
            let valId: IValueId = {
                node_id: parseInt(valMatch[1]),
                class_id: parseInt(valMatch[2]),
                instance: parseInt(valMatch[3]),
                index: parseInt(valMatch[4])
            };

            if (obj === null) {
                let i = undefined;

                for (let k in this.values[valId.node_id]) {
                    let vv = this.values[valId.node_id][k];
                    if (vv.node_id !== valId.node_id ||
                        vv.class_id !== valId.class_id ||
                        vv.instance !== valId.instance ||
                        vv.index !== valId.index
                    ) continue;
                    i = k;
                    break;
                }
                delete(this.values[valId.node_id]);
                this.cb.valueRemoved.forEach(cb => cb(valId.node_id, valId.class_id, valId));
            } else {
                this.updateValue(obj);
            }
        }

        if (nodeMatch) {
            let nodeId: INodeId = parseInt(nodeMatch[1]);
            if (obj === null) {
                delete(this.nodes[nodeId]);
                this.cb.nodeRemoved.forEach(cb => cb(nodeId));
            } else {
                this.createNode(nodeId);
                for (let k in obj) {
                    if (obj.hasOwnProperty(k)) {
                        this.nodes[nodeId][k] = obj[k];
                    }
                }
                if (obj.ready) {
                    setTimeout(() => {
                        this.cb.nodeReady.forEach(cb => {
                            cb(nodeId, this.nodes[nodeId]);
                        });
                    }, 5000);
                }
            }
        }
    }

    /**
     * Set a value
     * @param {INodeId} node_id
     * @param {IClassId} class_id
     * @param {IInstance} instance
     * @param {IIndex} index
     * @param value
     */
    setValue(node_id: INodeId|IValueId, class_id: IClassId|any, instance?: IInstance, index?: IIndex, value?: any) {

        if (typeof node_id === 'object') {
            value = class_id;
            class_id = node_id.class_id;
            instance = node_id.instance;
            index = node_id.index;
            node_id = node_id.node_id;
        }

        this.cmd({
            cmd: "value",
            nodeId: node_id,
            classId: class_id,
            instance: instance,
            index: index,
            value: value
        });
    }


    /**
     * Turn a binary switch on
     * @param {number} node_id
     */
    setNodeOn(node_id: INodeId) {
        this.cmd({
            cmd: "on",
            nodeId: node_id
        });
    }

    /**
     * Turn a binary switch off
     * @param {INodeId} node_id
     */
    setNodeOff(node_id: INodeId) {
        this.cmd({
            cmd: "off",
            nodeId: node_id
        });
    }

    /**
     * Set level for a node, for example dimming of lights
     * @param {number} node_id
     * @param {number} level Dim percentage
     */
    setLevel(node_id: INodeId, level: number) {
        this.cmd({
            cmd: "level",
            nodeId: node_id,
            value: level
        });
    }

    /**
     * Set location string
     * @param {INodeId} node_id
     * @param {string} location
     */
    setNodeLocation(node_id: INodeId, location: string) {
        this.cmd({
            cmd: "location",
            nodeId: node_id,
            value: location
        });
    }

    /**
     * Set node name
     * @param {INodeId} node_id
     * @param {string} name
     */
    setNodeName(node_id: INodeId, name: string) {
        this.cmd({
            cmd: "name",
            nodeId: node_id,
            value: name
        });
    }


    private cb: {
        driverReady: ((homeid: IHomeId) => any)[],
        driverFailed: (() => any)[],
        nodeAvailable: ((nodeid: INodeId, nodeinfo: INodeInfo) => any)[],
        nodeAdded: ((nodeid: INodeId) => any)[],
        nodeRemoved: ((nodeid: INodeId) => any)[],
        nodeNaming: ((nodeid: INodeId, nodeinfo: INodeInfo) => any)[],
        nodeReady: ((nodeid: INodeId, nodeinfo: INodeInfo) => any)[],
        nodeEvent: ((nodeid: INodeId, data: any) => any)[],
        sceneEvent: ((nodeid: INodeId, sceneId: ISceneId) => any)[],
        valueAdded: ((nodeid: INodeId, commandclass: IClassId, value: IValue) => any)[],
        valueChanged: ((nodeid: INodeId, commandclass: IClassId, value: IValue) => any)[],
        valueRefreshed: ((nodeid: INodeId, commandclass: IClassId, value: IValue) => any)[],
        valueRemoved: ((nodeid: INodeId, commandclass: IClassId, valueId: IValueId) => any)[],
        scanComplete: (() => any)[],
        pollingEnabled: ((nodeid: INodeId) => any)[],
        pollingDisabled: ((nodeid: INodeId) => any)[],
        controllerCommand: ((nodeid: INodeId, nodeinfo: INodeInfo) => any)[],
    } = {
        driverReady: [],
        driverFailed: [],
        nodeAvailable: [],
        nodeAdded: [],
        nodeNaming: [],
        nodeRemoved: [],
        nodeReady: [],
        nodeEvent: [],
        sceneEvent: [],
        valueAdded: [],
        valueChanged: [],
        valueRefreshed: [],
        valueRemoved: [],
        scanComplete: [],
        pollingEnabled: [],
        pollingDisabled: [],
        controllerCommand: [],
    };

    on(ev: string, cb: any) {
        if (ev.indexOf(" ") <= 0) {
            throw new Error(`invalid or unsupported event ${ev}`);
        }
        const p = ev.split(" ", 2);
        const newName = `${p[0]}${p[1].substr(0,1).toUpperCase()}${p[1].substr(1)}`;
        if (typeof this.cb[newName] === 'undefined') {
            throw new Error(`invalid or unsupported event ${ev}`);
        }
        this.cb[newName].push(cb);
    }

}
