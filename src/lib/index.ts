// place files you want to import through the `$lib` alias in this folder.

const ID = 57;
const PLUGIN_NAME = "Kai AI Plugin";
const PLUGIN_DEVELOPER = "Zenny";

export class VtubeSocket {
  private socket: WebSocket;
  private open = false;
  private authenticated = false;
  private vtubeURL = "ws://localhost:8001";
  private listeners: any = [];
  private payload = {
    apiName: "VTubeStudioPublicAPI",
    apiVersion: "1.0",
    requestID: `${ID}`,
    messageType: "",
  };
  private authToken = "";

  constructor() {
    this.socket = new WebSocket(this.vtubeURL);

    this.socket.addEventListener("open", () => {
      this.open = true;
      this.authenticate();
    });
    this.socket.addEventListener("error", () => this.retry());
    this.socket.addEventListener("message", (event) => {
      const currentMessage = JSON.parse(event.data);

      if (currentMessage.messageType === "AuthenticationTokenResponse") {
        const data = currentMessage.data;
        this.authToken = data.authenticationToken;
        this.vtubeMessage("AuthenticationRequest", {
          pluginName: PLUGIN_NAME,
          pluginDeveloper: PLUGIN_DEVELOPER,
          authenticationToken: this.authToken,
        });
        return;
      }

      if (currentMessage.messageType === "AuthenticationResponse") {
        const data = currentMessage.data;
        this.authenticated = data.authenticated;
        if (data.authenticated) {
          this.authenticated = true;
          this.callListeners({ authenticated: true });
        } else {
          this.callListeners({ error: "Authentication Failed", reason: data.reason });
        }
        return;
      }
      this.callListeners(currentMessage);
    });
  }

  public onVtubeEvent(callback: (event: any) => void) {
    this.listeners.push(callback);
  }

  public isAuthenticated() {
    return this.authenticated;
  }

  private authenticate() {
    this.vtubeMessage("AuthenticationTokenRequest", {
      pluginName: PLUGIN_NAME,
      pluginDeveloper: PLUGIN_DEVELOPER,
    });
  }

  private callListeners(message: any) {
    for (const listener of this.listeners) {
      listener(message);
    }
  }

  public vtubeMessage(messageType: string, data?: any) {
    const message = { ...this.payload, messageType, data };
    this.socket.send(JSON.stringify(message));
  }

  private retry() {
    const interval = setInterval(() => {
      if (!this.open) {
        this.socket = new WebSocket(this.vtubeURL);
        console.log("Failed to connect retrying...");
        return;
      }

      clearInterval(interval);
    }, 2000);
  }
}
