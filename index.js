
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

function Pick_Up() {
    sendToRobot("G 3\n");
}

function Put_Down() {
    sendToRobot("G 4\n");
}
// Formatting the movment command: M\n<left_motor_state> <right_motor_state>\n
// motor_state is a spectrum where: 0- full power back; 250- stop; 500 - full power forward. You can use any value from 0-500 range foe each motor.
function Forward() {                
    sendToRobot("M\n400 400\n");
}

function Stop() {
    sendToRobot("M\n250 250\n");
}

function Back() {
    sendToRobot("M\n0 0\n");
}

function Revolve_Left() {
    sendToRobot("M\n0 500\n");
}

function Revolve_Right(){
    sendToRobot("M\n500 0\n");
}

function LED_ON(R,G,B){                                                                         //sending sudocode to the robot
    sendToRobot("H W1 15 W2 2 \nBEGIN\n1 A 12 0 2 3\n2 C 0\n3 C "+R+" "+G+" "+B+"\n\nRUN_O\n");
}

function LED_OFF() {
    LED_ON(0, 0, 0);
}
var button1 = document.getElementById("connect");
var button2 = document.getElementById("open");
var button3 = document.getElementById("close");
var button4 = document.getElementById("pick_up");
var button5 = document.getElementById("put_down");
var button6 = document.getElementById("forward");
var button7 = document.getElementById("back");
var button8 = document.getElementById("revolve_l");
var button9 = document.getElementById("revolve_r");
var button10 = document.getElementById("LED_R");
var button11 = document.getElementById("LED_G");
var button12 = document.getElementById("LED_B");
var button13 = document.getElementById("LED_OFF");
var button14 = document.getElementById("stop");

button1.addEventListener('click', (e) => BTConnect());
button2.addEventListener('click', (e) => Release());
button3.addEventListener('click', (e) => Grab());
button4.addEventListener('click', (e) => Pick_Up());
button5.addEventListener('click', (e) => Put_Down());
button6.addEventListener('click', (e) => Forward());
button7.addEventListener('click', (e) => Back());
button8.addEventListener('click', (e) => Revolve_Left());
button9.addEventListener('click', (e) => Revolve_Right());
button10.addEventListener('click', (e) => LED_ON(255,0,0));
button11.addEventListener('click', (e) => LED_ON(0,255,0));
button12.addEventListener('click', (e) => LED_ON(0,0,255));
button13.addEventListener('click', (e) => LED_OFF());
button14.addEventListener('click', (e) => Stop());

console.log("START")



