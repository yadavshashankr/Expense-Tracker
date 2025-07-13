
import { useEffect } from 'react';
import jwt_decode from 'jwt-decode';
export default function LoginButton({ onLogin }) {
  useEffect(() => {
    /* global google */
    window.google.accounts.id.initialize({
      client_id: '1031633259679-di32f4288k7vdh4juuhveeahoqd0ogvt.apps.googleusercontent.com',
      callback: (res) => {
        const profile = jwt_decode(res.credential);
        onLogin({ profile, credential: res.credential });
      }
    });
    window.google.accounts.id.renderButton(document.getElementById('signInDiv'), { size: 'large' });
  }, []);
  return <div id="signInDiv" />;
}
