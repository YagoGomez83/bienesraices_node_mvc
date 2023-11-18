import nodemailer from "nodemailer";
const emailRegistro = async (datos) => {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const { nombre, email, token } = datos;
  //Enviar el email

  await transport.sendMail({
    from: "BienesRaices",
    to: email,
    subject: "Confirma tu cuenta en BienesRaices.com",
    text: "Confirma tu cuenta en BienesRaices.com",
    html: `<p>Hola ${nombre}, comprueba tu cuenta en bienesRaices.com</p>
    <p>Tu cuenta esta lista, solo debes confirmarla en el siguiente enlace: <a href="${
      process.env.BACKEND_URL
    }:${
      process.env.PORT ?? 3000
    }/auth/confirmar/${token}">Confirmar cuenta</a></p>
    <p>si tu no creaste esta cuenta ignara este mensaje</p>
    `,
  });
};

const emailOlvidePassword = async (datos) => {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const { nombre, email, token } = datos;
  //Enviar el email

  await transport.sendMail({
    from: "BienesRaices",
    to: email,
    subject: "Restablece tu password en BienesRaices.com",
    text: "Restablece tu password en BienesRaices.com",
    html: `<p>Hola ${nombre}, Has solicitado restablecer tu password en bienesRaices.com</p>
    <p>Sigue el siguiente enlace para generar un password nuevo : <a href="${
      process.env.BACKEND_URL
    }:${
      process.env.PORT ?? 3000
    }/auth/olvide-password/${token}">Restablecer password</a></p>
    <p>si tu no solicitaste el cambio de password ignora este mensaje</p>
    `,
  });
};

export { emailRegistro, emailOlvidePassword };
