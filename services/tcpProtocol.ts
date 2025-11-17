// TCP Protocol Implementation - COMMENTED OUT
// Using real MQTT instead of custom TCP protocol

/*
import TCPSocket from 'react-native-tcp-socket';
import { Buffer } from 'buffer';
// import { EventEmitter } from 'events';
import EventEmitter from 'eventemitter3';
// Topic table mapping
export const topics: Record<string, number> = {
  'relay/1': 0x0001,
  'sensor/temp': 0x0002,
  'client/status': 0x0003,
  'alert/buzzer': 0x0004,
  'office/ac/control': 0x0005,
  'tcp/test': 0x0006,
};

export type ProtocolMessageType =
  | 'CONNECT'
  | 'SUBSCRIBE'
  | 'PUBLISH'
  | 'ACK'
  | 'PING'
  | 'PONG'
  | 'DISCONNECT'
  | 'WILL';

export interface ProtocolEvent {
  type: ProtocolMessageType;
  data: any;
}

export class TcpProtocolClient {
  private socket: any = null;
  private emitter = new EventEmitter();
  private buffer: Buffer = Buffer.alloc(0);
  private msgId = 0x10;
  private connected = false;

  constructor() {}

  connect(host: string, port: number, clientId: string) {
    if (this.socket) {
      this.disconnect();
    }
    this.socket = TCPSocket.createConnection({ host, port }, () => {
      this.connected = true;
      if (this.socket.setNoDelay) this.socket.setNoDelay(true);
      this._sendConnect(clientId);
    });
    this.socket.on('data', (data: Buffer) => this._onData(data));
    this.socket.on('error', (err: Error) => {
      this.emitter.emit('error', err);
      this.disconnect();
    });
    this.socket.on('close', () => {
      this.connected = false;
      this.emitter.emit('close');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
      this.connected = false;
    }
  }

  subscribe(topicId: number) {
    const buf = Buffer.alloc(5);
    buf.writeUInt16BE(3, 0); // length
    buf.writeUInt8(0x01, 2); // type
    buf.writeUInt16BE(topicId, 3);
    this._sendRaw(buf);
  }

  publish(topicId: number, payload: string, msgId?: number, flags = 0xc0) {
    // Ensure payload ends with a newline for message framing
    const payloadWithNewline = payload.endsWith('\n')
      ? payload
      : payload + '\n';
    const payloadBuf = Buffer.from(payloadWithNewline, 'utf8');
    const len = 1 + 2 + 2 + payloadBuf.length; // type + topicId + msgId + payload
    const buf = Buffer.alloc(2 + len);
    buf.writeUInt16BE(len, 0);
    buf.writeUInt8(0x02 | flags, 2); // type|flags
    buf.writeUInt16BE(topicId, 3);
    buf.writeUInt16BE(msgId ?? this._nextMsgId(), 5);
    payloadBuf.copy(buf, 7);
    this._sendRaw(buf);
  }

  sendPing() {
    const buf = Buffer.alloc(3);
    buf.writeUInt16BE(1, 0);
    buf.writeUInt8(0x04, 2);
    this._sendRaw(buf);
  }

  sendDisconnect() {
    const buf = Buffer.alloc(3);
    buf.writeUInt16BE(1, 0);
    buf.writeUInt8(0x06, 2);
    this._sendRaw(buf);
  }

  sendWill(topicId: number, payload: string) {
    const payloadBuf = Buffer.from(payload, 'utf8');
    const len = 1 + 2 + 1 + payloadBuf.length;
    const buf = Buffer.alloc(2 + len);
    buf.writeUInt16BE(len, 0);
    buf.writeUInt8(0x07, 2);
    buf.writeUInt16BE(topicId, 3);
    buf.writeUInt8(payloadBuf.length, 5);
    payloadBuf.copy(buf, 6);
    this._sendRaw(buf);
  }

  onMessage(cb: (event: ProtocolEvent) => void) {
    this.emitter.on('message', cb);
  }

  private _sendConnect(clientId: string) {
    const clientIdBuf = Buffer.from(clientId, 'utf8');
    const len = 1 + 1 + clientIdBuf.length;
    const buf = Buffer.alloc(2 + len);
    buf.writeUInt16BE(len, 0);
    buf.writeUInt8(0x00, 2);
    buf.writeUInt8(clientIdBuf.length, 3);
    clientIdBuf.copy(buf, 4);
    this._sendRaw(buf);
  }

  private _sendRaw(buf: Buffer) {
    if (this.socket && this.connected) {
      this.socket.write(buf);
    }
  }

  private _onData(data: Buffer) {
    this.buffer = Buffer.concat([this.buffer, Buffer.from(data)]);
    while (this.buffer.length >= 2) {
      const len = this.buffer.readUInt16BE(0);
      if (this.buffer.length < 2 + len) break;
      const msg = this.buffer.slice(2, 2 + len);
      this._parseMessage(msg);
      this.buffer = this.buffer.slice(2 + len);
    }
  }

  private _parseMessage(msg: Buffer) {
    const type = msg.readUInt8(0);
    switch (type) {
      case 0x00: // CONNECT
        this.emitter.emit('message', { type: 'CONNECT', data: msg.slice(1) });
        break;
      case 0x01: // SUBSCRIBE
        this.emitter.emit('message', { type: 'SUBSCRIBE', data: msg.slice(1) });
        break;
      case 0x02: // PUBLISH
        this.emitter.emit('message', { type: 'PUBLISH', data: msg.slice(1) });
        break;
      case 0x03: // ACK
        this.emitter.emit('message', { type: 'ACK', data: msg.slice(1) });
        break;
      case 0x04: // PING
        this.emitter.emit('message', { type: 'PING', data: null });
        break;
      case 0x05: // PONG
        this.emitter.emit('message', { type: 'PONG', data: null });
        break;
      case 0x06: // DISCONNECT
        this.emitter.emit('message', { type: 'DISCONNECT', data: null });
        break;
      case 0x07: // WILL
        this.emitter.emit('message', { type: 'WILL', data: msg.slice(1) });
        break;
      default:
        this.emitter.emit('message', { type: 'UNKNOWN', data: msg });
    }
  }

  private _nextMsgId() {
    this.msgId = (this.msgId + 1) & 0xffff;
    if (this.msgId === 0) this.msgId = 1;
    return this.msgId;
  }
}
*/

// Real MQTT Implementation
import Paho from 'paho-mqtt';

export interface MqttConnection {
  id: string;
  host: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
  status: 'disconnected' | 'connecting' | 'connected';
  messages: string[];
  topic: string;
  message: string;
}

export class MqttClient {
  private client: any = null;
  private connected = false;
  private connection: MqttConnection;

  constructor(connection: MqttConnection) {
    this.connection = connection;
  }

  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.connection.status = 'connecting';

        this.client = new Paho.Client(
          this.connection.host,
          this.connection.port,
          this.connection.clientId
        );

        const options = {
          onSuccess: () => {
            this.connected = true;
            this.connection.status = 'connected';
            this.connection.messages.push(
              `Connected to ${this.connection.host}:${this.connection.port}`
            );
            resolve(true);
          },
          onFailure: (err: any) => {
            this.connected = false;
            this.connection.status = 'disconnected';
            this.connection.messages.push(
              `Connection failed: ${err.errorMessage || 'Unknown error'}`
            );
            reject(err);
          },
          userName: this.connection.username,
          password: this.connection.password,
          useSSL: false, // TODO: Make this configurable based on broker settings
        };

        this.client.connect(options);

        // Set up message listener
        this.client.onMessageArrived = (message: any) => {
          try {
            const payload = JSON.parse(message.payloadString);
            this.connection.messages.push(
              `[${message.destinationName}] Received: ${JSON.stringify(
                payload
              )}`
            );
          } catch (error) {
            this.connection.messages.push(
              `[${message.destinationName}] Received: ${message.payloadString}`
            );
          }
        };

        this.client.onConnectionLost = (responseObject: any) => {
          if (responseObject.errorCode !== 0) {
            this.connected = false;
            this.connection.status = 'disconnected';
            this.connection.messages.push('Connection lost');
          }
        };
      } catch (error) {
        this.connection.status = 'disconnected';
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
      this.connected = false;
      this.connection.status = 'disconnected';
      this.connection.messages.push('Disconnected from server');
    }
  }

  publish(topic: string, message: string): boolean {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      const mqttMessage = new Paho.Message(message);
      mqttMessage.destinationName = topic;
      mqttMessage.qos = 1;
      mqttMessage.retained = false;

      this.client.send(mqttMessage);

      this.connection.messages.push(`[${topic}] Sending: ${message}`);
      this.connection.messages.push(`[${topic}] Sent successfully`);

      return true;
    } catch (error) {
      this.connection.messages.push(`Error sending message: ${error}`);
      return false;
    }
  }

  subscribe(topic: string): boolean {
    if (!this.client || !this.connected) {
      return false;
    }

    try {
      this.client.subscribe(topic);
      this.connection.messages.push(`Subscribed to topic: ${topic}`);
      return true;
    } catch (error) {
      this.connection.messages.push(`Error subscribing to topic: ${error}`);
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
