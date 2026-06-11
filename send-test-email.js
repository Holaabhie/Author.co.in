import { Resend } from 'resend';

const resend = new Resend('re_xxxxxxxxx');

resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'author.handling@gmail.com',
  subject: 'Hello World',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
});
