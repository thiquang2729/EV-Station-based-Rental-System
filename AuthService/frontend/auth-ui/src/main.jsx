import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import App from "./App.jsx";
import store from "./store";
import "./index.css";
import "assets/css/App.css";
import horizonTheme from "theme";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <ChakraProvider theme={horizonTheme}>
        <ColorModeScript
          initialColorMode={horizonTheme.config?.initialColorMode ?? "light"}
        />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ChakraProvider>
    </Provider>
  </StrictMode>
);
