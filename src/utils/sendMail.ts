import config from "config";
import nodemailer from "nodemailer";
import { logger } from ".";

export default async function sendMail({
  to,
  html,
}: {
  to: string;
  html: string;
}) {
  try {
    const transporter = nodemailer.createTransport({
      auth: {
        user: config.get<string>("mailUser"),
        pass: config.get<string>("mailPass"),
      },
      service: "gmail",
      secure: false,
      port: config.get<number>("mailPort"),
      host: config.get<string>("mailHost"),
    });
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: "smilyweb", // sender address
      to, // list of receivers
      subject: "click on the link to reset your password", // Subject line
      html, // html body
    });
    return info;
  } catch (error: any) {
    logger.error(error, "email cannot be sent");
    return false;
  }
}
