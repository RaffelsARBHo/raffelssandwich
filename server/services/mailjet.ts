import Mailjet from 'node-mailjet';
import { ISendMailArgs } from './resend';

const mailjet = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC as string,
  process.env.MJ_APIKEY_PRIVATE as string,
  {
    config: {},
    options: {},
  }
);

export const send = async ({
  to: toInput,
  from,
  subject,
  text,
}: ISendMailArgs & { to: string | [string] }) => {
  try {
    const to = Array.isArray(toInput) ? toInput : [toInput];

    const request = await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: from,
          },
          To: to.map((email) => ({ Email: email })),
          Subject: subject,
          HTMLPart: text,
        },
      ],
    });
    return {};
  } catch (err) {
    return { error: true };
  }
};
