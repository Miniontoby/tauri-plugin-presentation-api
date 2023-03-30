<script lang="ts">
	let connection: PresentationConnection|undefined;
	let presentation: PresentationRequest|undefined;
	let response = '';

	function updateResponse(returnValue) {
		response += `[${new Date().toLocaleTimeString()}] ` + (typeof returnValue === 'string' ? returnValue : JSON.stringify(returnValue)) + '<br>'
	}
	function setConnection(returnValue) {
		connection = returnValue;
		updateResponse('> Connected to ' + connection.url + ', id: ' + connection.id);
	}
	function _start() {
		presentation?.start().then(setConnection).catch(updateResponse);
	}
	function _close() {
		updateResponse('Closing connection...');
		connection?.close();
	}
	function _terminate() {
		updateResponse('Terminating connection...');
		connection?.terminate();
	}
	function _send() {
		const message = document.querySelector('#message').value.trim();
		document.querySelector('#message').value = "";
		const lang = document.body.lang || 'en-US';

		updateResponse('Sending "' + message + '"...');
		connection?.send(JSON.stringify({message, lang}));
	};

	if (location.hash.includes("PresentationReceiver")) {
		let connectionIdx = 0;
		let messageIdx = 0;

		function addConnection(connection) {
		  connection.connectionId = ++connectionIdx;
		  addMessage('New connection #' + connectionIdx);

		  connection.addEventListener("message",function(event) {
		    messageIdx++;
		    const data = JSON.parse(event.data);
		    const logString = 'Message ' + messageIdx + ' from connection #' +
		        connection.connectionId + ': ' + data.message;
		    addMessage(logString, data.lang);
		    maybeSetFruit(data.message);
		    connection.send('Received message ' + messageIdx);
		  });

		  connection.addEventListener("close", function(event) {
		    addMessage('Connection #' + connection.connectionId + ' closed, reason = ' +
		        event.reason + ', message = ' + event.message);
		  });
		};

		/* Utils */

		const fruitEmoji = {
		  'grapes':      '\u{1F347}',
		  'watermelon':  '\u{1F349}',
		  'melon':       '\u{1F348}',
		  'tangerine':   '\u{1F34A}',
		  'lemon':       '\u{1F34B}',
		  'banana':      '\u{1F34C}',
		  'pineapple':   '\u{1F34D}',
		  'green apple': '\u{1F35F}',
		  'apple':       '\u{1F34E}',
		  'pear':        '\u{1F350}',
		  'peach':       '\u{1F351}',
		  'cherries':    '\u{1F352}',
		  'strawberry':  '\u{1F353}'
		};

		function addMessage(content, language) {
		  const listItem = document.createElement("li");
		  if (language) listItem.lang = language;
		  listItem.textContent = content;
		  document.querySelector("#message-list").appendChild(listItem);
		};

		function maybeSetFruit(message) {
		  const fruit = message.toLowerCase();
		  if (fruit in fruitEmoji) document.querySelector('#main').textContent = fruitEmoji[fruit];
		};

		document.addEventListener('DOMContentLoaded', function() {
		  document.querySelector("#receiver").hidden = false;
		  document.querySelector("#presentator").hidden = true;
		  const presentationthing = new Presentation();
		  //navigator.presentation = presentationthing;
		  if (navigator.presentation.receiver) {
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
	} else {
		presentation = new PresentationRequest("");
		//navigator.presentation.defaultRequest = presentation;
		globalThis.presentation = presentation;

presentation.addEventListener('connectionavailable', function(event) {
  connection = event.connection;
  connection.addEventListener('close', function() {
    updateResponse('> Connection closed.');
  });
  connection.addEventListener('terminate', function() {
    updateResponse('> Connection terminated.');
  });
  connection.addEventListener('message', function(event) {
    updateResponse('> ' + event.data);
  });
});

/* Availability monitoring */

presentation.getAvailability()
.then(availability => {
  updateResponse('Available presentation displays: ' + availability.value);
  availability.onchange = function() {
    updateResponse('> Available presentation displays: ' + availability.value);
  };
})
.catch(error => {
  updateResponse('Presentation availability not supported, ' + error.name + ': ' +
      error.message);
});
	}
</script>

<main class="container">
<div id="presentator">
  <h1>Welcome to Tauri!</h1>

  <div class="row">
    <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
      <img src="/vite.svg" class="logo vite" alt="Vite Logo" />
    </a>
    <a href="https://tauri.app" target="_blank" rel="noreferrer">
      <img src="/tauri.svg" class="logo tauri" alt="Tauri Logo" />
    </a>
    <a href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img src="/svelte.svg" class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>

  <p>
    Click on the Tauri, Vite, and Svelte logos to learn more.
  </p>

  <div>
<button on:click="{_start}">Start</button><button on:click="{_close}">Close</button><button on:click="{_terminate}">Terminate</button><br>
<p>
  <input id="message" type="text" placeholder="Enter a message..." list="fruits">
  <datalist id="fruits">
    <option value="grapes">
    </option><option value="watermelon">
    </option><option value="melon">
    </option><option value="tangerine">
    </option><option value="lemon">
    </option><option value="banana">
    </option><option value="pineapple">
    </option><option value="green apple">
    </option><option value="apple">
    </option><option value="pear">
    </option><option value="peach">
    </option><option value="cherries">
    </option><option value="strawberry">
  </option></datalist>
  <button on:click="{_send}">Send</button>
</p>
	<div>{@html response}</div>
</div>
</div>
<div id="receiver" hidden>
    <div id="main">Hello World!</div>
    <ul id="message-list">
    </ul>
</div>
</main>

<style>
  .logo.vite:hover {
    filter: drop-shadow(0 0 2em #747bff);
  }

  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00);
  }

  html, body {
     height: 100%;
     margin: 0;
     font-family: sans-serif;
     background: radial-gradient(ellipse at center, #333333 0%,#000000 100%);
     color: #fff;
  }
  #main {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    font-size: 54px;
  }
</style>