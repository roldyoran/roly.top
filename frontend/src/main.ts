import { createHead } from "@vueuse/head";
import { createApp } from "vue";
import router from "./router";
import { pinia } from "./stores";
import "./style.css";
import App from "./App.vue";

const app = createApp(App);
const head = createHead();

app.use(pinia);
app.use(router);
app.use(head);
app.mount("#app");
