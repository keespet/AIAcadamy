interface InviteEmailParams {
  inviteUrl: string
  fullName?: string
  expiryHours: number
}

export function getInviteEmailHtml(params: InviteEmailParams): string {
  const greeting = params.fullName ? `Beste ${params.fullName}` : 'Beste'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Uitnodiging AI Academy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #2563eb; font-size: 28px; font-weight: bold;">AI Academy</h1>
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">Jouw pad naar AI-expertise</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px;">${greeting},</p>
              <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Je bent uitgenodigd om deel te nemen aan de AI Academy cursus. Via deze cursus leer je alles over de mogelijkheden en het verantwoord gebruik van AI in je werk.
              </p>
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Klik op de onderstaande knop om je account aan te maken en direct te beginnen met de cursus.
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${params.inviteUrl}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                      Account aanmaken
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Deze link is ${params.expiryHours} uur geldig. Werkt de knop niet? Kopieer en plak de volgende link in je browser:
              </p>
              <p style="margin: 8px 0 0; word-break: break-all; color: #2563eb; font-size: 14px;">
                ${params.inviteUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 20px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                Je ontvangt deze email omdat je bent uitgenodigd voor de AI Academy.
                <br>Als je deze uitnodiging niet verwacht, kun je deze email negeren.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function getInviteEmailText(params: InviteEmailParams): string {
  const greeting = params.fullName ? `Beste ${params.fullName}` : 'Beste'

  return `
${greeting},

Je bent uitgenodigd om deel te nemen aan de AI Academy cursus. Via deze cursus leer je alles over de mogelijkheden en het verantwoord gebruik van AI in je werk.

Klik op de volgende link om je account aan te maken:
${params.inviteUrl}

Deze link is ${params.expiryHours} uur geldig.

Met vriendelijke groet,
AI Academy

---
Je ontvangt deze email omdat je bent uitgenodigd voor de AI Academy.
Als je deze uitnodiging niet verwacht, kun je deze email negeren.
  `.trim()
}
