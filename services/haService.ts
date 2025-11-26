import {
  Auth,
  createConnection,
  subscribeEntities,
  createLongLivedTokenAuth,
  Connection,
  HassEntities,
  callService,
} from 'home-assistant-js-websocket';
import { EventEmitter } from 'eventemitter3';



class HAService extends EventEmitter {
  private connection: Connection | null = null;
  private entities: HassEntities = {};

  constructor() {
    super();
  }

  async connect(url: string, token: string) {
    try {
      console.log(`Connecting to HA at ${url}...`);
      const auth = createLongLivedTokenAuth(url, token);
      
      this.connection = await createConnection({ auth });
      
      console.log('Connected to Home Assistant');
      this.emit('connected');

      subscribeEntities(this.connection, (entities) => {
        this.entities = entities;
        this.emit('entities_changed', entities);
      });
      
      // Handle connection loss
      this.connection.addEventListener('disconnected', () => {
        console.log('Disconnected from Home Assistant');
        this.emit('disconnected');
      });

    } catch (error) {
      console.error('Failed to connect to Home Assistant:', error);
      this.emit('error', error);
      throw error; // Re-throw to let caller handle it
    }
  }

  async disconnect() {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
      this.emit('disconnected');
    }
  }

  getEntities() {
    return this.entities;
  }

  async callService(domain: string, service: string, serviceData: object = {}) {
    if (!this.connection) {
      console.warn('Cannot call service, not connected to HA');
      return;
    }
    try {
      await callService(this.connection, domain, service, serviceData);
    } catch (error) {
      console.error('Error calling service:', error);
    }
  }

  // Helper to toggle a device
  async toggleDevice(entityId: string) {
    const domain = entityId.split('.')[0];
    await this.callService(domain, 'toggle', { entity_id: entityId });
  }
}

export const haService = new HAService();
