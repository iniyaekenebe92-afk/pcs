const { Resend } = require('resend');

let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.RESEND_FROM;

function applicantEmailHtml(data) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Application Received</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'DM Sans',system-ui,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;">

          <!-- HEADER / LOGO -->
          <tr>
            <td align="center" style="background-color:#0f172a;padding:24px 40px;">
              <img src="https://res.cloudinary.com/dopnzcfxj/image/upload/v1779505138/logo_light_xfzeak.png" alt="Peterson Care Solutions" width="200" style="display:block;height:auto;border:0;margin:0 auto;" />
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 20px;">

              <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#0f172a;font-family:Georgia,serif;">Dear ${data.full_name},</h1>

              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#0f172a;">
                We have successfully received your caregiver application and it is currently under review by our placement team. We appreciate your interest in pursuing a caregiving opportunity through Peterson Care Solutions.
              </p>

              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#0f172a;">
                Our team carefully reviews each application to ensure the best possible match between caregivers and employers. You can expect to hear from us if your profile meets the requirements for available placements.
              </p>

              <p style="margin:0 0 6px 0;font-size:15px;line-height:1.7;color:#0f172a;">If you have any questions about your application, please do not hesitate to contact us.</p>
              <p style="margin:0 0 32px 0;font-size:15px;line-height:1.7;color:#0f172a;">We wish you the very best in your placement journey.</p>

              <p style="margin:0;font-size:15px;color:#0f172a;">
                Warm regards,<br/>
                <strong style="color:#0f172a;">The Peterson Care Solutions Team</strong>
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#0f172a;padding:32px 40px;">

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td align="center">
                    <img src="https://res.cloudinary.com/dopnzcfxj/image/upload/v1779505138/logo_light_xfzeak.png" alt="Peterson Care Solutions" width="160" style="display:block;height:auto;border:0;margin:0 auto;" />
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px 0;text-align:center;font-size:13px;">
                <a href="${process.env.APP_URL}/contact" style="color:#ffffff !important;text-decoration:none;">Contact</a>
                <span style="color:rgba(255,255,255,0.2);margin:0 8px;">|</span>
                <a href="${process.env.APP_URL}/faq" style="color:#ffffff !important;text-decoration:none;">FAQ</a>
                <span style="color:rgba(255,255,255,0.2);margin:0 8px;">|</span>
                <a href="${process.env.APP_URL}/about" style="color:#ffffff !important;text-decoration:none;">About</a>
              </p>

              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:0 0 20px 0;"/>

              <p style="margin:0;text-align:center;font-size:11px;color:rgba(255,255,255,0.4);">&#169; 2025 Peterson Care Solutions. All rights reserved.</p>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

async function sendApplicationNotification(data) {
  console.log('[mailer] Sending applicant confirmation to:', data.email);
  const applicantResult = await getResend().emails.send({
    from: FROM,
    to: data.email,
    subject: `Application Received - Peterson Care Solutions`,
    html: applicantEmailHtml(data),
  });
  if (applicantResult.error) {
    console.error('[mailer] FAILED applicant email:', JSON.stringify(applicantResult.error));
  } else {
    console.log('[mailer] OK applicant email sent. ID:', applicantResult.data?.id);
  }

  console.log('[mailer] Sending admin notification to:', process.env.ADMIN_EMAIL);
  const adminResult = await getResend().emails.send({
    from: FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Caregiver Application - ${data.full_name}`,
    html: `
      <h2>New Application Received</h2>
      <p><strong>Name:</strong> ${data.full_name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>WhatsApp:</strong> ${data.whatsapp}</p>
      <p><strong>Nationality:</strong> ${data.nationality}</p>
      <p><strong>Destination:</strong> ${data.preferred_destination}</p>
      <p><strong>Experience:</strong> ${data.years_experience} years</p>
    `,
  });
  if (adminResult.error) {
    console.error('[mailer] FAILED admin email:', JSON.stringify(adminResult.error));
  } else {
    console.log('[mailer] OK admin email sent. ID:', adminResult.data?.id);
  }
}

module.exports = { sendApplicationNotification };
