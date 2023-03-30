// import "./modal.css";
import stylesheet from "./modal.css"; // assert { type: "css" };
document.adoptedStyleSheets = [stylesheet];
/*
import styles from "./modal.css";
(() => {
	const style = document.createElement('style');
	style.textContent = styles;
	document.head.appendChild(style);
})();
*/

// https://codeshack.io/interactive-modals-javascript/
export class Modal {
    constructor(options) {
        let defaults = { element: null, effect: 'zoom', state: 'closed', size: 'medium', content: null, footer: null, header: null, title: null };
        this.options = Object.assign(defaults, options);
        if (this.options.element == null) {
            this.options.element = document.createElement('div');
            this.options.element.classList.add('modal');
            this.options.element.innerHTML = `
                <div class="container">
                    <div class="header">
                        <button class="close">&times;</button> 
                    </div>
                    <div class="content"></div>
                    <div class="footer">
                        <button class="close">Close</button>
                    </div>
                </div>                        
            `;
            document.body.appendChild(this.options.element);
        }
        this.options.element.querySelector('.container').classList.remove('zoom', 'slide');
        this.options.element.querySelector('.container').classList.add(this.options.effect);
        if (this.options.header != null) this.header = this.options.header;
        if (this.options.content != null) this.content = this.options.content;
        if (this.options.footer != null) this.footer = this.options.footer;
        if (this.options.title != null) this.title = this.options.title;
        this.size = this.options.size;
        this._eventHandlers();
    }

    open() {
        this.options.state = 'open';
        this.options.element.style.display = 'flex';
        this.options.element.getBoundingClientRect();
        this.options.element.classList.add('open');
        if (this.options.onOpen) this.options.onOpen(this);
    }

    close() {
        this.options.state = 'closed';
        this.options.element.classList.remove('open');
        this.options.element.style.display = 'none';
        if (this.options.onClose) this.options.onClose(this);
    }

    get state() {
        return this.options.state;
    }

    get effect() {
        return this.options.effect;
    }

    set effect(value) {
        this.options.effect = value;
        this.options.element.querySelector('.container').classList.remove('zoom', 'slide');
        this.options.element.querySelector('.container').classList.add(value);
    }

    get size() {
        return this.options.size;
    }

    set size(value) {
        this.options.size = value;
        this.options.element.classList.remove('small', 'large', 'medium', 'full');
        this.options.element.classList.add(value);
    }

    get content() {
        return this.options.element.querySelector('.content').innerHTML;
    }

    get contentElement() {
        return this.options.element.querySelector('.content');
    }

    set content(value) {
        if (!value) {
            this.options.element.querySelector('.content').remove();
        } else {
            if (!this.options.element.querySelector('.content')) this.options.element.querySelector('.container').insertAdjacentHTML('afterbegin', `<div class="content"></div>`);
            this.options.element.querySelector('.content').innerHTML = value;
        }
    }

    get header() {
        return this.options.element.querySelector('.heading').innerHTML;
    }

    get headerElement() {
        return this.options.element.querySelector('.header');
    }

    set header(value) {
        if (!value) {
            this.options.element.querySelector('.header').remove();
        } else {
            if (!this.options.element.querySelector('.header')) this.options.element.querySelector('.container').insertAdjacentHTML('afterbegin', `<div class="header"></div>`);
            this.options.element.querySelector('.header').innerHTML = value;
        }
    }

    get title() {
        return this.options.element.querySelector('.header .title') ? this.options.element.querySelector('.header .title').innerHTML : null;
    }

    set title(value) {
        if (!this.options.element.querySelector('.header .title')) this.options.element.querySelector('.header').insertAdjacentHTML('afterbegin', `<h1 class="title"></h1>`);
        this.options.element.querySelector('.header .title').innerHTML = value;
    }

    get footer() {
        return this.options.element.querySelector('.footer').innerHTML;
    }

    get footerElement() {
        return this.options.element.querySelector('.footer');
    }

    set footer(value) {
        if (!value) {
            this.options.element.querySelector('.footer').remove();
        } else {
            if (!this.options.element.querySelector('.footer')) this.options.element.querySelector('.container').insertAdjacentHTML('beforeend', `<div class="footer"></div>`);
            this.options.element.querySelector('.footer').innerHTML = value;
        }
    }

    _eventHandlers() {
        this.options.element.querySelectorAll('.close').forEach(element => {
            element.onclick = event => {
                event.preventDefault();
                this.close();
            };
        });
        this.options.element.onclick = event => {
            if (event.target.classList.value == this.options.element.classList.value) {
                event.preventDefault();
                this.close();
            }
        };
        document.addEventListener("keydown", (e) => {
            if (this.options.element.classList.contains('open') && e.key === 'Escape') this.close();
        });
    }

    static initElements() {
        document.querySelectorAll('[data-modal]').forEach(element => {
            element.addEventListener('click', event => {
                event.preventDefault();
                let modalElement = document.querySelector(element.dataset.modal);
                let modal = new Modal({ element: modalElement });
                for (let data in modalElement.dataset) {
                    if (modal[data]) modal[data] = modalElement.dataset[data];
                }
                modal.open();
            });
        });
    }

    static confirm(value, success, cancel) {
        let modal = new Modal({ content: value, header: '', footer: '<button class="success">OK</button><button class="cancel alt">Cancel</button>' });
        modal.footerElement.querySelector('.success').onclick = event => {
            event.preventDefault();
            if (success) success();
            modal.close();
        };
        modal.footerElement.querySelector('.cancel').onclick = event => {
            event.preventDefault();
            if (cancel) cancel();
            modal.close();
        };
        modal.open();
    }

    static alert(value, success) {
        let modal = new Modal({ content: value, header: '', footer: '<button class="success">OK</button>' });
        modal.footerElement.querySelector('.success').onclick = event => {
            event.preventDefault();
            if (success) success();
            modal.close();
        };
        modal.open();
    }

    static prompt(value, def, success, cancel) {
        let modal = new Modal({ header: '', footer: '<button class="success">OK</button><button class="cancel alt">Cancel</button>' });
        modal.content = value + `<div class="prompt-input"><input type="text" value="${def}" placeholder="Enter your text..."></div>`;
        modal.footerElement.querySelector('.success').onclick = event => {
            event.preventDefault();
            if (success) success(modal.contentElement.querySelector('.prompt-input input').value);
            modal.close();
        };
        modal.footerElement.querySelector('.cancel').onclick = event => {
            event.preventDefault();
            if (cancel) cancel(modal.contentElement.querySelector('.prompt-input input').value);
            modal.close();
        };
        modal.open();
    }
}