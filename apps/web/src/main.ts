import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router/index.js";
import App from "./App.vue";
import { useTheme } from "./composables/useTheme.js";
import "./style.css";

const { init } = useTheme();
init();

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount("#app");
