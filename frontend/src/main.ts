import { createHead } from "@vueuse/head";
import { createApp } from "vue";
import router from "./router";
import { pinia } from "./stores";
import "./style.css";

// Vue Query
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import App from "./App.vue";

const app = createApp(App);
const head = createHead();

const queryClient = new QueryClient();

app.use(pinia);
app.use(router);
app.use(head);
app.use(VueQueryPlugin, { queryClient });
app.mount("#app");
