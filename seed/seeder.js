import categorias from "./categorias.js";
import precios from "./precios.js";
import usuarios from "./usuarios.js";
import db from "../config/db.js";
import { Propiedad, Precio, Categoria, Usuario } from "../models/index.js";

const importarDatos = async () => {
  try {
    //Autenticar el la base de datos
    await db.authenticate();
    //Generar las Columnas
    await db.sync();
    //Insertamos los datos

    await Promise.all([
      Categoria.bulkCreate(categorias),
      Precio.bulkCreate(precios),
      Usuario.bulkCreate(usuarios),
    ]);

    console.log("Datos Importados Correctamente");
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const eliminarDatos = async () => {
  try {
    await db.sync({ force: true });
    // await Promise.all([
    //   Categoria.destroy({ where: {}, truncate: true }),
    //   Precio.destroy({ where: {}, truncate: true }),
    // ]);
    console.log("Datos eliminados Correctamente");
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

if (process.argv[2] === "-i") {
  importarDatos();
}

if (process.argv[2] === "-e") {
  eliminarDatos();
}
