import { expect,it } from 'vitest';
import { symmetricEncrypt,symmetricDecrypt } from 'better-auth/crypto';
import { AdministratorOtpAdapter } from '../../src/adapters/auth/administrator-otp.adapter';
import { isLocalAdministratorMailTest } from '../../src/config/administrator-codes';
import { required } from '../../src/adapters/db/transaction';
const key='Local-only-otp-encryption-test-secret-12345';
const actor={id:'user-a',sessionId:'session-a',name:'Test',email:'test@example.invalid'};
it('encrypts random manual setup secrets and binds their decrypted payload to the owner',async()=>{
  const gateway=new AdministratorOtpAdapter(key),a=required(await gateway.prepareTotp(actor.id)),b=required(await gateway.prepareTotp(actor.id));
  expect(a.secret).toMatch(/^[A-Z2-7]{32}$/);expect(a.secret).not.toBe(b.secret);
  expect(a.ciphertext).not.toContain(a.secret);
  const decoded:unknown=JSON.parse(await symmetricDecrypt({key,data:a.ciphertext}));
  expect(decoded).toMatchObject({userId:actor.id,purpose:'administrator-totp',secret:a.secret});
});
it('matches the RFC 6238 SHA-1 vector with six digits and refuses reuse, wrong owners, tampering and expired windows',async()=>{
  const ciphertext=await symmetricEncrypt({key,data:JSON.stringify({userId:actor.id,purpose:'administrator-totp',secret:'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'})});
  const gateway=new AdministratorOtpAdapter(key,()=>59000);
  expect(required(await gateway.verifyTotp(actor.id,ciphertext,'287082',-1))).toBe(1);
  expect((await gateway.verifyTotp(actor.id,ciphertext,'287082',1)).ok).toBe(false);
  expect((await gateway.verifyTotp('other',ciphertext,'287082',-1)).ok).toBe(false);
  expect((await gateway.verifyTotp(actor.id,ciphertext+'invalid','287082',-1)).ok).toBe(false);
  expect((await new AdministratorOtpAdapter(key,()=>300000).verifyTotp(actor.id,ciphertext,'287082',-1)).ok).toBe(false);
});
it('binds emailed proof hashes to the account, session, verified recipient, purpose and nonce',()=>{
  const gateway=new AdministratorOtpAdapter(key),proof=gateway.prepareEmail(actor,'email-verify');
  expect(proof.code).toMatch(/^\d{6}$/);expect(proof.hash).toHaveLength(64);
  expect(gateway.verifyEmail(actor,'email-verify',proof.code,proof.nonce,proof.hash)).toBe(true);
  for(const changed of [{...actor,id:'other'},{...actor,sessionId:'other'},{...actor,email:'other@example.invalid'}])expect(gateway.verifyEmail(changed,'email-verify',proof.code,proof.nonce,proof.hash)).toBe(false);
  expect(gateway.verifyEmail(actor,'email-enroll',proof.code,proof.nonce,proof.hash)).toBe(false);
  expect(gateway.verifyEmail(actor,'email-verify',proof.code,'other',proof.hash)).toBe(false);
});
it('never enables the local-only mail fixture on a hosted, production or non-test database',()=>{
  const input={STAGING_BROWSER_TEST:'true',APP_ENVIRONMENT:'staging',DATABASE_URL:'postgresql://postgres:test@127.0.0.1:55432/booking_test',NEXT_PUBLIC_APP_URL:'http://localhost:3006'};
  expect(isLocalAdministratorMailTest(input)).toBe(true);
  expect(isLocalAdministratorMailTest({...input,APP_ENVIRONMENT:'production'})).toBe(false);
  expect(isLocalAdministratorMailTest({...input,DATABASE_URL:'postgresql://user:pass@db.example.com:5432/booking_test'})).toBe(false);
  expect(isLocalAdministratorMailTest({...input,NEXT_PUBLIC_APP_URL:'https://site.vercel.app'})).toBe(false);
  expect(isLocalAdministratorMailTest({...input,STAGING_BROWSER_TEST:undefined})).toBe(false);
});
