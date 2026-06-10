import { createHead } from "@vueuse/head";
import { createApp } from "vue";
import router from "./router";
import { pinia } from "./stores";
import "./style.css";
import App from "./App.vue";

// Vue Query
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";

const app = createApp(App);
const head = createHead();

const queryClient = new QueryClient();

app.use(pinia);
app.use(router);
app.use(head);
app.use(VueQueryPlugin, { queryClient });
app.mount("#app");
