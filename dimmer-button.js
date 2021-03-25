//TODO
//Add automatic area on <p bottom> when supported
//value template support
//Select mode color
import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

console.info('%c DIMMER-BUTTON %c 0.3 ','color: antiquewhite; background: #B565C6;','color: salmon; background: gray;');

class DimmerButton extends LitElement {
  
  static get properties() {
    return {
      hass: {},
      config: {}
    };
  }

  static getStubConfig() {
    return { entity: '#Required',name: '#friendly_name',mode: '#supports "brightness" or "color_temp" for light and "volume" for media_player', direction: "horizontal", bottom: "#optional text under name", hideState: "false", height: "",background: "",foreground: "",icon: "",on_icon: "",off_icon: "",on_color: "",off_color: "" }
    }

  constructor() {
    super();
    this.hold = false;
    this.dim = false;
    this.move = false;
    this.start = false;
    this.delta = 3;
    this.startY;
    this.startX;
    this.clientY;
    this.mode;
    this.iconOn;
    this.iconOff;
    this.displayState;
    this.rangeMax = 100;
    this.rangeValue = 0;
    this.maxVol;
    this.newValue = 0;
    this.longPress = null;
    this.active = '';
    this.cardWidth;
    this.vertical = false;
  }

  entityConfig(entity) {
    if(entity.entity_id.includes("light.")||entity.entity_id.includes("switch.")) {
      this.iconOn = this.config.icon ? this.config.icon : this.config.on_icon ? this.config.on_icon : entity.attributes.icon ? entity.attributes.icon : entity.entity_id.includes("light.") ? "hass:lightbulb" : "mdi:toggle-switch";
      this.iconOff = this.config.icon ? this.config.icon : this.config.off_icon ? this.config.off_icon : entity.attributes.icon ? entity.attributes.icon : entity.entity_id.includes("light.") ? "hass:lightbulb-outline" : "mdi:toggle-switch-off-outline";
      if(entity.attributes.supported_features & 1) {
        if(entity.attributes.supported_features & 2 && this.config.mode == "color_temp"){
          this.mode = "color_temp";
          this.displayState = entity.state === "on" ? ('• '+(this.newValue != 0 ? Math.round(1000000/(((entity.attributes.max_mireds-entity.attributes.min_mireds)*(this.newValue/100))+entity.attributes.min_mireds))+' K' : Math.round((1000000/(entity.attributes.color_temp)))+' K')) : '';
          this.rangeValue = entity.state === "on" ? Math.round(((entity.attributes.color_temp-entity.attributes.min_mireds)*100)/(entity.attributes.max_mireds-entity.attributes.min_mireds)) : 0;
        }else{
          this.mode = "brightness";
          this.displayState = '• '+(this.newValue != 0 ? this.newValue : (entity.state === "on" ? Math.round(entity.attributes.brightness/2.55) : 0))+'%';
          this.rangeValue = entity.state === "on" ? Math.round(entity.attributes.brightness/2.55) : 0;
        }
      }else{
        this.mode = "toggle";
        this.displayState = '';
        this.rangeMax = 1;
        this.rangeValue = entity.state === "on" ? 1 : 0;
      }
    }else if(entity.entity_id.includes("sensor.")){
      this.iconOn = this.config.icon ? this.config.icon : this.config.on_icon ? this.config.on_icon : entity.attributes.icon ? entity.attributes.icon : "mdi:eye";
      this.iconOff = this.config.icon ? this.config.icon : this.config.off_icon ? this.config.off_icon : entity.attributes.icon ? entity.attributes.icon : "mdi:eye";
      this.mode = "static";
      this.displayState = entity.attributes.unit_of_measurement ? entity.attributes.unit_of_measurement: '';
      this.rangeMax = 0;
    }else if(entity.entity_id.includes("media_player.")){
      this.iconOn = this.config.icon ? this.config.icon : this.config.on_icon ? this.config.on_icon : entity.attributes.icon ? entity.attributes.icon : "mdi:cast";
      this.iconOff = this.config.icon ? this.config.icon : this.config.off_icon ? this.config.off_icon : entity.attributes.icon ? entity.attributes.icon : "mdi:cast";
      if(entity.attributes.supported_features & 4 && this.config.mode == "volume") {
        this.mode = "volume";
        this.displayState = (entity.state === "playing" ? '• '+(this.newValue != 0 ? this.newValue : Math.round((entity.attributes.volume_level*100)))+'%' : '');
        this.maxVol = this.config.max_volume ? this.config.max_volume : 100;
        this.rangeMax = this.maxVol;
        this.rangeValue = (entity.attributes.volume_level*100);
      }else{
        this.mode = "pause";
        this.displayState = '';
        this.rangeMax = 1;
        this.rangeValue = entity.state === "on" ? 1 : 0;
      }
    }else{
      this.mode = "static";
    }
  }

  render() {
    const entity = this.config.entity;
    const hideState = this.config.hideState ? JSON.parse(this.config.hideState) : false
    const entityStates = this.hass.states[entity]
    const name = this.config.name ? this.config.name : entityStates.attributes.friendly_name;
    const onColor = this.config.on_color ? this.config.on_color : "#fdd835";
    const offColor = this.config.off_color ? this.config.off_color : "gray";
    const textOnColor = this.config.text_on_color ? this.config.text_on_color : "#fdd835";
    const textOffColor = this.config.text_off_color ? this.config.text_off_color : "gray";
    const cardHeight = this.config.height ? this.config.height : "150px";
    let bottomText = parseInt(cardHeight) >= 150 ? this.config.bottom : '';
    let background = this.config.background ? this.config.background : "var(--ha-card-background)";
    let foreground = this.config.foreground ? this.config.foreground : "var(--primary-color)";
    let fontSizeH = parseInt(cardHeight) >= 150 ? "20px" : (20-((150-parseInt(cardHeight))/25))+"px";
    let fontSizeW = this.cardWidth >= 200 ? "20px" : (20-((200-this.cardWidth)/12.5))+"px";
    let fontSize = fontSizeH < fontSizeW ? fontSizeH : fontSizeW;
    this.vertical = this.config.direction == 'vertical' ? true : false;
    this.entityConfig(entityStates);
    /* return html`
      <ha-card>
        <div class="button ${this.active}" style="
        ${this.mode == "static" && !hideState ? (entityStates.state == "on" ? "--dimmer-background:"+foreground : "--dimmer-background:"+background) : "--dimmer-background:"+background};
        --dimmer-foreground:${foreground};
        --color-on:${onColor};
        --color-off:${offColor};
        --text-color-on:${textOnColor};
        --text-color-off:${textOffColor};
        --card-height:${cardHeight};
        --font-size:${fontSize};
        --rotation:${this.vertical ? '270deg' : '0deg' };
        ${this.vertical ? "--range-width:"+cardHeight+"; --range-height:500px; --right:500px; --touch: none" : "--range-width: 100%; --range-height:100%; --right:0; --touch: pan-y;" };"
        >
          <div class="text">
            <div class="top ${entityStates.state}">
              <ha-icon class="icon" icon=${entityStates.state === "off" ? this.iconOff : this.iconOn}></ha-icon>
            </div>
            <div class="middle ${entityStates.state}" style="font-size: 0.65em; white-space: normal; color: black;">
             ${name}
          </div>
          ${bottomText ? html`<span class="bottom">${bottomText}</span>`: ''}
          </div>
          <input type="range" min="0" max="${entityStates.state !== "unavailable" ? this.rangeMax : "0" }" .value="${this.rangeValue}" 
            @pointerdown=${e => this._startCords(entity, e)}
            @pointerup=${e => this._endCords(entityStates, e)}
            @pointermove=${e => this._moveHandler(e)}
            @change=${e => this._setValue(entityStates, e)}
            @input=${e => this._displayValue(e.target.value)}
            >
        </div>
      </ha-card>
    `; */
    return html`
      <ha-card>
        <div class="button ${this.active}" style="
        ${this.mode == "static" && !hideState ? (entityStates.state == "on" ? "--dimmer-background:" + foreground : "--dimmer-background:" + background) : "--dimmer-background:" + background};
        --dimmer-foreground:${foreground};
        --color-on:${onColor};
        --color-off:${offColor};
        --text-color-on:${textOnColor};
        --text-color-off:${textOffColor};
        --card-height:${cardHeight};
        --font-size:${fontSize};
        --rotation:${this.vertical ? '270deg' : '0deg'};
        ${this.vertical ? "--range-width:" + cardHeight + "; --range-height:500px; --right:500px; --touch: none" : "--range-width: 100%; --range-height:100%; --right:0; --touch: pan-y;"};"
        >
          <div class="text top ${entityStates.state}">
            <div class="grid-container">
              <div class="iconcontainer">
                <ha-icon class="icon" icon=${entityStates.state === "off" ? this.iconOff : this.iconOn}></ha-icon>
              </div>
              <div class="name">
                ${name}
              </div>
            </div>
          </div>
          <input type="range" min="0" max="${entityStates.state !== "unavailable" ? this.rangeMax : "0"}" .value="${this.rangeValue}" 
            @pointerdown=${e => this._startCords(entity, e)}
            @pointerup=${e => this._endCords(entityStates, e)}
            @pointermove=${e => this._moveHandler(e)}
            @change=${e => this._setValue(entityStates, e)}
            @input=${e => this._displayValue(e.target.value)}
            >
        </div>
      </ha-card>
    `;
  }

  _moveHandler(e) {
    let diffX = Math.abs(this.startX-e.pageX);
    let diffY = Math.abs(this.startY-e.pageY);
    let posDelta = 6;
    if(diffX > posDelta || diffY > posDelta){
      if(this.start) {
        this.move = true;
      }
      clearTimeout(this.longPress);
    };
  }

  _displayValue(e) {
    if(this.move){
      this.newValue = parseInt(e);
      this.requestUpdate();
    }
  }

  _startCords(entity, e) {
      this.startX = e.pageX;
      this.startY = e.pageY;
      this.clientY = e.clientY;
      this.start = true;
      this.active = "active";
      let target = e.target.parentElement;
      this.longPress = setTimeout(() => this._moreInfo('hass-more-info', { entityId: this.config.entity }, target), 600);
    }

  _endCords(entity, e) {
    clearTimeout(this.longPress);
    let diffX = Math.abs(e.pageX - this.startX);
    let diffY = Math.abs(e.pageY - this.startY);
    let scrollY = Math.abs(e.clientY - this.clientY);
    this.move = false;
    this.start = false;
    this.active = '';
    if(this.hold){
      this.hold = false;
      return false;
    };
    if((diffX < this.delta && diffY < this.delta)&&(e.button == 0 || e.button == undefined)){
        this.dim = false;
        this._toggle(entity);
    }else{
      this.dim = true;
    };
    if(scrollY > 50 && !this.vertical){
      this.dim = false;
    }
  }

  _moreInfo(entity, detail, e){
    navigator.vibrate(100);
    let flash = document.createElement("span");
    flash.classList.add("effect");
    const old = e.getElementsByClassName("effect")[0];
    if (old) {
      old.remove();
    }
    e.appendChild(flash);
    this.hold = true;
    event = new Event(entity, {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    event.detail = detail || {};
    this.shadowRoot.dispatchEvent(event);
    return event;
  }

  _toggle(entity){
    switch(this.mode){
      case "color_temp":
      case "brightness":
      case "toggle":
        this.hass.callService("homeassistant", "toggle", {
          entity_id: entity.entity_id    
        });
        break;
      case "volume":
      case "pause":
        this.hass.callService("media_player", "media_play_pause", {
          entity_id: entity.entity_id    
        });
        break;
      }
    }

  _setValue(entity, e) {
    let value = e.target.value;
    let num = 0;
    if(this.dim){
      switch(this.mode){
        case "brightness":
          this.hass.callService("homeassistant", "turn_on", {
              entity_id: entity.entity_id,
              brightness: value * 2.55
          });
          break;
        case "color_temp":
          num = Math.round(((entity.attributes.max_mireds-entity.attributes.min_mireds)*(value/100))+entity.attributes.min_mireds);
          this.hass.callService("light", "turn_on", {
              entity_id: entity.entity_id,
              color_temp: num
          });
          break;
        case "volume":
          num = this.maxVol>value ? (value/100) : (this.maxVol/100);
          this.hass.callService("media_player", "volume_set", {
            entity_id: entity.entity_id,    
            volume_level: num
          });
          break;
        case "pause":
        case "toggle":
          this._toggle(entity);
          break;
        default:
      }
    }else{
      e.target.value = this.rangeValue;
      this.newValue = 0;
      this.dim = false;
      this.requestUpdate();
      return false;
    }
    this.dim = false;
  }
  
  updated(changedProperties) {
    this.cardWidth = this.getBoundingClientRect().width;
    if(!this.move){
      this.newValue = 0;
    }
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define an entity");
    }
    this.config = config;
  }

  getCardSize() {
    const cardSize = this.config.height ? Math.round(parseInt(this.config.height)/50) : 3;
    return cardSize;
  }
  
  static get styles() {
    return css`
        ha-card{
          background: none;
        }

        .grid-container {
          display: grid;
          align-items: center;
          text-align: center;
          grid-template-columns: 1fr;
          grid-template-rows: 4fr 1fr;
          gap: 8px 0px;
        }

        .iconcontainer {
          grid-area: 1 / 1 / 3 / 2;
        }
        .icon {
          --mdc-icon-size: 80%;
          pointer-events: none;
        }

        .name{
          grid-area: 2 / 1 / 3 / 2;
          overflow: hidden;
          font-family: Roboto, Noto, sans-serif;
          font-size: var(--font-size);
        }

        .text{
          overflow: hidden;
          display: flex;
          flex-flow: column wrap;
          padding-left: 6%;
          height: 100%;
          width: 94%;
          pointer-events: none;
        }
        span{
          z-index: 1;
          pointer-events: none;
          text-transform: capitalize;
          margin: 0;
        }
        span.off, span.paused, span.unavailable {
          color: var(--color-off);
        }
        span.on, span.playing {
          color: var(--color-on);
        }

        .status {
          display: none;
        }

        .top {
          font-size: var(--font-size);
        }

        .middle {
          font-size: var(--font-size);
          font-weight: var(--paper-font-title_-_font-weight);
          color: rgb(62, 62, 62);
          font-family: Roboto, Noto, sans-serif;
        }

        .middle.off, .middle.paused, .middle.unavailable {
          color: var(--text-color-off) !important;
        }
        .middle.on, .middle.playing {
          color: var(--text-color-on) !important;
        }

        .bottom {
          font-size: var(--paper-font-body1_-_font-size);
          font-weight: var(--paper-font-body1_-_font-weight);
          max-height: 40px;
          padding-left: 1%;
          padding-right: 10%;
          white-space: nowrap;
        }

        .button {
          height: var(--card-height);
          width: 100%;
          position: relative;
          background: var(--dimmer-background);
          background-size: cover;
          border-radius: var(--ha-card-border-radius);
          touch-action: var(--touch);
          overflow: hidden;
        }

        .button input[type="range"] {
          border-radius: var(--ha-card-border-radius);
          margin: 0;
          overflow: hidden;
          -webkit-appearance: none;
          background: none;
          position: absolute;
          width: var(--range-width);
          height: var(--range-height);
          top: 0;
          right: var(--right);
          -webkit-transform:rotate(var(--rotation));
          -moz-transform:rotate(var(--rotation));
          -o-transform:rotate(var(--rotation));
          -ms-transform:rotate(var(--rotation));
          transform:rotate(var(--rotation));
          transform-origin: top right;
        }

        .button input[type="range"]::-webkit-slider-runnable-track {
          height: 100px;
          -webkit-appearance: none;
        }

        .button input[type="range"]::-webkit-slider-thumb {
          width: 0;
          -webkit-appearance: none;
          box-shadow: -9999px 0 0 9999px var(--dimmer-foreground);
        }

        .button input[type="range"]::-moz-range-progress {
          height: 100%;
          background: var(--dimmer-foreground);
        }

        .button input[type="range"]::-moz-range-thumb{
          width: 0;
          border: 0;
        }

        .button input[type='range']:focus {
          outline: none;
        }

        .button input[type="range"]::-webkit-slider-thumb:hover {
          cursor: pointer;
        }

        .button input[type="range"]:hover {
          cursor: pointer;
        }

        .active{
          -webkit-transform: scaleX(0.97) scaleY(0.95);
          -ms-transform: scaleX(0.97) scaleY(0.95);
          transform: scaleX(0.97) scaleY(0.95);
          transition:all 0.3s ease-in;
        }

        span.effect {
          position: absolute;
          opacity: 0;
          animation: ripple 200ms ease-in;
          background-color: rgba(255, 255, 255, 0.7);
          height: 100%;
          width: 100%;
          left: 0;
          top: 0;
          border-radius: var(--ha-card-border-radius);
          pointer-events: none;
        }

        @keyframes ripple {
          to {
            opacity: 1;
          }
        }
    `;
  }  
  
}

customElements.define('dimmer-button', DimmerButton);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "dimmer-button",
  name: "Dimmer Button",
  description: "Dimmable buttons in the style of Android 11’s quick access device controls"
});
