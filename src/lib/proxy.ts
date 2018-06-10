import {IClassId, IHomeId, IIndex, IInstance, INodeId, INodeInfo, IValue, IValueId, OZW} from './openzwave-shared';
import {MqttClient} from 'mqtt';
import {Packet} from 'mqtt/types/lib/types';

import * as dbgModule from 'debug';
let debug = dbgModule('zvag-proxy');

export declare type IProxyArgs = {
    /**
     * Prefix for all MQTT messages
     */
    prefix?: string
}

const defaultPrefix = 'zwave/';

/**
 * MQTT topic structure:
 *
 * {home} -> INodeId[]
 * {home}/node{nodeId} -> INodeInfo
 *
 */

declare type IValueMap = {
    [node: number]: IValue[]
};


export declare type ICmd = (
    {
        cmd: "value"
        nodeId: INodeId
        classId?: IClassId
        instance?: IInstance
        index?: IIndex
        value?: string|number|boolean
    } | {
        cmd: "on"
        nodeId: INodeId
    } | {
        cmd: "off"
        nodeId: INodeId
    } | {
        cmd: "level"
        nodeId: INodeId
        value: number
    } | {
        cmd: "location"
        nodeId: INodeId
        value: string
    } | {
        cmd: "name"
        nodeId: INodeId
        value: string
    }
);

export class ZVagProxy {

    private zwave: OZW;
    private mqtt: MqttClient;
    private mqPrefix: string;
    private nodes: {[id: number]: INodeInfo} = {};
    private values: {[node: number]: IValue[]} = {};

    constructor(zwave: OZW, mqtt: MqttClient, args?: IProxyArgs) {
        this.zwave = zwave;
        this.mqtt = mqtt;
        this.mqPrefix = defaultPrefix;
        if (typeof args === 'object') {
            this.mqPrefix = args.prefix || defaultPrefix;
        }

        mqtt.subscribe(this.mqPrefix + '/set');
        mqtt.on('message',  (topic: string, payload: Buffer, packet: Packet) => {
            this.onMqttMessage(topic, payload, packet);
        });

        zwave.on('driver ready', homeid => {
            debug(`Driver ready`);
        });
        zwave.on('scan complete', () => this.onScanComplete());
        zwave.on('node added', id => this.createNode(id));
        zwave.on('node removed', id => this.destroyNode(id));
        zwave.on('node ready', (id, info) => this.onNodeReady(id, info));
        for (let cmd of ['value added', 'value changed', 'value refreshed']) {
            zwave.on(cmd, (node: INodeId, cls: IClassId, value: IValue) => {
                this.onValueUpdate(node, value);
            });
        }
        for (let cmd of ['node added', 'node naming', 'node available']) {
            zwave.on(cmd, (id: number, info: INodeInfo) => {
                this.onNodeUpdate(id, info);
            });
        }
        zwave.on('value removed', (node: INodeId, cls: IClassId, valueId) => {
            this.destroyValue(node, valueId);
        });

        for (let cmd of ['scene event', 'node event']) {
            let type = (cmd === 'scene event' ? 'scene' : 'event');
            zwave.on(cmd, (node, data) => {
                this.push(`node${node}/${type}`, JSON.stringify(data), false);
            });
        }

    }

    private push(topic: string, payload: string|Buffer, retain?: boolean) {
        const nt = `${this.mqPrefix}/${topic}`;
        this.mqtt.publish(nt, payload, {
            qos: 1,
            retain: (typeof retain !== 'undefined' ? retain : true),
        }, (error?: Error, packet?: Packet) => {
            if (error) {
                debug(`Error publishing to ${nt}: ${error}`);
                debug(`Message (${typeof payload}): ${payload.toString()}`);
            }
        });

    }

    private onMqttMessage(topic: string, payload: Buffer, packet: Packet) {
        let cmd = JSON.parse(payload.toString());
        if (typeof cmd !== 'object') {
            debug(`Invalid command received on topic ${topic}: "${payload.toString()}"`);
            return;
        }
        if (Array.isArray(cmd)) {
            for (let c of cmd) {
                this.execute(c);
            }
        } else {
            this.execute(cmd);
        }
    }

    private execute(c: ICmd) {
        let ok: boolean = false;
        try {
            if (c.cmd === 'value') {
                debug(`CMD: ${c.nodeId}-${c.classId}-${c.instance}-${c.index} Set ${c.value}`);
                this.zwave.setValue(
                    c.nodeId,
                    c.classId,
                    c.instance,
                    c.index,
                    c.value
                );
                ok = true;
            } else if (c.cmd === 'on') {
                debug(`CMD: ${c.nodeId} On`);
                this.zwave.setNodeOn(c.nodeId);
                ok = true;
            } else if (c.cmd === 'off') {
                debug(`CMD: ${c.nodeId} Off`);
                this.zwave.setNodeOff(c.nodeId);
                ok = true;
            } else if (c.cmd === 'location') {
                debug(`CMD: ${c.nodeId} location=${c.value}`);
                this.zwave.setNodeLocation(c.nodeId, c.value);
                ok = true;
            } else if (c.cmd === 'name') {
                debug(`CMD: ${c.nodeId} name=${c.value}`);
                this.zwave.setNodeName(c.nodeId, c.value);
                ok = true;
            } else if (c.cmd === 'level') {
                debug(`CMD: ${c.nodeId} level=${c.value}`);
                this.zwave.setLevel(c.nodeId, c.value);
                ok = true;
            }
            if (ok) return;
            debug(`Problems with command "${JSON.stringify(c)}": cmd not found`);

        } catch(err) {
            debug(`Problems with command "${JSON.stringify(c)}": ${err}`);
        }
    }

    private onScanComplete() {

    }

    private createNode(id: INodeId) {
        this.nodes[id] = {};
    }

    private destroyNode(id: INodeId) {
        if (typeof this.nodes[id] === 'undefined') {
            return;
        }
        this.push(`node${id}`, '');
        delete(this.nodes[id]);
        this.destroyValue(id);
    }

    private onNodeUpdate(id: INodeId, info: INodeInfo) {
        if (typeof this.nodes[id] === 'undefined') {
            this.nodes[id] = {};
        }
        if (typeof info !== "undefined") {
            for (let k in info) {
                if (info.hasOwnProperty(k)) {
                    this.nodes[id][k] = info[k];
                }
            }
        }
        if (this.nodes[id].ready) {
            this.push(`node${id}`, JSON.stringify(this.nodes[id]));
        }
    }

    private onNodeReady(id: INodeId, info: INodeInfo) {
        if (typeof this.nodes[id] === 'undefined') {
            this.nodes[id] = {};
        }
        this.nodes[id]._ready = true;
        this.nodes[id]._values = this.values[id].map(v => v.value_id);
        this.onNodeUpdate(id, this.nodes[id]);
    }

    private onValueUpdate(node: INodeId, value: IValue) {
        if (typeof this.values[node] === 'undefined') {
            this.values[node] = [];
        }
        let vv: IValue = undefined;
        for (let k in this.values[node]) {
            let v = this.values[node][k];
            if (v.value_id !== value.value_id) continue;
            vv = v;
            break;
        }
        if (typeof vv === 'undefined') {
            vv = value;
            this.values[node].push(vv);
        } else {
            for (let k in value) {
                if (value.hasOwnProperty(k)) {
                    vv[k] = value[k];
                }
            }
        }

        this.push(`node${node}/value${vv.class_id}-${vv.instance}-${vv.index}`, JSON.stringify(vv));

    }
    private destroyValue(node: INodeId, value?: IValueId) {
        if (typeof this.values[node] === 'undefined') {
            return;
        }
        let del: string[] = [];
        for (let k in this.values[node]) {
            let v = this.values[node][k];
            if (v.node_id !== node) continue;
            if (typeof value !== 'undefined' && (
                v.class_id !== value.class_id ||
                v.instance !== value.instance ||
                v.index !== value.index)
            ) continue;

            this.push(`node${node}/value${v.class_id}-${v.instance}-${v.index}`, '');
            del.push(k);
        }
        for (let k in del) {
            delete(this.values[node][k]);
        }
    }
}