# Tauri Plugin Presentation API

Adds the Web Presentation API functionality to Tauri apps.

## Install:

```
pnpm add https://github.com/Miniontoby/tauri-plugin-presentation-api
# or
npm add https://github.com/Miniontoby/tauri-plugin-presentation-api
# or
yarn add https://github.com/Miniontoby/tauri-plugin-presentation-api
```

## Usage

In your main.ts or in the file you want to use as controller and in the one you want to use as receiver, just add:
```js
import 'tauri-plugin-presentation-api';
```

## Example usage

Controller:
```js
let presentation = new PresentationRequest("RECEIVER_URL.html");
let connection;
presentation.addEventListener('connectionavailable', function(event) {
  connection = event.connection;
  connection.addEventListener('close', function() {
    console.log('Connection closed.');
  });
  connection.addEventListener('terminate', function() {
    console.log('Connection terminated.');
  });
  connection.addEventListener('message', function(event) {
    console.log(event.data);
  });

  const message = "Hello world";
  connection.send(JSON.stringify({message})); // You can send any thing
});
presentation.start();
```

Receiver:
```js
let connectionIdx = 0;
let messageIdx = 0;

function addConnection(connection) {
	connection.connectionId = ++connectionIdx;
	console.log('New connection #' + connectionIdx);
	connection.addEventListener("message",function(event) {
		messageIdx++;
		const data = JSON.parse(event.data);
		const logString = 'Message ' + messageIdx + ' from connection #' + connection.connectionId + ': ' + data.message;
		console.log(logString);
		connection.send('Received message ' + messageIdx);
	});
	connection.addEventListener("close", function(event) {
		console.log('Connection #' + connection.connectionId + ' closed, reason = ' + event.reason + ', message = ' + event.message);
	});
};
document.addEventListener('DOMContentLoaded', function() {
	const presentationthing = new Presentation();
	if (navigator.presentation.receiver) { // This doesn't yet work! So please use the `presentationthing.receiver` in this case
		navigator.presentation.receiver.connectionList.then(list => {
			list.connections.map(connection => addConnection(connection));
			list.onconnectionavailable = (event) => addConnection(event.connection);
		});
	}
	else if (presentationthing.receiver) {
		presentationthing.receiver.connectionList.then(list => {
			list.connections.map(connection => addConnection(connection));
			list.onconnectionavailable = (event) => addConnection(event.connection);
		});
	}
});
```


## Working Example App

Go to [examples/tauri-app/](https://github.com/Miniontoby/tauri-plugin-presentation-api/tree/main/examples/tauri-app/) to see an example that works.

You will have to clone this repo and run the app inside the folder `examples/tauri-app` cause else this tauri plugin isn't loaded.

You should then run in the folder: 
```sh
npm install
npm run tauri dev
```

This example's code is based on the [Presentation Receiver API Sample](https://googlechrome.github.io/samples/presentation-api/) from the googlechrome github pages.
