/**
 * Minimal Web Bluetooth API type declarations.
 * Covers only the subset used by lib/printer-store.ts.
 * Full spec: https://webbluetoothcg.github.io/web-bluetooth/
 */

interface BluetoothRemoteGATTCharacteristicProperties {
  writeWithoutResponse: boolean
  write: boolean
  notify: boolean
  read: boolean
}

type BtWriteValue = ArrayBuffer | DataView | Uint8Array | Uint8ClampedArray | Int8Array

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  properties: BluetoothRemoteGATTCharacteristicProperties
  writeValue(value: BtWriteValue): Promise<void>
  writeValueWithResponse(value: BtWriteValue): Promise<void>
  writeValueWithoutResponse(value: BtWriteValue): Promise<void>
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
}

interface BluetoothRemoteGATTService {
  getCharacteristic(
    characteristic: string | number
  ): Promise<BluetoothRemoteGATTCharacteristic>
}

interface BluetoothRemoteGATTServer {
  connected: boolean
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>
}

interface BluetoothDevice extends EventTarget {
  id: string
  name?: string
  gatt?: BluetoothRemoteGATTServer
  addEventListener(
    type: "gattserverdisconnected",
    listener: (event: Event) => void,
    options?: boolean | AddEventListenerOptions
  ): void
}

interface RequestDeviceOptions {
  filters?: Array<{
    services?: string[]
    name?: string
    namePrefix?: string
  }>
  acceptAllDevices?: boolean
  optionalServices?: string[]
}

interface Bluetooth {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>
}

interface Navigator {
  readonly bluetooth: Bluetooth
}
