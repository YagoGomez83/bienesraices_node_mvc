import express from "express";
import { body } from "express-validator";
import {
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
} from "../controllers/propiedadController.js";
import protegerRuta from "../middleware/protegerRuta.js";
import identificarUsuario from "../middleware/identificarUsuario.js";
import upload from "../middleware/subirImagen.js";
const router = express.Router();

router.get("/mis-propiedades", protegerRuta, admin);

//*******************Crear */
router.get("/propiedades/crear", protegerRuta, crear);
router.post(
  "/propiedades/crear",
  protegerRuta,
  body("titulo").notEmpty().withMessage("El Titulo es Obligatorio"),
  body("descripcion")
    .notEmpty()
    .withMessage("Necesita poner una descripción")
    .isLength({ max: 200 })
    .withMessage("La descripción es muy larga"),
  body("categoria").isNumeric().withMessage("Selecciona una categoria"),
  body("precio").isNumeric().withMessage("Selecciona un rango de precios"),
  body("habitaciones")
    .isNumeric()
    .withMessage("Selecciona la cantidad de habitaciones"),
  body("estacionamiento")
    .isNumeric()
    .withMessage("Selecciona la cantidad de estacionamiento"),
  body("wc").isNumeric().withMessage("Selecciona la cantidad de baños"),
  body("lat").notEmpty().withMessage("Ubica la propiedad en el mapa"),
  guardar
);

router.get("/propiedades/agregar-imagen/:id", protegerRuta, agregarImagen);
router.post(
  "/propiedades/agregar-imagen/:id",
  protegerRuta,
  upload.single("imagen"),
  almacenarImage
);
//****************Editar */
router.get("/propiedades/editar/:id", protegerRuta, editar);

router.post(
  "/propiedades/editar/:id",
  protegerRuta,
  body("titulo").notEmpty().withMessage("El Titulo es Obligatorio"),
  body("descripcion")
    .notEmpty()
    .withMessage("Necesita poner una descripción")
    .isLength({ max: 200 })
    .withMessage("La descripción es muy larga"),
  body("categoria").isNumeric().withMessage("Selecciona una categoria"),
  body("precio").isNumeric().withMessage("Selecciona un rango de precios"),
  body("habitaciones")
    .isNumeric()
    .withMessage("Selecciona la cantidad de habitaciones"),
  body("estacionamiento")
    .isNumeric()
    .withMessage("Selecciona la cantidad de estacionamiento"),
  body("wc").isNumeric().withMessage("Selecciona la cantidad de baños"),
  body("lat").notEmpty().withMessage("Ubica la propiedad en el mapa"),
  guardarCambios
);

//**********Eliminar*** */
router.post("/propiedades/eliminar/:id", protegerRuta, eliminar);

router.put("/propiedades/:id", protegerRuta, cambiarEstado);

//********************Area Publica**////////////////// */
router.get("/propiedad/:id", identificarUsuario, mostrarPropiedad);

//Almacenar los mensajes
router.post(
  "/propiedad/:id",
  identificarUsuario,
  body("mensaje")
    .isLength({ min: 10 })
    .withMessage("El mensaje es obligatorio o es muy corto"),
  enviarMensaje
);

//**************Ver mensajes************* */

router.get("/mensajes/:id", protegerRuta, verMensajes);
export default router;
