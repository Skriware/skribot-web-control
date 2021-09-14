var myESP32 = 'd804b643-6ce7-4e81-9f8a-ce0f699085eb'

var otaServiceUuid = 'c8659210-af91-4ad3-a995-a58d6fd26145'
var versionCharacteristicUuid = 'c8659212-af91-4ad3-a995-a58d6fd26145'
var fileCharacteristicUuid = 'c8659211-af91-4ad3-a995-a58d6fd26145'

var UARTService       = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
var CHARACTERISTIC_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'
var CHARACTERISTIC_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'

let esp32Device = null;
let esp32Service = null;
let readyFlagCharacteristic = null;
let dataToSend = null;
let updateData = null;

var totalSize;
var remaining;
var amountToWrite;
var currentPosition;

var currentHardwareVersion = "N/A";
var softwareVersion = "N/A";
var latestCompatibleSoftware = "N/A";

const characteristicSize = 512;

/* BTConnect
 * Brings up the bluetooth connection window and filters for the esp32
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

/* CheckVersion()
 * Grab most current version from Github and Server, if they don't match, prompt the user for firmware update
 */
function CheckVersion(){
  if(!esp32Service)
  {
    return;
  }
  return esp32Service.getCharacteristic(versionCharacteristicUuid)
  .then(characteristic => characteristic.readValue())
  .then(value => {
    currentHardwareVersion = 'v' + value.getUint8(0) + '.' + value.getUint8(1);
    softwareVersion = 'v' + value.getUint8(2) + '.' + value.getUint8(3) + '.' + value.getUint8(4);
    document.getElementById('hw_version').innerHTML = "Hardware: " + currentHardwareVersion;
    document.getElementById('sw_version').innerHTML = "Software: " + softwareVersion;
  })
  //Grab our version numbers from Github
  .then(_ => fetch('https://raw.githubusercontent.com/sparkfun/ESP32_OTA_BLE_React_WebApp_Demo/master/GithubRepo/version.json'))
  .then(function (response) {
    // The API call was successful!
    return response.json();
  })
  .then(function (data) {
    // JSON should be formatted so that 0'th entry is the newest version
    if (latestCompatibleSoftware === softwareVersion)
    {
      //Software is updated, do nothing.
    }
    else {
      var softwareVersionCount = 0;
      latestCompatibleSoftware = data.firmware[softwareVersionCount]['software'];
      versionFindLoop:
        while (latestCompatibleSoftware !== undefined) {
          var compatibleHardwareVersion = "N/A"
          var hardwareVersionCount = 0;
          while (compatibleHardwareVersion !== undefined) {
            compatibleHardwareVersion = data.firmware[softwareVersionCount]['hardware'][hardwareVersionCount++];
            if (compatibleHardwareVersion === currentHardwareVersion)
            {
              latestCompatibleSoftware = data.firmware[softwareVersionCount]['software'];
              if (latestCompatibleSoftware !== softwareVersion)
              {
                console.log(latestCompatibleSoftware);
                PromptUserForUpdate();
              }
              break versionFindLoop;
            }
          }
          softwareVersionCount++;
        }
      }
  })
  .catch(error => { console.log(error); });
}

/* SendFileOverBluetooth(data)
 * Figures out how large our update binary is, attaches an eventListener to our dataCharacteristic so the Server can tell us when it has finished writing the data to memory
 * Calls SendBufferedData(), which begins a loop of write, wait for ready flag, write, wait for ready flag...
 */
function SendFileOverBluetooth() {
  if(!esp32Service)
  {
    console.log("No esp32 Service");
    return;
  }
  console.warn('SENDING OVER BLE '+updateData.byteLength);
  totalSize = updateData.byteLength;
  remaining = totalSize;
  amountToWrite = 0;
  currentPosition = 0;
  esp32Service.getCharacteristic(fileCharacteristicUuid)
  .then(characteristic => {
    readyFlagCharacteristic = characteristic;
    return characteristic.startNotifications()
    .then(_ => {
      readyFlagCharacteristic.addEventListener('characteristicvaluechanged', SendBufferedData)
    });
  })
  .catch(error => { 
    console.log(error); 
  });
  SendBufferedData();
}


/* SendBufferedData()
 * An ISR attached to the same characteristic that it writes to, this function slices data into characteristic sized chunks and sends them to the Server
 */
function SendBufferedData() {
  if (remaining > 0) {
    if (remaining >= characteristicSize) {
      amountToWrite = characteristicSize
    }
    else {
      amountToWrite = remaining;
    }
    dataToSend = updateData.slice(currentPosition, currentPosition + amountToWrite);
    currentPosition += amountToWrite;
    remaining -= amountToWrite;
    console.log("remaining: " + remaining);
    esp32Service.getCharacteristic(fileCharacteristicUuid)
      .then(characteristic => RecursiveSend(characteristic, dataToSend))
      .then(_ => {
        return document.getElementById('completion').innerHTML = (100 * (currentPosition/totalSize)).toPrecision(3) + '%';
      })
      .catch(error => { 
        console.log(error); 
      });
  }
}


/* resursiveSend()
 * Returns a promise to itself to ensure data was sent and the promise is resolved.
 */
function RecursiveSend(characteristic, data) {
  return characteristic.writeValue(data)
  .catch(error => {
    return RecursiveSend(characteristic, data);
  });
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
    console.log("DUA")
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



