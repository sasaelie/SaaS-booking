'use client';
import { PORTAL, INPUT_LIMITS, SAAS } from '../../config/constants';
import { PortalField } from './PortalField';
import { useOrganizationSlug } from './use-organization-slug';
import './organization-link.css';

export function OrganizationIdentityFields({ appUrl }: { readonly appUrl: string }) {
  const state = useOrganizationSlug();
  return (
    <>
      <PortalField
        label={PORTAL.NAME}
        name="name"
        required
        minLength={INPUT_LIMITS.NAME_MIN}
        maxLength={INPUT_LIMITS.NAME_MAX}
        autoComplete="organization"
        onChange={(event) => state.changeName(event.currentTarget.value)}
      />
      <OrganizationSlugField state={state} />
      <output className="portal-url-preview" aria-label={PORTAL.SLUG_PREVIEW}>
        {appUrl}/{state.slug || PORTAL.SLUG_PLACEHOLDER}
      </output>
    </>
  );
}

function OrganizationSlugField({
  state,
}: {
  readonly state: ReturnType<typeof useOrganizationSlug>;
}) {
  return (
    <PortalField
      label={PORTAL.SLUG}
      name="slug"
      ref={state.ref}
      required
      minLength={SAAS.SLUG_MIN}
      maxLength={SAAS.SLUG_MAX}
      pattern={`(?=.{${SAAS.SLUG_MIN},${SAAS.SLUG_MAX}}$)[a-z0-9]+(-[a-z0-9]+)*`}
      value={state.slug}
      placeholder={PORTAL.SLUG_PLACEHOLDER}
      autoComplete="off"
      autoCapitalize="none"
      spellCheck={false}
      hint={PORTAL.SLUG_HINT}
      error={state.error}
      onChange={(event) => state.changeSlug(event.currentTarget.value)}
      onBlur={state.validate}
      onInvalid={(event) => {
        event.preventDefault();
        state.validate();
        event.currentTarget.focus();
      }}
    />
  );
}
