import { WebviewWindow, availableMonitors, Monitor, appWindow } from '@tauri-apps/api/window';
import { Modal } from './modal.js';
// import { writable } from 'svelte/store';
// import { emit, listen, TauriEvent } from '@tauri-apps/api/event'

// Docs:
// https://www.w3.org/TR/presentation-api/
// https://developer.mozilla.org/en-US/docs/Web/API/PresentationRequest

class Eventable {
    constructor() {
        this.el = document.createElement("Eventable");
        this.el.obj = this;
    }
    addEventListener() {
        this.el.addEventListener(arguments[0], arguments[1]);
    }
    dispatchEvent(eventName: string, eventData: object = {}) {
        var event = new Event(eventName);
        Object.assign(event, eventData);
        this.el.dispatchEvent(event);
    }
}

/*
[SecureContext, Exposed=Window]
interface PresentationRequest : EventTarget {
  constructor(USVString url);
  constructor(sequence<USVString> urls);
  Promise<PresentationConnection> start();
  Promise<PresentationConnection> reconnect(USVString presentationId);
  Promise<PresentationAvailability> getAvailability();

  attribute EventHandler onconnectionavailable;
};
*/
let modalTemplate = (t,st,dvcs) => `<div class="title-section"><b class="title">${t}</b><div class="subtitle">${st}</div></div><p class="info">Cast to device:</p><div class="devices">${dvcs.map((key,i) => '<div class="device-card" data-id="'+i+'"><img class="icon" alt="icon"/><div class="info"><div>Screen '+i+'</div><div>Available</div></div></div>').join("")}</div>`;
export class PresentationRequest2 extends Eventable {
	url: string;
	_monitors: Monitor[] = [];
	_idx: number = 0;
	starting: boolean = false;
	constructor(url: string[]|string) {
		super();
		if (typeof(url) == 'string') this.url = url;
		else this.url = url[0];

		this.selectModal = new Modal({
			effect: 'zoom',
			size: 'medium',
			content: modalTemplate('Presentation', 'hmm', []),
			footer: '', // '<button class="success">OK</button><button class="cancel alt">Cancel</button>',
			onClose: () => {
				this.starting = false;
				if (this.selectModal.reject) this.selectModal.reject("Canceled!");
			},
		});
		this.selectModal.contentElement.parentElement.classList.add('selector')
		this.addEventListener("connectionavailable", (e) => this.onconnectionavailable(e));
	}
	start(): Promise<PresentationConnection2> {
		return new Promise(async (resolve, reject) => {
			if (this.starting) reject("OperationError");
			await this.getAvailability();

			this.starting = true;
			if (this._monitors.length == 0 && !await this.getAvailability()) {
				reject("No monitor for presentating!");	
				return;
			}

			this.selectModal.content = modalTemplate('Presentation', 'hmm', this._monitors); 
			//this.selectModal.content = '<label for="monitorSelect">Select a monitor to project:</label> <select name="monitorSelect" id="monitorSelect">' + this._monitors.map((m, i)=>`<option value='${i}'>${m.name}</option>`).join('') + "</select>";
			this.selectModal.resolve = resolve;
			this.selectModal.reject = reject;
			this.selectModal.contentElement.querySelectorAll(".device-card").forEach((card) => {
				card.onclick = event => {
					event.preventDefault();
					if (this.selectModal.resolve)
						this.selectModal.resolve(this.#start(Number(card.dataset.id)));
					this.selectModal.close();
				}
			});
			this.selectModal.open();
		});
	}
	#start(monitorId: Number) {
		let monitor = this._monitors[monitorId];
		if (!monitor || monitorId < 0) return "Cannot find monitor!";
		this._idx++;
		this.starting = false;
		console.log(this._idx, this.url, monitor);
		const connection = new PresentationConnection2(String(this._idx), this.url, monitor)
		connection.onconnect = () => this.dispatchEvent("connectionavailable", { connection }); 
		return connection;
	}
	reconnect(presentationId: string): Promise<PresentationConnection2|boolean> {
		return new Promise((resolve, reject) => {
			resolve(PresentationConnection2.constructFromReconnect(String(presentationId)));
		});
	}
	getAvailability(): Promise<PresentationAvailability2> {
		return new Promise(async (resolve) => {
			this._monitors = await availableMonitors();
			if (this._monitors.length > 1) resolve(new PresentationAvailability2(true));
			resolve(new PresentationAvailability2(false));
		});
	}
	onconnectionavailable(event: object) {}
}

/*
[SecureContext, Exposed=Window]
interface PresentationConnection : EventTarget {
  readonly attribute USVString id;
  readonly attribute USVString url;
  readonly attribute PresentationConnectionState state;
  undefined close();
  undefined terminate();
  attribute EventHandler onconnect;
  attribute EventHandler onclose;
  attribute EventHandler onterminate;

  // Communication
  attribute BinaryType binaryType;
  attribute EventHandler onmessage;
  undefined send (DOMString message);
  undefined send (Blob data);
  undefined send (ArrayBuffer data);
  undefined send (ArrayBufferView data);
};
*/
export class PresentationConnection2 extends Eventable {
	id: string;
	url: string;
	monitor: Monitor;
	state: PresentationConnectionState2 = PresentationConnectionState2.connecting;
	webview: WebviewWindow;
	isReceiver: boolean = false;
	listens: any[] = [];
	constructor(id: string, url: string, monitor: Monitor|null) {
		super();
		this.id = id;
		this.url = url;
		if (monitor != null) {
			this.monitor = monitor;
			this.webview = new WebviewWindow(id, { url: this.url + "#PresentationReceiver", fullscreen: true, width: monitor.size.width, height: monitor.size.height, x: monitor.position.x, y: monitor.position.y, resizable: false });

			this.webview.once('tauri://created', async function (this) {
				// webview window successfully created
				this.state = PresentationConnectionState2.connected;
				this.onconnect();
				this._listeners();
				//window.PresentationConnectionList.connections.push(this);
			}.bind(this));

			this.webview.once('tauri://error', function (e) {
				console.log('An error accurred: ', e);
				this.state = PresentationConnectionState2.connected;
				this.onconnect();
				this._listeners();
				// an error occurred during webview window creation
			})
		} else {
			// is receiver itself, so set the webview to the main (controller) one
			this.webview = WebviewWindow.getByLabel('main');
			this.isReceiver = true;
			this._listeners();
		}
		this.addEventListener("connect", (e) => this.onconnect(e));
		this.addEventListener("close", (e) => this.onclose(e));
		this.addEventListener("terminate", (e) => this.onterminate(e));
		this.addEventListener("message", (e) => this.onmessage(e));
	}
	static constructFromReconnect(reconnectId: string) {
		this.id = reconnectId;
		const webview = WebviewWindow.getByLabel(reconnectId);
		if (webview) {
			this.webview = webview;
			this.state = PresentationConnectionState2.connected;
			this._listeners();
			return this;
		} else {
			return false;
		}
	}
	async _listeners(){
		this.listens.push(await this.webview.listen('message', (event) => {
			event.data = event.payload;
			this.dispatchEvent("message", event);
			//this.onmessage(event);
		}));
		this.listens.push(await this.webview.listen('close', (event) => {
			if (!this.isReceiver) this.state = PresentationConnectionState2.closed;
			else this.webview.emit("close", event);
			this.dispatchEvent("close", event);
			this.listens.forEach((l) => l());
			this.listens = [];
		}));
		this.listens.push(await this.webview.listen('terminate', () => {
			if (!this.isReceiver) {
				this.state = PresentationConnectionState2.terminated;
				this.dispatchEvent("terminate", {});
				//window.PresentationConnectionList.connections = window.PresentationConnectionList.connections.filter((conn) => conn != this);
				this.webview.close();
			} else {
				this.webview.emit("terminate");
				this.dispatchEvent("terminate", {});
				appWindow.close();
			}
			this.listens.forEach((l) => l());
			this.listens = [];
		}));
	}
	close() {
		if (this.state == PresentationConnectionState2.connected) {
			this.webview.emit("close", {reason: "closing", "message": ""});
		}
	}
	terminate() {
		if (this.state == PresentationConnectionState2.connected) {
			this.webview.emit("terminate");
		}
	}
	onconnect() {}
	onclose() {}
	onterminate() {}

	// Communication
	binaryType: BinaryType|undefined;
	onmessage(event: object) {}
	send (message: string) {
		this.webview.emit("message", message);
	}
}

/*
[SecureContext, Exposed=Window]
interface PresentationReceiver {
  readonly attribute Promise<PresentationConnectionList> connectionList;
};
*/
export class PresentationReceiver2 {
	connectionList: Promise<PresentationConnectionList2> = new Promise((resolve) => resolve(new PresentationConnectionList2()));
}

/*
[SecureContext, Exposed=Window]
interface PresentationAvailability : EventTarget {
  readonly attribute boolean value;

  attribute EventHandler onchange;
};
*/
export class PresentationAvailability2 extends Eventable {
	value: boolean = false;
	constructor(value=false) {
		super();
		this.value = value;
		this.addEventListener("change", (e) => this.onchange(e));
		window.requestAnimationFrame(this.getValue);
	}
	getValue() {
		(async () => {
			let monitors = await availableMonitors()
			let ovalue = this.value;
			this.value = (monitors.length > 1);
			if (ovalue != this.value) this.dispatchEvent("change");
			window.requestAnimationFrame(this.getValue);
		})();
	}
	onchange() { }
}

enum PresentationConnectionState2 { "connecting", "connected", "closed", "terminated" };

/*
[SecureContext, Exposed=Window]
interface PresentationConnectionAvailableEvent : Event {
  constructor(DOMString type, PresentationConnectionAvailableEventInit eventInitDict);
  [SameObject] readonly attribute PresentationConnection connection;
};

dictionary PresentationConnectionAvailableEventInit : EventInit {
  required PresentationConnection connection;
};
*/
export class PresentationConnectionAvailableEvent2 {
	connection: PresentationConnection2|undefined;
//	constructor(type: string, eventInitDict: PresentationConnectionAvailableEventInit) {
//	}
}



enum PresentationConnectionCloseReason2 { "error", "closed", "wentaway" };

/*
[SecureContext, Exposed=Window]
interface PresentationConnectionCloseEvent : Event {
  constructor(DOMString type, PresentationConnectionCloseEventInit eventInitDict);
  readonly attribute PresentationConnectionCloseReason reason;
  readonly attribute DOMString message;
};

dictionary PresentationConnectionCloseEventInit : EventInit {
  required PresentationConnectionCloseReason reason;
  DOMString message = "";
};
*/

/*
[SecureContext, Exposed=Window]
interface PresentationConnectionList : EventTarget {
  readonly attribute FrozenArray<PresentationConnection> connections;
  attribute EventHandler onconnectionavailable;
};
*/
class PresentationConnectionList2 extends EventTarget {
	connections: PresentationConnection2[] = [];
	onconnectionavailable() {}
	constructor() {
		this.connections = [new PresentationConnection2("1", location.href, null)];
	}
}

export class Presentation2 {
	defaultRequest: PresentationRequest2|null;
	receiver: PresentationReceiver2|null;
	constructor() {
		this.defaultRequest = null;
		this.receiver = null;
		if (location.hash.includes("PresentationReceiver")) {
			// IS RECEIVER
			this.receiver = new PresentationReceiver2();
		}		
	}
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
window.Presentation = Presentation2;
window.PresentationRequest = PresentationRequest2;
window.PresentationConnection = PresentationConnection2;
window.PresentationReceiver = PresentationReceiver2;
window.PresentationAvailability = PresentationAvailability2;
// navigator.presentation = new Presentation2();
