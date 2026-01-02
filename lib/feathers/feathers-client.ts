import authentication from "@feathersjs/authentication-client";
import { feathers } from "@feathersjs/feathers";
import rest from "@feathersjs/rest-client";
import socketio from "@feathersjs/socketio-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";

// Get API URL from environment variable
const FEATHERS_API_URL = "https://e23480e366ff.ngrok-free.app";

console.log("[Feathers Client] Initializing...");
console.log("[Feathers Client] API URL:", FEATHERS_API_URL);

// Create the Feathers application
const app = feathers();

// Setup REST client
console.log("[Feathers Client] Configuring REST client...");
const restClient = rest(FEATHERS_API_URL);
app.configure(restClient.fetch(fetch));
console.log("[Feathers Client] REST client configured");

// Setup Socket.io client
console.log("[Feathers Client] Configuring Socket.io client...");
const socket = io(FEATHERS_API_URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

// Socket connection event listeners for testing
socket.on("connect", () => {
  console.log("[Feathers Client] ✅ Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("[Feathers Client] ⚠️ Socket disconnected:", reason);
});

socket.on("reconnect", (attemptNumber) => {
  console.log(
    "[Feathers Client] 🔄 Socket reconnected after",
    attemptNumber,
    "attempts"
  );
});

socket.on("reconnect_attempt", (attemptNumber) => {
  console.log("[Feathers Client] 🔄 Reconnection attempt:", attemptNumber);
});

socket.on("reconnect_error", (error) => {
  console.log("[Feathers Client] ❌ Reconnection error:", error);
});

socket.on("reconnect_failed", () => {
  console.log("[Feathers Client] ❌ Reconnection failed");
});

socket.on("connect_error", (error) => {
  console.log("[Feathers Client] ❌ Connection error:", error.message);
});

app.configure(socketio(socket));
console.log("[Feathers Client] Socket.io client configured");

// Configure authentication with AsyncStorage for React Native
console.log("[Feathers Client] Configuring authentication...");
app.configure(
  authentication({
    storage: AsyncStorage,
    path: "/authentication",
  })
);
console.log("[Feathers Client] ✅ Authentication configured");
console.log("[Feathers Client] ✅ Feathers client initialized successfully");

export default app;
