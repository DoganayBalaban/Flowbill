import { Resend } from "resend";
import { env } from "../config/env";
import logger from "./logger";

const resend = new Resend(env.RESEND_API_KEY);

export const sendEmail = async(options:{
    to: string;
    subject: string;
    html: string;
})=>{
    try {
        const data = await resend.emails.send({
            from: "Flowbill <onboarding@resend.dev>",
            to: options.to,
            subject: options.subject,
            html: options.html,
        })
        logger.info("Email sent successfully", data);
        return data;
    } catch (error) {
        logger.error("Failed to send email", error);
        throw new Error("Failed to send email");
    }
}