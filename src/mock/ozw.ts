import {iNodeId, OZW} from "../lib/openzwave-shared";


export function OzwMock(): OZW {
    let callbacks = {};
    let mock: OZW = {
        connect: device => {},
        disconnect: device => {},
        setValue: (node_id, class_id, instance?, index?, value?) => {
            console.log({
                event: 'Mock OZW setValue',
                node_id: node_id,
                class_id: class_id,
                instance: instance,
                index: index,
                value: value
            });
        },
        setNodeOn: node_id => { return mock.setValue(node_id, 37, 1, 0, 1); },
        setNodeOff: node_id => { return mock.setValue(node_id, 37, 1, 0, 0); },
        setLevel: (node_id, level) => { return mock.setValue(node_id, 38, 1, 0, level); },
        setNodeLocation: (node_id: number, location: string) => {},
        setNodeName: (node_id: number, name: string) => {},
        on: (ev, cb) => {
            if (!callbacks[ev]) callbacks[ev] = [];
            callbacks[ev].push(cb);
        },
        emit: (ev, args) => {
            if (callbacks[ev]) {
                for (let cb of callbacks[ev]) {
                    cb.apply(cb, args);
                }
            }
        },
    };
    return mock;
}

