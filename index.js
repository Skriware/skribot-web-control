
var UARTService       = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
var CHARACTERISTIC_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'
var CHARACTERISTIC_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'

let esp32Service = null;

/* BTConnect
 * Brings up the bluetooth connection window and filters for the UART Service
 */
function BTConnect() {
    console.log(esp32Service)
    navigator.bluetooth.requestDevice({
        filters: [{
            services: [UARTService]
        }], optionalServices: [UARTService]
    })
        .then(device => {
            return device.gatt.connect()
        })
        .then(server => server.getPrimaryService(UARTService))
        .then(service => {
            esp32Service = service;
        })
        .then(service => {
            return service;
        })
  .catch(error => { console.log(error); });
}

function stringToArray(bufferString) {
    let uint8Array = new TextEncoder("utf-8").encode(bufferString);
    return uint8Array;
}

function sendToRobot(input) {
    console.log(esp32Service)
    if (esp32Service != null) {
        const msg = stringToArray(input);
        return esp32Service.getCharacteristic(CHARACTERISTIC_RX)
            .then(characteristic => characteristic.writeValue(msg))
            .catch(error => { console.log(error); });
    } else {
       console.log("Robot not connected! Connect Skribot first!")
    }

}

function Grab() {
    sendToRobot("G 1\n");
}

function Release() {
    sendToRobot("G 2\n");
}

function Forward() {
    sendToRobot("M\n400 400\n");
}

function Stop() {
    sendToRobot("M\n250 250\n");
}

function Revolve() {
    sendToRobot("M\n400 100\n");
}

var button1 = document.getElementById("connect");
var button2 = document.getElementById("open");
var button3 = document.getElementById("close");
var button4 = document.getElementById("forward");
var button5 = document.getElementById("revolve");
var button6 = document.getElementById("stop");

button1.addEventListener('click', (e) => BTConnect());
button2.addEventListener('click', (e) => Release());
button3.addEventListener('click', (e) => Grab());
button4.addEventListener('click', (e) => Forward());
button5.addEventListener('click', (e) => Revolve());
button6.addEventListener('click', (e) => Stop());

console.log("START")



