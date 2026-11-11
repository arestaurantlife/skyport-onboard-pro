import { createEmailWebhookHandler } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'

async function record(recipient: string, reason: 'bounce' | 'complaint' | 'unsubscribe', eventId: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const email = recipient.toLowerCase()
  const { error: supErr } = await supabaseAdmin
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (supErr) {
    console.error('suppressed_emails upsert failed', { code: supErr.code, message: supErr.message, event_id: eventId })
    throw new Error('Failed to write suppression')
  }
  const status = reason === 'bounce' ? 'bounced' : reason === 'complaint' ? 'complained' : 'suppressed'
  const msg = reason === 'bounce'
    ? 'Permanent bounce — email address is invalid or rejected'
    : reason === 'complaint' ? 'Spam complaint — recipient marked email as spam' : 'Recipient unsubscribed'
  const { error: logErr } = await supabaseAdmin.from('email_send_log').insert({
    message_id: null, template_name: 'system', recipient_email: email, status, error_message: msg, metadata: null,
  })
  if (logErr) {
    console.error('email_send_log insert failed', { code: logErr.code, message: logErr.message, event_id: eventId })
    throw new Error('Failed to write log')
  }
}

export const Route = createFileRoute("/lovable/email/events")({
  server: {
    handlers: {
      POST: ({ request }) => {
        const apiKey = process.env['LOVABLE_API_KEY']
        if (!apiKey) {
          console.error('Missing required environment variables')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }
        const handler = createEmailWebhookHandler({
          apiKey,
          on: {
            'email.bounced': (event) => record(event.data.recipient, 'bounce', event.event_id),
            'email.complaint': (event) => record(event.data.recipient, 'complaint', event.event_id),
            'email.unsubscribed': (event) => record(event.data.recipient, 'unsubscribe', event.event_id),
          },
        })
        return handler(request)
      },
    },
  },
})
