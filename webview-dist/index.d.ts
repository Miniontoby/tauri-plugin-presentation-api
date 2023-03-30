import { WebviewWindow, Monitor } from '@tauri-apps/api/window';
declare class Eventable {
    constructor();
    addEventListener(): void;
    dispatchEvent(eventName: string, eventData?: object): void;
}
export declare class PresentationRequest2 extends Eventable {
    #private;
    url: string;
    _monitors: Monitor[];
    _idx: number;
    starting: boolean;
    constructor(url: string[] | string);
    start(): Promise<PresentationConnection2>;
    reconnect(presentationId: string): Promise<PresentationConnection2 | boolean>;
    getAvailability(): Promise<PresentationAvailability2>;
    onconnectionavailable(event: object): void;
}
export declare class PresentationConnection2 extends Eventable {
    id: string;
    url: string;
    monitor: Monitor;
    state: PresentationConnectionState2;
    webview: WebviewWindow;
    isReceiver: boolean;
    listens: any[];
    constructor(id: string, url: string, monitor: Monitor | null);
    static constructFromReconnect(reconnectId: string): false | typeof PresentationConnection2;
    _listeners(): Promise<void>;
    close(): void;
    terminate(): void;
    onconnect(): void;
    onclose(): void;
    onterminate(): void;
    binaryType: BinaryType | undefined;
    onmessage(event: object): void;
    send(message: string): void;
}
export declare class PresentationReceiver2 {
    connectionList: Promise<PresentationConnectionList2>;
}
export declare class PresentationAvailability2 extends Eventable {
    value: boolean;
    constructor(value?: boolean);
    getValue(): void;
    onchange(): void;
}
declare enum PresentationConnectionState2 {
    "connecting" = 0,
    "connected" = 1,
    "closed" = 2,
    "terminated" = 3
}
export declare class PresentationConnectionAvailableEvent2 {
    connection: PresentationConnection2 | undefined;
}
declare class PresentationConnectionList2 extends EventTarget {
    connections: PresentationConnection2[];
    onconnectionavailable(): void;
    constructor();
}
export declare class Presentation2 {
    defaultRequest: PresentationRequest2 | null;
    receiver: PresentationReceiver2 | null;
    constructor();
}
declare global {
    interface Window {
        Presentation: Presentation2;
        PresentationRequest: PresentationRequest2;
        PresentationConnection: PresentationConnection2;
        PresentationReceiver: PresentationReceiver2;
        PresentationAvailability: PresentationAvailability2;
        PresentationConnectionAvailableEvent: PresentationConnectionAvailableEvent2;
        PresentationConnectionList: PresentationConnectionList2;
    }
    interface Navigator {
        presentation: Presentation2;
    }
}
export {};
