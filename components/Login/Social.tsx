import React, { useEffect, useState } from 'react';
import Image from 'next/image';

function SocialLogin({}) {
  const [csrf, setCsrf] = useState();

  useEffect(() => {
    fetch('/api/auth/csrf').then((d) => {
      d.json().then((r) => {
        setCsrf(r.csrfToken);
      });
    });
  }, []);

  return (
    <>
      <form action="/api/auth/signin/google" method="POST">
        <input type="hidden" name="csrfToken" value={csrf} />
        <input type="hidden" name="callbackUrl" value="/" />
        <button type="submit" className="button">
          <Image
            unoptimized
            loading="lazy"
            id="provider-logo"
            src="https://authjs.dev/img/providers/google.svg"
            alt="Google"
            width={24}
            height={24}
          />
          <span>Sign in with Google</span>
        </button>
      </form>
      <form action="/api/auth/signin/facebook" method="POST">
        <input type="hidden" name="csrfToken" value={csrf} />
        <input type="hidden" name="callbackUrl" value="/" />
        <button type="submit" className="button">
          <Image
            unoptimized
            loading="lazy"
            id="provider-logo"
            src="https://authjs.dev/img/providers/facebook.svg"
            alt="Facebook"
            width={24}
            height={24}
          />
          <span>Sign in with Facebook</span>
        </button>
      </form>
    </>
  );
}

export default SocialLogin;
