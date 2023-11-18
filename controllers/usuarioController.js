import { check, validationResult } from "express-validator";
import bcrypt from "bcrypt";

import Usuario from "../models/Usuario.js";
import { generarID, generarJWT } from "../helpers/tokens.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/emails.js";
//*********Login */
//Get
const formularioLogin = (req, res) => {
  res.render("auth/login", {
    pagina: "Iniciar Sesión",
    csrfToken: req.csrfToken(),
  });
};
//POST
const autenticar = async (req, res) => {
  //Validación
  await check("email")
    .isEmail()
    .withMessage("Debe de ingresar un Email")
    .run(req);
  await check("password")
    .notEmpty()
    .withMessage("El Password es obligatorio")
    .run(req);

  let resultado = validationResult(req);

  //Verificamos que resultado este vacio

  if (!resultado.isEmpty()) {
    //errores
    return res.render("auth/login", {
      pagina: "Iniciar Sesión",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
    });
  }

  //Comprobamos si el usuario existe

  const { email, password } = req.body;

  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario) {
    return res.render("auth/login", {
      pagina: "Iniciar Sesión",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "El usuario no existe" }],
    });
  }

  //Comprobar si el usuario esta confirmado
  if (!usuario.confirmado) {
    return res.render("auth/login", {
      pagina: "Iniciar Sesión",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "Tu cuenta no ha sido confirmada" }],
    });
  }

  //Revisar el password
  if (!usuario.verificarPassword(password)) {
    return res.render("auth/login", {
      pagina: "Iniciar Sesión",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "El password es incorrecto" }],
    });
  }

  //Autenticar al usuario
  const token = generarJWT({ id: usuario.id, nombre: usuario.nombre });
  //almacenar en un cokie

  return res
    .cookie("_token", token, {
      httpOnly: true,
      //secure:true
    })
    .redirect("/mis-propiedades");
};
const cerrarSesion = (req, res) => {
  return res.clearCookie("_token").status(200).redirect("/auth/login");
};
//**Registrar */
//GET
const formularioRegistro = (req, res) => {
  console.log();
  res.render("auth/registro", {
    pagina: "Crear Cuenta",
    csrfToken: req.csrfToken(),
  });
};
//POST
const registrar = async (req, res) => {
  //extraer los datos

  const { nombre, email, password } = req.body;
  //validaciones
  await check("nombre")
    .notEmpty()
    .withMessage("El Nombre es Obligatorio")
    .run(req);
  await check("email")
    .isEmail()
    .withMessage("Debe de ingresar un Email")
    .run(req);
  await check("password")
    .isLength({ min: 6 })
    .withMessage("El Password debe de contener un minimo de 6 caracteres")
    .run(req);
  await check("repetir_password")
    .equals(req.body.password)
    .withMessage("Los password no son iguales")
    .run(req);

  let resultado = validationResult(req);

  //Verificamos que resultado este vacio

  if (!resultado.isEmpty()) {
    //errores
    return res.render("auth/registro", {
      pagina: "Crear Cuenta",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
      usuario: {
        nombre,
        email,
      },
    });
  }

  //verificar que el usuario no este duplicado

  const existeUsuario = await Usuario.findOne({
    where: { email },
  });

  if (existeUsuario) {
    return res.render("auth/registro", {
      pagina: "Crear Cuenta",
      csrfToken: req.csrfToken(),
      errores: [
        {
          msg: "El usuario ya esta registrado",
        },
      ],
      usuario: {
        nombre,
        email,
      },
    });
  }

  const usuario = await Usuario.create({
    nombre,
    email,
    password,
    token: generarID(),
  });

  //Envia el email de confirmación

  emailRegistro({
    nombre: usuario.nombre,
    email: usuario.email,
    token: usuario.token,
  });

  //Mostramos mensaje de confirmación

  res.render("templates/mensaje", {
    pagina: "Cuenta Creada Correctamente",
    mensaje: "Hemos Enviado un Email de Confirmación, presiona en el enlace",
  });
};

//Funcion que comprueba una cuenta

const confirmar = async (req, res, next) => {
  const { token } = req.params;

  //Verificamos si el token es válido
  const usuario = await Usuario.findOne({ where: { token } });
  if (!usuario) {
    return res.render("auth/confirmar-cuenta", {
      pagina: "Error al confirmar tu cuenta",
      mensaje: "Hubo un error al confirmar tu cuenta intenta de nuevo",
      error: true,
    });
  }
  //confirmar la cuenta
  usuario.token = null;
  usuario.confirmado = true;
  await usuario.save();
  res.render("auth/confirmar-cuenta", {
    pagina: "Cuenta confirmada",
    mensaje: "La cuenta se Confirmo correctamente",
  });
};
const formularioOlvidePassword = (req, res) => {
  res.render("auth/olvide-password", {
    pagina: "Recupera tu acceso a Bienes Raices",
    csrfToken: req.csrfToken(),
  });
};
const resetPassword = async (req, res) => {
  //extraer los datos

  const { email } = req.body;
  //validaciones
  await check("email")
    .isEmail()
    .withMessage("Debe de ingresar un Email")
    .run(req);

  let resultado = validationResult(req);

  //Verificamos que resultado este vacio

  if (!resultado.isEmpty()) {
    //errores
    return res.render("auth/olvide-password", {
      pagina: "Recupera tu acceso a Bienes Raices",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
    });
  }

  //Buscar el usuario

  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario) {
    return res.render("auth/olvide-password", {
      pagina: "Recupera tu acceso a Bienes Raices",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "El email no pertenece a un usuario" }],
    });
  }

  //Generamos el token y enviamos el email
  usuario.token = generarID();
  await usuario.save();
  //Emviar el email
  emailOlvidePassword({
    email: usuario.email,
    nombre: usuario.nombre,
    token: usuario.token,
  });
  //renderizar un mensaje
  res.render("templates/mensaje", {
    pagina: "Restablece tu password",
    mensaje: "Hemos enviado un email con las instrucciones",
  });
};

const comprobarToken = async (req, res) => {
  const { token } = req.params;
  const usuario = await Usuario.findOne({ where: { token } });
  if (!usuario) {
    return res.render("auth/confirmar-cuenta", {
      pagina: "Restablece tu password",
      mensaje: "Hubo un error al validar tu información intneta de nuevo",
      error: true,
    });
  }
  //Mostrar formulario para modificar el password

  res.render("auth/reset-password", {
    pagina: "restablece Tu Password",
    csrfToken: req.csrfToken(),
  });
};

const nuevoPassword = async (req, res) => {
  //validar el nuevo password
  await check("password")
    .isLength({ min: 6 })
    .withMessage("El Password debe de contener un minimo de 6 caracteres")
    .run(req);
  let resultado = validationResult(req);

  //Verificamos que resultado este vacio

  if (!resultado.isEmpty()) {
    //errores
    return res.render("auth/reset-password", {
      pagina: "Restablece tu password",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
    });
  }
  const { token } = req.params;

  const { password } = req.body;

  //Identificar quien hace el cambio
  const usuario = await Usuario.findOne({ where: { token } });

  const salt = await bcrypt.genSalt(10);
  usuario.password = await bcrypt.hash(password, salt);
  usuario.token = null;
  await usuario.save();

  res.render("auth/confirmar-cuenta", {
    pagina: "Password Reestablecido",
    mensaje: "El password se guardo correctamente",
  });
};
export {
  formularioLogin,
  cerrarSesion,
  formularioRegistro,
  formularioOlvidePassword,
  registrar,
  confirmar,
  resetPassword,
  comprobarToken,
  nuevoPassword,
  autenticar,
};
