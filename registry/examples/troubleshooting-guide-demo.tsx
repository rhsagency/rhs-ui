import { IconCreditCard, IconLock, IconRefresh } from "@rhs-ui/icons";
import { TroubleshootingGuide } from "@rhs-ui/marketing/troubleshooting-guide";

const SETTINGS = "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 360'><rect width='720' height='360' fill='#efece5'/><rect x='24' y='24' width='672' height='312' rx='14' fill='#fff' stroke='#d9d4c9'/><rect x='48' y='48' width='150' height='14' rx='7' fill='#2b2d31'/><rect x='48' y='74' width='280' height='9' rx='4.5' fill='#c9c3b7'/><rect x='48' y='116' width='92' height='8' rx='4' fill='#8f8a7f'/><rect x='48' y='134' width='296' height='42' rx='9' fill='#fff' stroke='#2b2d31' stroke-width='2.5'/><rect x='64' y='151' width='170' height='9' rx='4.5' fill='#2b2d31'/><circle cx='376' cy='155' r='15' fill='#2b2d31'/><path d='M370 155h12M377 149l6 6-6 6' fill='none' stroke='#fff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/><rect x='412' y='116' width='72' height='8' rx='4' fill='#8f8a7f'/><rect x='412' y='134' width='260' height='42' rx='9' fill='#fff' stroke='#d9d4c9'/><rect x='428' y='151' width='120' height='9' rx='4.5' fill='#c9c3b7'/><rect x='48' y='204' width='110' height='8' rx='4' fill='#8f8a7f'/><rect x='48' y='222' width='624' height='42' rx='9' fill='#fff' stroke='#d9d4c9'/><rect x='64' y='239' width='220' height='9' rx='4.5' fill='#c9c3b7'/><rect x='48' y='286' width='104' height='36' rx='9' fill='#2b2d31'/><rect x='70' y='300' width='60' height='8' rx='4' fill='#fff'/></svg>",
  );

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <TroubleshootingGuide
        className="[--sticky-top:4rem]"
        supportHref="/support/new"
        defaultOpen="no-sign-in-email"
        areas={[
          {
            id: "sign-in",
            title: "Sign-in",
            description: "Emails, codes and locked accounts.",
            icon: <IconLock />,
            problems: [
              {
                id: "no-sign-in-email",
                symptom: "I do not get the sign-in email",
                cause: "The message is usually in spam, or it went to a different address than the one on your account. Company mail filters also hold a new sender for a few minutes.",
                steps: [
                  "Check your spam, promotions and quarantine folders for a message from no-reply@northwind.example.",
                  "Make sure you typed the address you registered with. A work address and a private one look alike more often than you would think.",
                  "Ask your IT team to allow mail from northwind.example, then request a new link. A link stays valid for 15 minutes.",
                ],
              },
              {
                id: "two-factor-code-rejected",
                symptom: "My two-factor code is rejected",
                cause: "Codes are calculated from your device's clock. If it is more than 30 seconds off, every code is wrong, even though it looks right.",
                steps: [
                  "Switch on automatic date and time in your phone's settings.",
                  {
                    text: "On a Windows laptop, resync the clock from a terminal that runs as administrator:",
                    code: { code: "w32tm /resync", language: "powershell" },
                  },
                  "Wait for the next code, and do not reuse one that has already failed.",
                ],
              },
              {
                id: "account-locked",
                symptom: "It says my account is locked",
                cause: "Five wrong passwords within ten minutes lock an account for half an hour. It is a brake on guessing, not a verdict on you.",
                steps: ["Wait 30 minutes. The lock lifts by itself.", "Or reset your password from the sign-in page. A reset lifts the lock straight away."],
              },
              {
                id: "new-phone-lost-codes",
                symptom: "I changed phones and cannot get my codes",
                cause: "Authenticator codes live on one device. They only move to a new phone if you exported them first.",
                warning: "Recovery signs you out of every device, including the one you are using now.",
                steps: [
                  "On the code screen, choose Use a recovery code and enter one of the ten codes you saved when you set up two-factor.",
                  "Add your new phone under Settings, Security, then remove the old one.",
                ],
                support: { href: "/support/recovery", label: "Start account recovery" },
              },
            ],
          },
          {
            id: "billing",
            title: "Billing",
            description: "Charges, invoices and cards.",
            icon: <IconCreditCard />,
            problems: [
              {
                id: "charged-twice",
                symptom: "I was charged twice this month",
                cause: "One of the two is usually a pending authorisation, which your bank shows next to the real charge and removes by itself within five working days.",
                steps: [
                  "Open Settings, Billing, Invoices and check how many invoices are marked Paid for this month.",
                  "If only one is, you are done: the second line will disappear from your statement.",
                  "If two are, open the menu on the extra invoice and choose Request refund. Refunds arrive in three to five working days.",
                ],
              },
              {
                id: "wrong-company-name",
                symptom: "My invoice shows the wrong company name",
                cause: "An invoice uses the billing details from the day it was issued, so a change only applies to the next one.",
                steps: [
                  {
                    text: "Open Settings, Billing and select Edit details. Change the company name and, while you are there, check the VAT number.",
                    image: { src: SETTINGS, alt: "The Billing settings page with the Company name field outlined and an arrow beside it", caption: "Billing details, with the company name field outlined." },
                  },
                  "Save. Past invoices keep the old name. If you need one reissued, ask us and we will send a corrected copy.",
                ],
              },
              {
                id: "card-declined",
                symptom: "My card keeps being declined",
                cause: "Banks often block the first online payment to a new merchant, and some cards cannot be used for subscriptions at all.",
                steps: ["Try again after approving the payment in your banking app, if it asked you to.", "Add a second card under Settings, Billing, Payment methods. We try it automatically if the first one fails."],
              },
            ],
          },
          {
            id: "sync",
            title: "Sync",
            description: "Files that do not arrive, and ones that arrive twice.",
            icon: <IconRefresh />,
            problems: [
              {
                id: "laptop-phone-out-of-sync",
                symptom: "Changes on my laptop do not show on my phone",
                cause: "Sync pauses on metered or low-power connections, and a paused client looks exactly like a working one.",
                steps: [
                  "Open the app on both devices and check that neither says Paused under the account name.",
                  {
                    text: "On the laptop, ask the client what it thinks is going on:",
                    code: { code: "northwind sync --status", language: "bash" },
                  },
                  "If the output ends in queued, leave the laptop plugged in and online for a few minutes.",
                ],
              },
              {
                id: "conflict-copy",
                symptom: "I see a conflicting copy of a file",
                cause: "Two devices edited the same file before either could sync. We keep both rather than choose for you.",
                steps: ["Open both copies and copy what you need into the one you want to keep.", "Delete the file marked conflicting copy. It will not come back."],
              },
              {
                id: "stuck-at-99",
                symptom: "Sync is stuck at 99 percent",
                cause: "One file is open in another program, so it cannot be read in full. Everything else has already arrived.",
                steps: ["Close the program that has the file open. Spreadsheets and design files are the usual ones.", "Sync finishes on its own within a minute."],
              },
            ],
          },
        ]}
      />
    </div>
  );
}
