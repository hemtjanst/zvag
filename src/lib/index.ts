/// <reference path="./openzwave-shared.d.ts"/>
import {IHomeId, INodeInfo, IValue, IValueId, OZW} from './openzwave-shared';
import {Client} from "hemtjanst/lib/hemtjanst";
import {Device, DeviceType} from "hemtjanst/lib/device";
import {ZVagNode} from "./node";
import {ZVagValue, IChange} from "./value";

import * as dbgModule from "debug";
let debug = dbgModule("zvag");

export type ZVagOpts = {
    name?: string
    clientId?: string
};

export class ZVag {

    private zwave: OZW;
    private ht: Client;
    private nodes: ZVagNode[] = [];
    private devices: {[name: string]: Device} = {};
    private opts: ZVagOpts;

    constructor(zwave: OZW, hemtjanst: Client, opts?: ZVagOpts) {
        this.zwave = zwave;
        this.ht = hemtjanst;
        this.opts = opts || {};
        if (!this.opts.name) {
            this.opts.name = "zwave";
        }

        for (let cmd of ["node added", "node naming", "node available"]) {
            zwave.on(cmd, (id: number, info: INodeInfo) => {
                this.updateNode(id, info);
            });
        }

        for (let cmd of ["value added", "value changed", "value refreshed"]) {
            zwave.on(cmd, (node: number, cls: number, value: IValue) => {
                if (typeof this.nodes[node] === "undefined") {
                    this.updateNode(node);
                }
                this.nodes[node].updateValue(value);
            });
        }

        zwave.on("node ready", (id, info) => {
            debug(`Node ${id} is ready`);
            this.updateNode(id, info);
            this.nodes[id].onReady();
            this.createDevices();
        });
    }

    private updateNode(id: number, info?: INodeInfo) {
        if (!this.nodes[id]) {
            this.nodes[id] = new ZVagNode(id, info);
        } else {
            this.nodes[id].update(info);
        }
    }

    private createDevices() {

        for (let i in this.nodes) {
            if (this.nodes[i] && this.nodes[i].ready) {
                let node = this.nodes[i];
                let name = this.opts.name + i;
                let type = node.getType();
                let typeStr = "switch";

                for (let t in DeviceType) {
                    if (DeviceType[t] === type) {
                        typeStr = t.toLowerCase();
                    }
                }

                let topic = typeStr+"/"+name;

                if (typeof this.devices[topic] !== "undefined") {
                    continue;
                }

                let dev = new Device(topic, {
                    name: node.info.name || name,
                    type: type,
                    manufacturer: node.info.manufacturer,
                    model: node.info.product,
                    lastWillID: this.opts.clientId,
                });

                let features = [];

                for (let value of node.getValues()) {
                    let ft = value.feature();
                    if (ft) {
                        debug(`Found feature ${ft.name} in ${topic}`);
                        features.push([value, ft.name, ft.meta]);
                    }
                }

                if (features.length > 0) {
                    for (let ft of features) {
                        let value: ZVagValue = ft[0];
                        dev.addFeature(ft[1], ft[2]);
                        dev.onSet(ft[1], (d,f,v) => {
                            debug(`Setting ${topic}/${f} to ${v}`);
                            value.set(this.zwave, v);
                        });
                    }

                    this.ht.AddDevice(dev);
                    this.devices[topic] = dev;

                    for (let ft of features) {
                        let value: ZVagValue = ft[0];
                        let ftName = ft[1];
                        value.on('update', (changes: IChange[]) => {
                            for (let ch of changes) {
                                if (ch.name !== "value") continue;
                                dev.update(ftName, ch.cur);
                                debug(`Updating ${topic}/${ftName} from ${ch.old} to ${ch.cur}`);
                            }
                        });

                        dev.update(ftName, value.value);
                        debug(`Setting ${topic}/${ftName} to ${value.value}`);
                    }
                }


            }
        }

    }

}
