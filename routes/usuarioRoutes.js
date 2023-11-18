import express from "express";
import {
  formularioLogin,
  formularioRegistro,
  cerrarSesion,
  formularioOlvidePassword,
  registrar,
  confirmar,
  resetPassword,
  comprobarToken,
  nuevoPassword,
  autenticar,
} from "../controllers/usuarioController.js";
const router = express.Router();

//routing

router.get("/login", formularioLogin);
router.post("/login", autenticar);
//*******Cerrar Sesión****** */
router.post("/cerrar-sesion", cerrarSesion);
//********Registro********** */
router.get("/registro", formularioRegistro);
router.post("/registro", registrar);
//******Confirmar******** */
router.get("/confirmar/:token", confirmar);
/**Olvide Password**** */
router.get("/olvide-password", formularioOlvidePassword);
router.post("/olvide-password", resetPassword);

//Almacena el nuevo password

router.get("/olvide-password/:token", comprobarToken);
router.post("/olvide-password/:token", nuevoPassword);

export default router;
