import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  outletName?: string
  jobRole?: string
  inviteCode?: string
  signupUrl?: string
  expiresAt?: string
  invitedByName?: string
}

const EmployeeInviteEmail = ({
  outletName = 'your new outlet',
  jobRole = 'team member',
  inviteCode = 'INVITE-CODE',
  signupUrl = 'https://skyport-onboard-pro.lovable.app/auth?mode=signup',
  expiresAt,
  invitedByName,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're invited to start training at {outletName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to {outletName}</Heading>
        <Text style={text}>
          {invitedByName ? `${invitedByName} has invited you` : "You've been invited"} to start
          your onboarding as a <strong>{jobRole}</strong>.
        </Text>
        <Section style={codeBox}>
          <Text style={codeLabel}>Your invite code</Text>
          <Text style={code}>{inviteCode}</Text>
        </Section>
        <Section style={{ textAlign: 'center', marginTop: '24px' }}>
          <Button href={signupUrl} style={button}>
            Create your account
          </Button>
        </Section>
        <Text style={textMuted}>
          The button takes you to signup with the code pre-filled. You can also enter it
          manually if needed.
        </Text>
        {expiresAt ? (
          <Text style={textMuted}>This code expires on {expiresAt}.</Text>
        ) : null}
        <Hr style={hr} />
        <Text style={footer}>
          If you weren't expecting this, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: EmployeeInviteEmail,
  subject: (data: Record<string, any>) =>
    `You're invited to onboard at ${data.outletName ?? 'your new outlet'}`,
  displayName: 'Employee invite',
  previewData: {
    outletName: 'Mesa Verde Cantina',
    jobRole: 'Server',
    inviteCode: 'SERVER-MVC-7Q3X',
    signupUrl: 'https://skyport-onboard-pro.lovable.app/auth?mode=signup&code=SERVER-MVC-7Q3X',
    expiresAt: 'Jun 20, 2026',
    invitedByName: 'Alex',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 700, color: '#0a0a0a', margin: '0 0 12px' }
const text = { fontSize: '15px', lineHeight: '22px', color: '#1a1a1a', margin: '0 0 16px' }
const textMuted = { fontSize: '13px', lineHeight: '20px', color: '#52525b', margin: '12px 0 0' }
const codeBox = {
  backgroundColor: '#f5f5f4',
  border: '1px solid #e7e5e4',
  borderRadius: '8px',
  padding: '16px 20px',
  textAlign: 'center' as const,
  margin: '20px 0',
}
const codeLabel = {
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: '#78716c',
  margin: '0 0 6px',
}
const code = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '20px',
  fontWeight: 700,
  color: '#0a0a0a',
  margin: 0,
  letterSpacing: '0.04em',
}
const button = {
  backgroundColor: '#0a0a0a',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 600,
  display: 'inline-block',
}
const hr = { borderColor: '#e7e5e4', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#78716c', margin: 0 }