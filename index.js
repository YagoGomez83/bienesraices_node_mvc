import express from "express";
import csrf from "csurf";
import cookieParser from "cookie-parser";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import propiedadesRoutes from "./routes/propiedadesRoutes.js";
import appRoutes from "./routes/appRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import db from "./config/db.js";
//Crear la app

const app = express();

//Habilitar lectura de datos de formulario
app.use(express.urlencoded({ extended: true }));

//Habilitamos Cookie Parser
app.use(cookieParser());

//Habilitamos CSRF
app.use(
  csrf({
    cookie: true,
  })
);
//conexion a la base de datos

try {
  await db.authenticate();
  db.sync();
  console.log("conexión correcta a la base de datos");
} catch (error) {
  console.log(error);
}

//Hablitilar Pug

app.set("view engine", "pug");
app.set("views", "./views");

//Carpeta Pública

app.use(express.static("public"));

//Routing
app.use("/", appRoutes);
app.use("/auth", usuarioRoutes);
app.use("/", propiedadesRoutes);
app.use("/api", apiRoutes);

//Definir unpuerto y arracar el proyecto

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`el servidor esta funcionando en el puerto: ${port}`);
});
