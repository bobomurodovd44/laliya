import authentication from "@feathersjs/authentication-client";
import { feathers } from "@feathersjs/feathers";
import rest from "@feathersjs/rest-client";
import socketio from "@feathersjs/socketio-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";

// Get API URL from environment variable
// Priority: EXPO_PUBLIC_FEATHERS_API_URL > app.json extra > fallback
const FEATHERS_API_URL = "https://ccd8d60942f5.ngrok-free.app";
// Create the Feathers application
const app = feathers();

// Setup REST client
const restClient = rest(FEATHERS_API_URL);
app.configure(restClient.fetch(fetch));

// Setup Socket.io client with logging disabled
const socket = io(FEATHERS_API_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  autoConnect: true,
});

app.configure(socketio(socket));

// Configure authentication with AsyncStorage for React Native
app.configure(
  authentication({
    storage: AsyncStorage,
    path: "/authentication",
  })
);

export default app;
