export const sendMail = async ({ to, subject, text }) => {
  console.log('\n========================================');
  console.log(`✉️  [MOCK EMAIL DISPATCHER]`);
  console.log(`Recipient: ${to}`);
  console.log(`Subject:   ${subject}`);
  console.log(`Body:\n${text}`);
  console.log('========================================\n');
  return true;
};
