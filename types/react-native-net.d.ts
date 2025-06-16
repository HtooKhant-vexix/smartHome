declare module 'react-native-net' {
  export class Socket {
    connect(port: number, host: string): void;
    write(data: string, callback?: (error?: Error) => void): boolean;
    end(): void;
    destroy(): void;
    on(
      event: 'connect' | 'error' | 'close',
      listener: (...args: any[]) => void
    ): this;
  }
}
