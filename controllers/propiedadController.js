import { unlink } from "node:fs/promises";
import { validationResult } from "express-validator";
import {
  Precio,
  Categoria,
  Propiedad,
  Mensaje,
  Usuario,
} from "../models/index.js";
import { esVendedor, formatearFecha } from "../helpers/index.js";
//************************** */
const admin = async (req, res) => {
  const { pagina: paginaActual } = req.query;

  const expresion = /^[1-9]$/;

  if (!expresion.test(paginaActual)) {
    return res.redirect("/mis-propiedades?pagina=1");
  }
  try {
    const { id } = req.usuario;

    //Limites y offset para el paginador
    const limit = 5;

    const offset = paginaActual * limit - limit;

    const [propiedades, total] = await Promise.all([
      Propiedad.findAll({
        limit,
        offset,
        where: {
          UsuarioID: id,
        },
        include: [
          { model: Categoria, as: "categoria" },
          { model: Precio, as: "precio" },
          { model: Mensaje, as: "mensajes" },
        ],
      }),
      Propiedad.count({
        where: {
          usuarioID: id,
        },
      }),
    ]);

    res.render("propieades/admin", {
      pagina: "Mis Propiedades",
      propiedades,
      csrfToken: req.csrfToken(),
      paginas: Math.ceil(total / limit),
      paginaActual: Number(paginaActual),
      total,
      offset,
      limit,
    });
  } catch (error) {
    console.log(error);
  }
};

//Formulario para crear una propiedad
//*********************************** */
const crear = async (req, res) => {
  //Consultar los modelos de Precio y Categoria
  const [categorias, precios] = await Promise.all([
    Categoria.findAll(),
    Precio.findAll(),
  ]);
  console.log(categorias);
  res.render("propieades/crear", {
    pagina: "Crear Propiedad",
    csrfToken: req.csrfToken(),
    categorias,
    precios,
    datos: {},
  });
};

//*************************************** */
const guardar = async (req, res) => {
  //Validacion
  let resultado = validationResult(req);
  if (!resultado.isEmpty()) {
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll(),
    ]);
    return res.render("propieades/crear", {
      pagina: "Mis Propiedades",
      csrfToken: req.csrfToken(),
      categorias,
      precios,
      errores: resultado.array(),
      datos: req.body,
    });
  }

  //Crear un registro
  const {
    titulo,
    descripcion,
    habitaciones,
    estacionamiento,
    wc,
    calle,
    lat,
    lng,
    precio: precioID,
    categoria: categoriaID,
  } = req.body;
  const { id: UsuarioID } = req.usuario;
  try {
    const propiedadGuardada = await Propiedad.create({
      titulo,
      descripcion,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precioID,
      categoriaID,
      UsuarioID,
      imagen: "",
    });
    const { id } = propiedadGuardada;
    res.redirect(`/propiedades/agregar-imagen/${id}`);
  } catch (error) {
    console.log(error);
  }
};
//************************************** */
const agregarImagen = async (req, res) => {
  //Validar que la propiedad exista
  const { id } = req.params;

  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  //Validar que la propiedad no este publicada
  if (propiedad.publicado) {
    return res.redirect("/mis-propiedades");
  }
  //Validar que la propiedad pertenece a quien visita esta página
  if (req.usuario.id.toString() !== propiedad.UsuarioID.toString()) {
    return res.redirect("/mis-propiedades");
  }
  res.render("propieades/agregar-imagen", {
    pagina: `Agregar Imagen: ${propiedad.titulo}`,
    csrfToken: req.csrfToken(),
    propiedad,
  });
};
//************************** */
const almacenarImage = async (req, res, next) => {
  const { id } = req.params;
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  //Validar que la propiedad no este publicada
  if (propiedad.publicado) {
    return res.redirect("/mis-propiedades");
  }
  //Validar que la propiedad pertenece a quien visita esta página
  if (req.usuario.id.toString() !== propiedad.UsuarioID.toString()) {
    return res.redirect("/mis-propiedades");
  }
  try {
    console.log(req.file);
    //Almacenar la imagen y publicar la propiedad
    propiedad.imagen = req.file.filename;
    propiedad.publicado = 1;
    await propiedad.save();
    next();
  } catch (error) {}
};
//************************************* */
const editar = async (req, res) => {
  const { id } = req.params;

  //validamos que la propiedad exista
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }

  //validamos que quien visita la URL es quien creo la propiedad

  if (propiedad.UsuarioID.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }
  //Consultar los modelos de Precio y Categoria
  const [categorias, precios] = await Promise.all([
    Categoria.findAll(),
    Precio.findAll(),
  ]);

  res.render("propieades/editar", {
    pagina: `Editar Propiedad: ${propiedad.titulo}`,
    csrfToken: req.csrfToken(),
    categorias,
    precios,
    datos: propiedad,
  });
};

//********************************* */
const guardarCambios = async (req, res) => {
  //Validacion
  let resultado = validationResult(req);
  if (!resultado.isEmpty()) {
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll(),
    ]);
    return res.render("propieades/editar", {
      pagina: "Editar Propiedad",
      csrfToken: req.csrfToken(),
      categorias,
      precios,
      errores: resultado.array(),
      datos: req.body,
    });
  }

  const { id } = req.params;

  //validamos que la propiedad exista
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }

  //validamos que quien visita la URL es quien creo la propiedad

  if (propiedad.UsuarioID.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }

  //Rescribir el objeto y actualizarlo
  const {
    titulo,
    descripcion,
    habitaciones,
    estacionamiento,
    wc,
    calle,
    lat,
    lng,
    precio: precioID,
    categoria: categoriaID,
  } = req.body;

  propiedad.set({
    titulo,
    descripcion,
    habitaciones,
    estacionamiento,
    wc,
    calle,
    lat,
    lng,
    precioID,
    categoriaID,
  });
  await propiedad.save();
  res.redirect("/mis-propiedades");
  try {
    console.log(propiedad);
  } catch (error) {
    console.log(error);
  }
};

//****************************Eliminar********* */
const eliminar = async (req, res) => {
  const { id } = req.params;

  //validamos que la propiedad exista
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }

  //validamos que quien visita la URL es quien creo la propiedad

  if (propiedad.UsuarioID.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }

  //Eliminar la Imagen
  await unlink(`public/uploads/${propiedad.imagen}`);
  //Eliminar la propiedad

  await propiedad.destroy();
  res.redirect("/mis-propiedades");
};

//*********Modifica el estado de la propiedad********** */

const cambiarEstado = async (req, res) => {
  const { id } = req.params;

  //validamos que la propiedad exista
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }

  //validamos que quien visita la URL es quien creo la propiedad

  if (propiedad.UsuarioID.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }
  //Actualizar la propiedad

  propiedad.publicado = !propiedad.publicado;
  await propiedad.save();
  res.json({
    resultado: true,
  });
};

//Muestra una propiedad

const mostrarPropiedad = async (req, res) => {
  const { id } = req.params;

  //Comprobamos que la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      { model: Categoria, as: "categoria" },
      { model: Precio, as: "precio" },
    ],
  });

  if (!propiedad || !propiedad.publicado) {
    return res.redirect("/404");
  }

  // const propiedades = await Propiedad.findAll({

  //   include: [
  //     { model: Categoria, as: "categoria" },
  //     { model: Precio, as: "precio" },
  //   ],
  // });
  res.render("propieades/mostrar", {
    pagina: propiedad.titulo,
    propiedad,
    csrfToken: req.csrfToken(),
    usuario: req.usuario,
    esVendedor: esVendedor(req.usuario?.id, propiedad?.UsuarioID),
  });
};
//*************************************** */
const enviarMensaje = async (req, res) => {
  const { id } = req.params;

  //Comprobamos que la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      { model: Categoria, as: "categoria" },
      { model: Precio, as: "precio" },
    ],
  });

  if (!propiedad) {
    return res.redirect("/404");
  }
  //Validamos que se envie el mensaje

  let resultado = validationResult(req);
  if (!resultado.isEmpty()) {
    return res.render("propieades/mostrar", {
      pagina: propiedad.titulo,
      propiedad,
      csrfToken: req.csrfToken(),
      usuario: req.usuario,
      esVendedor: esVendedor(req.usuario?.id, propiedad?.UsuarioID),
      errores: resultado.array(),
    });
  }

  //Almacenamos el mensaje

  const { mensaje } = req.body;
  const { id: propiedadId } = req.params;
  const { id: usuarioId } = req.usuario;

  await Mensaje.create({ mensaje, propiedadId, usuarioId });

  res.redirect("/");
};

//**********Leer mensajes recibidos *****/

const verMensajes = async (req, res) => {
  const { id } = req.params;

  //validamos que la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      {
        model: Mensaje,
        as: "mensajes",
        include: [{ model: Usuario.scope("eliminarPassword"), as: "usuario" }],
      },
    ],
  });

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }

  //validamos que quien visita la URL es quien creo la propiedad

  if (propiedad.UsuarioID.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }
  res.render("propieades/mensajes", {
    pagina: "Mensajes",
    mensajes: propiedad.mensajes,
    formatearFecha,
  });
};
export {
  admin,
  crear,
  guardar,
  agregarImagen,
  almacenarImage,
  editar,
  guardarCambios,
  eliminar,
  cambiarEstado,
  mostrarPropiedad,
  enviarMensaje,
  verMensajes,
};
